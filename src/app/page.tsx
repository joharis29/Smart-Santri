import { createClient } from '@supabase/supabase-js';

export default function Home() {
  // Mengambil kunci dari brankas .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Menyalakan mesin Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  return (
    <main style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Tes Koneksi Supabase 🚀</h1>

      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
        {supabaseUrl ? (
          <div>
            <h2 style={{ color: 'green' }}>✅ Koneksi Berhasil!</h2>
            <p>Next.js sudah berhasil membaca kunci Supabase-mu.</p>
            <code style={{ background: '#eee', padding: '5px', borderRadius: '5px' }}>
              URL Proyek: {supabaseUrl.substring(0, 25)}...
            </code>
          </div>
        ) : (
          <h2 style={{ color: 'red' }}>❌ Koneksi Gagal!</h2>
        )}
      </div>
    </main>
  );
}