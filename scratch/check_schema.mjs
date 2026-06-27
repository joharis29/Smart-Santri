import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('dokumen_pengajuan').select('*').limit(1);
  if (error) console.error(error);
  if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
  } else {
      console.log('No data found, trying to get columns from error:');
      const { data: d2, error: e2 } = await supabase.rpc('get_columns', { table_name: 'dokumen_pengajuan' });
      console.log(e2);
  }
}
main();
