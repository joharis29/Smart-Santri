import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const checkDB = async () => {
    const { data, count, error } = await supabase.from('document_chunks').select('source', { count: 'exact' }).eq('source', 'PAP').limit(1);
    console.log('PAP count:', count);
}
checkDB();
