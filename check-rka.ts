import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: docs } = await supabase
        .from('dokumen_pengajuan')
        .select('id, unit, jenis, status, parent_id, total_nominal, bidang, created_at')
        .eq('jenis', 'RKA');
    
    console.log("All RKA Documents:", docs);
    
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, role, unit_id, jenjang_id, full_name');
        
    console.log("Profiles:", profiles.filter(p => p.email?.includes('staf')));
}

checkData();
