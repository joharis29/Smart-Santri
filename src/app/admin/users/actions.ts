'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

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
    } else {
      // Sesuai SOP: Staf wajib registrasi mandiri. Admin tidak boleh membuatkan akun dari nol.
      throw new Error(`Email ${userData.email} belum terdaftar di sistem. Staf wajib melakukan registrasi mandiri terlebih dahulu.`);
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
        case 'Bendahara Pusat (Yayasan)': return 'BENDAHARA_PUSAT';
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

    // 4. Tambahkan/Upsert peran & unit aktif tersebut ke tabel relasi rangkap profiles_multi_role
    const { error: multiRoleError } = await supabaseAdmin
      .from('profiles_multi_role')
      .upsert({
        user_id: userId,
        role: mapDropdownToEnum(userData.role),
        unit_id: selectedUnitId
      }, { onConflict: 'user_id, role, unit_id' });

    if (multiRoleError) {
      console.error('Gagal mencatat data multi-role, namun profil utama tetap tersimpan:', multiRoleError);
    }

    return { success: true, userId };
  } catch (err: any) {
    console.error('Error in registerUserByAdmin server action:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan sistem' };
  }
}

export async function updateUserByAdmin(userId: string, userData: {
  name: string;
  email: string;
  concurrentRoles: { role: string; unit: string }[];
}) {
  try {
    const supabaseAdmin = createAdminClient();

    // Map roles to DB enum values
    const mapDropdownToEnum = (roleStr: string) => {
      switch (roleStr) {
        case 'Administrator': return 'ADMINISTRATOR';
        case 'Bendahara Pusat (Yayasan)': return 'BENDAHARA_PUSAT';
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

    if (!userData.concurrentRoles || userData.concurrentRoles.length === 0) {
      throw new Error("Pengguna minimal harus memiliki satu peran.");
    }

    // 1. Resolve UUIDs for all units in concurrentRoles
    const resolvedRoles = await Promise.all(userData.concurrentRoles.map(async (r) => {
      let unitId: string | null = null;
      if (r.unit && r.unit !== 'null' && r.unit !== 'undefined') {
        const { data: unitData } = await supabaseAdmin
          .from('unit')
          .select('id')
          .eq('name', r.unit)
          .maybeSingle();
        if (unitData) unitId = unitData.id;
      }
      return {
        roleEnum: mapDropdownToEnum(r.role),
        unitId,
        rawRole: r.role,
        rawUnit: r.unit
      };
    }));

    // 2. Update primary profile using the FIRST role in the array
    const primaryRole = resolvedRoles[0];
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: userData.name,
        email: userData.email,
        role: primaryRole.roleEnum,
        unit_id: primaryRole.unitId
      })
      .eq('id', userId);

    if (profileError) throw new Error(`Gagal memperbarui profil utama: ${profileError.message}`);

    // 3. Fetch existing multi_roles for this user
    const { data: existingRoles } = await supabaseAdmin
      .from('profiles_multi_role')
      .select('id, role, unit_id')
      .eq('user_id', userId);

    // 4. Determine roles to Add/Keep and roles to Delete
    const rolesToUpsert = resolvedRoles.map(r => ({
      user_id: userId,
      role: r.roleEnum,
      unit_id: r.unitId
    }));

    // Upsert all intended roles (Supabase will update or insert based on the unique constraint user_id, role, unit_id)
    const { error: upsertError } = await supabaseAdmin
      .from('profiles_multi_role')
      .upsert(rolesToUpsert, { onConflict: 'user_id, role, unit_id' });

    if (upsertError) throw new Error(`Gagal menyimpan data multi-peran: ${upsertError.message}`);

    // Determine roles to delete (existing roles that are NOT in the new list)
    if (existingRoles) {
      const rolesToDelete = existingRoles.filter(existing => {
        return !rolesToUpsert.some(newRole => 
          newRole.role === existing.role && 
          ((newRole.unit_id === null && existing.unit_id === null) || newRole.unit_id === existing.unit_id)
        );
      });

      if (rolesToDelete.length > 0) {
        const idsToDelete = rolesToDelete.map(r => r.id);
        await supabaseAdmin.from('profiles_multi_role').delete().in('id', idsToDelete);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in updateUserByAdmin server action:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan sistem saat memperbarui' };
  }
}

export async function deleteUserByAdmin(userId: string, roleName?: string, unitName?: string) {
  try {
    const supabaseAdmin = createAdminClient();

    let isPartialDelete = false;
    let newMainRole = null;
    let newMainUnit = null;

    if (roleName && unitName) {
      // 1. Fetch Unit ID if needed
      let selectedUnitId: string | null = null;
      if (unitName && unitName !== 'null' && unitName !== 'undefined') {
        const { data: unitData } = await supabaseAdmin
          .from('unit')
          .select('id')
          .eq('name', unitName)
          .maybeSingle();
        if (unitData) selectedUnitId = unitData.id;
      }

      // Map roles
      const mapDropdownToEnum = (roleStr: string) => {
        switch (roleStr) {
          case 'Administrator': return 'ADMINISTRATOR';
          case 'Bendahara Pusat (Yayasan)': return 'BENDAHARA_PUSAT';
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
      
      const mapEnumToDropdown = (roleEnum: string) => {
        switch (roleEnum) {
          case 'ADMINISTRATOR': return 'Administrator';
          case 'BENDAHARA_PUSAT': return 'Bendahara Pusat (Yayasan)';
          case 'PIMPINAN': return 'Pimpinan Pesantren';
          case 'BENDAHARA_JENJANG': return 'Bendahara Jenjang';
          case 'KEPALA_JENJANG': return 'Kepala Jenjang';
          case 'KEPALA_UNIT': return 'Kepala Unit';
          case 'BENDAHARA_UNIT': return 'Bendahara Unit';
          case 'STAFF_BIDANG': return 'Staf Bidang';
          case 'STAFF': return 'Staf Unit';
          default: return 'Staf Unit';
        }
      };

      const dbRoleToRemove = mapDropdownToEnum(roleName);

      // 2. Check how many roles the user has in profiles_multi_role
      const { data: userRoles } = await supabaseAdmin
        .from('profiles_multi_role')
        .select('id, role, unit_id, unit:unit_id(name)')
        .eq('user_id', userId);

      if (userRoles && userRoles.length > 1) {
        isPartialDelete = true;
        
        // Find the specific role to delete
        let roleToDelete = userRoles.find(r => r.role === dbRoleToRemove && (r.unit_id === selectedUnitId || (!r.unit_id && !selectedUnitId)));
        
        if (roleToDelete) {
          await supabaseAdmin.from('profiles_multi_role').delete().eq('id', roleToDelete.id);
        }

        // 3. Promote another remaining role to be the main role in profiles table
        const remainingRoles = userRoles.filter(r => r.id !== roleToDelete?.id);
        if (remainingRoles.length > 0) {
          const fallback = remainingRoles[0];
          newMainRole = mapEnumToDropdown(fallback.role);
          newMainUnit = fallback.unit ? (fallback.unit as any).name : 'Pusat (Yayasan)';

          await supabaseAdmin.from('profiles').update({
            role: fallback.role,
            unit_id: fallback.unit_id
          }).eq('id', userId);
        }
      }
    }

    if (!isPartialDelete) {
      // 4. Jika user hanya punya 1 role (atau info role tidak dikirim), HAPUS SEPENUHNYA
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authError) {
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
          return { success: true, isPartialDelete: false };
        }
        throw new Error(`Gagal menghapus akun di Supabase Auth: ${authError.message}`);
      }
    }

    return { success: true, isPartialDelete, newMainRole, newMainUnit };
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
      ban_duration: newIsActive ? 'none' : '876000h'
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

export async function switchActiveProfile(payload: { role: string; unitName: string }) {
  try {
    const supabase = await createClient();
    
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Anda tidak terautentikasi.');

    const supabaseAdmin = createAdminClient();

    // 2. Fetch Unit ID from DB
    let selectedUnitId: string | null = null;
    if (payload.unitName && payload.unitName !== 'null' && payload.unitName !== 'undefined') {
      const { data: unitData } = await supabaseAdmin
        .from('unit')
        .select('id')
        .eq('name', payload.unitName)
        .maybeSingle();
      if (unitData) selectedUnitId = unitData.id;
    }

    // Map role
    const mapDropdownToEnum = (roleStr: string) => {
      switch (roleStr) {
        case 'ADMINISTRATOR': return 'ADMINISTRATOR';
        case 'BENDAHARA_PUSAT': return 'BENDAHARA_PUSAT';
        case 'PIMPINAN': return 'PIMPINAN';
        case 'BENDAHARA_JENJANG': return 'BENDAHARA_JENJANG';
        case 'KEPALA_JENJANG': return 'KEPALA_JENJANG';
        case 'KEPALA_UNIT': return 'KEPALA_UNIT';
        case 'BENDAHARA_UNIT': return 'BENDAHARA_UNIT';
        case 'STAFF_BIDANG': return 'STAFF_BIDANG';
        case 'STAFF': return 'STAFF';
        default: return roleStr;
      }
    };
    const dbRole = mapDropdownToEnum(payload.role);

    // 3. Verify user is allowed to switch to this role/unit
    // Administrators and Bendahara Pusat can switch to any role/unit in the system!
    // For other users, they must have a record in profiles_multi_role!
    const { data: actualProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isSuperUser = actualProfile?.role === 'ADMINISTRATOR' || actualProfile?.role === 'BENDAHARA_PUSAT';

    if (!isSuperUser) {
      // Check in profiles_multi_role
      let query = supabaseAdmin
        .from('profiles_multi_role')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', dbRole);

      if (selectedUnitId === null) {
        query = query.is('unit_id', null);
      } else {
        query = query.eq('unit_id', selectedUnitId);
      }

      const { data: hasRole, error: mappingError } = await query.maybeSingle();

      if (mappingError || !hasRole) {
        throw new Error('Anda tidak memiliki otorisasi untuk peran dan unit kerja ini.');
      }
    }

    // 4. Update profiles table set role & unit_id
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: dbRole,
        unit_id: selectedUnitId
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return { success: true };
  } catch (err: any) {
    console.error('Error switching active profile:', err);
    return { success: false, error: err.message || 'Gagal mengubah peran aktif' };
  }
}
