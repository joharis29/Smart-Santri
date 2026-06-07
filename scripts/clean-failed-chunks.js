const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function clean() {
    const failedFiles = [
        "8. Juknis BOS.pdf",
        "9. Juknis BOS.pdf",
        "23. Juknis BOS.pdf"
    ];
    
    console.log('Menghapus sisa chunk yang gagal dari database...');
    
    for (const file of failedFiles) {
        console.log(`Menghapus chunk untuk file: ${file}`);
        const { error } = await supabase
            .from('document_chunks')
            .delete()
            .eq('metadata->>file_name', file);
            
        if (error) {
            console.error(`Gagal menghapus chunk untuk ${file}:`, error);
        } else {
            console.log(`Berhasil menghapus chunk untuk ${file}`);
        }
    }
    console.log('Pembersihan selesai.');
}

clean();
