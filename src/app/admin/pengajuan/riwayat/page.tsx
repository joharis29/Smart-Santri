'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { 
    ClipboardCheck, 
    Download, 
    Eye, 
    FileText, 
    FileSpreadsheet, 
    Search, 
    Filter, 
    ArrowUpRight,
    X,
    Paperclip,
    AlertTriangle,
    Activity,
    History,
    Building2,
    Calendar,
    Wallet,
    Tag,
    GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { createClient } from '@/utils/supabase/client';

export default function RiwayatPengajuanPage() {
    const supabase = createClient();
    const [riwayatItems, setRiwayatItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);

    // Detail Modal States
    const [selectedItemForDetail, setSelectedItemForDetail] = useState<any | null>(null);
    const [detailLpjDoc, setDetailLpjDoc] = useState<any>(null);
    const [detailRkaDoc, setDetailRkaDoc] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [selectedRevisionSnapshot, setSelectedRevisionSnapshot] = useState<any>(null);

    const handleViewDetail = async (item: any) => {
        setSelectedItemForDetail(item);
        setLoadingDetail(true);
        try {
            // Fetch the primary clicked document
            const { data: clickedDoc, error: docError } = await supabase
                .from('dokumen_pengajuan')
                .select('*, item_pengajuan(*)')
                .eq('id', item.id)
                .maybeSingle();

            if (docError || !clickedDoc) {
                console.error("Gagal mengambil data detail pengajuan:", docError);
                return;
            }

            // Determine if it is RKA or LPJ or REVISI_RKA
            const isLpjOrRevisi = clickedDoc.jenis === 'LPJ' || clickedDoc.jenis === 'REVISI_RKA';

            if (isLpjOrRevisi) {
                setDetailLpjDoc(clickedDoc);
                let rkaId = clickedDoc.jenis === 'REVISI_RKA' ? clickedDoc.parent_id : null;
                
                if (clickedDoc.jenis === 'LPJ') {
                    const lpjItem = clickedDoc.item_pengajuan?.find((it: any) => it.id === item.itemId) || clickedDoc.item_pengajuan?.[0];
                    let lpjDetails: any = {};
                    if (lpjItem?.rincian_json) {
                        try {
                            lpjDetails = typeof lpjItem.rincian_json === 'string'
                                ? JSON.parse(lpjItem.rincian_json)
                                : lpjItem.rincian_json;
                        } catch (e) {}
                    }
                    rkaId = lpjDetails?.rka_id;
                }

                if (rkaId) {
                    const { data: rkaDoc } = await supabase
                        .from('dokumen_pengajuan')
                        .select('*, item_pengajuan(*)')
                        .eq('id', rkaId)
                        .maybeSingle();
                    setDetailRkaDoc(rkaDoc);
                } else {
                    setDetailRkaDoc(null);
                }
            } else {
                // It is an RKA document
                setDetailRkaDoc(clickedDoc);
                // Look for a matching LPJ document that references this RKA
                const { data: lpjDocs } = await supabase
                    .from('dokumen_pengajuan')
                    .select('*, item_pengajuan(*)')
                    .eq('status', 'SELESAI')
                    .eq('unit', clickedDoc.unit);

                const matchingLpj = lpjDocs?.find(lDoc => {
                    return lDoc.item_pengajuan?.some((it: any) => {
                        let details: any = {};
                        try {
                            details = typeof it.rincian_json === 'string' 
                                ? JSON.parse(it.rincian_json) 
                                : (it.rincian_json || {});
                        } catch(e) {}
                        return details.rka_id === clickedDoc.id;
                    });
                });
                setDetailLpjDoc(matchingLpj || null);
            }
        } catch (err) {
            console.error("Error fetching detail:", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    // Filter States
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [selectedBidangs, setSelectedBidangs] = useState<string[]>([]);
    const [selectedSumber, setSelectedSumber] = useState<string[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string[]>([]);

    // Handle outside click for filter
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch Completed / Liquidated RKA items from Supabase
    useEffect(() => {
        const fetchRiwayat = async () => {
            setLoading(true);
            try {
                // 1. Get current user
                const { data: authData } = await supabase.auth.getUser();
                const user = authData?.user;
                if (!user) {
                    setLoading(false);
                    return;
                }

                // 2. Get active role & unit
                const role = localStorage.getItem(`activeRole_${user.id}`);
                setUserRole(role);
                const activeUnit = localStorage.getItem(`activeUnit_${user.id}`) || 'Pusat (Yayasan)';

                // 3. Query dokumen_pengajuan
                let query = supabase
                    .from('dokumen_pengajuan')
                    .select(`
                        *,
                        item_pengajuan(*)
                    `)
                    .or('and(jenis.eq.RKA,status.in.(CAIR,SUDAH_DITERIMA)),and(jenis.eq.REVISI_RKA,status.eq.SELESAI)')
                    .order('updated_at', { ascending: false });

                // If not Pusat/Admin, filter by active unit
                if (role !== 'BENDAHARA_PUSAT' && role !== 'ADMINISTRATOR' && role !== 'PIMPINAN') {
                    query = query.eq('unit', activeUnit);
                }

                const { data, error } = await query;

                if (error) {
                    console.error("Error fetching riwayat:", error);
                } else if (data) {
                    // Fetch all LPJ and Revisi RKA documents to find which RKAs have already been reported or revised
                    const { data: relatedDocs } = await supabase
                        .from('dokumen_pengajuan')
                        .select('jenis, parent_id, item_pengajuan(rincian_json)')
                        .in('jenis', ['LPJ', 'REVISI_RKA']);

                    const realizedRkaIds = new Set<string>();
                    relatedDocs?.forEach(doc => {
                        if (doc.jenis === 'REVISI_RKA' && doc.parent_id) {
                            realizedRkaIds.add(doc.parent_id);
                        }
                        
                        if (doc.jenis === 'LPJ') {
                            doc.item_pengajuan?.forEach((it: any) => {
                                try {
                                    const details = typeof it.rincian_json === 'string' 
                                        ? JSON.parse(it.rincian_json) 
                                        : (it.rincian_json || {});
                                    if (details.rka_id) {
                                        realizedRkaIds.add(details.rka_id);
                                    }
                                } catch(e) {}
                            });
                        }
                    });

                    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    const mapped: any[] = [];
                    data.forEach(doc => {
                        // Skip if this RKA document has already been reported in an LPJ
                        if (realizedRkaIds.has(doc.id)) {
                            return;
                        }

                        const items = doc.item_pengajuan || [];
                        items.forEach((it: any) => {
                            mapped.push({
                                id: doc.id,
                                itemId: it.id,
                                isRevision: !!doc.parent_id,
                                tanggal_pencairan: doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('id-ID') : new Date(doc.created_at).toLocaleDateString('id-ID'),
                                tanggal: new Date(doc.created_at).toLocaleDateString('id-ID'),
                                bulan: monthNames[Number(doc.periode_bulan)] || String(doc.periode_bulan),
                                tahun_ajaran: doc.tahun_ajaran || `${doc.periode_tahun}/${Number(doc.periode_tahun) + 1}`,
                                unit: doc.unit || 'SDIT 1',
                                bidang: doc.bidang || 'Tanpa Bidang',
                                kegiatan: it.judul_kegiatan || it.kegiatan || 'Pengajuan Dana',
                                sumber: (() => {
                                    const splits = it.rincian_json?.fundingSplits || [];
                                    const sources = splits
                                        .filter((s: any) => s.source && s.nominal > 0)
                                        .map((s: any) => s.source);
                                    return sources.length > 0 ? sources.join(' & ') : (it.sumber_dana || 'Dana Yayasan');
                                })(),
                                nominal: it.nominal || 0,
                                metode_pencairan: doc.metode_pencairan || '-',
                            });
                        });
                    });
                    setRiwayatItems(mapped);
                }
            } catch (err) {
                console.error("Error loading riwayat page data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRiwayat();
    }, []);

    const handleExportDocumentToExcel = async (docId: string, itemId: string) => {
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
        const tahunAjaran = doc.tahun_ajaran || `${doc.periode_tahun}/${Number(doc.periode_tahun) + 1}`;

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

        // Row 3: Additional Metadata
        const metaRow2 = worksheet.getRow(3);
        metaRow2.values = [
            'Metode Pencairan:', doc.metode_pencairan || 'CASH',
            '',
            'Status:', 'SUDAH DICAIRKAN',
            '', '', '', '', '', ''
        ];
        metaRow2.font = { name: 'Times New Roman', size: 10 };
        
        ;['A3', 'D3'].forEach(ref => {
            const cell = worksheet.getCell(ref);
            cell.font = { bold: true, name: 'Times New Roman' };
            cell.alignment = { horizontal: 'right' };
        });
        
        worksheet.getCell('B3').font = { bold: true, color: { argb: 'FF0284C7' }, name: 'Times New Roman' };
        worksheet.getCell('E3').font = { bold: true, color: { argb: 'FF059669' }, name: 'Times New Roman' };

        worksheet.addRow([]); 

        let globalTotal = 0;
        const globalSummary = {};

        // Helper Function for Rendering a Table Block
        const renderTableBlock = (title: string, itemsData: any[], isOriginal: boolean) => {
            if (title) {
                const titleRow = worksheet.addRow([title]);
                worksheet.mergeCells(`A${titleRow.number}:K${titleRow.number}`);
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
                                const subRow = worksheet.addRow(['', `   • ${item.name || '(Tanpa Nama)'}`, '', '', item.unit || item.satuan || '-', Number(item.price || item.harga_satuan || 0), Number(item.qty || item.kuantitas || 1), Number(item.total || 0), '', '', '', '']);
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
            const summaryHeader = worksheet.addRow([`RINGKASAN ANGGARAN ${isOriginal ? '(RKA ASLI)' : '(REVISI)'}`]);
            summaryHeader.getCell(1).font = { bold: true, name: 'Times New Roman' };
            Object.entries(blockSummary).forEach(([source, amount]) => {
                const r = worksheet.addRow([source, '', '', '', '', '', '', Number(amount)]);
                r.getCell(1).font = { bold: true, name: 'Times New Roman' };
                r.getCell(8).numFmt = '"Rp "#,##0';
                r.getCell(8).font = { bold: true, name: 'Times New Roman' };
            });
            worksheet.addRow([]);
            const totalRow = worksheet.addRow([`TOTAL ${isOriginal ? '(RKA ASLI)' : '(REVISI)'}`, '', '', '', '', '', '', Number(blockTotal)]);
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
        let signRow = worksheet.lastRow!.number + 1;
        
        worksheet.mergeCells(`B${signRow}:D${signRow}`);
        worksheet.getCell(`B${signRow}`).value = 'Bendahara Unit/Jenjang,';
        worksheet.getCell(`B${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`B${signRow}`).alignment = { horizontal: 'center' };

        worksheet.mergeCells(`E${signRow}:G${signRow}`);
        worksheet.getCell(`E${signRow}`).value = 'Kepala Unit/Jenjang,';
        worksheet.getCell(`E${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`E${signRow}`).alignment = { horizontal: 'center' };

        worksheet.mergeCells(`H${signRow}:K${signRow}`);
        worksheet.getCell(`H${signRow}`).value = 'Bendahara Pusat,';
        worksheet.getCell(`H${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`H${signRow}`).alignment = { horizontal: 'center' };

        let nameRow = signRow + 5;
        worksheet.mergeCells(`B${nameRow}:D${nameRow}`);
        worksheet.getCell(`B${nameRow}`).border = { bottom: { style: 'thin' } };
        worksheet.mergeCells(`E${nameRow}:G${nameRow}`);
        worksheet.getCell(`E${nameRow}`).border = { bottom: { style: 'thin' } };
        worksheet.mergeCells(`H${nameRow}:K${nameRow}`);
        worksheet.getCell(`H${nameRow}`).border = { bottom: { style: 'thin' } };

        // Generate and Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${reportTitle.replace(/ /g, '_')}_${doc.unit || 'SDIT1'}_${Date.now()}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    const handleExportFilteredToExcel = async () => {
        if (filteredRiwayat.length === 0) {
            alert("Tidak ada data untuk diekspor");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Riwayat RKA');

        // Header Title
        worksheet.mergeCells('A1:J1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'REKAPITULASI RIWAYAT RENCANA ANGGARAN KEGIATAN (RKA)';
        titleCell.font = { name: 'Times New Roman', size: 14, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Subtitle Metadata (Export Date)
        worksheet.mergeCells('A2:J2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        dateCell.font = { name: 'Times New Roman', size: 10, italic: true };
        dateCell.alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.addRow([]); // Blank spacer row

        // Table Headers
        const headers = [
            'No', 
            'Tanggal', 
            'Bulan / Periode', 
            'Tahun Ajaran', 
            'Unit', 
            'Bidang', 
            'Program / Kegiatan', 
            'Sumber Dana', 
            'Rencana Anggaran (Rp)', 
            'Metode Pencairan'
        ];
        
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, name: 'Times New Roman', size: 11 };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF1F5F9' } // Light slate header background
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Add Data Rows
        filteredRiwayat.forEach((row, index) => {
            const dataRow = worksheet.addRow([
                index + 1,
                row.tanggal || '-',
                row.bulan || '-',
                row.tahun_ajaran || '-',
                row.unit || '-',
                row.bidang || '-',
                row.kegiatan || '-',
                row.sumber || '-',
                Number(row.nominal || 0),
                row.metode_pencairan || '-'
            ]);

            // Number formatting for Rp nominal
            dataRow.getCell(9).numFmt = '"Rp "#,##0';
            
            // Text styling & thin borders
            dataRow.eachCell((cell, colNum) => {
                cell.font = { name: 'Times New Roman', size: 10 };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                // Alignments
                if (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 4 || colNum === 10) {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                } else if (colNum === 9) {
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                } else {
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                }

                // Format Metode Pencairan style
                if (colNum === 10) {
                    cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF0284C7' } }; // Sky-600 color for method
                }
            });
        });

        // Set column widths dynamically for premium styling
        worksheet.columns.forEach(col => {
            if (!col || !col.values) return;
            const values = col.values as string[];
            let maxLen = 0;
            values.forEach(val => {
                if (val) {
                    const str = val.toString();
                    if (str.length > maxLen) maxLen = str.length;
                }
            });
            col.width = Math.max(maxLen + 4, 12);
        });

        // Generate and trigger download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rekap_Riwayat_RKA_${Date.now()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Extract unique filter options dynamically
    const availableUnits = Array.from(new Set(riwayatItems.map((i: any) => i.unit).filter(Boolean)));
    const availableBidangs = Array.from(new Set(riwayatItems.map((i: any) => i.bidang).filter(Boolean)));
    const availableSumber = Array.from(new Set(
        riwayatItems.flatMap((i: any) => {
            if (!i.sumber) return [];
            return i.sumber.split(/\s*&\s*|\s*\/\s*/).map((s: string) => s.trim().replace(/Dana\s+/gi, ''));
        })
    )).filter(Boolean);
    const availableMonths = Array.from(new Set(riwayatItems.map((i: any) => i.bulan).filter(Boolean)));
    const availableTahunAjaran = Array.from(new Set(riwayatItems.map((i: any) => i.tahun_ajaran).filter(Boolean)));

    // Compute filtered items
    const filteredRiwayat = riwayatItems.filter(item => {
        // Filter by search query
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const kegiatanMatches = (item.kegiatan || '').toLowerCase().includes(q);
            const unitMatches = (item.unit || '').toLowerCase().includes(q);
            const bidangMatches = (item.bidang || '').toLowerCase().includes(q);
            if (!kegiatanMatches && !unitMatches && !bidangMatches) return false;
        }

        // Filter by Unit
        if (selectedUnits.length > 0 && !selectedUnits.includes(item.unit)) return false;

        // Filter by Bidang
        if (selectedBidangs.length > 0 && !selectedBidangs.includes(item.bidang)) return false;
        
        // Filter by Sumber Dana
        if (selectedSumber.length > 0) {
            const cleanSources = (item.sumber || '').split(/\s*&\s*|\s*\/\s*/).map((s: string) => s.trim().replace(/Dana\s+/gi, ''));
            const matchesAny = selectedSumber.some(selected => cleanSources.includes(selected));
            if (!matchesAny) return false;
        }
        
        // Filter by Month
        if (selectedMonths.length > 0 && !selectedMonths.includes(item.bulan)) return false;

        // Filter by Tahun Ajaran
        if (selectedTahunAjaran.length > 0 && !selectedTahunAjaran.includes(item.tahun_ajaran)) return false;
        
        return true;
    });

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            
            {/* Header Section (Ultra Compact) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700 shrink-0">
                        <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Riwayat Pengajuan</h1>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                
                {/* Unified Toolbar */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
                    <div className="relative w-full lg:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all" 
                            placeholder="Cari kegiatan, unit, atau pengaju..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full lg:w-auto">
                        {/* -------------------- FILTER DROPDOWN -------------------- */}
                        <div className="relative" ref={filterRef}>
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center justify-center gap-2 border text-[10px] font-black px-4 py-2.5 rounded-xl transition-all shadow-sm uppercase tracking-widest ${isFilterOpen || selectedUnits.length > 0 || selectedBidangs.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0 || selectedTahunAjaran.length > 0 ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                            >
                                <Filter className="w-3.5 h-3.5" /> Filter
                                {(selectedUnits.length + selectedBidangs.length + selectedSumber.length + selectedMonths.length + selectedTahunAjaran.length) > 0 && (
                                    <span className="bg-emerald-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px] ml-1">
                                        {selectedUnits.length + selectedBidangs.length + selectedSumber.length + selectedMonths.length + selectedTahunAjaran.length}
                                    </span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Filter Arsip</h4>
                                            {(selectedUnits.length > 0 || selectedBidangs.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0 || selectedTahunAjaran.length > 0) && (
                                                <button 
                                                    onClick={() => { 
                                                        setSelectedUnits([]); 
                                                        setSelectedBidangs([]); 
                                                        setSelectedSumber([]); 
                                                        setSelectedMonths([]); 
                                                        setSelectedTahunAjaran([]); 
                                                    }}
                                                    className="text-[10px] text-rose-500 font-black hover:underline uppercase"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {/* Unit Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" /> Berdasarkan Unit
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableUnits.length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 italic">Tidak tersedia</span>
                                                    ) : (
                                                        availableUnits.map(unit => (
                                                            <button 
                                                                key={unit}
                                                                onClick={() => {
                                                                    if (selectedUnits.includes(unit)) setSelectedUnits(selectedUnits.filter(u => u !== unit));
                                                                    else setSelectedUnits([...selectedUnits, unit]);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selectedUnits.includes(unit) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {unit}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bidang Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Tag className="w-3 h-3" /> Berdasarkan Bidang
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableBidangs.length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 italic">Tidak tersedia</span>
                                                    ) : (
                                                        availableBidangs.map(bidang => (
                                                            <button 
                                                                key={bidang}
                                                                onClick={() => {
                                                                    if (selectedBidangs.includes(bidang)) setSelectedBidangs(selectedBidangs.filter(b => b !== bidang));
                                                                    else setSelectedBidangs([...selectedBidangs, bidang]);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selectedBidangs.includes(bidang) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {bidang}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sumber Dana Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Wallet className="w-3 h-3" /> Sumber Dana
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableSumber.length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 italic">Tidak tersedia</span>
                                                    ) : (
                                                        availableSumber.map(sumber => (
                                                            <button 
                                                                key={sumber}
                                                                onClick={() => {
                                                                    if (selectedSumber.includes(sumber)) setSelectedSumber(selectedSumber.filter(s => s !== sumber));
                                                                    else setSelectedSumber([...selectedSumber, sumber]);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selectedSumber.includes(sumber) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {sumber}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Month Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Bulan
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableMonths.length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 italic">Tidak tersedia</span>
                                                    ) : (
                                                        availableMonths.map(mo => (
                                                            <button 
                                                                key={mo}
                                                                onClick={() => {
                                                                    if (selectedMonths.includes(mo)) setSelectedMonths(selectedMonths.filter(m => m !== mo));
                                                                    else setSelectedMonths([...selectedMonths, mo]);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selectedMonths.includes(mo) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {mo}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tahun Ajaran Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <GraduationCap className="w-3 h-3" /> Tahun Ajaran
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableTahunAjaran.length === 0 ? (
                                                        <span className="text-[10px] text-slate-400 italic">Tidak tersedia</span>
                                                    ) : (
                                                        availableTahunAjaran.map(ta => (
                                                            <button 
                                                                key={ta}
                                                                onClick={() => {
                                                                    if (selectedTahunAjaran.includes(ta)) setSelectedTahunAjaran(selectedTahunAjaran.filter(t => t !== ta));
                                                                    else setSelectedTahunAjaran([...selectedTahunAjaran, ta]);
                                                                }}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${selectedTahunAjaran.includes(ta) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                {ta}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => setIsFilterOpen(false)}
                                            className="w-full bg-slate-900 text-white text-[10px] font-black py-3 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-widest"
                                        >
                                            Terapkan Filter
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* --------------------------------------------------------- */}

                        <button 
                            onClick={handleExportFilteredToExcel}
                            className="flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-black px-4 py-2.5 rounded-xl transition-all shadow-sm uppercase tracking-widest"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Ekspor Excel
                        </button>
                    </div>
                </div>                {/* Table Container */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[750px] lg:min-w-0 table-fixed lg:table-auto">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap lg:w-[15%]">Periode / Tgl</th>
                                <th className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap lg:w-[15%]">Unit / Bidang</th>
                                <th className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest lg:w-[40%]">Program / Kegiatan</th>
                                <th className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap lg:w-[15%]">Sumber / Metode</th>
                                <th className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap lg:w-[10%]">Nominal</th>
                                <th className="px-3 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap lg:w-[5%]">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Memuat Riwayat Pengajuan...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRiwayat.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-12 text-center">
                                        <p className="text-slate-500 font-medium text-xs italic">Tidak ada riwayat pengajuan yang cocok dengan filter saat ini.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRiwayat.map((item) => (
                                    <tr key={item.itemId} className="hover:bg-slate-50/80 transition-colors group">
                                        {/* 1. Periode & Tanggal */}
                                        <td className="px-3 py-2.5 align-middle">
                                            <div className="text-xs font-bold text-slate-800 whitespace-nowrap">
                                                {item.tanggal_pencairan || item.tanggal}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap leading-none mt-0.5">
                                                {item.bulan || '-'} ({item.tahun_ajaran || '-'})
                                            </div>
                                        </td>
                                        
                                        {/* 2. Unit / Bidang */}
                                        <td className="px-3 py-2.5 align-middle">
                                            <p className="text-xs font-bold text-emerald-700 whitespace-nowrap">{item.unit}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap leading-none mt-0.5">{item.bidang || '-'}</p>
                                        </td>
 
                                        {/* 3. Program / Kegiatan */}
                                        <td className="px-3 py-2.5 align-middle">
                                            <div className="flex items-center gap-1.5">
                                                {item.isRevision && (
                                                    <span className="bg-amber-100 text-amber-700 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border border-amber-200 shrink-0">
                                                        Revisi
                                                    </span>
                                                )}
                                                <p className="text-xs font-extrabold text-slate-800 leading-tight">{item.kegiatan || item.program}</p>
                                            </div>
                                        </td>
 
                                        {/* 4. Sumber & Metode */}
                                        <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-600 uppercase tracking-tighter max-w-[150px] truncate" title={item.sumber || 'Dana Yayasan'}>
                                                    {(item.sumber || 'Dana Yayasan').replace(/Dana\s+/gi, '')}
                                                </span>
                                                {item.metode_pencairan === 'Transfer' ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-tight">
                                                        Transfer
                                                    </span>
                                                ) : item.metode_pencairan === 'Cash' ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-tight">
                                                        Cash
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-50 text-slate-400 border border-slate-100">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </td>
 
                                        {/* 5. Nominal */}
                                        <td className="px-3 py-2.5 align-middle text-right whitespace-nowrap">
                                            <span className="text-xs font-black text-slate-900">
                                                Rp {Number(item.nominal || 0).toLocaleString('id-ID')}
                                            </span>
                                        </td>
 
                                        {/* 6. Aksi */}
                                        <td className="px-3 py-2.5 align-middle text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <button 
                                                    onClick={() => handleExportDocumentToExcel(item.id, item.itemId)}
                                                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                                                    title="Ekspor Excel (RKA)"
                                                >
                                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleViewDetail(item)}
                                                    className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer" 
                                                    title="Detail Riwayat"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                {userRole && [
                                                    'STAFF_UNIT', 
                                                    'STAFF_BIDANG', 
                                                    'BENDAHARA_UNIT', 
                                                    'BENDAHARA_JENJANG'
                                                ].includes(userRole) && (
                                                    <Link 
                                                        href={`/admin/realisasi/buat?itemId=${item.itemId}`}
                                                        className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                                                        title="Buat Laporan Realisasi"
                                                    >
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Meta */}
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-center shrink-0 rounded-b-3xl">
                    <p className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">Menampilkan {filteredRiwayat.length} arsip pencairan</p>
                </div>
            </div>

            {/* DETAIL MODAL - RKA-ONLY PROPOSAL VIEW */}
            {selectedItemForDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        
                        {/* Header */}
                        <div className="px-6 py-4 text-white flex justify-between items-start shrink-0 bg-emerald-600">
                            <div className="flex gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <ClipboardCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-sm font-black italic leading-tight uppercase tracking-tight">
                                            {selectedItemForDetail.kegiatan}
                                        </h3>
                                        <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-200">
                                            {detailRkaDoc?.status || selectedItemForDetail.status || 'SUDAH DISETUJUI'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold opacity-90 uppercase tracking-tighter">
                                        {selectedItemForDetail.unit} / {selectedItemForDetail.bidang} • ID: {selectedItemForDetail.id}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setSelectedItemForDetail(null);
                                    setDetailLpjDoc(null);
                                    setDetailRkaDoc(null);
                                    setSelectedRevisionSnapshot(null);
                                }} 
                                className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 gap-3">
                                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat Detail RKA...</p>
                            </div>
                        ) : (
                            <Fragment>
                                {/* Funding Accumulation Summary */}
                                <div className="bg-slate-100/50 border-b border-slate-200 px-6 py-2 flex flex-wrap gap-3 items-center shrink-0">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sumber Pendanaan:</span>
                                    {(() => {
                                        const summary: Record<string, number> = {};
                                        
                                        const docForFunding = detailLpjDoc || detailRkaDoc;
                                        if (docForFunding) {
                                            const targetTitle = (selectedItemForDetail?.kegiatan || '').trim().toLowerCase();
                                            const fundingItems = (docForFunding.item_pengajuan || []).filter((it: any) => {
                                                const itemTitle = (it.judul_kegiatan || it.kegiatan || '').trim().toLowerCase();
                                                return itemTitle === targetTitle;
                                            });
                                            const itemsToUse = fundingItems.length > 0 ? fundingItems : (docForFunding.item_pengajuan || []);
                                            itemsToUse.forEach((it: any) => {
                                                let details: any = {};
                                                try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                
                                                const splits = details.fundingSplits || details.subsidiSources || [];
                                                if (Array.isArray(splits)) {
                                                    splits.forEach((s: any) => {
                                                        const source = s.source || s.sumber || 'Dana Yayasan';
                                                        const amount = Number(s.nominal || s.amount || 0);
                                                        if (amount > 0) summary[source] = (summary[source] || 0) + amount;
                                                    });
                                                }
                                            });
                                        }
                                        
                                        if (Object.keys(summary).length === 0) {
                                            summary[selectedItemForDetail.sumber || 'Dana Yayasan'] = selectedItemForDetail.nominal;
                                        }

                                        return Object.entries(summary).map(([source, amount], idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">{source}:</span>
                                                <span className="text-[9px] font-black text-slate-950 italic font-bold">Rp {amount.toLocaleString('id-ID')}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* Banner for revision snapshot view */}
                                {selectedRevisionSnapshot && (
                                    <div className="bg-amber-500 text-white px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md border-b border-amber-600 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1 bg-white/20 rounded-lg">
                                                <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-wider leading-tight">
                                                    ⚠️ MENAMPILKAN ARSIP SEBELUM REVISI (Perencanaan RKA)
                                                </p>
                                                <p className="text-[9px] font-bold opacity-90 leading-normal">
                                                    Tanggal Revisi: {new Date(selectedRevisionSnapshot.tanggal_revisi).toLocaleString('id-ID')} • Catatan: "{selectedRevisionSnapshot.catatan_revisi}"
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedRevisionSnapshot(null)}
                                            className="px-3 py-1 bg-white text-amber-600 hover:bg-slate-50 active:scale-95 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer whitespace-nowrap"
                                        >
                                            Kembali ke Versi Sekarang
                                        </button>
                                    </div>
                                )}

                                {/* Scrollable Body */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-50/30">
                                    
                                    {/* Status & Summary Bar */}
                                    <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status Dokumen:</span>
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                {detailRkaDoc?.status || selectedItemForDetail.status || 'DISETUJUI'}
                                            </span>
                                        </div>
                                        
                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                    Total Nominal RKA:
                                                </span>
                                                <span className="text-sm font-black text-slate-800 italic">
                                                    Rp {(() => {
                                                        if (selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'RKA') {
                                                            const targetTitle = (selectedItemForDetail?.kegiatan || '').trim().toLowerCase();
                                                            const filteredSnapshotItems = (selectedRevisionSnapshot.items || []).filter((it: any) => {
                                                                const itemTitle = (it.judul_kegiatan || it.kegiatan || it.item || '').trim().toLowerCase();
                                                                return itemTitle === targetTitle;
                                                            });
                                                            const itemsToSum = filteredSnapshotItems.length > 0 ? filteredSnapshotItems : (selectedRevisionSnapshot.items || []);
                                                            const totalVal = itemsToSum.reduce((sum: number, it: any) => sum + (it.nominal || 0), 0);
                                                            return totalVal.toLocaleString('id-ID');
                                                        }
                                                        if (detailRkaDoc) {
                                                            const targetTitle = (selectedItemForDetail?.kegiatan || '').trim().toLowerCase();
                                                            const rkaItems = (detailRkaDoc.item_pengajuan || []).filter((it: any) => {
                                                                const itemTitle = (it.judul_kegiatan || it.kegiatan || '').trim().toLowerCase();
                                                                return itemTitle === targetTitle;
                                                            });
                                                            if (rkaItems.length > 0) {
                                                                const totalVal = rkaItems.reduce((sum: number, it: any) => sum + (it.nominal || 0), 0);
                                                                return totalVal.toLocaleString('id-ID');
                                                            }
                                                        }
                                                        return (selectedItemForDetail?.nominal || 0).toLocaleString('id-ID');
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RKA Table */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-amber-500 rounded-full shadow-md"></div>
                                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                                                    Rincian Rencana Kegiatan & Anggaran (RKA{detailLpjDoc?.jenis === 'REVISI_RKA' ? ' ASLI' : ''})
                                                </h4>
                                            </div>
                                        </div>
                                        
                                        {!detailRkaDoc && !(selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'RKA') ? (
                                            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                ⚠️ Referensi RKA tidak ditemukan
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                <table className="w-full text-left text-[9px] border-collapse">
                                                    <thead className="bg-amber-50/50 border-b border-amber-100">
                                                        <tr>
                                                            <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">No</th>
                                                            <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Program / Kegiatan</th>
                                                            <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Operasional</th>
                                                            <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest text-center">Jml Kegiatan</th>
                                                            <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Waktu / Tempat</th>
                                                            <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">PIC / Sasaran</th>
                                                            <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest text-right">Nominal Rencana</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(() => {
                                                            let rkaItemsToRender = [];
                                                            if (selectedRevisionSnapshot && selectedRevisionSnapshot.type === 'RKA') {
                                                                const targetTitle = (selectedItemForDetail?.kegiatan || '').trim().toLowerCase();
                                                                rkaItemsToRender = (selectedRevisionSnapshot.items || []).filter((it: any) => {
                                                                    const itemTitle = (it.judul_kegiatan || it.kegiatan || it.item || '').trim().toLowerCase();
                                                                    return itemTitle === targetTitle;
                                                                });
                                                                if (rkaItemsToRender.length === 0) {
                                                                    rkaItemsToRender = selectedRevisionSnapshot.items || [];
                                                                }
                                                            } else if (detailRkaDoc) {
                                                                const targetTitle = (selectedItemForDetail?.kegiatan || '').trim().toLowerCase();
                                                                rkaItemsToRender = (detailRkaDoc.item_pengajuan || []).filter((it: any) => {
                                                                    const itemTitle = (it.judul_kegiatan || it.kegiatan || '').trim().toLowerCase();
                                                                    return itemTitle === targetTitle;
                                                                });
                                                                if (rkaItemsToRender.length === 0 && detailRkaDoc.item_pengajuan?.length > 0) {
                                                                    rkaItemsToRender = [detailRkaDoc.item_pengajuan[0]];
                                                                }
                                                            }
                                                            
                                                            return rkaItemsToRender.map((it: any, idx: number) => {
                                                                let rkaDetails: any = {};
                                                                try { rkaDetails = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                                const rkaItems = rkaDetails.items || [];
                                                                
                                                                return (
                                                                    <Fragment key={idx}>
                                                                        <tr className="bg-white">
                                                                            <td className="px-3 py-2 text-slate-500 font-bold">{idx + 1}</td>
                                                                            <td className="px-3 py-2 font-black text-slate-900 italic">{it.judul_kegiatan || it.kegiatan || it.item}</td>
                                                                            <td className="px-3 py-2"><span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md font-black uppercase text-[8px]">{it.kategori_coa || it.operasional}</span></td>
                                                                            <td className="px-3 py-2 text-center font-black text-slate-800">{it.jumlah_kegiatan || 1}x</td>
                                                                            <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{it.waktu || '-'} / {it.tempat || '-'}</td>
                                                                            <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{it.pic || '-'} / {it.sasaran || '-'}</td>
                                                                            <td className="px-3 py-2 text-right font-black text-slate-950 text-xs">Rp {(it.nominal || 0).toLocaleString('id-ID')}</td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td colSpan={7} className="px-8 pb-4 bg-amber-50/10">
                                                                                <div className="bg-white rounded-xl border border-amber-100 p-3 space-y-3 shadow-sm">
                                                                                    <div className="flex items-center gap-2 mb-1 px-1">
                                                                                        <div className="w-1.5 h-3 bg-amber-500 rounded-full"></div>
                                                                                        <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Rincian Anggaran RKA</p>
                                                                                    </div>
                                                                                    <table className="w-full text-[9px]">
                                                                                        <thead>
                                                                                            <tr className="text-slate-600 font-black uppercase tracking-tighter border-b border-slate-100">
                                                                                                <th className="py-1.5 text-left">Nama Item / Spesifikasi</th>
                                                                                                <th className="py-1.5 text-center">Satuan</th>
                                                                                                <th className="py-1.5 text-right">Harga Satuan</th>
                                                                                                <th className="py-1.5 text-center">Qty</th>
                                                                                                <th className="py-1.5 text-right">Total (Rp)</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody className="divide-y divide-slate-100 text-slate-800">
                                                                                            {rkaItems.map((sub: any, sIdx: number) => (
                                                                                                <tr key={sIdx}>
                                                                                                    <td className="py-1.5 font-bold italic">{sub.name}</td>
                                                                                                    <td className="py-1.5 text-center font-bold">{sub.unit}</td>
                                                                                                    <td className="py-1.5 text-right font-black">Rp {Number(sub.price || 0).toLocaleString('id-ID')}</td>
                                                                                                    <td className="py-1.5 text-center font-black">{sub.qty}</td>
                                                                                                    <td className="py-1.5 text-right font-black text-slate-950">Rp {Number(sub.total || 0).toLocaleString('id-ID')}</td>
                                                                                                </tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    </Fragment>
                                                                );
                                                            });
                                                        })()}
                                                    </tbody>
                                                </table>
                                                {/* ALOKASI DANA RKA ORIGINAL */}
                                                {detailRkaDoc && (
                                                    <div className="bg-amber-50/50 border-t border-amber-100 p-3">
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Alokasi Sumber Dana (RKA Original):</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(() => {
                                                                    const summary: Record<string, number> = {};
                                                                    const targetTitle = (selectedItemForDetail?.kegiatan || '').trim().toLowerCase();
                                                                    const rkaItems = (detailRkaDoc.item_pengajuan || []).filter((it: any) => {
                                                                        const itemTitle = (it.judul_kegiatan || it.kegiatan || '').trim().toLowerCase();
                                                                        return itemTitle === targetTitle;
                                                                    });
                                                                    const itemsToUse = rkaItems.length > 0 ? rkaItems : (detailRkaDoc.item_pengajuan || []);
                                                                    itemsToUse.forEach((it: any) => {
                                                                        let rkaDetails: any = {};
                                                                        try { rkaDetails = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                                        const splits = rkaDetails.fundingSplits || [];
                                                                        if (Array.isArray(splits)) {
                                                                            splits.forEach((s: any) => {
                                                                                const source = s.source || s.sumber || 'Dana Yayasan';
                                                                                const amount = Number(s.nominal || s.amount || 0);
                                                                                if (amount > 0) summary[source] = (summary[source] || 0) + amount;
                                                                            });
                                                                        }
                                                                    });
                                                                    if (Object.keys(summary).length === 0) {
                                                                        summary[selectedItemForDetail.sumber || 'Dana Yayasan'] = selectedItemForDetail.nominal;
                                                                    }
                                                                    return Object.entries(summary).map(([source, amount], idx) => (
                                                                        <div key={idx} className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg border border-amber-200 shadow-sm">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                                            <span className="text-[9px] font-black text-amber-900 uppercase tracking-tighter">{source}:</span>
                                                                            <span className="text-[9px] font-black text-amber-950 italic">Rp {amount.toLocaleString('id-ID')}</span>
                                                                        </div>
                                                                    ));
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Revisi / LPJ Table */}
                                    {detailLpjDoc && (
                                        <div className="space-y-2 mt-6">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-4 bg-sky-500 rounded-full shadow-md"></div>
                                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                                                        {detailLpjDoc?.jenis === 'REVISI_RKA' ? 'Rincian Revisi Anggaran (REVISI RKA)' : 'Rincian Realisasi Pengeluaran (LPJ)'}
                                                    </h4>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                <table className="w-full text-left text-[9px] border-collapse">
                                                    <thead className="bg-sky-50/50 border-b border-sky-100">
                                                        <tr>
                                                            <th className="px-3 py-2 font-black text-sky-800 uppercase tracking-widest">No</th>
                                                            <th className="px-3 py-2 font-black text-sky-800 uppercase tracking-widest">Program / Kegiatan</th>
                                                            <th className="px-3 py-2 font-black text-sky-800 uppercase tracking-widest">Operasional</th>
                                                            <th className="px-3 py-2 font-black text-sky-800 uppercase tracking-widest text-center">Jml Kegiatan</th>
                                                            <th className="px-3 py-2 font-black text-sky-800 uppercase tracking-widest text-right">Nominal {detailLpjDoc?.jenis === 'REVISI_RKA' ? 'Revisi' : 'Realisasi'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(() => {
                                                            const targetTitle = (selectedItemForDetail?.kegiatan || '').trim().toLowerCase();
                                                            let itemsToRender = (detailLpjDoc.item_pengajuan || []).filter((it: any) => {
                                                                const itemTitle = (it.judul_kegiatan || it.kegiatan || '').trim().toLowerCase();
                                                                return itemTitle === targetTitle;
                                                            });
                                                            if (itemsToRender.length === 0 && detailLpjDoc.item_pengajuan?.length > 0) {
                                                                itemsToRender = [detailLpjDoc.item_pengajuan[0]];
                                                            }
                                                            return itemsToRender.map((it: any, idx: number) => {
                                                                let lpjDetails: any = {};
                                                                try { lpjDetails = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                                const lpjRincian = lpjDetails.items || (Array.isArray(lpjDetails) ? lpjDetails : []);
                                                                
                                                                return (
                                                                    <Fragment key={`lpj-${idx}`}>
                                                                        <tr className="bg-white">
                                                                            <td className="px-3 py-2 text-slate-500 font-bold">{idx + 1}</td>
                                                                            <td className="px-3 py-2 font-black text-slate-900 italic">{it.judul_kegiatan || it.kegiatan || '-'}</td>
                                                                            <td className="px-3 py-2"><span className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded-md font-black uppercase text-[8px]">{it.kategori_coa || it.operasional || '-'}</span></td>
                                                                            <td className="px-3 py-2 text-center font-black text-slate-800">{it.jumlah_kegiatan || 1}x</td>
                                                                            <td className="px-3 py-2 text-right font-black text-slate-950 text-xs">Rp {(it.nominal || 0).toLocaleString('id-ID')}</td>
                                                                        </tr>
                                                                        {lpjRincian.length > 0 && (
                                                                            <tr>
                                                                                <td colSpan={7} className="px-8 pb-4 bg-sky-50/10">
                                                                                    <div className="bg-white rounded-xl border border-sky-100 p-3 space-y-3 shadow-sm">
                                                                                        <div className="flex items-center gap-2 mb-1 px-1">
                                                                                            <div className="w-1.5 h-3 bg-sky-500 rounded-full"></div>
                                                                                            <p className="text-[9px] font-black text-sky-800 uppercase tracking-widest">Rincian Item {detailLpjDoc?.jenis === 'REVISI_RKA' ? 'Revisi' : 'Realisasi'}</p>
                                                                                        </div>
                                                                                        <table className="w-full text-[9px]">
                                                                                            <thead>
                                                                                                <tr className="text-slate-600 font-black uppercase tracking-tighter border-b border-slate-100">
                                                                                                    <th className="py-1.5 text-left">Nama Item</th>
                                                                                                    <th className="py-1.5 text-center">Satuan</th>
                                                                                                    <th className="py-1.5 text-right">Harga Satuan</th>
                                                                                                    <th className="py-1.5 text-center">Qty</th>
                                                                                                    <th className="py-1.5 text-right">Total (Rp)</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody className="divide-y divide-slate-100 text-slate-800">
                                                                                                {lpjRincian.map((sub: any, sIdx: number) => (
                                                                                                    <tr key={sIdx}>
                                                                                                        <td className="py-1.5 font-bold italic">{sub.name}</td>
                                                                                                        <td className="py-1.5 text-center font-bold">{sub.unit || sub.satuan}</td>
                                                                                                        <td className="py-1.5 text-right font-black">Rp {Number(sub.price || sub.harga_satuan || 0).toLocaleString('id-ID')}</td>
                                                                                                        <td className="py-1.5 text-center font-black">{sub.qty || sub.kuantitas}</td>
                                                                                                        <td className="py-1.5 text-right font-black text-slate-950">Rp {Number(sub.total || 0).toLocaleString('id-ID')}</td>
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </Fragment>
                                                                );
                                                            });
                                                        })()}
                                                    </tbody>
                                                </table>
                                                {/* ALOKASI DANA REVISI / LPJ */}
                                                <div className="bg-sky-50/50 border-t border-sky-100 p-3">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[9px] font-black text-sky-800 uppercase tracking-widest">Alokasi Sumber Dana {detailLpjDoc?.jenis === 'REVISI_RKA' ? '(Revisi RKA)' : '(Realisasi)'}:</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(() => {
                                                                const summary: Record<string, number> = {};
                                                                const targetTitle = (selectedItemForDetail?.kegiatan || '').trim().toLowerCase();
                                                                const lpjItems = (detailLpjDoc.item_pengajuan || []).filter((it: any) => {
                                                                    const itemTitle = (it.judul_kegiatan || it.kegiatan || '').trim().toLowerCase();
                                                                    return itemTitle === targetTitle;
                                                                });
                                                                const itemsToUse = lpjItems.length > 0 ? lpjItems : (detailLpjDoc.item_pengajuan || []);
                                                                itemsToUse.forEach((it: any) => {
                                                                    let details: any = {};
                                                                    try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                                    const splits = details.fundingSplits || details.subsidiSources || [];
                                                                    if (Array.isArray(splits)) {
                                                                        splits.forEach((s: any) => {
                                                                            const source = s.source || s.sumber || 'Dana Yayasan';
                                                                            const amount = Number(s.nominal || s.amount || 0);
                                                                            if (amount > 0) summary[source] = (summary[source] || 0) + amount;
                                                                        });
                                                                    }
                                                                });
                                                                if (Object.keys(summary).length === 0) {
                                                                    summary[selectedItemForDetail.sumber || 'Dana Yayasan'] = selectedItemForDetail.nominal;
                                                                }
                                                                return Object.entries(summary).map(([source, amount], idx) => (
                                                                    <div key={idx} className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg border border-sky-200 shadow-sm">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                                                                        <span className="text-[9px] font-black text-sky-900 uppercase tracking-tighter">{source}:</span>
                                                                        <span className="text-[9px] font-black text-sky-950 italic">Rp {amount.toLocaleString('id-ID')}</span>
                                                                    </div>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* RIWAYAT REVISI SNAPSHOT LOG (RKA Only) */}
                                    {(() => {
                                        const rkaHistory = detailRkaDoc?.riwayat_revisi || [];
                                        if (rkaHistory.length === 0) return null;
                                        
                                        return (
                                            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <History className="w-4 h-4 text-amber-600 animate-pulse" />
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                        Riwayat Log Penolakan & Berkas Sebelum Revisi ({rkaHistory.length}):
                                                    </p>
                                                </div>
                                                
                                                <div className="divide-y divide-slate-100 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {rkaHistory.map((rev: any, rIdx: number) => (
                                                        <div key={rIdx} className="py-2.5 flex flex-col gap-1 text-[10px] font-bold">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-slate-500 font-semibold">{new Date(rev.tanggal_revisi).toLocaleString('id-ID')}</span>
                                                                <button 
                                                                    onClick={() => setSelectedRevisionSnapshot({ ...rev, type: 'RKA' })}
                                                                    className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-600 rounded text-[8px] font-black uppercase tracking-tighter transition-all cursor-pointer"
                                                                >
                                                                    Lihat RKA Lama
                                                                </button>
                                                            </div>
                                                            <p className="text-slate-800 italic leading-snug">"{rev.catatan_revisi || 'Tanpa catatan'}"</p>
                                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Total RKA: Rp {Number(rev.total_nominal || 0).toLocaleString('id-ID')}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* SECTION 4: Jejak Audit (Workflow History) */}
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Jejak Audit & Alur Otorisasi Proposal RKA:</p>
                                        </div>
                                        
                                        <div className="relative pl-6 space-y-5 font-bold">
                                            <div className="absolute left-[9px] top-1.5 bottom-1.5 w-[1px] bg-slate-200 font-bold"></div>
                                            
                                            {(() => {
                                                const formatFullDate = (dateStr: string) => {
                                                    if (!dateStr) return '';
                                                    return new Date(dateStr).toLocaleString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    }) + ' WIB';
                                                };

                                                const rkaHistory = detailRkaDoc?.riwayat_revisi || [];
                                                const finalUpdateDate = detailRkaDoc?.updated_at || detailRkaDoc?.created_at;

                                                return (
                                                    <Fragment>
                                                        {/* 1. Pengajuan Awal */}
                                                        <div className="relative flex items-start gap-3 font-bold">
                                                            <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm font-bold"></div>
                                                            <div className="space-y-0.5">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">1. Pengajuan Anggaran RKA</h5>
                                                                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[8px] font-bold">
                                                                        {formatFullDate(detailRkaDoc?.created_at)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[9px] font-bold text-slate-400">Diajukan oleh Bendahara Unit/Jenjang {selectedItemForDetail.unit} dengan nominal rencana Rp {selectedItemForDetail.nominal.toLocaleString('id-ID')}.</p>
                                                            </div>
                                                        </div>

                                                        {/* Revisions (if any) */}
                                                        {rkaHistory.map((rev: any, rIdx: number) => (
                                                            <Fragment key={`rev-${rIdx}`}>
                                                                <div className="relative flex items-start gap-3 font-bold">
                                                                    <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-sm font-bold animate-pulse"></div>
                                                                    <div className="space-y-0.5">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-tight">Revisi Dikembalikan oleh Bendahara</h5>
                                                                            <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[8px] font-bold border border-rose-100">
                                                                                {formatFullDate(rev.tanggal_revisi)}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[9px] font-bold text-slate-600 italic">"Catatan Penolakan: {rev.catatan_revisi || 'Tanpa catatan'}"</p>
                                                                    </div>
                                                                </div>

                                                                <div className="relative flex items-start gap-3 font-bold">
                                                                    <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm font-bold"></div>
                                                                    <div className="space-y-0.5">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Pengajuan Kembali Proposal RKA</h5>
                                                                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[8px] font-bold">
                                                                                {formatFullDate(rev.tanggal_revisi)}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[9px] font-bold text-slate-400">Berkas diperbaiki dan diajukan ulang oleh Bendahara Unit/Jenjang {selectedItemForDetail.unit}.</p>
                                                                    </div>
                                                                </div>
                                                            </Fragment>
                                                        ))}

                                                        {/* 2. Otorisasi Kepala Unit */}
                                                        <div className="relative flex items-start gap-3 font-bold">
                                                            <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm font-bold"></div>
                                                            <div className="space-y-0.5">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">2. Otorisasi Kepala Unit/Jenjang</h5>
                                                                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[8px] font-bold">
                                                                        {formatFullDate(finalUpdateDate)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[9px] font-bold text-slate-400">Diverifikasi dan disetujui secara resmi oleh Kepala Unit/Jenjang {selectedItemForDetail.unit}.</p>
                                                            </div>
                                                        </div>

                                                        {/* 3. Persetujuan Akhir & Pencairan */}
                                                        <div className="relative flex items-start gap-3 font-bold">
                                                            <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm font-bold"></div>
                                                            <div className="space-y-0.5">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">3. Persetujuan Akhir & Pencairan</h5>
                                                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-bold border border-emerald-100">
                                                                        {formatFullDate(finalUpdateDate)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Telah disetujui, dana dicairkan secara resmi oleh Bendahara Pusat (Yayasan), dan siap dilaksanakan.</p>
                                                            </div>
                                                        </div>
                                                    </Fragment>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer - Fixed Height */}
                                <div className="bg-slate-50 px-6 py-4 flex justify-end shrink-0 border-t border-slate-100">
                                    <button 
                                        onClick={() => {
                                            setSelectedItemForDetail(null);
                                            setDetailLpjDoc(null);
                                            setDetailRkaDoc(null);
                                            setSelectedRevisionSnapshot(null);
                                        }}
                                        className="px-5 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-md cursor-pointer"
                                    >
                                        Tutup Detail
                                    </button>
                                </div>
                            </Fragment>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
