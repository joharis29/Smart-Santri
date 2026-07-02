const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPaguDuplicates() {
    const { data, error } = await supabase.from('pagu_program').select('id, program_id, periode_id');
    if (error) { console.error('Error fetching pagu:', error); return; }
    
    const groups = {};
    data.forEach(r => {
        const key = r.program_id + '_' + r.periode_id;
        if(!groups[key]) groups[key] = [];
        groups[key].push(r.id);
    });
    
    let dupCount = 0;
    const toDelete = [];
    for (const [key, ids] of Object.entries(groups)) {
        if (ids.length > 1) {
            dupCount++;
            for (let i = 1; i < ids.length; i++) {
                toDelete.push(ids[i]);
            }
        }
    }
    console.log('Pagu duplicates:', dupCount, 'Rows to delete:', toDelete.length);
    
    if (toDelete.length > 0) {
        const { error: delErr } = await supabase.from('pagu_program').delete().in('id', toDelete);
        console.log('Deleted pagu duplicates:', delErr || 'Success');
    }
}
checkPaguDuplicates();
