const https = require('https');

const url = 'https://mayaqxbpspfogkmyqudx.supabase.co/rest/v1/dokumen_pengajuan?id=eq.4335c587-c035-44a2-a742-8a5b4f6931b8&select=*,item_pengajuan(*)';
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
            const json = JSON.parse(data);
            if (json && json.length > 0) {
                const doc = json[0];
                console.log("=== DOCUMENT ===");
                console.log("ID:", doc.id);
                console.log("Status:", doc.status);
                console.log("=== ITEMS ===");
                doc.item_pengajuan.forEach((it, idx) => {
                    console.log(`\nItem ${idx + 1}:`);
                    console.log("  ID:", it.id);
                    console.log("  Judul Kegiatan:", it.judul_kegiatan);
                    console.log("  Nominal (in db):", it.nominal);
                    const details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {});
                    console.log("  Rincian JSON Items:", details.items);
                    console.log("  Rincian JSON fundingSplits:", details.fundingSplits);
                    console.log("  Rincian JSON subsidiSources:", details.subsidiSources);
                    console.log("  Rincian JSON jumlah_kegiatan:", details.jumlah_kegiatan);
                });
            } else {
                console.log("No document found.");
            }
        } catch (e) {
            console.error("Parse Error:", e);
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
