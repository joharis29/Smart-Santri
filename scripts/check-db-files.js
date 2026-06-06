const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getFiles() {
    let allFiles = new Set();
    let hasMore = true;
    let start = 0;
    const step = 1000;

    while (hasMore) {
        const { data, error } = await supabase
            .from('document_chunks')
            .select('metadata')
            .range(start, start + step - 1);
        
        if (error) {
            console.error(error);
            break;
        }

        if (data.length === 0) {
            hasMore = false;
        } else {
            data.forEach(d => {
                if (d.metadata && d.metadata.file_name) {
                    allFiles.add(d.metadata.file_name);
                }
            });
            start += step;
        }
    }
    
    console.log(JSON.stringify(Array.from(allFiles).sort(), null, 2));
}

getFiles();
