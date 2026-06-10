import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const email = 'admin.smartsantri@gmail.com';
  console.log(`Updating password for ${email}...`);

  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const user = listData.users.find(u => u.email === email);

  if (!user) {
    console.error("User not found!");
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: 'SmartSantri2026!' }
  );

  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('SUCCESS! Password updated.');
  }
}

run();
