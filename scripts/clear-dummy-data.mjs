import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
  console.log('Memulai proses penghapusan data dummy transaksi...');

  // Hapus tabel dengan relasi FK (anak) lebih dulu, baru tabel induk
  const tablesToDelete = [
    'item_pengajuan',
    'dokumen_pengajuan',
    'transaksi_pengeluaran',
    'transaksi_pendapatan'
  ];

  for (const table of tablesToDelete) {
    console.log(`Menghapus isi tabel ${table}...`);
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
      
    if (error) {
      console.error(`❌ Gagal menghapus ${table}:`, error.message);
    } else {
      console.log(`✅ Berhasil menghapus semua data di ${table}`);
    }
  }

  console.log('\nMereset saldo seluruh Dompet Dana Unit ke 0...');
  const { error: updateError } = await supabase.from('dompet_dana').update({ saldo: 0 }).not('id', 'is', null);
    
  if (updateError) {
    console.error('❌ Gagal mereset dompet_dana:', updateError.message);
  } else {
    console.log('✅ Berhasil mereset saldo dompet_dana');
  }

  console.log('\nProses pembersihan data selesai! Sistem siap digunakan untuk production/UAT.');
}

clearData().catch(console.error);
