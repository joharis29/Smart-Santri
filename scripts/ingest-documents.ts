import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
const pdf = require('pdf-parse')

// Load env vars
dotenv.config({ path: '.env.local' })

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small',  // 1536 dimensi, hemat biaya
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
        
        // Batch embedding (max 100 per request) untuk menghindari limit API
        for (let i = 0; i < chunks.length; i += 100) {
          const batch = chunks.slice(i, i + 100)
          console.log(`    → Embedding batch ${Math.floor(i/100) + 1}...`)
          const vectors = await embeddings.embedDocuments(batch)
          
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
