const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching program_kegiatan...");
    const { data } = await supabase.from('program_kegiatan').select('unit').eq('unit', 'PESANTREN/YAYASAN').limit(5);
    console.log("PESANTREN/YAYASAN records:", data);
    
    const { data: data2 } = await supabase.from('program_kegiatan').select('unit').eq('unit', 'Pusat (Yayasan)').limit(5);
    console.log("Pusat (Yayasan) records:", data2);
    
    // Check if there are other tables that might have it, e.g. RKA / Pengajuan
    
    process.exit(0);
}
run();
