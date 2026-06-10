'use server';

import { createAdminClient } from '@/utils/supabase/admin';

export async function checkEmailExists(email: string) {
  try {
    const supabaseAdmin = createAdminClient();
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = listData.users.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );
    return { success: true, exists: !!authUser };
  } catch (err: any) {
    console.error('Error checking email:', err);
    return { success: false, exists: false, error: err.message };
  }
}
