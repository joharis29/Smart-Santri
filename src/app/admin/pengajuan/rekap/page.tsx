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
    ArrowUpRight
} from 'lucide-react';

// Real Data Containers (Empty for production)
const MOCK_RKA_QUEUE: any[] = [];
const MOCK_LPJ_QUEUE: any[] = [];

export default function RekapitulasiDraftPage() {
    const [activeTab, setActiveTab] = useState<'RKA' | 'LPJ'>('RKA');
    const [rkaQueue, setRkaQueue] = useState(MOCK_RKA_QUEUE);
    const [lpjQueue, setLpjQueue] = useState(MOCK_LPJ_QUEUE);
    
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSumber, setSelectedSumber] = useState<string[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<string[]>([]);

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

    // Filter Logic
    const filteredItems = activeQueue.filter(item => {
        const matchesSearch = item.pengaju.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.unit.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSumber = selectedSumber.length === 0 || selectedSumber.includes(item.sumber);
        const matchesUnit = selectedUnit.length === 0 || selectedUnit.includes(item.unit);
        return matchesSearch && matchesSumber && matchesUnit;
    });

    const totalSelectedNominal = filteredItems.filter(i => i.selected).reduce((acc, curr) => acc + curr.nominal, 0);
    const totalSelectedItems = filteredItems.filter(i => i.selected).length;

    // Rejection Logic
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [catatanRevisi, setCatatanRevisi] = useState('');

    const handleReject = (item: any) => {
        setSelectedItem(item);
        setCatatanRevisi('');
        setIsRejectModalOpen(true);
    };

    const confirmReject = () => {
        setActiveQueue(prev => prev.filter(i => i.id !== selectedItem.id));
        setIsRejectModalOpen(false);
        alert(`Dokumen "${selectedItem.kegiatan}" telah dikembalikan ke staf untuk revisi.`);
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
        <div className="p-4 md:p-6 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg shadow-amber-100">
                        <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Rekapitulasi Draft</h1>
                    </div>
                </div>
            </div>

            {/* Tab Navigation & Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                    <button 
                        onClick={() => setActiveTab('RKA')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'RKA' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText className="w-4 h-4" /> Antrean RKA
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">{rkaQueue.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('LPJ')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'LPJ' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ClipboardCheck className="w-4 h-4" /> Antrean LPJ
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">{lpjQueue.length}</span>
                    </button>
                </div>

                <div className="flex flex-1 gap-2 lg:max-w-md">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={`Cari pengaju, kegiatan, atau unit...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`p-2.5 rounded-2xl border transition-all shadow-sm ${isFilterOpen || selectedSumber.length > 0 || selectedUnit.length > 0 ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Filter Antrean</h3>
                                        {(selectedSumber.length > 0 || selectedUnit.length > 0) && (
                                            <button 
                                                onClick={() => { setSelectedSumber([]); setSelectedUnit([]); }}
                                                className="text-[10px] font-black text-rose-500 hover:underline uppercase"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>

                                    {/* Sumber Dana Filter */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Sumber Dana</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Kas Operasional', 'Zakat Maal', 'Dana BOS', 'Kas Internal'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        setSelectedSumber(prev => 
                                                            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                                                        );
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${selectedSumber.includes(s) ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Unit Filter */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Unit Satuan</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['SDIT 1', 'Dapur Pusat', 'SMPIT 1', 'Yayasan'].map(u => (
                                                <button
                                                    key={u}
                                                    onClick={() => {
                                                        setSelectedUnit(prev => 
                                                            prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
                                                        );
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${selectedUnit.includes(u) ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    {u}
                                                </button>
                                            ))}
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
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isAllSelected}
                                        onChange={(e) => toggleAllSelection(e.target.checked)}
                                        className="rounded text-emerald-600 w-4 h-4 cursor-pointer" 
                                    />
                                </th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Pengaju & Unit</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Kegiatan (Detail Program)</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sumber Dana</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Nominal</th>
                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Otorisasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center space-y-3">
                                        <div className="flex justify-center">
                                            <div className="bg-slate-50 p-4 rounded-full">
                                                <ClipboardCheck className="w-12 h-12 text-slate-200" />
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Tidak ada antrean {activeTab}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={item.selected} 
                                                onChange={() => toggleItemSelection(item.id)}
                                                className="rounded text-emerald-600 w-4 h-4 cursor-pointer" 
                                            />
                                        </td>
                                        <td className="px-4 py-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 p-2 rounded-xl">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 leading-none mb-1">{item.pengaju}</p>
                                                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest leading-none">{item.unit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 align-middle">
                                            <p className="text-xs font-black text-slate-700 mb-1">{item.kegiatan}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{item.coa}</span>
                                                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Info className="w-2.5 h-2.5" /> ID: {item.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 align-middle text-center">
                                            <span className="inline-flex px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-black rounded-lg border border-slate-100 uppercase tracking-tighter">
                                                {item.sumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 align-middle text-right whitespace-nowrap">
                                            <p className="text-sm font-black text-slate-800 italic tracking-tighter">Rp {item.nominal.toLocaleString('id-ID')}</p>
                                        </td>
                                        <td className="px-4 py-4 align-middle text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleReject(item)}
                                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" 
                                                    title="Tolak & Beri Catatan Revisi"
                                                >
                                                    <XCircle className="w-4.5 h-4.5" />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Review Detail">
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

                {/* Footer Toolbar */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="text-right border-r border-slate-100 pr-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Item Terpilih</p>
                                <p className="text-sm font-black text-slate-800">{totalSelectedItems} baris</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Nominal</p>
                                <p className="text-lg font-black text-emerald-700 italic tracking-tighter">Rp {totalSelectedNominal.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                    <button 
                        disabled={totalSelectedItems === 0}
                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2 uppercase tracking-tight active:scale-95"
                    >
                        <Send className="w-4 h-4 fill-white" />
                        Teruskan ke Kepala Unit
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
        </div>
    );
}
