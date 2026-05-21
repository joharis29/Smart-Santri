'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    CheckSquare, 
    Send, 
    XCircle, 
    FileEdit, 
    Filter, 
    Download, 
    ClipboardCheck, 
    FileText, 
    ChevronDown, 
    Info,
    Search,
    AlertCircle,
    User,
    ArrowUpRight,
    X
} from 'lucide-react';

import { createClient } from '@/utils/supabase/client';

import { revisiPengajuan } from '../buat/actions';
import { forwardPengajuanToKepala } from './actions';
import { notifyKepalaForwarded } from '../buat/actions';

export default function RekapitulasiDraftPage() {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'RKA' | 'LPJ'>('RKA');
    const [rkaQueue, setRkaQueue] = useState<any[]>([]);
    const [lpjQueue, setLpjQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBidang, setSelectedBidang] = useState<string[]>([]);
    const [selectedSumber, setSelectedSumber] = useState<string[]>([]);
    const [selectedBulan, setSelectedBulan] = useState<string[]>([]);
    const [selectedTahun, setSelectedTahun] = useState<string[]>([]);

    // Fetch real data from Supabase
    useEffect(() => {
        const fetchRekap = async () => {
            setLoading(true);
            // Fetch items joined with their document status
            const { data, error } = await supabase
                .from('item_pengajuan')
                .select(`
                    *,
                    dokumen_pengajuan!inner(id, unit, bidang, periode_bulan, periode_tahun, created_at, catatan_revisi)
                `)
                .eq('dokumen_pengajuan.status', 'REKAP_BENDAHARA')
                .order('created_at', { ascending: false });

            if (!error && data) {
                const rka: any[] = [];
                const lpj: any[] = [];

                data.forEach(item => {
                    const mapped = {
                        id: item.id,
                        dokumenId: (item.dokumen_pengajuan as any)?.id,
                        pengaju: 'Staf Unit',
                        unit: (item.dokumen_pengajuan as any)?.unit || 'Tanpa Unit',
                        bidang: (item.dokumen_pengajuan as any)?.bidang || 'Tanpa Bidang', 
                        kegiatan: item.judul_kegiatan,
                        coa: item.kategori_coa,
                        sumber: (() => {
                            const splits = item.rincian_json?.fundingSplits || [];
                            const sources = splits
                                .filter((s: any) => s.source && s.nominal > 0)
                                .map((s: any) => s.source);
                            return sources.length > 0 ? sources.join(' & ') : (item.sumber_dana || 'Dana BOS');
                        })(),
                        nominal: item.nominal,
                        isRevisi: !!(item.dokumen_pengajuan as any)?.catatan_revisi,
                        lastNote: (item.dokumen_pengajuan as any)?.catatan_revisi,
                        rincian: item.rincian_json,
                        pic: item.pic || '-',
                        tempat: item.tempat || '-',
                        waktu: item.waktu || '-',
                        sasaran: item.sasaran || '-',
                        selected: false,
                        type: 'RKA', // Default
                        bulan: (() => {
                            const m = (item.dokumen_pengajuan as any)?.periode_bulan;
                            const monthNames: Record<number, string> = {
                                1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
                                7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
                            };
                            return monthNames[Number(m)] || String(m || 'Januari');
                        })(),
                        tahunAjaran: (item.dokumen_pengajuan as any)?.periode_tahun || '2025/2026'
                    };

                    if (mapped.type === 'RKA') rka.push(mapped);
                    else lpj.push(mapped);
                });

                setRkaQueue(rka);
                setLpjQueue(lpj);
            }
            setLoading(false);
        };

        fetchRekap();
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

    const activeQueue = activeTab === 'RKA' ? rkaQueue : lpjQueue;
    const setActiveQueue = activeTab === 'RKA' ? setRkaQueue : setLpjQueue;

    // Dynamic Filter Options Sourced from activeQueue
    const availableBidang = Array.from(new Set(activeQueue.map((i: any) => i.bidang).filter(Boolean)));
    const availableSumber = Array.from(new Set(
        activeQueue.flatMap((i: any) => {
            if (!i.sumber) return [];
            return i.sumber.split('&').map((s: string) => s.trim());
        }).filter(Boolean)
    ));
    const availableBulan = Array.from(new Set(activeQueue.map((i: any) => i.bulan).filter(Boolean)));
    const availableTahun = Array.from(new Set(activeQueue.map((i: any) => i.tahunAjaran).filter(Boolean)));

    // Filter Logic
    const filteredItems = activeQueue.filter(item => {
        const matchesSearch = item.pengaju.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.bidang.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesBidang = selectedBidang.length === 0 || selectedBidang.includes(item.bidang);
        
        const matchesSumber = selectedSumber.length === 0 || (() => {
            const itemSources = item.sumber.split('&').map((s: string) => s.trim());
            return selectedSumber.some(s => itemSources.includes(s));
        })();

        const matchesBulan = selectedBulan.length === 0 || selectedBulan.includes(item.bulan);
        const matchesTahun = selectedTahun.length === 0 || selectedTahun.includes(item.tahunAjaran);

        return matchesSearch && matchesBidang && matchesSumber && matchesBulan && matchesTahun;
    });

    const totalSelectedNominal = filteredItems.filter(i => i.selected).reduce((acc, curr) => acc + curr.nominal, 0);
    const totalSelectedItems = filteredItems.filter(i => i.selected).length;

    // Rejection Logic
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [catatanRevisi, setCatatanRevisi] = useState('');

    // Detail Modal Logic
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<any>(null);

    const handleOpenDetail = (item: any) => {
        setSelectedDetail(item);
        setIsDetailModalOpen(true);
    };

    const handleReject = (item: any) => {
        setSelectedItem(item);
        setCatatanRevisi('');
        setIsRejectModalOpen(true);
    };

    const confirmReject = async () => {
        if (!selectedItem.dokumenId) {
            alert("ID Dokumen tidak ditemukan.");
            return;
        }

        const res = await revisiPengajuan(selectedItem.dokumenId, catatanRevisi);
        if (res.success) {
            setActiveQueue(prev => prev.filter(i => i.id !== selectedItem.id));
            setIsRejectModalOpen(false);
            alert(`Dokumen "${selectedItem.kegiatan}" telah dikembalikan ke staf untuk revisi.`);
        } else {
            alert("Gagal memproses revisi: " + res.error);
        }
    };

    const [isForwarding, setIsForwarding] = useState(false);

    const handleForwardToKepala = async () => {
        const selectedDocIds = Array.from(new Set(
            filteredItems.filter(i => i.selected).map(i => i.dokumenId)
        ));
        
        if (selectedDocIds.length === 0) {
            alert("Silakan pilih pengajuan terlebih dahulu.");
            return;
        }

        if (!confirm(`Apakah Anda yakin ingin meneruskan ${selectedDocIds.length} pengajuan terpilih ke Kepala Unit/Jenjang?`)) {
            return;
        }

        setIsForwarding(true);
        const res = await forwardPengajuanToKepala(selectedDocIds);

        if (res.error) {
            alert("Gagal meneruskan pengajuan: " + res.error);
        } else {
            alert(`Berhasil meneruskan ${res.count || selectedDocIds.length} pengajuan ke Kepala Unit.`);
            // Send email notification to Kepala Unit (non-blocking)
            notifyKepalaForwarded(selectedDocIds).catch(err => console.error('[notifyKepalaForwarded]', err));
            // Update local queues to remove forwarded items
            setRkaQueue(prev => prev.filter(i => !selectedDocIds.includes(i.dokumenId)));
            setLpjQueue(prev => prev.filter(i => !selectedDocIds.includes(i.dokumenId)));
        }
        setIsForwarding(false);
    };

    const toggleItemSelection = (id: number) => {
        setActiveQueue(prev => prev.map(item => 
            item.id === id ? { ...item, selected: !item.selected } : item
        ));
    };

    const toggleAllSelection = (checked: boolean) => {
        setActiveQueue(prev => prev.map(item => ({ ...item, selected: checked })));
    };

    const isAllSelected = filteredItems.length > 0 && filteredItems.every(i => i.selected);

    return (
        <div className="p-3 md:p-4 space-y-3">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="bg-amber-500 p-2 rounded-xl text-white shadow-lg shadow-amber-100/50">
                        <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-slate-800 tracking-tight uppercase">Rekapitulasi Draft</h1>
                    </div>
                </div>
            </div>

            {/* Tab Navigation & Search Bar */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5">
                    <button 
                        onClick={() => setActiveTab('RKA')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${activeTab === 'RKA' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText className="w-3.5 h-3.5" /> Antrean RKA
                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded text-[9px] font-bold">{rkaQueue.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('LPJ')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5 ${activeTab === 'LPJ' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Antrean LPJ
                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded text-[9px] font-bold">{lpjQueue.length}</span>
                    </button>
                </div>

                <div className="flex flex-1 gap-2 lg:max-w-md">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={`Cari pengaju, kegiatan, atau unit...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2 text-[10px] font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`p-2.5 rounded-2xl border transition-all shadow-sm ${isFilterOpen || selectedBidang.length > 0 || selectedSumber.length > 0 || selectedBulan.length > 0 || selectedTahun.length > 0 ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Filter Antrean</h3>
                                        {(selectedBidang.length > 0 || selectedSumber.length > 0 || selectedBulan.length > 0 || selectedTahun.length > 0) && (
                                            <button 
                                                onClick={() => { 
                                                    setSelectedBidang([]); 
                                                    setSelectedSumber([]); 
                                                    setSelectedBulan([]); 
                                                    setSelectedTahun([]); 
                                                }}
                                                className="text-[10px] font-black text-rose-500 hover:underline uppercase"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>

                                    {/* 1. Bidang Filter */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bidang</label>
                                        <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar">
                                            {availableBidang.map(b => (
                                                <button
                                                    key={b}
                                                    onClick={() => {
                                                        setSelectedBidang(prev => 
                                                            prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
                                                        );
                                                    }}
                                                    className={`px-2.5 py-1 rounded-xl text-[9px] font-bold transition-all border ${selectedBidang.includes(b) ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    {b}
                                                </button>
                                            ))}
                                            {availableBidang.length === 0 && (
                                                <span className="text-[9px] font-bold text-slate-300 italic">Tidak ada data</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Sumber Dana Filter */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sumber Dana</label>
                                        <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar">
                                            {availableSumber.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        setSelectedSumber(prev => 
                                                            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                                                        );
                                                    }}
                                                    className={`px-2.5 py-1 rounded-xl text-[9px] font-bold transition-all border ${selectedSumber.includes(s) ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                            {availableSumber.length === 0 && (
                                                <span className="text-[9px] font-bold text-slate-300 italic">Tidak ada data</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Bulan Filter */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bulan</label>
                                        <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar">
                                            {availableBulan.map(bln => (
                                                <button
                                                    key={bln}
                                                    onClick={() => {
                                                        setSelectedBulan(prev => 
                                                            prev.includes(bln) ? prev.filter(x => x !== bln) : [...prev, bln]
                                                        );
                                                    }}
                                                    className={`px-2.5 py-1 rounded-xl text-[9px] font-bold transition-all border ${selectedBulan.includes(bln) ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    {bln}
                                                </button>
                                            ))}
                                            {availableBulan.length === 0 && (
                                                <span className="text-[9px] font-bold text-slate-300 italic">Tidak ada data</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 4. Tahun Ajaran Filter */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tahun Ajaran</label>
                                        <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar">
                                            {availableTahun.map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => {
                                                        setSelectedTahun(prev => 
                                                            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                                                        );
                                                    }}
                                                    className={`px-2.5 py-1 rounded-xl text-[9px] font-bold transition-all border ${selectedTahun.includes(t) ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                            {availableTahun.length === 0 && (
                                                <span className="text-[9px] font-bold text-slate-300 italic">Tidak ada data</span>
                                            )}
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
                    <button className="bg-white border border-slate-200 p-2.5 rounded-2xl hover:bg-slate-50 text-slate-600 transition-all shadow-sm">
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-2 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isAllSelected}
                                        onChange={(e) => toggleAllSelection(e.target.checked)}
                                        className="rounded text-emerald-600 w-3.5 h-3.5 cursor-pointer" 
                                    />
                                </th>
                                <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap w-[180px]">PENGAJU & BIDANG</th>
                                <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-auto">Program/Kegiatan</th>
                                <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-[160px]">Sumber Dana</th>
                                <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap w-[120px]">Nominal</th>
                                <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap w-[60px]">Opsi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center space-y-2">
                                        <div className="flex justify-center">
                                            <div className="bg-slate-50 p-3 rounded-full">
                                                <ClipboardCheck className="w-8 h-8 text-slate-200" />
                                            </div>
                                        </div>
                                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Tidak ada antrean {activeTab}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-3 py-1.5 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={item.selected} 
                                                onChange={() => toggleItemSelection(item.id)}
                                                className="rounded text-emerald-600 w-3.5 h-3.5 cursor-pointer" 
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 align-middle">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-slate-100 p-1.5 rounded-lg shrink-0">
                                                    <User className="w-3.5 h-3.5 text-slate-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{item.pengaju}</p>
                                                    <p className="text-[8px] text-emerald-600 font-black uppercase tracking-wider leading-none mt-0.5">{item.bidang}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-2 py-1.5 align-middle">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="text-[11px] font-black text-slate-700 leading-tight">{item.kegiatan}</p>
                                                {item.isRevisi ? (
                                                    <span 
                                                        className="px-1 py-0.2 bg-amber-50 text-amber-700 text-[7px] font-black rounded uppercase cursor-help tracking-tighter"
                                                        title={`HASIL REVISI: ${item.lastNote}`}
                                                    >
                                                        Revisi
                                                    </span>
                                                ) : (
                                                    <span className="px-1 py-0.2 bg-sky-50 text-sky-700 text-[7px] font-black rounded uppercase tracking-tighter">
                                                        Baru
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-1 py-0.2 rounded uppercase tracking-tighter shrink-0">{item.coa}</span>
                                                <span className="text-[8px] font-bold text-slate-400 flex items-center gap-0.5 tracking-tighter shrink-0"><Info className="w-2 h-2" /> ID: {item.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-1.5 align-middle text-center">
                                            <span className="inline-flex px-1.5 py-0.5 bg-slate-50 text-slate-600 text-[8px] font-black rounded border border-slate-100 uppercase tracking-tighter">
                                                {item.sumber}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1.5 align-middle text-right whitespace-nowrap">
                                            <p className="text-[11px] font-black text-slate-800 italic tracking-tighter">Rp {item.nominal.toLocaleString('id-ID')}</p>
                                        </td>
                                        <td className="px-2 py-1.5 align-middle text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1">
                                                <button 
                                                    onClick={() => handleOpenDetail(item)}
                                                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" 
                                                    title="Review Detail"
                                                >
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Toolbar */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                            <div className="text-right border-r border-slate-100 pr-3">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Item Terpilih</p>
                                <p className="text-xs font-black text-slate-800 leading-none">{totalSelectedItems} baris</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Nominal</p>
                                <p className="text-sm font-black text-emerald-700 italic tracking-tighter leading-none">Rp {totalSelectedNominal.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleForwardToKepala}
                        disabled={totalSelectedItems === 0 || isForwarding}
                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black px-6 py-2.5 rounded-xl shadow-md shadow-emerald-100/50 transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-tight active:scale-95 shrink-0"
                    >
                        <Send className="w-3.5 h-3.5 fill-white" />
                        {isForwarding ? 'Memproses...' : 'Teruskan ke Kepala Unit'}
                    </button>
                </div>
            </div>

            {/* Reject Modal */}
            {isRejectModalOpen && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-rose-50 p-6 flex items-center gap-4 border-b border-rose-100">
                            <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-rose-900 uppercase">Tolak & Minta Revisi</h3>
                                <p className="text-[10px] text-rose-700 font-bold uppercase tracking-widest">Dokumen {activeTab}</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Kegiatan</p>
                                <p className="text-xs font-black text-slate-800">{selectedItem.kegiatan}</p>
                            </div>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 min-h-[120px] transition-all placeholder:text-slate-300"
                                placeholder="Tuliskan catatan revisi di sini agar staf pengaju paham apa yang harus diperbaiki..."
                                value={catatanRevisi}
                                onChange={(e) => setCatatanRevisi(e.target.value)}
                            />
                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-all uppercase tracking-wider"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={confirmReject}
                                    disabled={!catatanRevisi.trim()}
                                    className="flex-1 px-4 py-3 bg-rose-600 text-white text-xs font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 disabled:opacity-50 transition-all uppercase tracking-wider"
                                >
                                    Konfirmasi Tolak
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Review Modal */}
            {isDetailModalOpen && selectedDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-emerald-50 p-6 flex items-center justify-between border-b border-emerald-100">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-emerald-900 uppercase italic leading-tight">{selectedDetail.kegiatan}</h3>
                                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest">ID: {selectedDetail.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-emerald-600" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Operasional</p>
                                    <p className="text-xs font-black text-slate-800">{selectedDetail.coa}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PIC / Penanggung Jawab</p>
                                    <p className="text-xs font-black text-slate-800">{selectedDetail.pic}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu & Tempat</p>
                                    <p className="text-xs font-black text-slate-800">{selectedDetail.waktu} @ {selectedDetail.tempat}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sasaran Strategis</p>
                                    <p className="text-xs font-black text-slate-800">{selectedDetail.sasaran}</p>
                                </div>
                            </div>

                            {/* Rincian Items Table */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rincian Anggaran (Breakdown)</label>
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-[9px] font-black text-slate-500 uppercase">Item</th>
                                                <th className="px-4 py-2 text-center text-[9px] font-black text-slate-500 uppercase">Qty</th>
                                                <th className="px-4 py-2 text-right text-[9px] font-black text-slate-500 uppercase">Harga</th>
                                                <th className="px-4 py-2 text-right text-[9px] font-black text-slate-500 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 bg-white">
                                            {selectedDetail.rincian?.items?.map((it: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2.5 text-[11px] font-bold text-slate-700">{it.name}</td>
                                                    <td className="px-4 py-2.5 text-[11px] font-bold text-slate-600 text-center">{it.qty} {it.unit}</td>
                                                    <td className="px-4 py-2.5 text-[11px] font-bold text-slate-600 text-right">Rp {it.price.toLocaleString('id-ID')}</td>
                                                    <td className="px-4 py-2.5 text-[11px] font-black text-slate-800 text-right">Rp {it.total.toLocaleString('id-ID')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-100">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase">Total Nominal</td>
                                                <td className="px-4 py-3 text-right text-sm font-black text-emerald-700 italic tracking-tighter">
                                                    Rp {selectedDetail.nominal.toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Funding Split */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alokasi Sumber Dana</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedDetail.rincian?.fundingSplits?.filter((s: any) => s.source && s.nominal > 0).map((s: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                                            <span className="text-[10px] font-black text-amber-800 uppercase">{s.source}</span>
                                            <span className="text-xs font-black text-amber-900">Rp {s.nominal.toLocaleString('id-ID')} ({s.percent}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
