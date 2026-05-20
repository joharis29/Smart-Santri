/**
 * =======================================================================
 * Smart Santri — Script Ekstraksi & Chunking Dokumen Regulasi
 * =======================================================================
 * Script ini membaca file PDF dari folder docs/regulasi/,
 * mengekstrak teksnya, memecahnya menjadi potongan kecil (chunks),
 * dan menyimpan hasilnya ke file JSON yang siap di-embed.
 *
 * Cara menjalankan:
 *   npx ts-node --skip-project scripts/prepare_documents.ts
 *
 * Output:
 *   docs/regulasi/chunks_output.json
 * =======================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// Kompatibilitas ESM (pengganti __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi
const REGULASI_DIR = path.resolve(__dirname, '..', 'docs', 'regulasi');
const OUTPUT_FILE = path.join(REGULASI_DIR, 'chunks_output.json');

// Pemetaan folder → source label untuk database
const SOURCE_MAP: Record<string, string> = {
  ISAK335: 'ISAK335',
  JUKNIS_BOS: 'JUKNIS_BOS',
  PAP: 'PAP',
  SOP_PESANTREN: 'SOP_PESANTREN',
};

interface DocumentChunk {
  source: string;
  fileName: string;
  chunkIndex: number;
  content: string;
  metadata: {
    sourceFolder: string;
    originalFile: string;
    chunkSize: number;
  };
}

async function extractTextFromPDF(filePath: string): Promise<string> {
  // pdf-parse is CJS-only, so we use createRequire for ESM compatibility
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const pdfParse = require('pdf-parse');
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text || '';
}

async function main() {
  console.log('🚀 Smart Santri — Ekstraksi Dokumen Regulasi');
  console.log('='.repeat(60));
  console.log(`📂 Sumber: ${REGULASI_DIR}`);
  console.log('');

  const allChunks: DocumentChunk[] = [];

  // Konfigurasi text splitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,      // ~1000 karakter per chunk
    chunkOverlap: 200,    // overlap 200 karakter untuk konteks
    separators: ['\n\n', '\n', '. ', ' ', ''], // prioritas pemisah
  });

  // Iterasi setiap folder regulasi
  for (const [folderName, sourceLabel] of Object.entries(SOURCE_MAP)) {
    const folderPath = path.join(REGULASI_DIR, folderName);

    if (!fs.existsSync(folderPath)) {
      console.log(`⚠️  Folder tidak ditemukan: ${folderName}, dilewati.`);
      continue;
    }

    const pdfFiles = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.pdf'));
    console.log(`📖 ${sourceLabel}: Ditemukan ${pdfFiles.length} file PDF`);

    for (const pdfFile of pdfFiles) {
      const filePath = path.join(folderPath, pdfFile);
      console.log(`   ├─ Memproses: ${pdfFile}...`);

      try {
        // 1. Ekstrak teks dari PDF
        const rawText = await extractTextFromPDF(filePath);

        if (!rawText || rawText.trim().length < 50) {
          console.log(`   │  ⚠️  Teks terlalu pendek atau kosong, dilewati.`);
          continue;
        }

        // 2. Bersihkan teks (hapus whitespace berlebih, karakter aneh)
        const cleanedText = rawText
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\s{3,}/g, ' ')
          .trim();

        // 3. Pecah menjadi chunks
        const chunks = await splitter.splitText(cleanedText);

        console.log(`   │  ✅ ${chunks.length} chunks dihasilkan (${cleanedText.length} karakter total)`);

        // 4. Simpan setiap chunk dengan metadata
        chunks.forEach((chunkContent, index) => {
          allChunks.push({
            source: sourceLabel,
            fileName: pdfFile,
            chunkIndex: index,
            content: chunkContent,
            metadata: {
              sourceFolder: folderName,
              originalFile: pdfFile,
              chunkSize: chunkContent.length,
            },
          });
        });
      } catch (err: any) {
        console.log(`   │  ❌ Gagal memproses: ${err.message}`);
      }
    }
    console.log('');
  }

  // 5. Tulis output JSON
  console.log('='.repeat(60));
  console.log(`📊 Total chunks yang dihasilkan: ${allChunks.length}`);

  // Statistik per sumber
  const stats: Record<string, number> = {};
  allChunks.forEach(c => {
    stats[c.source] = (stats[c.source] || 0) + 1;
  });
  Object.entries(stats).forEach(([source, count]) => {
    console.log(`   📌 ${source}: ${count} chunks`);
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allChunks, null, 2), 'utf-8');
  console.log(`\n💾 Output disimpan ke: ${OUTPUT_FILE}`);
  console.log('✅ Selesai! Chunks siap untuk di-embed ke database vektor.');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
