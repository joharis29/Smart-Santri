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
  modelName: 'gemini-embedding-001', // 3072 dimensi dari Google Gemini
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
  
  console.log('Menghapus data chunks lama dari database...')
  const { error: deleteError } = await supabase.from('document_chunks').delete().not('id', 'is', null)
  if (deleteError) {
    console.error('Gagal menghapus data lama:', deleteError)
    return
  }
  console.log('Data lama berhasil dihapus.\n')
  
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
        
        // Embedding satu per satu untuk menghindari bug empty array atau rate limit dari Gemini
        for (let i = 0; i < chunks.length; i++) {
          const content = chunks[i]
          console.log(`    → Embedding chunk ${i + 1}/${chunks.length}...`)
          
          let vector: number[] = [];
          let retries = 0;
          while (retries < 5) {
            try {
              const res = await embeddings.embedDocuments([content])
              if (res && res.length > 0 && res[0].length > 0) {
                vector = res[0];
                break; // Berhasil
              }
            } catch (err: any) {
              console.log(`      [Retry] API Error:`, err)
            }
            
            console.warn(`    ⚠️ Gagal mendapatkan embedding. Menunggu 5 detik sebelum retry ke-${retries + 1}...`)
            await new Promise(resolve => setTimeout(resolve, 5000))
            retries++;
          }
          
          if (retries >= 5 || !vector || vector.length === 0) {
             console.error(`    ❌ Gagal total mendapatkan embedding setelah 5 retry. Menghentikan proses untuk file ini.`)
             break; // Stop file ini jika gagal beruntun
          }

          const row = {
            source: source,
            content: content,
            embedding: vector,
            metadata: { file_name: file, chunk_index: i }
          }
          
          const { error } = await supabase.from('document_chunks').insert(row)
          if (error) {
             console.error(`    ❌ Gagal insert chunk ${i}:`, error.message)
          }

          // Delay 2 detik antar chunk agar aman dari rate limit (15 request per minute free tier = 4 detik, tapi kita coba 2 detik)
          await new Promise(resolve => setTimeout(resolve, 2000))
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
