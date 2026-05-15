'use client';

import { useState, useEffect, useRef } from 'react';
import { ClipboardCheck, Download, Eye, FileText, Search, Filter, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function RiwayatPengajuanPage() {
    // Real Data (Empty for production)
    const [riwayatItems, setRiwayatItems] = useState<any[]>([]);

    // Filter States
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
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

    // Extract unique filter options dynamically
    const availableUnits = Array.from(new Set(riwayatItems.map(i => i.unit)));
    const availableSumber = Array.from(new Set(riwayatItems.map(i => i.sumber)));
    const availableMonths = Array.from(new Set(riwayatItems.map(i => {
        const parts = i.tanggal.split(' ');
        return parts.length === 3 ? `${parts[1]} ${parts[2]}` : i.tanggal;
    })));

    // Compute filtered items
    const filteredRiwayat = riwayatItems.filter(item => {
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
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full lg:w-auto">
                        {/* -------------------- FILTER DROPDOWN -------------------- */}
                        <div className="relative" ref={filterRef}>
                            <button 
                              onClick={() => setIsFilterOpen(!isFilterOpen)}
                              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 border border-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm ${selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
                            >
                                <Filter className="w-4 h-4" /> Filter
                                {(selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0) && (
                                    <span className="text-[10px] font-bold bg-emerald-600 text-white w-4 h-4 flex items-center justify-center rounded-full leading-none ml-1">
                                        {selectedUnits.length + selectedSumber.length + selectedMonths.length}
                                    </span>
                                )}
                            </button>

                            {isFilterOpen && (
                              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in slide-in-from-top-2">
                                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Filter Data</h4>
                                    {(selectedUnits.length > 0 || selectedSumber.length > 0 || selectedMonths.length > 0) && (
                                      <button 
                                        onClick={() => { setSelectedUnits([]); setSelectedSumber([]); setSelectedMonths([]); }}
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
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Tgl Pencairan</th>
                                <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">Pengaju & Unit</th>
                                <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-1/3">Kegiatan (Sumber)</th>
                                <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Nominal</th>
                                <th className="px-6 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRiwayat.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <p className="text-slate-500 font-medium text-sm">Tidak ada riwayat pengajuan yang cocok dengan filter saat ini.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRiwayat.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-3 align-middle text-xs font-bold text-slate-600 whitespace-nowrap">{item.tanggal}</td>
                                        <td className="px-6 py-3 align-middle whitespace-nowrap">
                                            <p className="text-xs font-bold text-slate-800">{item.pengaju}</p>
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{item.unit}</p>
                                        </td>
                                        <td className="px-6 py-3 align-middle">
                                            <p className="text-xs font-bold text-slate-800">{item.kegiatan}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{item.sumber}</p>
                                        </td>
                                        <td className="px-6 py-3 align-middle text-center whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200/60">
                                                <ClipboardCheck className="w-3 h-3" /> SUDAH DITERIMA
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 align-middle text-xs font-extrabold text-slate-800 text-right whitespace-nowrap">
                                            Rp {item.nominal.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-3 align-middle text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Lihat Dokumen">
                                                    <FileText className="w-3.5 h-3.5" />
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Detail Riwayat">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <Link 
                                                    href={`/admin/realisasi/buat?itemId=${item.id}`}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                                                    title="Buat Laporan Realisasi"
                                                >
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                </Link>
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
