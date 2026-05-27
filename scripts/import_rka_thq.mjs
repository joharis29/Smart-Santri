import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importRKA() {
  const filePath = path.resolve(process.cwd(), 'docs/program/RKA THQ.xlsx');
  const workbook = new ExcelJS.Workbook();
  
  try {
    // 1. Kosongkan tabel terlebih dahulu (karena data sebelumnya salah/berantakan)
    console.log('Menghapus data lama di tabel program_kegiatan (khusus unit THQ)...');
    const { error: deleteError } = await supabase
      .from('program_kegiatan')
      .delete()
      .eq('unit', 'THQ');
      
    if (deleteError) {
      console.error('Gagal menghapus data lama:', deleteError);
      return;
    }

    // 2. Baca file Excel
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    
    console.log(`Membaca file: ${filePath}`);
    console.log(`Sheet Name: ${worksheet.name}`);
    console.log(`Total Rows: ${worksheet.rowCount}`);
    
    const records = [];
    
    // Variabel untuk menyimpan nilai dari baris sebelumnya (karena Merge Cell)
    let currentStandar = '';
    let currentProgram = '';
    
    // Asumsikan baris 1 adalah header, data dimulai dari baris 2
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const values = row.values;
      
      // Index di exceljs dimulai dari 1 (1 = Kolom A)
      const colStandar = values[1] ? String(values[1]).trim() : '';
      const colProgram = values[2] ? String(values[2]).trim() : '';
      const colKegiatan = values[3] ? String(values[3]).trim() : '';
      const colPelaksana = values[4] ? String(values[4]).trim() : '';
      const colSasaran = values[5] ? String(values[5]).trim() : '';
      const colKategori = values[6] ? String(values[6]).trim() : 'Program Tetap & Wajib';
      const colIndikator = values[7] ? String(values[7]).trim() : '';
      
      // Update hirarki Standar jika ada nilai baru (bukan hasil merge cell kosong)
      if (colStandar && colStandar.toLowerCase() !== 'standar') {
        currentStandar = colStandar;
      }
      
      // Update hirarki Program jika ada nilai baru
      if (colProgram && colProgram.toLowerCase() !== 'program') {
        currentProgram = colProgram;
      }
      
      // Jika kolom Kegiatan kosong, berarti baris ini tidak valid atau hanya header kategori
      if (!colKegiatan) {
        continue;
      }
      
      records.push({
        unit: 'THQ',
        bidang: 'Kurikulum', // Asumsi default bidang untuk THQ
        standar: currentStandar || '(-)',
        program: currentProgram || '(-)',
        nama_kegiatan: colKegiatan,
        detail_kegiatan: '', // Dikosongkan sesuai permintaan
        pelaksana: colPelaksana,
        sasaran: colSasaran,
        prioritas: colKategori,
        indikator: colIndikator
      });
    }
    
    console.log(`Ditemukan ${records.length} baris data Kegiatan yang valid.`);
    
    if (records.length > 0) {
      console.log('Menyisipkan data baru ke Supabase...');
      const { data, error } = await supabase
        .from('program_kegiatan')
        .insert(records)
        .select();
        
      if (error) {
        console.error('Error saat insert:', error);
      } else {
        console.log(`Berhasil mengimpor ${data.length} data ke tabel program_kegiatan dengan format terstruktur!`);
      }
    }
    
  } catch (err) {
    console.error("Error reading file or inserting data:", err);
  }
}

importRKA();
