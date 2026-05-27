import ExcelJS from 'exceljs';

async function readExcel() {
  const filePath = 'docs/program/RKA THQ.xlsx';
  const workbook = new ExcelJS.Workbook();
  
  try {
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    
    console.log(`Sheet Name: ${worksheet.name}`);
    console.log(`Row Count: ${worksheet.rowCount}`);
    
    // Print first 20 rows
    for (let i = 1; i <= Math.min(20, worksheet.rowCount); i++) {
      const row = worksheet.getRow(i);
      console.log(`Row ${i}:`, row.values);
    }
  } catch (err) {
    console.error("Error reading file:", err);
  }
}

readExcel();
