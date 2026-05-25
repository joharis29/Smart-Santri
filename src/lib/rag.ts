import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { createClient } from '@/utils/supabase/server'

// Inisialisasi model dipindahkan ke dalam fungsi untuk mencegah error build Vercel

export interface AuditResult {
  status: 'AMAN' | 'ANOMALI'
  alasan: string
  referensi: string[]
  skor_kepatuhan: number
}

export async function auditNarasi(
  jenis: 'RKA' | 'LPJ',
  narasi: string,
  kategoriCoa: string,
  sumberDana: string,
  nominalRp: number,
  rincian?: any[]
): Promise<AuditResult> {
  const supabase = await createClient()

  try {
    // Inisialisasi model (ditaruh di sini agar tidak memicu error saat Vercel static build time)
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: 'gemini-embedding-2',
    })

    const llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      temperature: 0,
      maxOutputTokens: 1024,
    })

    // 1. Embed query (Ubah teks narasi menjadi angka vektor)
    const queryVector = await embeddings.embedQuery(narasi)

    // 2. Similarity Search ke Supabase (Ambil 5 regulasi paling relevan)
    // Karena kita tidak menggunakan index ivfflat, pencarian exact match dilakukan
    const { data: chunks, error } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_count: 5,
      filter_source: null
    })

    if (error) {
      console.error('Error fetching chunks:', error)
      throw error
    }

    if (!chunks || chunks.length === 0) {
      return {
        status: 'AMAN',
        alasan: 'Tidak ada aturan spesifik yang melarang pengeluaran ini pada dokumen regulasi yang tersedia.',
        referensi: [],
        skor_kepatuhan: 80
      }
    }

    // 3. Bangun konteks untuk LLM
    const konteks = chunks
      .map((c: any) => `[SUMBER: ${c.source} | FILE: ${c.metadata?.file_name || 'unknown'}]\n${c.content}`)
      .join('\n\n-------------------\n\n')

    // 4. Prompting ke Gemini 1.5 Flash
    const systemPrompt = `Anda adalah Auditor Finansial Internal Pesantren yang sangat ketat dan ahli dalam regulasi keuangan pesantren (ISAK 335, Panduan Akuntansi Pesantren, Juknis BOS, dan SOP Internal).

Tugas Anda adalah memvalidasi dokumen ${jenis} (Rencana Kerja / Laporan Pertanggungjawaban) berikut berdasarkan konteks regulasi yang disediakan.

ATURAN AUDIT:
1. Anda HANYA boleh mengambil keputusan berdasarkan "Konteks Regulasi" di bawah. Jangan berasumsi di luar konteks.
2. Jika dokumen tersebut sejalan atau tidak dilarang oleh konteks -> status "AMAN"
3. Jika dokumen tersebut terindikasi melanggar konteks (misal: dana BOS dipakai untuk honor rutin padahal dilarang) -> status "ANOMALI"
4. Output ANDA HARUS BERUPA JSON VALID tanpa awalan/akhiran tambahan (seperti \`\`\`json).

KONTEKS REGULASI:
${konteks}`

    let rincianText = '';
    if (rincian && rincian.length > 0) {
      rincianText = '\n\nRincian Item Belanja:\n' + rincian.map(it => `- ${it.name} (${it.qty} ${it.unit}): Rp ${Number(it.total).toLocaleString('id-ID')}`).join('\n');
    }

    const userPrompt = `Lakukan audit pada transaksi berikut:
- Jenis Dokumen: ${jenis}
- Narasi Pengeluaran: "${narasi}"
- Kategori Akun (COA): ${kategoriCoa}
- Sumber Dana: ${sumberDana}
- Nominal Total: Rp ${nominalRp.toLocaleString('id-ID')}${rincianText}

Berikan output dalam bentuk JSON murni dengan format berikut:
{
  "status": "AMAN" atau "ANOMALI",
  "alasan": "berikan 1-2 kalimat alasan singkat dan tegas mengapa aman atau anomali. PENTING: JANGAN gunakan tanda kutip ganda (\") atau baris baru (enter/newline) di dalam teks alasan ini agar JSON tidak rusak",
  "referensi": ["tuliskan nama dokumen atau bab yang mendasari keputusan Anda dari konteks yang ada"],
  "skor_kepatuhan": angka 0 sampai 100
}
HANYA kembalikan JSON murni, jangan beri tambahan teks apa pun di luar blok kurawal { }.`

    // 5. Panggil LLM
    const response = await llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ])

    // 6. Parsing Output JSON
    const responseText = response.content.toString()
    
    // Ekstraksi hanya blok JSON
    let jsonString = responseText;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    // Membersihkan sisa markdown jika ada
    jsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim()
    
    try {
      return JSON.parse(jsonString) as AuditResult;
    } catch (parseError) {
      console.warn('[RAG] Failed to parse JSON, falling back to regex extract:', parseError);
      // Fallback jika Gemini membandel atau teks terpotong
      const statusMatch = jsonString.match(/"status"\s*:\s*"?([^",\s}]+)"?/i);
      const statusStr = statusMatch ? statusMatch[1].toUpperCase() : 'AMAN';
      const finalStatus = (statusStr === 'ANOMALI' || statusStr === 'AMAN') ? statusStr : 'AMAN';
      
      const alasanMatch = jsonString.match(/"alasan"\s*:\s*"([^"]*)/i);
      const alasanStr = alasanMatch ? alasanMatch[1] : 'Sistem berhasil melakukan audit, namun format alasan gagal dibaca.';
      
      return {
        status: finalStatus,
        alasan: alasanStr,
        referensi: [],
        skor_kepatuhan: finalStatus === 'ANOMALI' ? 30 : 85
      };
    }

  } catch (error: any) {
    console.error('[RAG Audit Error]', error)
    return {
      status: 'AMAN', // Fail-safe: jika AI error, jangan blokir proses
      alasan: 'Gagal melakukan audit AI secara otomatis karena gangguan sistem. Detail Error: ' + (error?.message || 'Unknown Error'),
      referensi: [],
      skor_kepatuhan: 50
    }
  }
}
