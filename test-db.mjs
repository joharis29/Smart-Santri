import dotenv from 'dotenv'; dotenv.config({ path: '.env.local' }); console.log(Object.keys(process.env).filter(k => k.includes('DB') || k.includes('POSTGRES') || k.includes('DATABASE')));
