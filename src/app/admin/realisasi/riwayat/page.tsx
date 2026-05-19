'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    History, 
    Download, 
    Eye, 
    FileText, 
    FileSpreadsheet,
    Search, 
    Filter, 
    ArrowUpRight,
    CheckCircle2,
    Building2,
    Calendar,
    Wallet
} from 'lucide-react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { createClient } from '@/utils/supabase/client';

interface RiwayatDokumen {
    id: string;
    itemId: string;
    tanggal: string;
    pengaju: string;
    unit: string;
    bidang?: string;
    bulan?: string;
    tahun_ajaran?: string;
    kegiatan: string;
    program?: string;
    sumber: string;
    nominal: number;
    status: string;
}

export default function RiwayatDokumenPage() {
    const supabase = createClient();
    const [riwayatItems, setRiwayatItems] = useState<RiwayatDokumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Filter States
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [selectedSumber, setSelectedSumber] = useState<string[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

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

    // Fetch Completed LPJ items from Supabase
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
                    .eq('jenis', 'LPJ')
                    .eq('status', 'SELESAI')
                    .order('updated_at', { ascending: false });

                // If not Pusat/Admin/Pimpinan, filter by active unit
                if (role !== 'BENDAHARA_PUSAT' && role !== 'ADMINISTRATOR' && role !== 'PIMPINAN') {
                    query = query.eq('unit', activeUnit);
                }

                const { data, error } = await query;

                if (error) {
                    console.error("Error fetching LPJ riwayat:", error);
                } else if (data) {
                    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    const mapped: RiwayatDokumen[] = [];
                    data.forEach(doc => {
                        const items = doc.item_pengajuan || [];
                        items.forEach((it: any) => {
                            mapped.push({
                                id: doc.id,
                                itemId: it.id,
                                tanggal: doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                                bulan: monthNames[Number(doc.periode_bulan)] || String(doc.periode_bulan),
                                tahun_ajaran: doc.tahun_ajaran || `${doc.periode_tahun}/${Number(doc.periode_tahun) + 1}`,
                                unit: doc.unit || 'SDIT 1',
                                bidang: doc.bidang || 'Tanpa Bidang',
                                pengaju: doc.pembuat_email || doc.unit || 'Staf Pengaju',
                                kegiatan: it.judul_kegiatan || it.kegiatan || 'Realisasi Anggaran',
                                sumber: (() => {
                                    const splits = it.rincian_json?.fundingSplits || [];
                                    const subSplits = it.rincian_json?.subsidiSources || [];
                                    const sources = [...splits, ...subSplits]
                                        .filter((s: any) => s.source && s.nominal > 0)
                                        .map((s: any) => s.source);
                                    const uniqueSources = Array.from(new Set(sources));
                                    return uniqueSources.length > 0 ? uniqueSources.join(' / ') : (it.sumber_dana || 'Dana Yayasan');
                                })(),
                                nominal: it.nominal || 0,
                                status: doc.status
                            });
                        });
                    });
                    setRiwayatItems(mapped);
                }
            } catch (err) {
                console.error("Error loading LPJ riwayat page data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRiwayat();
    }, []);

    // Export LPJ Document details to Excel
    const handleExportDocumentToExcel = async (docId: string, itemId: string) => {
        // Fetch full LPJ Document and its items
        const { data: doc, error } = await supabase
            .from('dokumen_pengajuan')
            .select('*, item_pengajuan(*)')
            .eq('id', docId)
            .maybeSingle();

        if (error || !doc) {
            alert("Gagal mengunduh data realisasi LPJ: " + (error?.message || "Laporan tidak ditemukan"));
            return;
        }

        const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const bulanName = monthNames[Number(doc.periode_bulan)] || String(doc.periode_bulan);
        const tahunAjaranStr = doc.tahun_ajaran || `${doc.periode_tahun}/${Number(doc.periode_tahun) + 1}`;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('LPJ Realisasi');

        // Title
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'LAPORAN PERTANGGUNGJAWABAN REALISASI ANGGARAN (LPJ)';
        titleCell.font = { name: 'Times New Roman', size: 14, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Metadata
        worksheet.getRow(2).values = [
            'Unit / Jenjang:', doc.unit || '-',
            '',
            'Bidang / Dept:', doc.bidang || '-',
            '',
            'Bulan:', bulanName,
            '',
            'Tahun Ajaran:', tahunAjaranStr
        ];
        worksheet.getRow(2).font = { name: 'Times New Roman', size: 10 };
        ['A2', 'D2', 'G2', 'J2'].forEach(ref => {
            const cell = worksheet.getCell(ref);
            cell.font = { bold: true, name: 'Times New Roman' };
        });

        worksheet.addRow([]);

        // Table Headers
        const tableHeaders = ['No', 'Kegiatan / Program', 'Operasional', 'PIC', 'Waktu & Tempat', 'Sumber Dana', 'Nominal Realisasi (Rp)'];
        const headerRow = worksheet.addRow(tableHeaders);
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

        // Filter and write rows
        const targetItems = (doc.item_pengajuan || []).filter((it: any) => it.id === itemId);
        let grandTotal = 0;

        targetItems.forEach((row: any, idx: number) => {
            const nominal = Number(row.nominal) || 0;
            grandTotal += nominal;

            const timePlace = `${row.waktu || '-'} / ${row.tempat || '-'}`;
            const r = worksheet.addRow([
                idx + 1,
                row.judul_kegiatan || 'Realisasi Anggaran',
                row.kategori_coa || 'Lainnya',
                row.pic || '-',
                timePlace,
                row.sumber_dana || 'Dana Yayasan',
                nominal
            ]);
            r.getCell(7).numFmt = '"Rp "#,##0';
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

        worksheet.addRow([]);
        const totalRow = worksheet.addRow(['TOTAL REALISASI DICAIRKAN', '', '', '', '', '', grandTotal]);
        totalRow.getCell(1).font = { bold: true, size: 12, name: 'Times New Roman' };
        totalRow.getCell(7).font = { bold: true, size: 12, color: { argb: 'FF065F46' }, name: 'Times New Roman' };
        totalRow.getCell(7).numFmt = '"Rp "#,##0';

        worksheet.columns.forEach((col, i) => {
            if (i === 1) col.width = 35;
            else if (i === 4 || i === 5) col.width = 25;
            else col.width = 15;
        });

        // Tanda Tangan
        worksheet.addRow([]);
        worksheet.addRow([]);
        const signRow = worksheet.lastRow!.number + 1;
        worksheet.mergeCells(`B${signRow}:C${signRow}`);
        worksheet.getCell(`B${signRow}`).value = 'Bendahara Pusat,';
        worksheet.getCell(`B${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`B${signRow}`).alignment = { horizontal: 'center' };

        worksheet.mergeCells(`E${signRow}:F${signRow}`);
        worksheet.getCell(`E${signRow}`).value = 'Penerima Laporan,';
        worksheet.getCell(`E${signRow}`).font = { name: 'Times New Roman', bold: true };
        worksheet.getCell(`E${signRow}`).alignment = { horizontal: 'center' };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `LPJ_REALISASI_${doc.unit || 'Jenjang'}_${Date.now()}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    // Extract unique filter options
    const availableUnits = Array.from(new Set(riwayatItems.map(i => i.unit)));
    const availableSumber = Array.from(new Set(riwayatItems.map(i => i.sumber)));
    const availableMonths = Array.from(new Set(riwayatItems.map(i => {
        return i.bulan ? `${i.bulan} ${i.tahun_ajaran}` : i.tanggal;
    })));

    // Compute filtered items
    const filteredRiwayat = riwayatItems.filter(item => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
            item.kegiatan.toLowerCase().includes(q) || 
            item.pengaju.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            item.unit.toLowerCase().includes(q);
        
        const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(item.unit);
        const matchesSumber = selectedSumber.length === 0 || selectedSumber.includes(item.sumber);
        
        let matchesMonth = true;
        if (selectedMonths.length > 0) {
            const tMonth = item.bulan ? `${item.bulan} ${item.tahun_ajaran}` : item.tanggal;
            matchesMonth = selectedMonths.includes(tMonth);
        }
        
        return matchesSearch && matchesUnit && matchesSumber && matchesMonth;
    });

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2.5 rounded-xl text-white shadow-lg shadow-slate-100">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Riwayat Dokumen (LPJ)</h1>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
                    <div className="relative w-full lg:max-w-md group">
                        <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-bold transition-all" 
                            placeholder="Cari ID, kegiatan, unit, atau pengaju..."
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full lg:w-auto">
                        <div className="relative" ref={filterRef}>
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center justify-center gap-2 border text-[10px] font-black px-4 py-2.5 rounded-xl transition-all shadow-sm uppercase tracking-widest ${isFilterOpen || selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0 ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                            >
                                <Filter className="w-3.5 h-3.5" /> Filter
                                {(selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0) && (
                                    <span className="bg-emerald-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[8px] ml-1">
                                        {selectedUnits.length + selectedSumber.length + selectedMonths.length}
                                    </span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Filter Arsip</h4>
                                            {(selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0) && (
                                                <button 
                                                    onClick={() => { setSelectedUnits([]); setSelectedSumber([]); setSelectedMonths([]); }}
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
                                                    <Calendar className="w-3 h-3" /> Periode Bulan
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
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tgl Laporan Diterima</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Bulan / T.A</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Unit / Bidang</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Program / Kegiatan</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Sumber Dana</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Nominal</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Memuat Riwayat Laporan...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRiwayat.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center space-y-3">
                                        <div className="flex justify-center">
                                            <div className="bg-slate-50 p-4 rounded-full">
                                                <History className="w-12 h-12 text-slate-200" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tidak ada dokumen LPJ yang ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRiwayat.map((item) => (
                                    <tr key={item.itemId} className="hover:bg-slate-50/50 transition-colors group">
                                        {/* 1. Tanggal Laporan Diterima */}
                                        <td className="px-6 py-4 align-middle text-[11px] font-black text-slate-500 whitespace-nowrap tracking-tighter uppercase">
                                            {item.tanggal}
                                        </td>
                                        
                                        {/* 2. Bulan / T.A */}
                                        <td className="px-4 py-4 align-middle whitespace-nowrap">
                                            <p className="text-xs font-black text-slate-800 leading-none mb-1">{item.bulan || '-'}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">{item.tahun_ajaran || '-'}</p>
                                        </td>

                                        {/* 3. Unit / Bidang */}
                                        <td className="px-4 py-4 align-middle whitespace-nowrap">
                                            <p className="text-xs font-black text-emerald-700 leading-none mb-1">{item.unit}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">{item.bidang || '-'}</p>
                                        </td>

                                        {/* 4. Program / Kegiatan */}
                                        <td className="px-4 py-4 align-middle">
                                            <p className="text-xs font-black text-slate-700 leading-tight mb-1">{item.kegiatan || item.program}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.id}</p>
                                        </td>

                                        {/* 5. Sumber Dana */}
                                        <td className="px-4 py-4 align-middle whitespace-nowrap">
                                            <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg border border-slate-200 uppercase tracking-tighter">
                                                {item.sumber}
                                            </span>
                                        </td>

                                        {/* 6. Nominal */}
                                        <td className="px-4 py-4 align-middle text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end">
                                                <p className="text-xs font-black text-slate-800 italic tracking-tighter">Rp {Number(item.nominal || 0).toLocaleString('id-ID')}</p>
                                                <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                                    <CheckCircle2 className="w-2.5 h-2.5" /> SELESAI
                                                </span>
                                            </div>
                                        </td>

                                        {/* 7. Aksi */}
                                        <td className="px-4 py-4 align-middle text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button 
                                                    onClick={() => handleExportDocumentToExcel(item.id, item.itemId)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" 
                                                    title="Ekspor Excel (LPJ)"
                                                >
                                                    <FileSpreadsheet className="w-4.5 h-4.5" />
                                                </button>
                                                <button className="p-2 text-slate-300 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all" title="Detail Audit">
                                                    <ArrowUpRight className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex justify-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {loading ? "Memproses..." : `Menampilkan ${filteredRiwayat.length} Dokumen LPJ Terverifikasi`}
                    </p>
                </div>
            </div>
        </div>
    );
}
