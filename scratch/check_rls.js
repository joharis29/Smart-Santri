require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL);
client.connect().then(() => {
  return client.query("SELECT * FROM pg_policies WHERE tablename = 'dokumen_pengajuan'");
}).then(res => {
  console.log(res.rows);
  client.end();
}).catch(console.error);
