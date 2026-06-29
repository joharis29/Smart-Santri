const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching program_kegiatan units...");
    const { data, error } = await supabase.from('program_kegiatan').select('unit');
    if(error) console.error(error);
    const units = [...new Set(data.map(d => d.unit))];
    console.log("Unique units in program_kegiatan:", units);
}
run().then(() => {
    console.log("Done");
});
