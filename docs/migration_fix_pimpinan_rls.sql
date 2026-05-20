-- =========================================================================================
-- PERBAIKAN: IZIN BACA (RLS) UNTUK PIMPINAN PADA TABEL transaksi_pendapatan
-- =========================================================================================
-- Masalah: Sebelumnya Pimpinan mengalami Saldo Minus di Buku Besar karena
-- RLS (Row Level Security) transaksi_pendapatan tidak mencantumkan role 'PIMPINAN'.
-- Sehingga, Pimpinan hanya bisa membaca pengeluaran (Kredit) tapi tidak bisa membaca pemasukan (Debet).

DROP POLICY IF EXISTS "Allowed roles read pendapatan" ON public.transaksi_pendapatan;

CREATE POLICY "Allowed roles read pendapatan" ON public.transaksi_pendapatan
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'PIMPINAN', 'BENDAHARA_PUSAT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT')
  );

-- Catatan: Kebijakan INSERT tetap dibatasi untuk Administrator dan Bendahara saja.
-- Pimpinan tidak perlu melakukan Insert, hanya Read untuk laporan Buku Besar.
