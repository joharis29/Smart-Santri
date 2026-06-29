const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Updating program_kegiatan...");
    const { data: d1, error: e1 } = await supabase.from('program_kegiatan').update({ unit: 'Pusat (Yayasan)' }).eq('unit', 'Pesantren/Yayasan');
    if (e1) console.error(e1); else console.log("Updated program_kegiatan");

    console.log("Updating pagu_unit...");
    const { data: d2, error: e2 } = await supabase.from('pagu_unit').update({ unit: 'Pusat (Yayasan)' }).eq('unit', 'Pesantren/Yayasan');
    if (e2) console.error(e2); else console.log("Updated pagu_unit");

    console.log("Updating transaksi_pengeluaran...");
    const { data: d3, error: e3 } = await supabase.from('transaksi_pengeluaran').update({ unit: 'Pusat (Yayasan)' }).eq('unit', 'Pesantren/Yayasan');
    if (e3) console.error(e3); else console.log("Updated transaksi_pengeluaran");

    console.log("Updating dompet_dana...");
    const { data: d4, error: e4 } = await supabase.from('dompet_dana').update({ unit: 'Pusat (Yayasan)' }).eq('unit', 'Pesantren/Yayasan');
    if (e4) console.error(e4); else console.log("Updated dompet_dana");

    console.log("Updating pengajuan_rka...");
    const { data: d5, error: e5 } = await supabase.from('pengajuan_rka').update({ unit: 'Pusat (Yayasan)' }).eq('unit', 'Pesantren/Yayasan');
    if (e5) console.error(e5); else console.log("Updated pengajuan_rka");
    
    console.log("Updating draft_pengajuan_rka...");
    const { data: d6, error: e6 } = await supabase.from('draft_pengajuan_rka').update({ unit: 'Pusat (Yayasan)' }).eq('unit', 'Pesantren/Yayasan');
    if (e6) console.error(e6); else console.log("Updated draft_pengajuan_rka");

}
run().then(() => console.log("All done!"));
