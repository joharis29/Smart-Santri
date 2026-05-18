'use client';

import { useState, useEffect, useRef } from 'react';
import { ClipboardCheck, Download, Eye, FileText, FileSpreadsheet, Search, Filter, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { createClient } from '@/utils/supabase/client';

export default function RiwayatPengajuanPage() {
    const supabase = createClient();
    const [riwayatItems, setRiwayatItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);

    // Filter States
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [selectedSumber, setSelectedSumber] = useState<string[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [selectedMetode, setSelectedMetode] = useState<string[]>([]);

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
                    .in('status', ['CAIR', 'SUDAH_DITERIMA', 'SELESAI'])
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
                                    return sources.length > 0 ? sources.join(' / ') : (it.sumber_dana || 'Dana Yayasan');
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

    const handleExportDocumentToExcel = async (docId: string) => {
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

        const items = doc.item_pengajuan || [];
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
    const availableUnits = Array.from(new Set(riwayatItems.map(i => i.unit)));
    const availableSumber = Array.from(new Set(riwayatItems.map(i => i.sumber)));
    const availableMonths = Array.from(new Set(riwayatItems.map(i => {
        const parts = i.tanggal.split(' ');
        return parts.length === 3 ? `${parts[1]} ${parts[2]}` : i.tanggal;
    })));

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
        
        // Filter by Sumber Dana
        if (selectedSumber.length > 0 && !selectedSumber.includes(item.sumber)) return false;
        
        // Filter by Month
        if (selectedMonths.length > 0) {
            const parts = item.tanggal.split(' ');
            const tMonth = parts.length === 3 ? `${parts[1]} ${parts[2]}` : item.tanggal;
            if (!selectedMonths.includes(tMonth)) return false;
        }

        // Filter by Metode Pencairan
        if (selectedMetode.length > 0 && !selectedMetode.includes(item.metode_pencairan)) return false;
        
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
                              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 border border-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm ${selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0 || selectedMetode.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
                            >
                                <Filter className="w-4 h-4" /> Filter
                                {(selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0 || selectedMetode.length > 0) && (
                                    <span className="text-[10px] font-bold bg-emerald-600 text-white w-4 h-4 flex items-center justify-center rounded-full leading-none ml-1">
                                        {selectedUnits.length + selectedSumber.length + selectedMonths.length + selectedMetode.length}
                                    </span>
                                )}
                            </button>

                            {isFilterOpen && (
                              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in slide-in-from-top-2">
                                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Filter Data</h4>
                                    {(selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0 || selectedMetode.length > 0) && (
                                      <button 
                                        onClick={() => { setSelectedUnits([]); setSelectedSumber([]); setSelectedMonths([]); setSelectedMetode([]); }}
                                        className="text-[10px] text-rose-500 font-bold hover:underline"
                                      >
                                        Reset Semua
                                      </button>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                    {/* Unit Filter */}
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Berdasarkan Unit</p>
                                      <div className="space-y-2">
                                        {availableUnits.map(unit => (
                                          <label key={unit} className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                              type="checkbox" 
                                              className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                              checked={selectedUnits.includes(unit)}
                                              onChange={(e) => {
                                                if (e.target.checked) setSelectedUnits([...selectedUnits, unit]);
                                                else setSelectedUnits(selectedUnits.filter(u => u !== unit));
                                              }}
                                            />
                                            <span className="text-xs font-medium text-slate-700 group-hover:text-emerald-700">{unit}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Sumber Dana Filter */}
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Berdasarkan Sumber Dana</p>
                                      <div className="space-y-2">
                                        {availableSumber.map(sumber => (
                                          <label key={sumber} className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                              type="checkbox" 
                                              className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                              checked={selectedSumber.includes(sumber)}
                                              onChange={(e) => {
                                                if (e.target.checked) setSelectedSumber([...selectedSumber, sumber]);
                                                else setSelectedSumber(selectedSumber.filter(s => s !== sumber));
                                              }}
                                            />
                                            <span className="text-xs font-medium text-slate-700 group-hover:text-emerald-700">{sumber}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Month Filter */}
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Berdasarkan Bulan</p>
                                      <div className="space-y-2">
                                        {availableMonths.map(mo => (
                                          <label key={mo} className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                              type="checkbox" 
                                              className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                              checked={selectedMonths.includes(mo)}
                                              onChange={(e) => {
                                                if (e.target.checked) setSelectedMonths([...selectedMonths, mo]);
                                                else setSelectedMonths(selectedMonths.filter(m => m !== mo));
                                              }}
                                            />
                                            <span className="text-xs font-medium text-slate-700 group-hover:text-emerald-700">{mo}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Metode Filter */}
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Berdasarkan Metode</p>
                                      <div className="space-y-2">
                                        {['Transfer', 'Cash'].map(metode => (
                                          <label key={metode} className="flex items-center gap-2 cursor-pointer group">
                                            <input 
                                              type="checkbox" 
                                              className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                              checked={selectedMetode.includes(metode)}
                                              onChange={(e) => {
                                                if (e.target.checked) setSelectedMetode([...selectedMetode, metode]);
                                                else setSelectedMetode(selectedMetode.filter(m => m !== metode));
                                              }}
                                            />
                                            <span className="text-xs font-medium text-slate-700 group-hover:text-emerald-700">{metode}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                              </div>
                            )}
                        </div>
                        {/* --------------------------------------------------------- */}

                        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-emerald-200">
                            <Download className="w-4 h-4" /> Export Data
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Tgl Pencairan</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Bulan / T.A</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Unit / Bidang</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-1/4">Program / Kegiatan</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Sumber Dana</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Metode</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Nominal</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Memuat Riwayat Pengajuan...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRiwayat.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <p className="text-slate-500 font-medium text-sm italic">Tidak ada riwayat pengajuan yang cocok dengan filter saat ini.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRiwayat.map((item) => (
                                    <tr key={item.itemId} className="hover:bg-slate-50/80 transition-colors group">
                                        {/* 1. Tgl Pencairan */}
                                        <td className="px-6 py-4 align-middle text-xs font-bold text-slate-600 whitespace-nowrap">
                                            {item.tanggal_pencairan || item.tanggal}
                                        </td>
                                        
                                        {/* 2. Bulan / T.A */}
                                        <td className="px-6 py-4 align-middle whitespace-nowrap">
                                            <p className="text-xs font-bold text-slate-800">{item.bulan || '-'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.tahun_ajaran || '-'}</p>
                                        </td>
 
                                        {/* 3. Unit / Bidang */}
                                        <td className="px-6 py-4 align-middle whitespace-nowrap">
                                            <p className="text-xs font-bold text-emerald-700">{item.unit}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.bidang || '-'}</p>
                                        </td>
 
                                        {/* 4. Program / Kegiatan */}
                                        <td className="px-6 py-4 align-middle">
                                            <p className="text-xs font-bold text-slate-800 leading-relaxed">{item.kegiatan || item.program}</p>
                                        </td>
 
                                        {/* 5. Sumber Dana */}
                                        <td className="px-6 py-4 align-middle whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-tighter">
                                                {item.sumber || 'Dana Yayasan'}
                                            </span>
                                        </td>

                                        {/* 5.5 Metode Pencairan */}
                                        <td className="px-6 py-4 align-middle text-center whitespace-nowrap">
                                            {item.metode_pencairan === 'Transfer' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-tight">
                                                    Transfer
                                                </span>
                                            ) : item.metode_pencairan === 'Cash' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-tight">
                                                    Cash
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-100">
                                                    -
                                                </span>
                                            )}
                                        </td>
 
                                        {/* 6. Nominal */}
                                        <td className="px-6 py-4 align-middle text-xs font-black text-slate-900 text-right whitespace-nowrap">
                                            Rp {Number(item.nominal || 0).toLocaleString('id-ID')}
                                        </td>

                                        {/* 7. Aksi */}
                                        <td className="px-6 py-4 align-middle text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleExportDocumentToExcel(item.id)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                                                    title="Ekspor Excel (RKA)"
                                                >
                                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Detail Riwayat">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                {userRole && [
                                                    'STAFF_UNIT', 
                                                    'STAFF_BIDANG', 
                                                    'BENDAHARA_UNIT', 
                                                    'BENDAHARA_JENJANG'
                                                ].includes(userRole) && (
                                                    <Link 
                                                        href={`/admin/realisasi/buat?itemId=${item.id}`}
                                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
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
        </div>
    );
}
