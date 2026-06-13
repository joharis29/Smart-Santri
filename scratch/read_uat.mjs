import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

async function readUatFiles() {
    const dir = 'docs/uat';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx'));
    
    for (const file of files) {
        console.log(`\n\n=== Reading ${file} ===`);
        const result = await mammoth.extractRawText({ path: path.join(dir, file) });
        console.log(result.value.substring(0, 1000));
        // print a summary or matching lines for ratings
        const lines = result.value.split('\n').filter(l => l.trim().length > 0);
        console.log('--- key lines ---');
        lines.forEach(l => {
            if (l.toLowerCase().includes('skor') || l.toLowerCase().includes('diterima') || l.toLowerCase().includes('ditolak') || l.toLowerCase().includes('nilai')) {
                console.log(l.substring(0, 150));
            }
        });
    }
}

readUatFiles().catch(console.error);
