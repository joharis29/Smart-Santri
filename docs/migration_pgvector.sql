-- Jalankan di SQL Editor Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabel penyimpanan embedding dokumen regulasi
CREATE TABLE IF NOT EXISTS document_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT NOT NULL,  -- 'ISAK335' | 'PAP' | 'JUKNIS_BOS' | 'SOP_PESANTREN'
  content     TEXT NOT NULL,  -- teks chunk asli
  embedding   VECTOR(1536),   -- OpenAI text-embedding-3-small = 1536 dimensi
  metadata    JSONB,          -- { page, chapter, section }
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index cosine similarity (paling efisien untuk semantic search)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS: hanya bisa dibaca oleh authenticated users
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_chunks" ON document_chunks;
CREATE POLICY "read_chunks" ON document_chunks 
  FOR SELECT TO authenticated USING (true);

-- Fungsi similarity search (dipanggil via RPC)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
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
