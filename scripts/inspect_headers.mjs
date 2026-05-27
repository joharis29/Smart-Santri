import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

async function inspectHeaders() {
  const dirPath = path.resolve(process.cwd(), 'docs/program');
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx') && f !== 'RKA THQ.xlsx');
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      
      console.log(`\n--- ${file} ---`);
      // check first 5 rows for headers
      for (let i = 1; i <= 5; i++) {
        const row = worksheet.getRow(i);
        const values = row.values.filter(v => v !== undefined && v !== null && String(v).trim() !== '');
        if (values.length > 2) {
          console.log(`Row ${i}:`, row.values);
          break; // Found header row
        }
      }
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
    }
  }
}

inspectHeaders();
