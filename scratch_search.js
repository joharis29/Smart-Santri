const https = require('https');

const url = 'https://mayaqxbpspfogkmyqudx.supabase.co/rest/v1/dokumen_pengajuan?select=*,item_pengajuan(*)';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1heWFxeGJwc3Bmb2drbXlxdWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDk0OTMsImV4cCI6MjA5Mzk4NTQ5M30.4_rF8Fuh5aQen6YMKmm5euF88CVmvSScdsGMS8rHC_U';

const options = {
    method: 'GET',
    headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
    }
};

const req = https.request(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const docs = JSON.parse(data);
            console.log(`Total documents found: ${docs.length}`);
            docs.forEach(doc => {
                const matchedItems = (doc.item_pengajuan || []).filter(it => 
                    (it.judul_kegiatan || '').toLowerCase().includes('optimalisasi')
                );
                if (matchedItems.length > 0) {
                    console.log(`\n================================`);
                    console.log(`Doc ID: ${doc.id}`);
                    console.log(`Unit: ${doc.unit}`);
                    console.log(`Status: ${doc.status}`);
                    console.log(`Created At: ${doc.created_at}`);
                    matchedItems.forEach(it => {
                        console.log(`  Item ID: ${it.id}`);
                        console.log(`  Judul: ${it.judul_kegiatan}`);
                        console.log(`  Nominal: ${it.nominal}`);
                        try {
                            const details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : it.rincian_json;
                            console.log(`  JSON Items:`, details?.items);
                            console.log(`  JSON fundingSplits:`, details?.fundingSplits);
                        } catch(e) {}
                    });
                }
            });
        } catch (e) {
            console.error("Parse error:", e);
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
