const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    console.log("Fetching karyawan...");
    const { data: karyawanList, error } = await supabase.from('karyawan').select('*');
    if (error) {
        console.error(error);
        return;
    }

    let updatedCount = 0;
    for (const k of karyawanList) {
        if (k.unit && k.unit.includes('Yayasan/Pesantren (Pusat)')) {
            const newUnit = k.unit.replace('Yayasan/Pesantren (Pusat)', 'Pusat (Yayasan)');
            await supabase.from('karyawan').update({ unit: newUnit }).eq('id', k.id);
            updatedCount++;
        }
    }
    console.log(`Updated ${updatedCount} karyawan records.`);
}
run().then(() => console.log("Done"));
