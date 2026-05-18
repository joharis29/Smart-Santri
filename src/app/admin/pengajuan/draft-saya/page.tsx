'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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

import { createClient } from '@/utils/supabase/client';
import { submitPengajuan, deletePengajuan } from '../buat/actions';

interface Draft {
    id: string;      // Display ID (Truncated)
    realId: string;  // Original UUID
    type: string;
    name: string;    // Program Name
    bidang: string;
    period: string;
    budget?: number;
    fundingSources: string[];
    items: number;
    status: string;
    lastUpdate: string;
    note?: string;
}

export default function DraftSayaPage() {
    const supabase = createClient();
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'RKA' | 'LPJ'>('RKA');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterBidang, setFilterBidang] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const filterRef = useRef<HTMLDivElement>(null);

    // Fetch real data from Supabase
    useEffect(() => {
        const fetchDrafts = async () => {
            setLoading(true);
            console.log("Fetching drafts from Supabase...");
            
            // 1. Get current authenticated user
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) {
                setLoading(false);
                return;
            }

            // 2. Fetch drafts filtered by user's pembuat_id
            const { data, error } = await supabase
                .from('dokumen_pengajuan')
                .select(`
                    id, 
                    unit,
                    bidang,
                    periode_bulan, 
                    periode_tahun, 
                    status, 
                    created_at,
                    catatan_revisi,
                    jenis,
                    item_pengajuan(judul_kegiatan, nominal, rincian_json)
                `)
                .eq('pembuat_id', user.id)
                .in('status', ['DRAFT', 'REVISI', 'MENUNGGU_VERIFIKASI'])
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Supabase Error:", error);
                alert("Gagal mengambil data: " + error.message);
            } else if (data) {
                console.log("Data received:", data);
                const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                
                const mapped: Draft[] = data.map(d => {
                    const items = Array.isArray(d.item_pengajuan) ? d.item_pengajuan : [];
                    const total = items.reduce((sum: number, it: any) => sum + (it.nominal || 0), 0);
                    const itemCount = items.length;
                    
                    const monthName = monthNames[Number(d.periode_bulan)] || d.periode_bulan;
                    
                    // Extract Program Name
                    const firstName = items[0]?.judul_kegiatan || (d.status === 'REVISI' ? 'Revisi Pengajuan' : 'Draft Pengajuan');
                    const displayName = itemCount > 1 ? `${firstName} (+${itemCount - 1})` : firstName;

                    // Extract unique funding sources
                    const sources = new Set<string>();
                    items.forEach((it: any) => {
                        const rincian = it.rincian_json || {};
                        const splits = rincian.fundingSplits || [];
                        splits.forEach((s: any) => {
                            if (s.source && s.nominal > 0) sources.add(s.source);
                        });
                    });

                    return {
                        id: String(d.id).slice(0, 8).toUpperCase(),
                        realId: d.id,
                        type: d.jenis || 'RKA', 
                        name: displayName,
                        bidang: d.bidang || 'Tanpa Bidang', 
                        period: `${monthName} ${d.periode_tahun}`,
                        budget: total,
                        fundingSources: Array.from(sources),
                        items: itemCount,
                        status: (d.status === 'REVISI' || d.catatan_revisi) ? 'REVISI' : 
                                d.status === 'MENUNGGU_VERIFIKASI' ? 'Verifikasi Unit' : 
                                'Drafting',
                        lastUpdate: d.created_at ? new Date(d.created_at).toLocaleDateString('id-ID') : '-',
                        note: d.catatan_revisi
                    };
                });
                setDrafts(mapped);
            }
            setLoading(false);
        };

        fetchDrafts();
    }, []);

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

    const handleEdit = (realId: string, type: string) => {
        const path = type === 'RKA' ? `/admin/pengajuan/buat?id=${realId}` : `/admin/realisasi/buat?id=${realId}`;
        window.location.href = path;
    };

    const handleKirim = async (realId: string) => {
        if (!confirm('Kirim draf ini ke Bendahara sekarang?')) return;
        
        const res = await submitPengajuan(realId);
        if (res.success) {
            alert('Draf berhasil dikirim!');
            setDrafts(prev => prev.filter(d => d.realId !== realId));
        } else {
            alert('Gagal mengirim draf: ' + res.error);
        }
    };

    const handleDelete = async (realId: string) => {
        if (!confirm('Hapus draf ini secara permanen?')) return;
        
        const res = await deletePengajuan(realId);
        if (res.success) {
            alert('Draf berhasil dihapus.');
            setDrafts(prev => prev.filter(d => d.realId !== realId));
        } else {
            alert('Gagal menghapus draf: ' + res.error);
        }
    };

    const currentDrafts = useMemo(() => {
        return drafts.filter((draft: Draft) => {
            if (draft.type !== activeTab) return false;
            const matchesSearch = draft.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                draft.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesBidang = filterBidang === '' || draft.bidang === filterBidang;
            const matchesStatus = filterStatus === '' || draft.status === filterStatus;
            return matchesSearch && matchesBidang && matchesStatus;
        });
    }, [activeTab, searchQuery, filterBidang, filterStatus, drafts]);

    return (
        <div className="p-3 md:p-4 space-y-3">
            
            {/* Header Section - Ultra Compact */}
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-100">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none mb-1">Draft Saya</h1>
                    </div>
                </div>

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
                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">
                            {drafts.filter(d => d.type === 'RKA').length}
                        </span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('LPJ')}
                        className={`flex-1 lg:flex-none px-5 py-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'LPJ' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ClipboardCheck className="w-3.5 h-3.5" /> LPJ
                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">
                            {drafts.filter(d => d.type === 'LPJ').length}
                        </span>
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex gap-2 flex-1 lg:max-w-md">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={`Cari draf ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`p-2 rounded-xl border transition-all shadow-sm ${isFilterOpen || filterBidang || filterStatus ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Filter Lanjutan</h3>
                                        {(filterBidang || filterStatus) && (
                                            <button 
                                                onClick={() => { setFilterBidang(''); setFilterStatus(''); }}
                                                className="text-[9px] font-bold text-rose-500 hover:underline"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> Filter Bidang
                                        </label>
                                        <select 
                                            value={filterBidang}
                                            onChange={(e) => setFilterBidang(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Semua Bidang</option>
                                            <option value="Kurikulum">Kurikulum</option>
                                            <option value="Kesiswaan">Kesiswaan</option>
                                            <option value="Sarpras">Sarpras</option>
                                            <option value="Humas">Humas</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <History className="w-3 h-3" /> Status Draf
                                        </label>
                                        <select 
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Semua Status</option>
                                            <option value="Drafting">Drafting</option>
                                            <option value="Revisi">Butuh Revisi</option>
                                        </select>
                                    </div>

                                    <button 
                                        onClick={() => setIsFilterOpen(false)}
                                        className="w-full bg-emerald-600 text-white text-[10px] font-black py-2 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest"
                                    >
                                        Terapkan Filter
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ultra Compact Table Layout */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Program/ Kegiatan</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Bulan & Periode</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sumber Dana</th>
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
                                currentDrafts.map((draft: Draft) => (
                                    <React.Fragment key={draft.id}>
                                        <tr className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${draft.status === 'REVISI' ? 'bg-rose-50' : 'bg-orange-50'}`}>
                                                        <FileText className={`w-4 h-4 ${draft.status === 'REVISI' ? 'text-rose-500' : 'text-orange-500'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-700">{draft.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">{draft.id} • {draft.lastUpdate}</div>
                                                    </div>
                                                </div>
                                                {draft.status === 'REVISI' && draft.note && (
                                                    <div className="mt-2 ml-10 p-2 bg-rose-50 border border-rose-100 rounded-lg">
                                                        <div className="flex items-start gap-1.5">
                                                            <AlertCircle className="w-3 h-3 text-rose-500 mt-0.5" />
                                                            <p className="text-[10px] font-bold text-rose-600 leading-tight">
                                                                CATATAN BENDAHARA: <span className="font-medium text-rose-500 italic">"{draft.note}"</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <p className="text-[11px] font-black text-slate-700 leading-tight mb-0.5">{draft.period}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{draft.bidang}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {(draft.fundingSources?.length ?? 0) > 0 ? (
                                                        draft.fundingSources?.map(s => (
                                                            <span key={s} className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-emerald-100 uppercase">{s}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] text-slate-300 italic">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <p className="text-xs font-black text-slate-800 italic">Rp {draft.budget?.toLocaleString('id-ID')}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{draft.items} Items</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                                    draft.status === 'REVISI' 
                                                    ? 'bg-rose-100 text-rose-600' 
                                                    : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                    {draft.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => handleEdit(draft.realId, draft.type)} className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit"><FileEdit className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleKirim(draft.realId)} className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Kirim ke Bendahara"><Send className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDelete(draft.realId)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
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
