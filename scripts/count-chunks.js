const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function countChunks() {
    let allData = [];
    let hasMore = true;
    let start = 0;
    const step = 1000;

    while (hasMore) {
        const { data, error } = await supabase
            .from('document_chunks')
            .select('metadata')
            .range(start, start + step - 1);
        
        if (error) break;

        if (data.length === 0) {
            hasMore = false;
        } else {
            allData = allData.concat(data);
            start += step;
        }
    }
    
    const counts = {};
    allData.forEach(d => {
        if (d.metadata && d.metadata.file_name) {
            counts[d.metadata.file_name] = (counts[d.metadata.file_name] || 0) + 1;
        }
    });
    
    console.log(JSON.stringify(counts, null, 2));
}

countChunks();
