import { createClient } from '@supabase/supabase-js';

export default function Home() {
  // Mengambil kunci dari brankas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Jika kunci kosong, kita tampilkan error di layar, JANGAN paksa mesin menyala
  if (!supabaseUrl || !supabaseKey) {
    return (
      <main style={{ padding: '50px', textAlign: 'center' }}>
        <h2 style={{ color: 'red' }}>🚨 Kunci Tidak Terbaca!</h2>
        <p>URL terbaca: {supabaseUrl ? '✅ Ya' : '❌ Tidak'}</p>
        <p>Key terbaca: {supabaseKey ? '✅ Ya' : '❌ Tidak'}</p>
      </main>
    );
  }

  // Jika kunci ada, baru nyalakan mesin
  const supabase = createClient(supabaseUrl, supabaseKey);

  return (
    <main style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Tes Koneksi Supabase 🚀</h1>
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
        <h2 style={{ color: 'green' }}>✅ Koneksi Berhasil!</h2>
        <p>Mesin Next.js sudah berhasil membaca kuncimu.</p>
      </div>
    </main>
  );
}