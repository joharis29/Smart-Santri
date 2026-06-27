import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
      console.log('Error getting tables using get_tables RPC:', error.message);
      // fallback: let's query a known table or do something else
  } else {
      console.log("Tables:", data);
  }
}
main();
