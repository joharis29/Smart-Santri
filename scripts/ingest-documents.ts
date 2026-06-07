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

async function ingest(targetFiles: string[] = []) {
  console.log('Memulai proses ingestion dokumen regulasi...')
  
  // HAPUS bagian delete agar data lama tidak hilang
  // const { error: deleteError } = await supabase.from('document_chunks').delete().not('id', 'is', null)
  
  // Baca semua folder di dalam docs/regulasi
  const sources = ['ISAK335', 'PAP', 'JUKNIS_BOS', 'SOP_PESANTREN']
  
  for (const source of sources) {
    const sourcePath = path.join(REGULASI_DIR, source)
    
    if (!fs.existsSync(sourcePath)) {
      continue
    }

    const files = fs.readdirSync(sourcePath).filter(file => !file.startsWith('.'))
    
    if (files.length === 0) {
      continue
    }

    console.log(`\n📂 Menemukan ${files.length} file di folder ${source}:`)
    
    for (const file of files) {
      // Jika targetFiles diberikan, lewati file yang tidak ada di target
      if (targetFiles.length > 0 && !targetFiles.includes(file)) {
          continue;
      }

      const filePath = path.join(sourcePath, file)
      console.log(`  Memeriksa file: ${file}...`)

      // Cek apakah file sudah ada di database dan hitung jumlah chunk-nya
      const { count, error: checkErr } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('metadata->>file_name', file)

      const startIndex = count || 0;
      
      try {
        console.log(`  Sedang membaca file: ${file}...`)
        const buffer = fs.readFileSync(filePath)
        let text = ''
        
        if (file.toLowerCase().endsWith('.pdf')) {
            const pdfData = await pdf(buffer)
            text = pdfData.text
        } else {
            console.log(`  ⚠️ File ${file} bukan PDF. Dilewati.`)
            continue
        }
        
        const chunks = await splitter.splitText(text)
        console.log(`    → Dokumen dipecah menjadi ${chunks.length} chunks`)

        if (startIndex >= chunks.length) {
          console.log(`  ⏭️ File ${file} sudah diproses sepenuhnya (${chunks.length} chunks). Melewati...`)
          continue
        }

        if (startIndex > 0) {
          console.log(`  🔄 Melanjutkan file ${file} mulai dari chunk ke-${startIndex + 1} dari total ${chunks.length}...`)
        }
        
        // Estimasi waktu
        const sisaChunks = chunks.length - startIndex;
        const estimasiMenit = (sisaChunks * 4.1) / 60
        console.log(`    → Estimasi waktu sisa proses: ${estimasiMenit.toFixed(2)} menit`)

        for (let i = startIndex; i < chunks.length; i++) {
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
              console.log(`      [Retry] API Error:`, err.message)
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

          // Delay 4.1 detik antar chunk agar super aman dari rate limit (15 request per minute)
          await new Promise(resolve => setTimeout(resolve, 4100))
        }
        console.log(`    ✅ File ${file} selesai diproses`)
      } catch (err: any) {
        console.error(`  ❌ Gagal memproses ${file}:`, err.message)
      }
    }
  }
  console.log('\n🎉 Proses ingestion selesai!')
}

// Ambil argument file dari command line jika ada
const targetFilesArg = process.argv.slice(2)
ingest(targetFilesArg).catch(console.error)
