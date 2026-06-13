const path = require('path');
const mammoth = require('./node_modules/mammoth');

async function readDraft() {
    const filePath = '../docs/skripsi/draft.docx';
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        const text = result.value;
        console.log("TEXT EXTRACTED (Length):", text.length);
        // Print the first 2000 chars to get an idea, and look for "BAB IV" or "BAB 4"
        const bab4Index = text.search(/BAB\s*IV/i);
        if (bab4Index !== -1) {
            console.log("\n\n--- BAB IV FOUND ---");
            console.log(text.substring(bab4Index, bab4Index + 10000)); 
        } else {
            console.log("\n\n--- BAB IV NOT FOUND, printing start ---");
            console.log(text.substring(0, 3000));
        }
    } catch(e) {
        console.error("Error parsing DOCX:", e);
    }
}

readDraft().catch(console.error);
