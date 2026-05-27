import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importAllRKA() {
  const dirPath = path.resolve(process.cwd(), 'docs/program');
  // Ambil semua file kecuali THQ yang sudah diimpor, dan abaikan file temporary ~$
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx') && f !== 'RKA THQ.xlsx' && !f.startsWith('~$'));
  
  const allRecords = [];
  
  for (const file of files) {
    const unitName = file.replace('RKA ', '').replace('.xlsx', '').trim();
    const filePath = path.join(dirPath, file);
    const workbook = new ExcelJS.Workbook();
    
    try {
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      
      console.log(`\nMembaca file: ${file} (Unit: ${unitName})`);
      
      // Temukan baris header (1-5)
      let headerRowIndex = -1;
      let headerValues = [];
      
      for (let i = 1; i <= 5; i++) {
        const row = worksheet.getRow(i);
        const vals = row.values;
        // Cek apakah baris ini memiliki teks "PROGRAM"
        const hasProgram = vals.some(v => v && String(v).toUpperCase().includes('PROGRAM'));
        if (hasProgram) {
          headerRowIndex = i;
          headerValues = vals;
          break;
        }
      }
      
      if (headerRowIndex === -1) {
        console.error(`Gagal menemukan baris header di file ${file}`);
        continue;
      }
      
      // Petakan indeks kolom
      let idxStandarBidang = -1;
      let headerStandarBidangName = '';
      let idxProgram = -1;
      let idxKegiatan = -1;
      let idxPelaksana = -1;
      let idxSasaran = -1;
      let idxPrioritas = -1;
      let idxIndikator = -1;
      
      headerValues.forEach((val, idx) => {
        if (!val) return;
        const v = String(val).toUpperCase().trim();
        if (v === 'STANDAR' || v === 'BIDANG' || v === 'KATEGORI') {
          idxStandarBidang = idx;
          headerStandarBidangName = v;
        } else if (v.includes('PROGRAM')) {
          idxProgram = idx;
        } else if (v.includes('KEGIATAN') || v.includes('OPERASIONAL')) {
          idxKegiatan = idx;
        } else if (v.includes('PELAKSANA') || v.includes('PENANGGUNG JAWAB') || v.includes('PENANGGUNGJAWAB')) {
          idxPelaksana = idx;
        } else if (v.includes('SASARAN')) {
          idxSasaran = idx;
        } else if (v.includes('PRIORITAS') || v.includes('KATEGORI')) {
          // Jika 'KATEGORI' sudah dipakai untuk StandarBidang (seperti di TK), jangan timpa
          if (v === 'KATEGORI' && headerStandarBidangName === 'KATEGORI' && idxStandarBidang !== idx) {
            idxPrioritas = idx;
          } else if (v.includes('PRIORITAS')) {
            idxPrioritas = idx;
          }
        } else if (v.includes('INDIKATOR')) {
          idxIndikator = idx;
        }
      });
      
      let currentStandarBidang = '';
      let currentProgram = '';
      let rowCount = 0;
      
      // Baca data mulai dari baris setelah header
      for (let i = headerRowIndex + 1; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const values = row.values;
        
        let colStandarBidang = '';
        if (idxStandarBidang > -1 && values[idxStandarBidang]) {
          colStandarBidang = String(values[idxStandarBidang]).trim();
        }
        
        let colProgram = '';
        if (idxProgram > -1 && values[idxProgram]) {
          colProgram = String(values[idxProgram]).trim();
        }
        
        const colKegiatan = idxKegiatan > -1 && values[idxKegiatan] ? String(values[idxKegiatan]).trim() : '';
        const colPelaksana = idxPelaksana > -1 && values[idxPelaksana] ? String(values[idxPelaksana]).trim() : '';
        const colSasaran = idxSasaran > -1 && values[idxSasaran] ? String(values[idxSasaran]).trim() : '';
        const colPrioritas = idxPrioritas > -1 && values[idxPrioritas] ? String(values[idxPrioritas]).trim() : 'Program Tetap & Wajib';
        const colIndikator = idxIndikator > -1 && values[idxIndikator] ? String(values[idxIndikator]).trim() : '';
        
        // Update hierarki
        if (colStandarBidang && !colStandarBidang.toLowerCase().includes('standar') && !colStandarBidang.toLowerCase().includes('bidang') && !colStandarBidang.toLowerCase().includes('kategori')) {
          currentStandarBidang = colStandarBidang;
        }
        
        if (colProgram && !colProgram.toLowerCase().includes('program')) {
          currentProgram = colProgram;
        }
        
        // Skip jika tidak ada nama kegiatan (biasanya ini baris kosong atau header section)
        if (!colKegiatan) continue;
        
        let bidang = '(-)';
        let standar = '(-)';
        
        if (headerStandarBidangName === 'BIDANG' || headerStandarBidangName === 'KATEGORI') {
          bidang = currentStandarBidang || '(-)';
        } else if (headerStandarBidangName === 'STANDAR') {
          standar = currentStandarBidang || '(-)';
        }
        
        allRecords.push({
          unit: unitName,
          bidang: bidang,
          standar: standar,
          program: currentProgram || '(-)',
          nama_kegiatan: colKegiatan,
          detail_kegiatan: '',
          pelaksana: colPelaksana,
          sasaran: colSasaran,
          prioritas: colPrioritas,
          indikator: colIndikator
        });
        
        rowCount++;
      }
      
      console.log(`✓ Berhasil memetakan ${rowCount} kegiatan.`);
      
    } catch (e) {
      console.error(`Error membaca file ${file}:`, e);
    }
  }
  
  if (allRecords.length > 0) {
    console.log(`\nMenghapus data lama (kecuali THQ) di tabel program_kegiatan...`);
    const { error: delErr } = await supabase.from('program_kegiatan').delete().neq('unit', 'THQ');
    if (delErr) {
      console.error('Error delete:', delErr);
      return;
    }
    
    console.log(`Menyisipkan total ${allRecords.length} kegiatan baru ke Supabase...`);
    // Supabase merekomendasikan insert secara chunk jika data terlalu besar (misal max 1000 per request)
    const chunkSize = 500;
    for (let i = 0; i < allRecords.length; i += chunkSize) {
      const chunk = allRecords.slice(i, i + chunkSize);
      const { error: insertErr } = await supabase.from('program_kegiatan').insert(chunk);
      if (insertErr) {
        console.error(`Error insert chunk ${i} - ${i + chunkSize}:`, insertErr);
      }
    }
    console.log(`Sukses mengimpor seluruh data RKA!`);
  }
}

importAllRKA();
