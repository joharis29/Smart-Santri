import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, role');
    
    console.log("All roles in DB:", Array.from(new Set(profiles.map(p => p.role))));
}

checkData();
