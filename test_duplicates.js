const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findDuplicates() {
    const { data, error } = await supabase.from('program_kegiatan').select('id, unit, bidang, program, nama_kegiatan');
    if (error) { console.error('Error fetching:', error); return; }
    
    const normalizeStr = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const groups = {};
    data.forEach(r => {
        const key = normalizeStr(r.unit) + '|' + normalizeStr(r.bidang) + '|' + normalizeStr(r.program) + '|' + normalizeStr(r.nama_kegiatan);
        if(!groups[key]) groups[key] = [];
        groups[key].push(r.id);
    });
    
    let duplicateCount = 0;
    const toDelete = [];
    
    for (const [key, ids] of Object.entries(groups)) {
        if (ids.length > 1) {
            duplicateCount++;
            console.log('Duplicate found:', key, ids.length, 'rows');
            
            // We need to check if any of these IDs are used in pagu_program.
            // Wait, let's fetch pagu_program for these IDs to see which one has pagu.
            const { data: pagus } = await supabase.from('pagu_program').select('id, program_id, nominal_pagu').in('program_id', ids);
            
            const usedIds = new Set(pagus?.map(p => p.program_id) || []);
            
            let idToKeep = null;
            // Prefer an ID that is used in pagu_program
            for (const id of ids) {
                if (usedIds.has(id)) {
                    idToKeep = id;
                    break;
                }
            }
            
            // If none are used, just keep the first one
            if (!idToKeep) {
                idToKeep = ids[0];
            }
            
            // Push the rest to delete
            for (const id of ids) {
                if (id !== idToKeep) {
                    toDelete.push(id);
                }
            }
        }
    }
    
    console.log('Total Duplicate Groups:', duplicateCount);
    console.log('Total Rows to Delete:', toDelete.length);
    
    // Now actually delete them
    if (toDelete.length > 0) {
        // Delete in chunks of 100 to avoid limits
        const chunkSize = 100;
        for (let i = 0; i < toDelete.length; i += chunkSize) {
            const chunk = toDelete.slice(i, i + chunkSize);
            const { error: delErr } = await supabase.from('program_kegiatan').delete().in('id', chunk);
            if (delErr) {
                console.error('Delete error for chunk:', delErr);
            } else {
                console.log('Deleted chunk of', chunk.length, 'rows');
            }
        }
        console.log('Finished deleting duplicates.');
    }
}
findDuplicates();
