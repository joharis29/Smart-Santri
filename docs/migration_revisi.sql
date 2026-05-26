-- Jalankan script ini di SQL Editor Supabase untuk menambahkan dukungan Revisi RKA

ALTER TABLE dokumen_pengajuan 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES dokumen_pengajuan(id) ON DELETE SET NULL;

-- Berikan komentar pada kolom untuk dokumentasi
COMMENT ON COLUMN dokumen_pengajuan.parent_id IS 'ID Dokumen RKA asli. Jika tidak null, berarti ini adalah pengajuan Revisi RKA.';
