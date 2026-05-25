-- Jalankan di SQL Editor Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Hapus tabel dan fungsi lama jika sebelumnya menggunakan OpenAI (1536 dimensi)
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP FUNCTION IF EXISTS match_documents CASCADE;

-- Tabel penyimpanan embedding dokumen regulasi (Google Gemini 3072 dimensi)
CREATE TABLE IF NOT EXISTS document_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT NOT NULL,  -- 'ISAK335' | 'PAP' | 'JUKNIS_BOS' | 'SOP_PESANTREN'
  content     TEXT NOT NULL,  -- teks chunk asli
  embedding   VECTOR(3072),   -- Google gemini-embedding-2 = 3072 dimensi
  metadata    JSONB,          -- { file_name, chunk_index }
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Hapus index karena data dokumen kita tidak mencapai 10.000 row, exact match tanpa index lebih cepat dan akurat.

-- RLS: hanya bisa dibaca oleh authenticated users
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_chunks" ON document_chunks;
CREATE POLICY "read_chunks" ON document_chunks 
  FOR SELECT TO authenticated USING (true);

-- Fungsi similarity search (dipanggil via RPC)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(3072),
  match_count     INT DEFAULT 5,
  filter_source   TEXT DEFAULT NULL
)
RETURNS TABLE (
  id       UUID,
  source   TEXT,
  content  TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    id, source, content, metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE (filter_source IS NULL OR source = filter_source)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
