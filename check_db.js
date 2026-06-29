const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    console.log("Checking...");
    const { data } = await supabase.from('program_kegiatan').select('unit').eq('unit', 'PESANTREN/YAYASAN').limit(5);
    console.log(data);
    process.exit(0);
}
run();
