import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
const pdf = require('pdf-parse')

// Load env vars
dotenv.config({ path: '.env.local' })

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'gemini-embedding-2', // 3072 dimensi dari Google Gemini
})

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,       // ~800 karakter per chunk
  chunkOverlap: 100,    // overlap untuk konteks antar chunk
  separators: ['\n\n', '\n', '.', ' '],
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Gunakan service role key untuk insert
)

const REGULASI_DIR = path.join(process.cwd(), 'docs', 'regulasi')

async function ingest() {
  console.log('Memulai proses ingestion dokumen regulasi...')
  
  // Baca semua folder di dalam docs/regulasi
  const sources = ['ISAK335', 'PAP', 'JUKNIS_BOS', 'SOP_PESANTREN']
  
  for (const source of sources) {
    const sourcePath = path.join(REGULASI_DIR, source)
    
    if (!fs.existsSync(sourcePath)) {
      console.warn(`\n⚠️ Folder tidak ditemukan: ${sourcePath}. Melewati...`)
      continue
    }

    const files = fs.readdirSync(sourcePath).filter(file => !file.startsWith('.'))
    
    if (files.length === 0) {
      console.log(`\n📂 Folder ${source} kosong. Tidak ada file untuk di-ingest.`)
      continue
    }

    console.log(`\n📂 Menemukan ${files.length} file di folder ${source}:`)
    
    for (const file of files) {
      const filePath = path.join(sourcePath, file)
      console.log(`  Memproses file: ${file}...`)
      
      try {
        const buffer = fs.readFileSync(filePath)
        let text = ''
        
        if (file.toLowerCase().endsWith('.pdf')) {
            const pdfData = await pdf(buffer)
            text = pdfData.text
        } else {
            console.log(`  ⚠️ Peringatan: Saat ini skrip hanya membaca file .pdf (File ${file} dilewati). Harap "Save As PDF" dokumen Word Anda dan coba lagi.`)
            continue
        }
        
        const chunks = await splitter.splitText(text)
        console.log(`    → Dokumen dipecah menjadi ${chunks.length} chunks`)
        
        // Batch embedding (max 20 per request) untuk menghindari rate limit API Gemini Free Tier
        for (let i = 0; i < chunks.length; i += 20) {
          const batch = chunks.slice(i, i + 20)
          console.log(`    → Embedding batch ${Math.floor(i/20) + 1}...`)
          
          let vectors: number[][] = [];
          let retries = 0;
          while (retries < 5) {
            try {
              vectors = await embeddings.embedDocuments(batch)
              if (vectors && vectors.length > 0 && vectors[0].length > 0) {
                break; // Berhasil
              }
            } catch (err: any) {
              console.log(`      [Retry] API Error: ${err.message}`)
            }
            
            console.warn(`    ⚠️ Gagal mendapatkan embedding (Rate limit/Error). Menunggu 15 detik sebelum retry ke-${retries + 1}...`)
            await new Promise(resolve => setTimeout(resolve, 15000))
            retries++;
          }
          
          if (retries >= 5 || !vectors || vectors.length === 0 || vectors[0].length === 0) {
             console.error(`    ❌ Gagal total mendapatkan embedding setelah 5 retry. Melewati batch ini.`)
             continue
          }

          const rows = batch.map((content, j) => ({
            source: source,
            content,
            embedding: vectors[j],
            metadata: { file_name: file, chunk_index: i + j }
          }))
          
          const { error } = await supabase.from('document_chunks').insert(rows)
          if (error) {
             console.error(`    ❌ Gagal insert batch:`, error.message)
          }

          // Delay 4.5 detik antar batch agar aman dari limit 15 request per minute (4 detik = 15 request)
          await new Promise(resolve => setTimeout(resolve, 4500))
        }
        console.log(`    ✅ File ${file} selesai diproses`)
      } catch (err: any) {
        console.error(`  ❌ Gagal memproses ${file}:`, err.message)
      }
    }
  }
  console.log('\n🎉 Proses ingestion selesai!')
}

ingest().catch(console.error)
