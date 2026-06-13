const fs = require('fs');
const pdf = require('./node_modules/pdf-parse');

async function readPdfs() {
    const dir = '../docs/uat';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    
    for (const file of files) {
        console.log(`\n\n=== Reading ${file} ===`);
        const dataBuffer = fs.readFileSync(`${dir}/${file}`);
        try {
            const data = await pdf(dataBuffer);
            console.log("TEXT EXTRACTED:", data.text.substring(0, 1500));
            // Just look for "Diterima" or "Sangat Baik" or percentages
            const matches = data.text.match(/(\d+\s*%|\d+\/\d+|sangat baik|baik|cukup|kurang|diterima|ditolak)/gi);
            if (matches) {
                console.log("Matches found:", [...new Set(matches)].join(', '));
            }
        } catch(e) {
            console.error("Error parsing PDF:", e);
        }
    }
}

readPdfs().catch(console.error);
