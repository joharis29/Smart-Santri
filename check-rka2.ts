import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: docs } = await supabase
        .from('dokumen_pengajuan')
        .select('id, unit, unit_id, jenjang_id, jenis, status')
        .eq('jenis', 'RKA');
    
    console.log("Docs:", docs);
}

checkData();
