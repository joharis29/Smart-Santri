const fs = require('fs');
const path = require('path');
const mammoth = require('./node_modules/mammoth');

async function readUatFiles() {
    const dir = '../docs/uat';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx'));
    
    for (const file of files) {
        console.log(`\n\n=== Reading ${file} ===`);
        const result = await mammoth.extractRawText({ path: path.join(dir, file) });
        console.log("TEXT EXTRACTED:", result.value.substring(0, 1000));
        const lines = result.value.split('\n');
        lines.forEach(l => {
            if (l.toLowerCase().includes('skor') || l.toLowerCase().includes('diterima') || l.toLowerCase().includes('ditolak') || l.toLowerCase().includes('nilai')) {
                console.log(l.substring(0, 150));
            }
        });
    }
}

readUatFiles().catch(console.error);
