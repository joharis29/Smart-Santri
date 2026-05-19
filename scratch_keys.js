const https = require('https');

const url = 'https://mayaqxbpspfogkmyqudx.supabase.co/rest/v1/dokumen_pengajuan?limit=1';
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
                console.log("Keys in dokumen_pengajuan:", Object.keys(json[0]));
                console.log("Sample document values:", json[0]);
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
