'use server';

import { createAdminClient } from '@/utils/supabase/admin';

export async function sendPasswordResetLink(email: string, origin: string) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Cek secara eksplisit apakah email terdaftar di database Supabase Auth
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    
    const authUser = listData.users.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!authUser) {
      return { success: false, error: 'Mohon maaf, akun tidak terdaftar di sistem.' };
    }

    // 2. Jika email terdaftar, panggil Supabase Auth menggunakan hak akses Admin
    // agar proses pengiriman tetap berjalan dari server
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-kata-sandi`,
    });

    if (resetError) {
      return { success: false, error: 'Gagal mengirim email reset. Pastikan layanan email aktif.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error sending reset link:', err);
    return { success: false, error: err.message || 'Terjadi kesalahan sistem' };
  }
}
