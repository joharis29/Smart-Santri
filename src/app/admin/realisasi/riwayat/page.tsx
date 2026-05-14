'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    History, 
    Download, 
    Eye, 
    FileText, 
    Search, 
    Filter, 
    ArrowUpRight,
    CheckCircle2,
    Building2,
    Calendar,
    Wallet
} from 'lucide-react';
import Link from 'next/link';

interface RiwayatDokumen {
    id: string;
    tanggal: string;
    pengaju: string;
    unit: string;
    kegiatan: string;
    sumber: string;
    nominal: number;
    status: 'SELESAI';
}

export default function RiwayatDokumenPage() {
    // Simulasi data LPJ "SELESAI"
    const [riwayatItems, setRiwayatItems] = useState<RiwayatDokumen[]>([
        { id: 'LPJ-S-001', tanggal: '14 Feb 2026', pengaju: 'Staf Kebersihan', unit: 'SDIT 1', kegiatan: 'Beli Sapu & Alat Pel', sumber: 'Kas Operasional', nominal: 160000, status: 'SELESAI' },
        { id: 'LPJ-S-002', tanggal: '12 Feb 2026', pengaju: 'Staf Kurikulum', unit: 'SMPIT 1', kegiatan: 'Beli Peta Dunia 3D', sumber: 'Dana BOS', nominal: 750000, status: 'SELESAI' },
        { id: 'LPJ-S-003', tanggal: '10 Feb 2026', pengaju: 'Staf Keamanan', unit: 'Yayasan', kegiatan: 'Service CCTV Utama', sumber: 'Kas Internal', nominal: 1200000, status: 'SELESAI' },
        { id: 'LPJ-S-004', tanggal: '08 Feb 2026', pengaju: 'Staf Dapur', unit: 'Dapur Asrama Putra', kegiatan: 'Belanja Beras Mingguan', sumber: 'Kas Internal', nominal: 8500000, status: 'SELESAI' },
        { id: 'LPJ-S-005', tanggal: '05 Feb 2026', pengaju: 'Staf Asrama', unit: 'Asrama Putri', kegiatan: 'Penggantian Lampu Kamar', sumber: 'Dana Yayasan', nominal: 450000, status: 'SELESAI' },
    ]);

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

    // Extract unique filter options
    const availableUnits = Array.from(new Set(riwayatItems.map(i => i.unit)));
    const availableSumber = Array.from(new Set(riwayatItems.map(i => i.sumber)));
    const availableMonths = Array.from(new Set(riwayatItems.map(i => {
        const parts = i.tanggal.split(' ');
        return parts.length === 3 ? `${parts[1]} ${parts[2]}` : i.tanggal;
    })));

    // Compute filtered items
    const filteredRiwayat = riwayatItems.filter(item => {
        const matchesSearch = item.kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.pengaju.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.id.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(item.unit);
        const matchesSumber = selectedSumber.length === 0 || selectedSumber.includes(item.sumber);
        
        let matchesMonth = true;
        if (selectedMonths.length > 0) {
            const parts = item.tanggal.split(' ');
            const tMonth = parts.length === 3 ? `${parts[1]} ${parts[2]}` : item.tanggal;
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
                        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Riwayat Dokumen</h1>
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
                            placeholder="Cari ID, kegiatan, atau pengaju..."
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
                                                    {availableUnits.map(unit => (
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
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Sumber Dana Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Wallet className="w-3 h-3" /> Sumber Dana
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableSumber.map(sumber => (
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
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Month Filter */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Periode Bulan
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {availableMonths.map(mo => (
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
                                                    ))}
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

                        <button className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-5 py-2.5 rounded-xl transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest active:scale-95">
                            <Download className="w-3.5 h-3.5" /> Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tgl Selesai</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Pengaju & Unit</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Kegiatan (ID Dokumen)</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Sumber Dana</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Nominal</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRiwayat.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center space-y-3">
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
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 align-middle text-[11px] font-black text-slate-500 whitespace-nowrap tracking-tighter uppercase">{item.tanggal}</td>
                                        <td className="px-4 py-4 align-middle whitespace-nowrap">
                                            <p className="text-xs font-black text-slate-800 leading-none mb-1">{item.pengaju}</p>
                                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest leading-none">{item.unit}</p>
                                        </td>
                                        <td className="px-4 py-4 align-middle">
                                            <p className="text-xs font-black text-slate-700 leading-tight mb-1">{item.kegiatan}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.id}</p>
                                        </td>
                                        <td className="px-4 py-4 align-middle text-center">
                                            <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg border border-slate-200 uppercase tracking-tighter">
                                                {item.sumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 align-middle text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end">
                                                <p className="text-xs font-black text-slate-800 italic tracking-tighter">Rp {item.nominal.toLocaleString('id-ID')}</p>
                                                <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                                    <CheckCircle2 className="w-2.5 h-2.5" /> SELESAI
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 align-middle text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Lihat LPJ">
                                                    <FileText className="w-4.5 h-4.5" />
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
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Menampilkan {filteredRiwayat.length} Dokumen LPJ Terverifikasi</p>
                </div>
            </div>
        </div>
    );
}
