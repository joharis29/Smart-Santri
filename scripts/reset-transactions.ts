import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function resetTransactions() {
  console.log('Memulai proses pembersihan riwayat transaksi (Reset Data)...')

  const tablesToClear = [
    'item_pengajuan',
    'dokumen_pengajuan',
    'transaksi_pengeluaran',
    'transaksi_pendapatan'
  ];

  for (const table of tablesToClear) {
    console.log(`Menghapus data di tabel: ${table}...`)
    const { error } = await supabase.from(table).delete().not('id', 'is', null)
    
    if (error) {
      console.error(`❌ Gagal menghapus tabel ${table}:`, error.message)
    } else {
      console.log(`✅ Tabel ${table} berhasil dibersihkan.`)
    }
  }

  console.log('Mengembalikan semua saldo di dompet_dana menjadi 0 (Nol)...')
  const { data: wallets } = await supabase.from('dompet_dana').select('id');
  if (wallets) {
    for (const w of wallets) {
      await supabase.from('dompet_dana').update({ saldo: 0 }).eq('id', w.id);
    }
    console.log(`✅ ${wallets.length} dompet dana berhasil di-reset saldonya menjadi 0.`);
  }

  console.log('\nPembersihan Selesai! Semua jejak transaksi telah dihapus.')
}

resetTransactions();
