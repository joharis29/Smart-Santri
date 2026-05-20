/**
 * =======================================================================
 * Smart Santri — RAG (Retrieval-Augmented Generation) Library
 * =======================================================================
 * Library ini menyediakan fungsi-fungsi untuk:
 * 1. Mengingestkan chunks dokumen regulasi ke Supabase Vector Store.
 * 2. Melakukan semantic search terhadap regulasi.
 * 3. Menganalisis kepatuhan transaksi keuangan terhadap regulasi.
 *
 * MODE MOCK: Jika OPENAI_API_KEY tidak tersedia, semua fungsi
 * akan mengembalikan data simulasi (mock) agar development tetap berjalan.
 * =======================================================================
 */

import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { createClient } from '@supabase/supabase-js';

// =========================================================================
// TYPES
// =========================================================================

/** Hasil analisis kepatuhan dari AI */
export interface ComplianceResult {
  /** Apakah analisis ini menggunakan AI asli atau data mock */
  isMock: boolean;
  /** Skor kepatuhan: 0-100 (100 = sangat patuh) */
  complianceScore: number;
  /** Status ringkas: 'PATUH' | 'PERINGATAN' | 'TIDAK_PATUH' */
  status: 'PATUH' | 'PERINGATAN' | 'TIDAK_PATUH';
  /** Daftar temuan/flags dari analisis */
  flags: ComplianceFlag[];
  /** Penjelasan naratif dari AI */
  explanation: string;
  /** Sumber regulasi yang dirujuk */
  references: string[];
}

export interface ComplianceFlag {
  /** Tingkat keparahan: 'INFO' | 'WARNING' | 'CRITICAL' */
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  /** Kategori regulasi: 'ISAK335' | 'PAP' | 'JUKNIS_BOS' | 'SOP_PESANTREN' */
  category: string;
  /** Pesan ringkas */
  message: string;
  /** Saran perbaikan */
  suggestion: string;
}

/** Data transaksi yang akan diaudit */
export interface TransactionData {
  /** Jenis dokumen: 'RKA' atau 'LPJ' */
  jenis: 'RKA' | 'LPJ';
  /** Nama kegiatan */
  kegiatan: string;
  /** Unit pengaju */
  unit: string;
  /** Bidang kegiatan */
  bidang: string;
  /** Total nominal anggaran */
  nominal: number;
  /** Sumber dana */
  sumberDana: string;
  /** Narasi / keterangan */
  narasi: string;
  /** Detail item-item pengajuan (opsional) */
  items?: Array<{
    judul: string;
    nominal: number;
    sumberDana: string;
  }>;
}

// =========================================================================
// CONFIGURATION
// =========================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Cek apakah OpenAI API Key tersedia dan valid */
export function isAIAvailable(): boolean {
  return OPENAI_API_KEY.length > 10 && OPENAI_API_KEY.startsWith('sk-');
}

// =========================================================================
// EMBEDDINGS & VECTOR STORE (Hanya aktif jika API Key tersedia)
// =========================================================================

let _embeddings: OpenAIEmbeddings | null = null;
let _vectorStore: SupabaseVectorStore | null = null;
let _llm: ChatOpenAI | null = null;

function getEmbeddings(): OpenAIEmbeddings {
  if (!_embeddings) {
    _embeddings = new OpenAIEmbeddings({
      openAIApiKey: OPENAI_API_KEY,
      modelName: 'text-embedding-3-small', // 1536 dimensi, hemat biaya
    });
  }
  return _embeddings;
}

function getVectorStore(): SupabaseVectorStore {
  if (!_vectorStore) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    _vectorStore = new SupabaseVectorStore(getEmbeddings(), {
      client: supabase,
      tableName: 'document_chunks',
      queryName: 'match_documents',
    });
  }
  return _vectorStore;
}

function getLLM(): ChatOpenAI {
  if (!_llm) {
    _llm = new ChatOpenAI({
      openAIApiKey: OPENAI_API_KEY,
      modelName: 'gpt-4o-mini', // Model hemat biaya tapi tetap berkualitas
      temperature: 0.1,         // Rendah agar konsisten dan presisi
      maxTokens: 1024,
    });
  }
  return _llm;
}

// =========================================================================
// PROMPT TEMPLATE
// =========================================================================

const COMPLIANCE_PROMPT = PromptTemplate.fromTemplate(`
Anda adalah **Auditor Keuangan Syariah dan Kepatuhan Pesantren** yang sangat berpengalaman.
Tugas Anda adalah menganalisis data transaksi keuangan pesantren berdasarkan regulasi yang berlaku.

## Regulasi yang Relevan (dari database):
{context}

## Data Transaksi yang Diaudit:
- **Jenis Dokumen**: {jenis}
- **Kegiatan**: {kegiatan}
- **Unit**: {unit}
- **Bidang**: {bidang}
- **Nominal**: Rp {nominal}
- **Sumber Dana**: {sumberDana}
- **Narasi**: {narasi}

## Instruksi Analisis:
1. Periksa apakah transaksi ini SESUAI dengan regulasi ISAK 335 (standar akuntansi pesantren), PAP (Pedoman Akuntansi Pesantren), Juknis BOS (jika menggunakan dana BOS), dan SOP Internal Pesantren.
2. Identifikasi potensi ketidakpatuhan atau anomali.
3. Berikan skor kepatuhan 0-100.
4. Berikan flag/peringatan jika ada masalah.

## Format Respons (HARUS JSON valid):
{{
  "complianceScore": <number 0-100>,
  "status": "<PATUH|PERINGATAN|TIDAK_PATUH>",
  "flags": [
    {{
      "severity": "<INFO|WARNING|CRITICAL>",
      "category": "<ISAK335|PAP|JUKNIS_BOS|SOP_PESANTREN>",
      "message": "<pesan ringkas>",
      "suggestion": "<saran perbaikan>"
    }}
  ],
  "explanation": "<penjelasan naratif 2-3 kalimat>",
  "references": ["<sumber regulasi yang dirujuk>"]
}}

Jawab HANYA dengan JSON valid, tanpa teks tambahan.
`);

// =========================================================================
// CORE FUNCTIONS
// =========================================================================

/**
 * Fungsi utama: Menganalisis kepatuhan transaksi terhadap regulasi.
 * Jika API Key tidak tersedia, mengembalikan data mock.
 */
export async function analyzeCompliance(
  transaction: TransactionData
): Promise<ComplianceResult> {
  // ---- MODE MOCK (Tanpa Kredit OpenAI) ----
  if (!isAIAvailable()) {
    return generateMockResult(transaction);
  }

  // ---- MODE LIVE (Dengan Kredit OpenAI) ----
  try {
    // 1. Semantic Search: Cari regulasi yang relevan
    const vectorStore = getVectorStore();
    const relevantDocs = await vectorStore.similaritySearch(
      `${transaction.kegiatan} ${transaction.narasi} ${transaction.sumberDana}`,
      5 // Ambil 5 dokumen paling relevan
    );

    const context = relevantDocs
      .map((doc, i) => `[${i + 1}] (${doc.metadata?.source || 'Regulasi'}): ${doc.pageContent}`)
      .join('\n\n');

    // 2. Bangun chain LLM
    const chain = RunnableSequence.from([
      COMPLIANCE_PROMPT,
      getLLM(),
      new StringOutputParser(),
    ]);

    // 3. Jalankan analisis
    const rawResponse = await chain.invoke({
      context: context || 'Tidak ada regulasi yang ditemukan dalam database vektor.',
      jenis: transaction.jenis,
      kegiatan: transaction.kegiatan,
      unit: transaction.unit,
      bidang: transaction.bidang,
      nominal: transaction.nominal.toLocaleString('id-ID'),
      sumberDana: transaction.sumberDana,
      narasi: transaction.narasi,
    });

    // 4. Parse respons JSON
    const parsed = JSON.parse(rawResponse);

    return {
      isMock: false,
      complianceScore: parsed.complianceScore ?? 75,
      status: parsed.status ?? 'PERINGATAN',
      flags: parsed.flags ?? [],
      explanation: parsed.explanation ?? 'Analisis berhasil dilakukan.',
      references: parsed.references ?? [],
    };
  } catch (error: any) {
    console.error('[RAG] Error during compliance analysis:', error.message);

    // Fallback ke mock jika terjadi error (misal: rate limit, network error)
    return {
      ...generateMockResult(transaction),
      explanation: `Analisis AI gagal: ${error.message}. Menampilkan hasil estimasi otomatis.`,
    };
  }
}

/**
 * Ingest chunks dokumen ke Supabase Vector Store.
 * Dipanggil oleh script `prepare_documents.ts` setelah chunks dibuat.
 * Memerlukan API Key OpenAI untuk membuat embeddings.
 */
export async function ingestChunks(
  chunks: Array<{ content: string; source: string; metadata: Record<string, any> }>
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!isAIAvailable()) {
    return {
      success: false,
      count: 0,
      error: 'OPENAI_API_KEY tidak tersedia. Proses embedding memerlukan kredit OpenAI.',
    };
  }

  try {
    const vectorStore = getVectorStore();

    // Konversi chunks ke format LangChain Document
    const documents = chunks.map(chunk => ({
      pageContent: chunk.content,
      metadata: {
        source: chunk.source,
        ...chunk.metadata,
      },
    }));

    // Batch insert (LangChain otomatis membuat embeddings)
    await vectorStore.addDocuments(documents);

    return { success: true, count: documents.length };
  } catch (error: any) {
    console.error('[RAG] Error during chunk ingestion:', error.message);
    return { success: false, count: 0, error: error.message };
  }
}

// =========================================================================
// MOCK DATA GENERATOR
// =========================================================================

/**
 * Menghasilkan data analisis kepatuhan simulasi berdasarkan heuristik sederhana.
 * Digunakan saat API Key OpenAI tidak tersedia.
 */
function generateMockResult(transaction: TransactionData): ComplianceResult {
  const flags: ComplianceFlag[] = [];
  let score = 85; // Skor default: cukup baik

  const sumberLower = (transaction.sumberDana || '').toLowerCase();
  const narasiLower = (transaction.narasi || '').toLowerCase();

  // --- Heuristik 1: Validasi penggunaan Dana BOS ---
  if (sumberLower.includes('bos')) {
    // Dana BOS memiliki aturan ketat dari Juknis Kemendikbud
    if (narasiLower.includes('makan') || narasiLower.includes('konsumsi')) {
      flags.push({
        severity: 'WARNING',
        category: 'JUKNIS_BOS',
        message: 'Dana BOS tidak boleh digunakan untuk konsumsi rapat/kegiatan yang tidak terkait langsung dengan pembelajaran.',
        suggestion: 'Pastikan konsumsi terkait langsung dengan kegiatan belajar mengajar (KBM). Lampirkan bukti kegiatan.',
      });
      score -= 15;
    }

    if (transaction.nominal > 50000000) {
      flags.push({
        severity: 'INFO',
        category: 'JUKNIS_BOS',
        message: 'Pengajuan Dana BOS di atas Rp 50 juta memerlukan persetujuan komite sekolah.',
        suggestion: 'Lampirkan notulensi rapat komite sekolah yang menyetujui anggaran ini.',
      });
      score -= 5;
    }
  }

  // --- Heuristik 2: Validasi ISAK 335 (Akuntansi Pesantren) ---
  if (sumberLower.includes('zakat')) {
    // Zakat memiliki batasan penggunaan (8 asnaf)
    flags.push({
      severity: 'INFO',
      category: 'ISAK335',
      message: 'Dana Zakat bersifat terikat (restricted) dan harus disalurkan sesuai 8 golongan asnaf (ISAK 335 par. 10).',
      suggestion: 'Pastikan penerima manfaat termasuk dalam 8 golongan asnaf yang ditentukan syariat.',
    });
  }

  if (sumberLower.includes('infaq') || sumberLower.includes('sedekah')) {
    flags.push({
      severity: 'INFO',
      category: 'ISAK335',
      message: 'Dana Infaq/Sedekah yang bersifat terikat harus digunakan sesuai peruntukan donatur (ISAK 335 par. 12).',
      suggestion: 'Verifikasi bahwa penggunaan dana sesuai dengan niat awal pemberi infaq.',
    });
  }

  // --- Heuristik 3: Validasi SOP Pesantren ---
  if (transaction.jenis === 'LPJ' && !narasiLower.includes('bukti') && !narasiLower.includes('kuitansi') && !narasiLower.includes('nota')) {
    flags.push({
      severity: 'WARNING',
      category: 'SOP_PESANTREN',
      message: 'Narasi LPJ tidak menyebutkan bukti transaksi (nota/kuitansi).',
      suggestion: 'Sertakan referensi nomor nota/kuitansi atau foto bukti transaksi dalam narasi LPJ.',
    });
    score -= 10;
  }

  // --- Heuristik 4: Cek nominal wajar ---
  if (transaction.nominal > 100000000) {
    flags.push({
      severity: 'WARNING',
      category: 'PAP',
      message: 'Nominal pengajuan melebihi Rp 100 juta. Berdasarkan PAP, transaksi material memerlukan otorisasi berlapis.',
      suggestion: 'Pastikan pengajuan ini telah melewati persetujuan Kepala Unit, Bendahara Pusat, dan Pimpinan Pesantren.',
    });
    score -= 10;
  }

  // Tentukan status berdasarkan skor
  let status: ComplianceResult['status'] = 'PATUH';
  if (score < 60) status = 'TIDAK_PATUH';
  else if (score < 80) status = 'PERINGATAN';

  // Jika tidak ada flag sama sekali, beri flag positif
  if (flags.length === 0) {
    flags.push({
      severity: 'INFO',
      category: 'SOP_PESANTREN',
      message: 'Tidak ditemukan indikasi ketidakpatuhan pada transaksi ini.',
      suggestion: 'Lanjutkan proses persetujuan sesuai alur yang berlaku.',
    });
  }

  return {
    isMock: true,
    complianceScore: Math.max(0, Math.min(100, score)),
    status,
    flags,
    explanation: `[Mode Simulasi] Analisis otomatis mendeteksi ${flags.length} catatan pada pengajuan ${transaction.jenis} "${transaction.kegiatan}" dengan sumber dana ${transaction.sumberDana}. Skor kepatuhan estimasi: ${Math.max(0, Math.min(100, score))}/100.`,
    references: [
      'ISAK 335 — Akuntansi Entitas Berorientasi Nonlaba (Pesantren)',
      'PAP — Pedoman Akuntansi Pesantren',
      'Juknis BOS — Petunjuk Teknis Dana Bantuan Operasional Sekolah',
      'SOP Internal Pesantren Smart Santri',
    ],
  };
}
