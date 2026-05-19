const https = require('https');

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1heWFxeGJwc3Bmb2drbXlxdWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDk0OTMsImV4cCI6MjA5Mzk4NTQ5M30.4_rF8Fuh5aQen6YMKmm5euF88CVmvSScdsGMS8rHC_U';

function checkDoc(id, name) {
    const url = `https://mayaqxbpspfogkmyqudx.supabase.co/rest/v1/dokumen_pengajuan?id=eq.${id}`;
    const options = {
        method: 'GET',
        headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`
        }
    };

    const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json && json.length > 0) {
                    console.log(`=== ${name} ===`);
                    console.log("ID:", json[0].id);
                    console.log("jenis:", json[0].jenis);
                    console.log("status:", json[0].status);
                    console.log("total_nominal:", json[0].total_nominal);
                } else {
                    console.log(`=== ${name} === NOT FOUND`);
                }
            } catch(e) { console.error(e); }
        });
    });
    req.end();
}

checkDoc('4335c587-c035-44a2-a742-8a5b4f6931b8', 'LPJ Document');
checkDoc('2c78963e-fc02-48f9-80e6-b80024498ee1', 'RKA Document');
