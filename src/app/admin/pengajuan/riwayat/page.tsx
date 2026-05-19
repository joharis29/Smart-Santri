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

            // Determine if it is RKA or LPJ
            const isLpj = clickedDoc.status === 'SELESAI';

            if (isLpj) {
                setDetailLpjDoc(clickedDoc);
                const lpjItem = clickedDoc.item_pengajuan?.find((it: any) => it.id === item.itemId) || clickedDoc.item_pengajuan?.[0];
                let lpjDetails: any = {};
                if (lpjItem?.rincian_json) {
                    try {
                        lpjDetails = typeof lpjItem.rincian_json === 'string'
                            ? JSON.parse(lpjItem.rincian_json)
                            : lpjItem.rincian_json;
                    } catch (e) {}
                }
                const rkaId = lpjDetails?.rka_id;
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
                    .eq('jenis', 'RKA')
                    .in('status', ['CAIR', 'SUDAH_DITERIMA'])
                    .order('updated_at', { ascending: false });

                // If not Pusat/Admin, filter by active unit
                if (role !== 'BENDAHARA_PUSAT' && role !== 'ADMINISTRATOR' && role !== 'PIMPINAN') {
                    query = query.eq('unit', activeUnit);
                }

                const { data, error } = await query;

                if (error) {
                    console.error("Error fetching riwayat:", error);
                } else if (data) {
                    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    const mapped: any[] = [];
                    data.forEach(doc => {
                        const items = doc.item_pengajuan || [];
                        items.forEach((it: any) => {
                            mapped.push({
                                id: doc.id,
                                itemId: it.id,
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

        const isDapurMode = doc.unit === 'Dapur Pusat' || doc.unit === 'Dapur Asrama Putra' || doc.unit === 'Dapur Asrama Putri';
        let reportTitle = "PENGAJUAN RENCANA KEGIATAN DAN ANGGARAN (RKA)";
        if (isDapurMode) {
            reportTitle = "LAPORAN REIMBURSEMENT DAPUR";
        } else if (doc.periode_bulan === 0 || doc.periode_bulan === '0') {
            reportTitle = "PENGAJUAN RENCANA KEGIATAN DAN ANGGARAN TAHUNAN (RKAT)";
        }

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

        // 3. Table Headers
        let tableHeader = [];
        if (isDapurMode) {
            tableHeader = ['No', 'Tanggal', 'Item / Bahan Makanan', 'Spesifikasi / Detail', 'Metode Pembayaran', 'Nominal (Rp)'];
        } else {
            tableHeader = [
                'No', 
                'Nama Program/ Kegiatan', 
                'Operasional', 
                'Jumlah Kegiatan', 
                'Satuan', 
                'Harga Satuan', 
                'Qty', 
                'Rencana Anggaran', 
                'Waktu', 
                'Tempat', 
                'Penanggung Jawab', 
                'Sasaran'
            ];
        }

        const headerRow = worksheet.addRow(tableHeader);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, name: 'Times New Roman' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF1F5F9' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        const items = (doc.item_pengajuan || []).filter((it: any) => it.id === itemId);
        let totalPengajuan = 0;
        const summary: Record<string, number> = {};

        // 4. Data Population
        if (isDapurMode) {
            items.forEach((row: any, idx: number) => {
                const nominal = Number(row.nominal) || 0;
                totalPengajuan += nominal;
                
                // Track funding split for summary
                let fundingSplits: any[] = [];
                try {
                    const details = typeof row.rincian_json === 'string' ? JSON.parse(row.rincian_json) : (row.rincian_json || {});
                    fundingSplits = details.fundingSplits || [];
                } catch(e) {}
                
                if (Array.isArray(fundingSplits) && fundingSplits.length > 0) {
                    fundingSplits.forEach((s: any) => {
                        if (s.source && s.nominal > 0) {
                            summary[s.source] = (summary[s.source] || 0) + s.nominal;
                        }
                    });
                } else {
                    summary[row.sumber_dana || 'Dana Yayasan'] = (summary[row.sumber_dana || 'Dana Yayasan'] || 0) + nominal;
                }

                const r = worksheet.addRow([
                    idx + 1,
                    row.tanggal_kebutuhan ? new Date(row.tanggal_kebutuhan).toLocaleDateString('id-ID') : '-',
                    row.judul_kegiatan || 'Bahan Makanan',
                    row.sasaran || '-',
                    doc.metode_pencairan || 'CASH',
                    nominal
                ]);
                r.getCell(6).numFmt = '"Rp "#,##0';
                r.eachCell(cell => {
                    cell.font = { name: 'Times New Roman' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });
        } else {
            items.forEach((row: any, idx: number) => {
                const nominal = Number(row.nominal) || 0;
                totalPengajuan += nominal;
                
                let details: any = {};
                try {
                    details = typeof row.rincian_json === 'string' ? JSON.parse(row.rincian_json) : (row.rincian_json || {});
                } catch(e) {
                    details = { items: [], fundingSplits: [] };
                }

                const savedJumlah = details.jumlah_kegiatan || '1';
                const fundingSplits = details.fundingSplits || [];

                // Track funding split for summary
                if (Array.isArray(fundingSplits) && fundingSplits.length > 0) {
                    fundingSplits.forEach((s: any) => {
                        if (s.source && s.nominal > 0) {
                            summary[s.source] = (summary[s.source] || 0) + s.nominal;
                        }
                    });
                } else {
                    summary[row.sumber_dana || 'Dana Yayasan'] = (summary[row.sumber_dana || 'Dana Yayasan'] || 0) + nominal;
                }

                const mainRow = worksheet.addRow([
                    idx + 1,
                    row.judul_kegiatan,
                    row.kategori_coa,
                    savedJumlah,
                    '',
                    '',
                    '',
                    nominal,
                    row.waktu || '-',
                    row.tempat || '-',
                    row.pic || '-',
                    row.sasaran || '-'
                ]);
                mainRow.getCell(8).numFmt = '"Rp "#,##0';
                mainRow.eachCell(cell => {
                    cell.font = { bold: true, name: 'Times New Roman' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });

                // Sub-items Rincian
                const rincianItems = details.items || [];
                const hasValidRincian = Array.isArray(rincianItems) && rincianItems.some((item: any) => item.name || item.total > 0);
                if (hasValidRincian) {
                    const rincianLabelRow = worksheet.addRow(['', '   --- RINCIAN BUDGET ---']);
                    rincianLabelRow.getCell(2).font = { italic: true, size: 9, color: { argb: 'FF64748B' } };

                    rincianItems.forEach((item: any) => {
                        if (item.name || item.total > 0) {
                            const subRow = worksheet.addRow([
                                '',
                                `   • ${item.name || '(Tanpa Nama)'}`,
                                '', 
                                '', 
                                item.unit || '-',
                                Number(item.price || 0),
                                Number(item.qty || 1),
                                Number(item.total || 0),
                                '', '', '', ''
                            ]);
                            subRow.getCell(6).numFmt = '"Rp "#,##0';
                            subRow.getCell(8).numFmt = '"Rp "#,##0';
                            subRow.eachCell(cell => {
                                cell.font = { name: 'Times New Roman' };
                                cell.border = {
                                    top: { style: 'thin' },
                                    left: { style: 'thin' },
                                    bottom: { style: 'thin' },
                                    right: { style: 'thin' }
                                };
                            });
                        }
                    });
                    worksheet.addRow([]);
                }
            });
        }

        // 5. Summary Section
        worksheet.addRow([]);
        const summaryHeader = worksheet.addRow(['RINGKASAN ANGGARAN PER SUMBER DANA']);
        summaryHeader.getCell(1).font = { bold: true, name: 'Times New Roman' };

        Object.entries(summary).forEach(([source, amount]) => {
            const r = worksheet.addRow([source, '', '', '', '', '', '', Number(amount)]);
            r.getCell(1).font = { bold: true, name: 'Times New Roman' };
            r.getCell(8).numFmt = '"Rp "#,##0';
            r.getCell(8).font = { bold: true, name: 'Times New Roman' };
        });

        worksheet.addRow([]);
        const totalRow = worksheet.addRow(['TOTAL KESELURUHAN', '', '', '', '', '', '', Number(totalPengajuan)]);
        totalRow.getCell(1).font = { bold: true, size: 12, name: 'Times New Roman' };
        totalRow.getCell(8).font = { bold: true, size: 12, color: { argb: 'FF065F46' }, name: 'Times New Roman' };
        totalRow.getCell(8).numFmt = '"Rp "#,##0';

        // Column Widths
        worksheet.columns.forEach((col, i) => {
            if (i === 1) col.width = 45;
            else if (i === 2) col.width = 20;
            else col.width = 15;
        });

        // 6. Otorisasi & Tanda Tangan
        worksheet.addRow([]);
        worksheet.addRow([]);
        let signRow = worksheet.lastRow!.number + 1;
        
        // Bendahara Unit
        worksheet.mergeCells(`B${signRow}:D${signRow}`);
        worksheet.getCell(`B${signRow}`).value = 'Bendahara Unit/Jenjang,';
        worksheet.getCell(`B${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`B${signRow}`).alignment = { horizontal: 'center' };

        // Kepala Unit
        worksheet.mergeCells(`E${signRow}:G${signRow}`);
        worksheet.getCell(`E${signRow}`).value = 'Kepala Unit/Jenjang,';
        worksheet.getCell(`E${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`E${signRow}`).alignment = { horizontal: 'center' };

        // Bendahara Pusat
        worksheet.mergeCells(`H${signRow}:K${signRow}`);
        worksheet.getCell(`H${signRow}`).value = 'Bendahara Pusat,';
        worksheet.getCell(`H${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`H${signRow}`).alignment = { horizontal: 'center' };

        // Signature Spaces
        let nameRow = signRow + 5;
        
        worksheet.mergeCells(`B${nameRow}:D${nameRow}`);
        worksheet.getCell(`B${nameRow}`).border = { bottom: { style: 'thin' } };
        worksheet.getCell(`B${nameRow}`).value = '';
        
        worksheet.mergeCells(`E${nameRow}:G${nameRow}`);
        worksheet.getCell(`E${nameRow}`).border = { bottom: { style: 'thin' } };
        worksheet.getCell(`E${nameRow}`).value = '';
        
        worksheet.mergeCells(`H${nameRow}:K${nameRow}`);
        worksheet.getCell(`H${nameRow}`).border = { bottom: { style: 'thin' } };
        worksheet.getCell(`H${nameRow}`).value = '';

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

                        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-emerald-200">
                            <Download className="w-4 h-4" /> Export Data
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
                                            <p className="text-xs font-extrabold text-slate-800 leading-tight">{item.kegiatan || item.program}</p>
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
                                        
                                        if (detailRkaDoc) {
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
                                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Rincian Rencana Kegiatan & Anggaran (RKA)</h4>
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
                                            </div>
                                        )}
                                    </div>

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
                                            <Activity className="w-4 h-4 text-emerald-600" />
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Jejak Audit & Alur Otorisasi Proposal:</p>
                                        </div>
                                        
                                        <div className="relative pl-6 space-y-4 font-bold">
                                            <div className="absolute left-[9px] top-1 bottom-1 w-[1px] bg-slate-200 font-bold"></div>
                                            
                                            <div className="relative flex items-start gap-3 font-bold">
                                                <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm font-bold"></div>
                                                <div>
                                                    <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">1. Pengajuan Anggaran RKA</h5>
                                                    <p className="text-[9px] font-bold text-slate-400">Diajukan oleh Bendahara Unit/Jenjang {selectedItemForDetail.unit} dengan nominal rencana Rp {selectedItemForDetail.nominal.toLocaleString('id-ID')}.</p>
                                                </div>
                                            </div>

                                            <div className="relative flex items-start gap-3 font-bold">
                                                <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm font-bold"></div>
                                                <div>
                                                    <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">2. Otorisasi Kepala Unit/Jenjang</h5>
                                                    <p className="text-[9px] font-bold text-slate-400">Diverifikasi dan disetujui secara resmi oleh Kepala Unit/Jenjang {selectedItemForDetail.unit}.</p>
                                                </div>
                                            </div>

                                            <div className="relative flex items-start gap-3 font-bold">
                                                <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm font-bold"></div>
                                                <div>
                                                    <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">3. Persetujuan Akhir & Pencairan</h5>
                                                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Telah disetujui, dana dicairkan secara resmi oleh Bendahara Pusat (Yayasan), dan siap dilaksanakan.</p>
                                                </div>
                                            </div>
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
