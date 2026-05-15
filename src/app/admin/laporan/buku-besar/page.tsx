'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { 
    BarChart3, 
    Download, 
    Search, 
    Filter, 
    ArrowUpRight, 
    Calendar,
    Building2,
    BookOpen,
    ArrowDownLeft,
    ArrowUpRight as ArrowUpRightIcon,
    Wallet,
    Info,
    ChevronDown,
    FileText
} from 'lucide-react';

interface LedgerEntry {
    id: string;
    tanggal: string;
    keterangan: string;
    unit: string;
    coa: string;
    tipe: 'DEBET' | 'KREDIT';
    nominal: number;
    saldo: number;
    refId: string;
}

const MOCK_LEDGER: LedgerEntry[] = [];

export default function BukuBesarPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [filterCOA, setFilterCOA] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Close filter when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredLedger = useMemo(() => {
        return MOCK_LEDGER.filter(item => {
            const matchesSearch = item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.refId.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesUnit = filterUnit === '' || item.unit === filterUnit;
            const matchesCOA = filterCOA === '' || item.coa === filterCOA;
            return matchesSearch && matchesUnit && matchesCOA;
        });
    }, [searchQuery, filterUnit, filterCOA]);

    const stats = useMemo(() => {
        const totalDebet = filteredLedger.filter(i => i.tipe === 'DEBET').reduce((acc, curr) => acc + curr.nominal, 0);
        const totalKredit = filteredLedger.filter(i => i.tipe === 'KREDIT').reduce((acc, curr) => acc + curr.nominal, 0);
        return { totalDebet, totalKredit };
    }, [filteredLedger]);

    const uniqueUnits = Array.from(new Set(MOCK_LEDGER.map(i => i.unit)));
    const uniqueCOAs = Array.from(new Set(MOCK_LEDGER.map(i => i.coa)));

    return (
        <div className="p-3 md:p-6 space-y-4 md:space-y-6 bg-slate-50/50 min-h-screen">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-3 rounded-[1.25rem] text-white shadow-xl shadow-slate-200">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none mb-1">Laporan Buku Besar</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Konsolidasi Jurnal & Mutasi Keuangan Real-time</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-5 py-3 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">
                        <Calendar className="w-4 h-4" /> Feb 2026
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white text-[10px] font-black px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all uppercase tracking-widest shadow-xl shadow-emerald-100">
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
                    <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <ArrowDownLeft className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Pemasukan (Debet)</p>
                        <p className="text-xl font-black text-slate-800 tracking-tighter italic">Rp {stats.totalDebet.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-rose-200 transition-all">
                    <div className="bg-rose-50 p-3.5 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                        <ArrowUpRightIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Pengeluaran (Kredit)</p>
                        <p className="text-xl font-black text-slate-800 tracking-tighter italic text-rose-600">Rp {stats.totalKredit.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-[2rem] shadow-xl shadow-slate-200 flex items-center gap-4 border border-slate-800">
                    <div className="bg-white/10 p-3.5 rounded-2xl text-emerald-400">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Saldo Akhir Kumulatif</p>
                        <p className="text-xl font-black text-white tracking-tighter italic">Rp {(stats.totalDebet - stats.totalKredit).toLocaleString('id-ID')}</p>
                    </div>
                </div>
            </div>

            {/* Unified Toolbar */}
            <div className="bg-white p-2.5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                <div className="flex flex-col lg:flex-row gap-3 flex-1 lg:max-w-4xl">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Cari transaksi, keterangan, atau No. Ref..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    
                    <div className="flex gap-2 relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 border px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${isFilterOpen || filterUnit || filterCOA ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter className="w-4 h-4" /> Filter Laporan
                        </button>

                        {isFilterOpen && (
                            <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Kriteria Laporan</h3>
                                        {(filterUnit || filterCOA) && (
                                            <button 
                                                onClick={() => { setFilterUnit(''); setFilterCOA(''); }}
                                                className="text-[9px] font-black text-rose-500 hover:underline uppercase"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> Filter Unit Kerja
                                        </label>
                                        <select 
                                            value={filterUnit}
                                            onChange={(e) => setFilterUnit(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Semua Unit</option>
                                            {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Info className="w-3 h-3" /> Kategori Akun (COA)
                                        </label>
                                        <select 
                                            value={filterCOA}
                                            onChange={(e) => setFilterCOA(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Semua Akun</option>
                                            {uniqueCOAs.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <button 
                                        onClick={() => setIsFilterOpen(false)}
                                        className="w-full bg-slate-900 text-white text-[10px] font-black py-3.5 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-widest"
                                    >
                                        Terapkan Filter
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 px-6 border-l border-slate-100">
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Posting</p>
                        <div className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 leading-none">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Up-to-date
                        </div>
                    </div>
                </div>
            </div>

            {/* High Density Ledger Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Tgl & ID</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/4">Keterangan Transaksi</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit Satuan</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Akun (COA)</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Debet (Rp)</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Kredit (Rp)</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right bg-slate-50/50">Saldo (Rp)</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Ref</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLedger.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <FileText className="w-16 h-16" />
                                            <p className="text-xs font-black uppercase tracking-[0.3em]">Tidak ada data entri</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLedger.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] font-black text-slate-600 leading-none mb-1.5 uppercase tracking-tighter">{item.tanggal}</p>
                                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{item.id}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-[11px] font-black text-slate-800 leading-tight">{item.keterangan}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter bg-slate-100 px-2 py-1 rounded-lg inline-block">{item.unit}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">{item.coa}</p>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <p className={`text-[11px] font-black ${item.tipe === 'DEBET' ? 'text-emerald-600' : 'text-slate-200'}`}>
                                                {item.tipe === 'DEBET' ? item.nominal.toLocaleString('id-ID') : '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <p className={`text-[11px] font-black ${item.tipe === 'KREDIT' ? 'text-rose-600' : 'text-slate-200'}`}>
                                                {item.tipe === 'KREDIT' ? item.nominal.toLocaleString('id-ID') : '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-right bg-slate-50/30">
                                            <p className="text-[11px] font-black text-slate-900 italic tracking-tighter">
                                                {item.saldo.toLocaleString('id-ID')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-2 text-slate-300 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-xl transition-all" title="Lihat Dokumen Referensi">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Menampilkan {filteredLedger.length} Entri Jurnal Buku Besar</p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Mutasi: {(stats.totalDebet + stats.totalKredit).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
