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

// Mock Data for Queue
const MOCK_RKA_QUEUE = [
    { id: 1, pengaju: 'Staf Kebersihan', unit: 'SDIT 1', coa: 'Pemeliharaan', kegiatan: 'Beli Sapu dan Alat Pel', sumber: 'Kas Operasional', nominal: 150000, selected: true },
    { id: 2, pengaju: 'Staf Asrama', unit: 'SDIT 1', coa: 'Aset Tetap', kegiatan: 'Lemari Pakaian', sumber: 'Zakat Maal', nominal: 2500000, selected: true },
    { id: 3, pengaju: 'Staf Dapur', unit: 'Dapur Pusat', coa: 'Beban Konsumsi', kegiatan: 'Beras 100 Karung', sumber: 'Dana BOS', nominal: 15000000, selected: false }
];

const MOCK_LPJ_QUEUE = [
    { id: 101, pengaju: 'Staf Kurikulum', unit: 'SMPIT 1', coa: 'Alat Peraga', kegiatan: 'Beli Peta Dunia 3D', sumber: 'Dana BOS', nominal: 750000, selected: true },
    { id: 102, pengaju: 'Staf Keamanan', unit: 'Yayasan', coa: 'Pemeliharaan', kegiatan: 'Service CCTV Utama', sumber: 'Kas Internal', nominal: 1200000, selected: true }
];

export default function RekapitulasiDraftPage() {
    const [activeTab, setActiveTab] = useState<'RKA' | 'LPJ'>('RKA');
    const [rkaQueue, setRkaQueue] = useState(MOCK_RKA_QUEUE);
    const [lpjQueue, setLpjQueue] = useState(MOCK_LPJ_QUEUE);
    
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [selectedSumber, setSelectedSumber] = useState<string[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<string[]>([]);

    const activeQueue = activeTab === 'RKA' ? rkaQueue : lpjQueue;
    const setActiveQueue = activeTab === 'RKA' ? setRkaQueue : setLpjQueue;

    // Filter Logic
    const filteredItems = activeQueue.filter(item => {
        if (selectedSumber.length > 0 && !selectedSumber.includes(item.sumber)) return false;
        if (selectedUnit.length > 0 && !selectedUnit.includes(item.unit)) return false;
        return true;
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
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Rekapitulasi Draft</h1>
                        <p className="text-xs text-slate-500 font-medium tracking-wide">Pemeriksaan & Otorisasi Berjenjang (Mode Checker)</p>
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
                        <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder={`Cari pengaju, kegiatan, atau unit...`}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <button className="bg-white border border-slate-200 p-2.5 rounded-2xl hover:bg-slate-50 text-slate-600 transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                    <button className="bg-white border border-slate-200 p-2.5 rounded-2xl hover:bg-slate-50 text-slate-600 transition-all">
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
