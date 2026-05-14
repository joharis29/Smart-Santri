'use client';

import React, { useState } from 'react';
import { 
    Plus, 
    Search, 
    Filter, 
    FileText, 
    FileCheck, 
    Clock, 
    AlertCircle, 
    MoreVertical, 
    FileEdit, 
    Trash2, 
    Send,
    LayoutGrid,
    History,
    ChevronDown,
    Building2,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

// Mock Data
const MOCK_RKA_DRAFTS = [
    { id: 'DRF-001', type: 'RKA', name: 'Kurikulum', unit: 'SDIT 1', period: 'Mei 2025', budget: 2500000, items: 4, status: 'Drafting', lastUpdate: '2 jam yang lalu' },
    { id: 'DRF-002', type: 'RKA', name: 'Sarpras', unit: 'SDIT 1', period: 'Juni 2025', budget: 12500000, items: 12, status: 'Drafting', lastUpdate: 'Kemarin' },
    { id: 'DRF-003', type: 'RKA', name: 'Kesiswaan', unit: 'SDIT 1', period: 'Mei 2025', budget: 1500000, items: 3, status: 'Revisi', note: 'Nota untuk item konsumsi kurang jelas.', lastUpdate: '3 jam yang lalu' },
];

const MOCK_LPJ_DRAFTS = [
    { id: 'LPJ-001', type: 'LPJ', name: 'Beli Sapu & Alat Pel', unit: 'SDIT 1', period: 'Mei 2025', realisasi: 160000, items: 1, status: 'Drafting', lastUpdate: '10 menit yang lalu' },
    { id: 'LPJ-002', type: 'LPJ', name: 'Konsumsi Rapat', unit: 'SDIT 1', period: 'Mei 2025', realisasi: 550000, items: 1, status: 'Revisi', note: 'Tolong jelaskan rincian kelebihan belanja di narasi.', lastUpdate: '1 jam yang lalu' },
];

export default function DraftSayaPage() {
    const [activeTab, setActiveTab] = useState<'RKA' | 'LPJ'>('RKA');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleEdit = (id: string, type: string) => {
        const path = type === 'RKA' ? `/admin/pengajuan/buat?id=${id}` : `/admin/realisasi/buat?id=${id}`;
        window.location.href = path;
    };

    const handleKirim = (id: string) => {
        if (confirm('Kirim draf ini ke Bendahara Unit untuk diperiksa?')) {
            alert(`Berhasil dikirim ke Bendahara!`);
            window.location.href = '/admin/pengajuan/rekap';
        }
    };

    const currentDrafts = activeTab === 'RKA' ? MOCK_RKA_DRAFTS : MOCK_LPJ_DRAFTS;

    return (
        <div className="p-4 md:p-6 space-y-4">
            
            {/* Header Section - Compact */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-100">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase italic leading-none mb-1">Draft Saya</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Kelola draf {activeTab}</p>
                    </div>
                </div>
                <Link 
                    href={activeTab === 'RKA' ? "/admin/pengajuan/buat" : "/admin/realisasi/buat"}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-95 text-[10px] uppercase tracking-wider"
                >
                    <Plus className="w-4 h-4" /> 
                    <span>Buat Baru</span>
                </Link>
            </div>

            {/* Banner Informasi - Ultra Compact */}
            <div className="bg-amber-50 border border-amber-200/50 rounded-2xl px-4 py-2 flex items-center gap-3">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <p className="text-[10px] font-bold text-amber-900 leading-none">
                    Data draf bersifat <span className="underline decoration-1">Private</span>. Belum terlihat oleh Bendahara Unit.
                </p>
            </div>

            {/* Toolbar: Tabs, Search, & Filter */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                {/* Tabs */}
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-full lg:w-auto">
                    <button 
                        onClick={() => setActiveTab('RKA')}
                        className={`flex-1 lg:flex-none px-5 py-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'RKA' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText className="w-3.5 h-3.5" /> RKA
                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">{MOCK_RKA_DRAFTS.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('LPJ')}
                        className={`flex-1 lg:flex-none px-5 py-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'LPJ' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ClipboardCheck className="w-3.5 h-3.5" /> LPJ
                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">{MOCK_LPJ_DRAFTS.length}</span>
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex gap-2 flex-1 lg:max-w-md">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={`Cari draf...`}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <button className="bg-white border border-slate-200 p-2 rounded-xl hover:bg-slate-50 text-slate-600 transition-all shadow-sm">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Ultra Compact Table Layout */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Info Draf</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Unit & Periode</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Opsi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentDrafts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                         <FileText className="w-12 h-12 text-slate-100 mx-auto mb-2" />
                                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada draf {activeTab}</p>
                                    </td>
                                </tr>
                            ) : (
                                currentDrafts.map((draft) => (
                                    <React.Fragment key={draft.id}>
                                        <tr className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${draft.type === 'RKA' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {draft.type === 'RKA' ? <FileText className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 leading-tight mb-0.5">{draft.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{draft.id} • {draft.lastUpdate}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <p className="text-[11px] font-black text-slate-700 leading-tight mb-0.5">{draft.unit}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{draft.period}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <p className="text-xs font-black text-slate-800 italic tracking-tighter leading-tight mb-0.5">Rp {(draft.type === 'RKA' ? (draft as any).budget : (draft as any).realisasi).toLocaleString('id-ID')}</p>
                                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none">{draft.items} Items</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${draft.status === 'Revisi' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {draft.status === 'Revisi' ? 'BUTUH REVISI' : 'DRAFTING'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => handleEdit(draft.id, draft.type)} className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit"><FileEdit className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleKirim(draft.id)} className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Kirim ke Bendahara"><Send className="w-3.5 h-3.5" /></button>
                                                    <button className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                        {draft.status === 'Revisi' && (
                                            <tr className="bg-rose-50/20">
                                                <td colSpan={5} className="px-6 py-2 border-t border-rose-100/50">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="w-3 h-3 text-rose-500" />
                                                        <p className="text-[10px] font-bold text-rose-600 italic">Catatan: {draft.note}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const ClipboardCheck = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
    </svg>
);
