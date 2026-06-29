const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Updating program_kegiatan...");
    const { data: data1, error: err1 } = await supabase
        .from('program_kegiatan')
        .update({ unit: 'Pusat (Yayasan)' })
        .eq('unit', 'PESANTREN/YAYASAN');
    
    if (err1) console.error("Error updating program_kegiatan:", err1);
    else console.log("Updated program_kegiatan successfully.");

    console.log("Updating pagu_unit...");
    const { data: data2, error: err2 } = await supabase
        .from('pagu_unit')
        .update({ unit: 'Pusat (Yayasan)' })
        .eq('unit', 'PESANTREN/YAYASAN');

    if (err2) console.error("Error updating pagu_unit:", err2);
    else console.log("Updated pagu_unit successfully.");

    console.log("Done.");
}

run();
