'use server';

import { createAdminClient } from '@/utils/supabase/admin';

export async function registerUserByAdmin(userData: {
  email: string;
  name: string;
  role: string;
  unit: string;
  password?: string;
}) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Periksa apakah email sudah terdaftar sebelumnya di Supabase Auth (auth.users)
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Gagal memeriksa daftar akun terdaftar: ${listError.message}`);
    }

    const existingUser = listData.users.find(
      u => u.email?.toLowerCase() === userData.email.toLowerCase()
    );
    let userId: string;

    if (existingUser) {
      // Jika akun sudah ada di Auth, gunakan ID yang sudah ada
      userId = existingUser.id;

      // Reset password jika admin menginput password baru
      if (userData.password) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: userData.password
        });
        if (updateError) {
          throw new Error(`Gagal memperbarui kata sandi akun yang sudah terdaftar: ${updateError.message}`);
        }
      }
    } else {
      // Jika email belum ada di Auth, buat akun baru (auto confirms email)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password || 'SmartSantri123!',
        email_confirm: true,
        user_metadata: {
          full_name: userData.name
        }
      });

      if (authError) {
        throw new Error(`Gagal mendaftarkan akun baru di Supabase Auth: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Gagal mendapatkan data akun setelah pendaftaran.');
      }

      userId = authData.user.id;
    }

    // 2. Fetch Unit ID from DB
    let selectedUnitId: string | null = null;
    if (userData.unit) {
      const { data: unitData } = await supabaseAdmin
        .from('unit')
        .select('id')
        .eq('name', userData.unit)
        .single();
      if (unitData) selectedUnitId = unitData.id;
    }

    // Map roles to DB enum values
    const mapDropdownToEnum = (roleStr: string) => {
      switch (roleStr) {
        case 'Administrator': return 'ADMINISTRATOR';
        case 'Bendahara Yayasan/Pesantren (Pusat)': return 'BENDAHARA_PUSAT';
        case 'Pimpinan Pesantren': return 'PIMPINAN';
        case 'Bendahara Jenjang': return 'BENDAHARA_JENJANG';
        case 'Kepala Jenjang': return 'KEPALA_JENJANG';
        case 'Kepala Unit': return 'KEPALA_UNIT';
        case 'Bendahara Unit': return 'BENDAHARA_UNIT';
        case 'Staf Bidang': return 'STAFF_BIDANG';
        case 'Staf Unit': return 'STAFF';
        default: return 'STAFF';
      }
    };

    // 3. Upsert data profil (Masukkan jika belum ada, Perbarui jika sudah ada) ke tabel profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: userData.name,
        email: userData.email,
        role: mapDropdownToEnum(userData.role),
        unit_id: selectedUnitId
      }, { onConflict: 'id' });

    if (profileError) {
      // Jika ini adalah akun baru dan gagal menyimpan profil, bersihkan akun auth yang baru dibuat tersebut
      if (!existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      throw new Error(`Gagal menyimpan data profil ke database: ${profileError.message}`);
    }

    return { success: true, userId };
  } catch (err: any) {
    console.error('Error in registerUserByAdmin server action:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan sistem' };
  }
}

export async function deleteUserByAdmin(userId: string) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Coba hapus akun dari auth.users (profil akan otomatis terhapus secara cascade jika ada relasinya)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      // Jika akun tidak ditemukan di auth.users (misal data simulasi lama), 
      // kita harus tetap menghapus baris datanya dari tabel profiles secara langsung!
      const isUserNotFound = authError.message?.toLowerCase().includes('not found') || 
                            (authError as any).status === 404;
      
      if (isUserNotFound) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);
        
        if (profileError) {
          throw new Error(`Gagal menghapus profil simulasi lama dari database: ${profileError.message}`);
        }
        return { success: true };
      }
      throw new Error(`Gagal menghapus akun di Supabase Auth: ${authError.message}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in deleteUserByAdmin server action:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan sistem' };
  }
}

export async function resetUserPasswordByAdmin(userId: string, newPassword: string) {
  try {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      throw new Error(`Gagal mereset kata sandi di Supabase Auth: ${error.message}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error resetting password:', err);
    return { success: false, error: err.message || 'Gagal mereset kata sandi' };
  }
}

export async function toggleUserStatusByAdmin(userId: string, currentIsActive: boolean) {
  try {
    const supabaseAdmin = createAdminClient();
    const newIsActive = !currentIsActive;

    // 1. Update is_active in profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: newIsActive })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Gagal memperbarui status profil di database: ${profileError.message}`);
    }

    // 2. Ban/unban in Supabase Auth to actually prevent/allow login
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: newIsActive ? 'none' : 'infinite'
    });

    if (authError) {
      const isUserNotFound = authError.message?.toLowerCase().includes('not found') || 
                            (authError as any).status === 404;
      if (!isUserNotFound) {
        throw new Error(`Gagal memperbarui hak akses login di Supabase Auth: ${authError.message}`);
      }
    }

    return { success: true, newIsActive };
  } catch (err: any) {
    console.error('Error toggling user status:', err);
    return { success: false, error: err.message || 'Gagal mengubah status pengguna' };
  }
}
