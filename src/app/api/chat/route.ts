import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client (Service Role for admin/rpc access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'gemini-embedding-001',
  maxRetries: 3,
});

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.5-flash', // Memakai model terbaru yang stabil
  temperature: 0.3, // Sedikit kreativitas untuk gaya bahasa asisten, tapi tetap faktual
  maxRetries: 3,
  maxOutputTokens: 4096,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Expand known abbreviations for better embedding matching
    let searchQuery = message
      .replace(/\bPAP\b/gi, 'Pedoman Akuntansi Pesantren (PAP)')
      .replace(/\bISAK 35\b/gi, 'Interpretasi Standar Akuntansi Keuangan (ISAK) 35')
      .replace(/\bISAK 335\b/gi, 'Interpretasi Standar Akuntansi Keuangan (ISAK) 335')
      .replace(/\bBOS\b/gi, 'Bantuan Operasional Sekolah (BOS)');

    // 1. Embed query untuk mencari dokumen relevan (RAG)
    let queryVector = null;
    try {
      queryVector = await embeddings.embedQuery(searchQuery);
    } catch (embError: any) {
      console.warn('[Chatbot] Embedding failed (possibly Rate Limit):', embError.message);
      // Fallback: Jika terkena Limit (429), kita hentikan dengan status 429
      if (embError?.message?.includes('429') || embError?.message?.toLowerCase().includes('quota')) {
         return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
      }
    }

    let konteks = '';
    
    // 2. Jika embedding berhasil, ambil dokumen dari Supabase
    if (queryVector) {
      const { data: chunks, error } = await supabase.rpc('match_documents', {
        query_embedding: queryVector,
        match_count: 5,
        filter_source: null
      });

      if (!error && chunks && chunks.length > 0) {
        konteks = chunks
          .map((c: any) => `[SUMBER: ${c.source} | FILE: ${c.metadata?.file_name || 'unknown'}]\n${c.content}`)
          .join('\n\n');
      }
    }

    // 3. Susun History menjadi string atau objek untuk prompt
    // LangChain bisa menerima history, tapi cara paling aman untuk prompt sederhana adalah menyisipkannya.
    const historyText = (history || [])
        .map((h: any) => `${h.role === 'user' ? 'Pengguna' : 'AI'}: ${h.content}`)
        .join('\n');

    const systemPrompt = `Anda adalah "Asisten Cerdas Smart Santri", sebuah AI ramah, profesional, dan membantu yang melayani pengguna aplikasi manajemen keuangan pesantren.
Tugas Anda adalah:
1. Menjawab pertanyaan pengguna terkait operasional sistem atau aturan regulasi keuangan pesantren.
2. JIKA pengguna bertanya hal terkait aturan keuangan, GUNAKAN referensi dokumen di bawah ini untuk menjawab secara akurat.
3. SANGAT PENTING: JIKA dokumen referensi ("KONTEKS REGULASI DITEMUKAN" di bawah) KOSONG atau tidak mengandung informasi yang ditanyakan, ANDA DILARANG KERAS mengambil informasi dari luar sistem atau menggunakan pengetahuan umum. Anda WAJIB menjawab: "Maaf, informasi tersebut belum tersedia di dalam sistem Smart Santri" atau kalimat semacamnya. Jangan berhalusinasi.
4. JIKA Anda memberikan jawaban berdasarkan konteks, Anda WAJIB MENGUTIP sumbernya di awal atau akhir penjelasan. PENTING: JANGAN cantumkan nama file mentah (seperti "2. Juknis BOS.pdf"). Anda harus mencari dan merangkai JUDUL RESMI peraturan tersebut berdasarkan isi teks konteks (misal: "Berdasarkan Keputusan Direktur Jenderal Pendidikan Islam Nomor..."). Jika judul resmi tidak terlihat jelas di teks, sebutkan secara umum (misal: "Menurut Petunjuk Teknis BOS...").
5. Berikan jawaban yang lengkap dan tuntas, jangan sampai terpotong. Gunakan bahasa Indonesia yang baik, ramah, dan ringkas. Gunakan Markdown (bold, italic, list) untuk membuat jawaban mudah dibaca.
6. Anda bisa mengingat percakapan sebelumnya jika relevan.

--- KONTEKS REGULASI DITEMUKAN ---
${konteks || 'KOSONG (Tidak ada referensi dokumen yang ditemukan untuk pertanyaan ini).'}
----------------------------------`;

    const finalPrompt = `${systemPrompt}\n\n[Riwayat Percakapan Sebelumnya]\n${historyText}\n\nPengguna: ${message}\nAI:`;

    // 4. Tanya LLM
    const response = await llm.invoke(finalPrompt);

    return NextResponse.json({ 
        reply: response.content 
    });

  } catch (error: any) {
    console.error('[Chat API Error]', error);
    
    if (error?.message?.includes('429') || error?.message?.toLowerCase().includes('quota')) {
        return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
