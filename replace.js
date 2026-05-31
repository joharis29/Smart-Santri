const fs = require('fs');

const file = 'src/app/admin/pengajuan/riwayat/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const handleExportDocumentToExcel = async \(docId: string, itemId: string\) => \{[\s\S]*?const handleExportFilteredToExcel = async \(\) => \{/;

const newFunc = \const handleExportDocumentToExcel = async (docId: string, itemId: string) => {
        const supabase = createClient();
        
        // 1. Fetch document and all its items
        const { data: doc, error } = await supabase
            .from('dokumen_pengajuan')
            .select('*, item_pengajuan(*)')
            .eq('id', docId)
            .maybeSingle();

        if (error || !doc) {
            alert("Gagal mengunduh data pengajuan: " + (error?.message || "Dokumen tidak ditemukan"));
            return;
        }

        // Fetch parent doc if REVISI_RKA
        let parentDoc = null;
        if (doc.jenis === 'REVISI_RKA' && doc.parent_id) {
            const { data: pDoc } = await supabase
                .from('dokumen_pengajuan')
                .select('*, item_pengajuan(*)')
                .eq('id', doc.parent_id)
                .maybeSingle();
            parentDoc = pDoc;
        }

        const isDapurMode = doc.unit === 'Dapur Pusat' || doc.unit === 'Dapur Asrama Putra' || doc.unit === 'Dapur Asrama Putri';
        let reportTitle = "PENGAJUAN RENCANA KEGIATAN DAN ANGGARAN (RKA)";
        if (isDapurMode) {
            reportTitle = "LAPORAN REIMBURSEMENT DAPUR";
        } else if (doc.periode_bulan === 0 || doc.periode_bulan === '0') {
            reportTitle = "PENGAJUAN RENCANA KEGIATAN DAN ANGGARAN TAHUNAN (RKAT)";
        }
        if (doc.jenis === 'REVISI_RKA') reportTitle = "LAPORAN REVISI ANGGARAN (REVISI RKA)";

        const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const bulan = monthNames[Number(doc.periode_bulan)] || String(doc.periode_bulan);
        const tahunAjaran = doc.tahun_ajaran || \\/\\;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan');

        // 1. Header Styling & Data
        worksheet.mergeCells('A1:K1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = reportTitle;
        titleCell.font = { name: 'Times New Roman', size: 14, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // 2. Metadata Row
        const metaRow = worksheet.getRow(2);
        metaRow.values = [
            'Unit / Jenjang:', doc.unit || 'SDIT 1', 
            '', 
            'Bidang / Dept:', doc.bidang || '-', 
            '', 
            'Bulan:', bulan, 
            '', 
            'Tahun Ajaran:', tahunAjaran
        ];
        metaRow.font = { name: 'Times New Roman', size: 10 };
        
        ;['A2', 'D2', 'G2', 'J2'].forEach(ref => {
            const cell = worksheet.getCell(ref);
            cell.font = { bold: true, name: 'Times New Roman' };
            cell.alignment = { horizontal: 'right' };
        });

        // Row 3: Additional Metadata (Metode Pencairan & Status)
        const metaRow2 = worksheet.getRow(3);
        metaRow2.values = [
            'Metode Pencairan:', doc.metode_pencairan || 'CASH',
            '',
            'Status:', 'SUDAH DICAIRKAN',
            '',
            '',
            '',
            '',
            '',
            ''
        ];
        metaRow2.font = { name: 'Times New Roman', size: 10 };
        
        ;['A3', 'D3'].forEach(ref => {
            const cell = worksheet.getCell(ref);
            cell.font = { bold: true, name: 'Times New Roman' };
            cell.alignment = { horizontal: 'right' };
        });
        
        // Highlight Status and Metode
        worksheet.getCell('B3').font = { bold: true, color: { argb: 'FF0284C7' }, name: 'Times New Roman' }; // Sky-600
        worksheet.getCell('E3').font = { bold: true, color: { argb: 'FF059669' }, name: 'Times New Roman' }; // Emerald-600

        worksheet.addRow([]); 

        let globalTotal = 0;
        const globalSummary = {};

        // Helper Function for Rendering a Table Block
        const renderTableBlock = (title, itemsData, isOriginal) => {
            if (title) {
                const titleRow = worksheet.addRow([title]);
                worksheet.mergeCells(\A\:K\\);
                titleRow.getCell(1).font = { bold: true, name: 'Times New Roman', size: 12, color: { argb: isOriginal ? 'FFD97706' : 'FF0284C7' } };
                titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isOriginal ? 'FFFFFBEB' : 'FFF0F9FF' } };
                titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
                worksheet.addRow([]);
            }

            let tableHeader = [];
            if (isDapurMode) {
                tableHeader = ['No', 'Tanggal', 'Item / Bahan Makanan', 'Spesifikasi / Detail', 'Metode Pembayaran', 'Nominal (Rp)'];
            } else {
                tableHeader = [
                    'No', 'Nama Program/ Kegiatan', 'Operasional', 'Jumlah Kegiatan', 'Satuan', 'Harga Satuan', 'Qty', 
                    isOriginal ? 'Rencana Anggaran' : 'Nominal Revisi', 'Waktu', 'Tempat', 'Penanggung Jawab', 'Sasaran'
                ];
            }

            const headerRow = worksheet.addRow(tableHeader);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, name: 'Times New Roman' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            let blockTotal = 0;
            const blockSummary = {};

            itemsData.forEach((row, idx) => {
                const nominal = Number(row.nominal) || 0;
                blockTotal += nominal;
                if (!isOriginal) globalTotal += nominal;
                
                let details = {};
                try { details = typeof row.rincian_json === 'string' ? JSON.parse(row.rincian_json) : (row.rincian_json || {}); } catch(e) {}

                const fundingSplits = details.fundingSplits || details.subsidiSources || [];
                if (Array.isArray(fundingSplits) && fundingSplits.length > 0) {
                    fundingSplits.forEach((s) => {
                        if (s.source && s.nominal > 0) {
                            blockSummary[s.source] = (blockSummary[s.source] || 0) + s.nominal;
                            if (!isOriginal) globalSummary[s.source] = (globalSummary[s.source] || 0) + s.nominal;
                        }
                    });
                } else {
                    blockSummary[row.sumber_dana || 'Dana Yayasan'] = (blockSummary[row.sumber_dana || 'Dana Yayasan'] || 0) + nominal;
                    if (!isOriginal) globalSummary[row.sumber_dana || 'Dana Yayasan'] = (globalSummary[row.sumber_dana || 'Dana Yayasan'] || 0) + nominal;
                }

                if (isDapurMode) {
                    const r = worksheet.addRow([
                        idx + 1,
                        row.tanggal_kebutuhan ? new Date(row.tanggal_kebutuhan).toLocaleDateString('id-ID') : '-',
                        row.judul_kegiatan || 'Bahan Makanan', row.sasaran || '-', doc.metode_pencairan || 'CASH', nominal
                    ]);
                    r.getCell(6).numFmt = '"Rp "#,##0';
                    r.eachCell(cell => {
                        cell.font = { name: 'Times New Roman' };
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    });
                } else {
                    const savedJumlah = details.jumlah_kegiatan || '1';
                    const mainRow = worksheet.addRow([
                        idx + 1, row.judul_kegiatan, row.kategori_coa, savedJumlah, '', '', '', nominal, row.waktu || '-', row.tempat || '-', row.pic || '-', row.sasaran || '-'
                    ]);
                    mainRow.getCell(8).numFmt = '"Rp "#,##0';
                    mainRow.eachCell(cell => {
                        cell.font = { bold: true, name: 'Times New Roman' };
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    });

                    const rincianItems = details.items || [];
                    if (Array.isArray(rincianItems) && rincianItems.some(item => item.name || item.total > 0)) {
                        const rincianLabelRow = worksheet.addRow(['', '   --- RINCIAN BUDGET ---']);
                        rincianLabelRow.getCell(2).font = { italic: true, size: 9, color: { argb: 'FF64748B' } };
                        rincianItems.forEach((item) => {
                            if (item.name || item.total > 0) {
                                const subRow = worksheet.addRow(['', \   • \\, '', '', item.unit || item.satuan || '-', Number(item.price || item.harga_satuan || 0), Number(item.qty || item.kuantitas || 1), Number(item.total || 0), '', '', '', '']);
                                subRow.getCell(6).numFmt = '"Rp "#,##0';
                                subRow.getCell(8).numFmt = '"Rp "#,##0';
                                subRow.eachCell(cell => {
                                    cell.font = { name: 'Times New Roman' };
                                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                                });
                            }
                        });
                        worksheet.addRow([]);
                    }
                }
            });

            // Block Summary
            worksheet.addRow([]);
            const summaryHeader = worksheet.addRow([\RINGKASAN ANGGARAN \\]);
            summaryHeader.getCell(1).font = { bold: true, name: 'Times New Roman' };
            Object.entries(blockSummary).forEach(([source, amount]) => {
                const r = worksheet.addRow([source, '', '', '', '', '', '', Number(amount)]);
                r.getCell(1).font = { bold: true, name: 'Times New Roman' };
                r.getCell(8).numFmt = '"Rp "#,##0';
                r.getCell(8).font = { bold: true, name: 'Times New Roman' };
            });
            worksheet.addRow([]);
            const totalRow = worksheet.addRow([\TOTAL \\, '', '', '', '', '', '', Number(blockTotal)]);
            totalRow.getCell(1).font = { bold: true, size: 12, name: 'Times New Roman' };
            totalRow.getCell(8).font = { bold: true, size: 12, color: { argb: isOriginal ? 'FFD97706' : 'FF0284C7' }, name: 'Times New Roman' };
            totalRow.getCell(8).numFmt = '"Rp "#,##0';
            worksheet.addRow([]);
            worksheet.addRow([]);
        };

        if (parentDoc) {
            const rkaItems = (parentDoc.item_pengajuan || []).filter((it: any) => {
                const targetTitle = doc.item_pengajuan?.[0]?.judul_kegiatan?.trim().toLowerCase() || '';
                return (it.judul_kegiatan || '').trim().toLowerCase() === targetTitle;
            });
            const itemsToUse = rkaItems.length > 0 ? rkaItems : (parentDoc.item_pengajuan || []);
            renderTableBlock('RINCIAN RENCANA KEGIATAN & ANGGARAN (RKA ASLI)', itemsToUse, true);
        }

        const items = (doc.item_pengajuan || []).filter((it: any) => it.id === itemId);
        renderTableBlock(parentDoc ? 'RINCIAN REVISI ANGGARAN (REVISI RKA)' : '', items, false);

        // Column Widths
        worksheet.columns.forEach((col, i) => {
            if (i === 1) col.width = 45;
            else if (i === 2) col.width = 20;
            else col.width = 15;
        });

        // 6. Otorisasi & Tanda Tangan
        worksheet.addRow([]);
        let signRow = worksheet.lastRow!.number + 1;
        
        worksheet.mergeCells(\B\:D\\);
        worksheet.getCell(\B\\).value = 'Bendahara Unit/Jenjang,';
        worksheet.getCell(\B\\).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(\B\\).alignment = { horizontal: 'center' };

        worksheet.mergeCells(\E\:G\\);
        worksheet.getCell(\E\\).value = 'Kepala Unit/Jenjang,';
        worksheet.getCell(\E\\).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(\E\\).alignment = { horizontal: 'center' };

        worksheet.mergeCells(\H\:K\\);
        worksheet.getCell(\H\\).value = 'Bendahara Pusat,';
        worksheet.getCell(\H\\).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(\H\\).alignment = { horizontal: 'center' };

        let nameRow = signRow + 5;
        worksheet.mergeCells(\B\:D\\);
        worksheet.getCell(\B\\).border = { bottom: { style: 'thin' } };
        worksheet.mergeCells(\E\:G\\);
        worksheet.getCell(\E\\).border = { bottom: { style: 'thin' } };
        worksheet.mergeCells(\H\:K\\);
        worksheet.getCell(\H\\).border = { bottom: { style: 'thin' } };

        // Generate and Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = \\_\_\.xlsx\;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    const handleExportFilteredToExcel = async () => {\;

if (match) {
    const newContent = content.replace(regex, newFunc);
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Replaced function');
} else {
    console.log('Regex did not match!');
}
