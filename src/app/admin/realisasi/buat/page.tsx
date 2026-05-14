'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { 
    ClipboardCheck, 
    Search, 
    ArrowRight, 
    Calculator, 
    FileText, 
    Camera as CameraIcon, 
    Upload, 
    X, 
    AlertTriangle, 
    CheckCircle2, 
    Plus,
    ChevronDown,
    Building2,
    DollarSign,
    Info,
    Layout,
    ArrowUpRight,
    Send,
    Percent,
    LayoutGrid,
    Trash2,
    PlusCircle,
    RotateCcw,
    File as FileIcon,
    Image as ImageIcon
} from 'lucide-react';

const APPROVED_ITEMS = [
    { 
        id: 'ITM-001', 
        docId: 'RKA-2025-05-01',
        name: 'Beli Sapu dan Alat Pel', 
        unit: 'SDIT 1', 
        program: 'Pemeliharaan Gedung',
        budget: 150000, 
        source: 'Kas Operasional',
        isRestricted: false
    },
    { 
        id: 'ITM-002', 
        docId: 'RKA-2025-05-01',
        name: 'Konsumsi Rapat Wali Murid', 
        unit: 'SDIT 1', 
        program: 'Kesiswaan',
        budget: 500000, 
        source: 'Dana BOS',
        isRestricted: true,
        allowedBackupSources: ['Yayasan', 'Zakat']
    }
];

const FUND_SOURCES = ['Kas Operasional', 'Yayasan', 'Zakat', 'Infaq', 'Dana BOS'];

interface SubsidiSource {
    source: string;
    amount: number;
    percent: number;
}

interface LPJItem {
    id: string;
    name: string;
    unit: string;
    price: number;
    qty: number;
    total: number;
}

export default function BuatRealisasiPage() {
    const [selectedItemId, setSelectedItemId] = useState('');
    const [narasi, setNarasi] = useState('');
    const [subsidiSources, setSubsidiSources] = useState<SubsidiSource[]>([]);
    const [items, setItems] = useState<LPJItem[]>([
        { id: '1', name: '', unit: '', price: 0, qty: 0, total: 0 }
    ]);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const activeItem = useMemo(() => 
        APPROVED_ITEMS.find(item => item.id === selectedItemId), 
    [selectedItemId]);

    const realisasiNominal = useMemo(() => 
        items.reduce((acc, curr) => acc + curr.total, 0),
    [items]);

    const selisih = useMemo(() => {
        if (!activeItem) return 0;
        return realisasiNominal - activeItem.budget;
    }, [activeItem, realisasiNominal]);

    const totalSubsidi = useMemo(() => 
        subsidiSources.reduce((acc, curr) => acc + curr.amount, 0), 
    [subsidiSources]);

    const sisaKekurangan = useMemo(() => {
        if (selisih <= 0) return 0;
        return Math.max(0, selisih - totalSubsidi);
    }, [selisih, totalSubsidi]);

    // --- Sync Logic ---
    const updateSubsidi = (index: number, field: 'amount' | 'percent' | 'source', value: any) => {
        const news = [...subsidiSources];
        const item = { ...news[index] };

        if (field === 'source') {
            item.source = value;
        } else if (field === 'amount') {
            item.amount = Number(value);
            // Hitung Persen berdasarkan Nominal (dari Total Selisih)
            item.percent = selisih > 0 ? (item.amount / selisih) * 100 : 0;
        } else if (field === 'percent') {
            item.percent = Number(value);
            // Hitung Nominal berdasarkan Persen (dari Total Selisih)
            item.amount = selisih > 0 ? (item.percent / 100) * selisih : 0;
        }

        news[index] = item;
        setSubsidiSources(news);
    };

    const updateItem = (id: string, field: keyof LPJItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'price' || field === 'qty') {
                    updated.total = Number(updated.price) * Number(updated.qty);
                }
                return updated;
            }
            return item;
        }));
    };

    const addItem = () => {
        const newId = (items.length + 1).toString();
        setItems([...items, { id: newId, name: '', unit: '', price: 0, qty: 0, total: 0 }]);
    };

    const deleteItem = (id: string) => {
        if (items.length === 1) return;
        setItems(items.filter(item => item.id !== id));
    };

    // --- Camera Logic ---
    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
        } catch (err) {
            alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `lpj-nota-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        setAttachments(prev => [...prev, file].slice(0, 50));
                        setIsCameraOpen(false);
                        stopCamera();
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    useEffect(() => {
        if (isCameraOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isCameraOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles].slice(0, 50));
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="p-4 space-y-4 max-w-6xl mx-auto">
            
            {/* Ultra Compact Header */}
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-100">
                        <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">Realisasi Anggaran</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block border-r border-slate-100 pr-4">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Periode Aktif</p>
                        <p className="text-[11px] font-black text-slate-700 uppercase">Mei 2025</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 uppercase italic">
                        Sudah Diterima
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Main Section */}
                <div className="lg:col-span-8 space-y-4">
                    
                    {/* Item Selector & Stats Horizontal */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                                    <Search className="w-3 h-3 text-emerald-600" /> Pilih Kegiatan
                                </label>
                                <div className="relative group">
                                    <select 
                                        value={selectedItemId}
                                        onChange={(e) => {
                                            setSelectedItemId(e.target.value);
                                            setSubsidiSources([]);
                                            setItems([{ id: '1', name: '', unit: '', price: 0, qty: 0, total: 0 }]);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Cari item pengajuan...</option>
                                        {APPROVED_ITEMS.map(item => (
                                            <option key={item.id} value={item.id}>[{item.docId}] {item.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                                    <DollarSign className="w-3 h-3 text-emerald-600" /> Nominal Realisasi
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-2 text-xs font-black text-slate-400 italic">Rp</div>
                                    <input 
                                        type="number"
                                        value={realisasiNominal || ''}
                                        readOnly
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-lg font-black text-slate-400 focus:outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {activeItem && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-1">Anggaran</p>
                                    <p className="text-sm font-black text-slate-700">Rp {activeItem.budget.toLocaleString('id-ID')}</p>
                                </div>
                                <div className={`p-3 rounded-xl border ${selisih > 0 ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    <p className="text-[9px] font-extrabold uppercase mb-1">Selisih</p>
                                    <p className="text-sm font-black">Rp {Math.abs(selisih).toLocaleString('id-ID')}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 hidden md:block">
                                    <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-1">Sumber Dana</p>
                                    <p className="text-xs font-bold text-slate-600 truncate">{activeItem.source}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-1">Status Saldo</p>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selisih > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {selisih > 0 ? 'Kurang' : 'Aman'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NEW: Rincian Realisasi Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Layout className="w-3 h-3 text-emerald-600" /> Rincian Penggunaan Dana (LPJ Kustom)
                            </h3>
                            <button 
                                onClick={addItem}
                                className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-all shadow-sm"
                            >
                                <PlusCircle className="w-3 h-3" /> Tambah Baris
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="divide-x divide-slate-200">
                                        <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase text-center w-10">No</th>
                                        <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-left min-w-[200px]">Uraian Barang / Jasa</th>
                                        <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-center w-20">Satuan</th>
                                        <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-right w-32">Harga Satuan</th>
                                        <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-center w-16">Qty</th>
                                        <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-right w-32">Total</th>
                                        <th className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase text-center w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={item.id} className="divide-x divide-slate-100 hover:bg-slate-50/30 transition-colors">
                                            <td className="px-2 py-2 text-center text-[10px] font-bold text-slate-300">{idx + 1}</td>
                                            <td className="p-0">
                                                <input 
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-transparent border-none outline-none text-[11px] font-bold text-slate-700 placeholder:italic placeholder:font-normal"
                                                    placeholder="Contoh: Kertas A4 80gr..."
                                                />
                                            </td>
                                            <td className="p-0">
                                                <input 
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                                    className="w-full px-2 py-2.5 bg-transparent border-none outline-none text-[10px] font-bold text-slate-500 text-center uppercase"
                                                    placeholder="Rim"
                                                />
                                            </td>
                                            <td className="p-0">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-2.5 text-[9px] font-bold text-slate-300 italic">Rp</span>
                                                    <input 
                                                        type="number"
                                                        value={item.price || ''}
                                                        onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                                        className="w-full pl-6 pr-3 py-2.5 bg-transparent border-none outline-none text-[11px] font-black text-right text-slate-700"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-0">
                                                <input 
                                                    type="number"
                                                    value={item.qty || ''}
                                                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                    className="w-full px-2 py-2.5 bg-transparent border-none outline-none text-[11px] font-black text-center text-emerald-600"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="p-0 bg-slate-50/30">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-2.5 text-[9px] font-bold text-slate-300 italic">Rp</span>
                                                    <div className="w-full pl-6 pr-3 py-2.5 text-[11px] font-black text-right text-emerald-700">
                                                        {item.total.toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <button 
                                                    onClick={() => deleteItem(item.id)}
                                                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-end items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal Rincian:</span>
                            <span className="text-sm font-black text-emerald-700">Rp {realisasiNominal.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Subsidi Silang Area - Dynamic Percent & Nominal */}
                    {selisih > 0 && (
                        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5 space-y-4 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                                <div>
                                    <h3 className="text-xs font-black text-rose-800 flex items-center gap-2 uppercase tracking-tight">
                                        <AlertTriangle className="w-4 h-4 text-rose-500" /> Subsidi Silang Wajib
                                    </h3>
                                    <p className="text-[10px] text-rose-600 font-medium italic">Kelebihan belanja Rp {selisih.toLocaleString('id-ID')} harus ditutupi.</p>
                                </div>
                                <div className={`text-xs font-black px-3 py-1 rounded-lg transition-all ${sisaKekurangan === 0 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-rose-600 text-white shadow-lg shadow-rose-100'}`}>
                                    Sisa: Rp {sisaKekurangan.toLocaleString('id-ID')}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                {subsidiSources.map((subsidi, idx) => (
                                    <div key={idx} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200 animate-in slide-in-from-left-2 duration-200">
                                        <div className="flex-1 min-w-[200px]">
                                            <select 
                                                value={subsidi.source}
                                                onChange={(e) => updateSubsidi(idx, 'source', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                            >
                                                <option value="">Pilih Sumber...</option>
                                                {((activeItem?.isRestricted ? activeItem.allowedBackupSources : FUND_SOURCES) || []).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        
                                        {/* Percent Input */}
                                        <div className="relative w-20">
                                            <input 
                                                type="number"
                                                value={subsidi.percent ? Math.round(subsidi.percent) : ''}
                                                onChange={(e) => updateSubsidi(idx, 'percent', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-6 py-1.5 text-[11px] font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 text-center"
                                                placeholder="0"
                                            />
                                            <Percent className="absolute right-1.5 top-2 w-2.5 h-2.5 text-slate-400" />
                                        </div>

                                        <ArrowRight className="w-3 h-3 text-slate-300 hidden md:block" />

                                        {/* Nominal Input */}
                                        <div className="relative w-36">
                                            <div className="absolute left-2 top-2 text-[10px] font-black text-slate-400 italic">Rp</div>
                                            <input 
                                                type="number"
                                                value={subsidi.amount || ''}
                                                onChange={(e) => updateSubsidi(idx, 'amount', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-[11px] font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                placeholder="Nominal"
                                            />
                                        </div>

                                        <button 
                                            onClick={() => setSubsidiSources(subsidiSources.filter((_, i) => i !== idx))}
                                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setSubsidiSources([...subsidiSources, { source: '', amount: 0, percent: 0 }])}
                                    className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 hover:border-emerald-200 hover:text-emerald-600 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Plus className="w-3 h-3" /> Tambah Sumber Dana Subsidi
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Narrative Input - Compact */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                            <FileText className="w-3 h-3 text-emerald-600" /> Narasi Pelaksanaan
                        </label>
                        <textarea 
                            value={narasi}
                            onChange={(e) => setNarasi(e.target.value)}
                            placeholder="Tuliskan detail pelaksanaan kegiatan di sini..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-700 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>

                {/* Right Sidebar - Compact */}
                <div className="lg:col-span-4 space-y-4">
                    
                    {/* Media Attachments - Ultra Compact */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                            <CameraIcon className="w-3 h-3 text-emerald-600" /> Bukti Nota / Kuitansi
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setIsCameraOpen(true)}
                                className="flex items-center justify-center gap-2 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 hover:bg-emerald-100 transition-all group"
                            >
                                <CameraIcon className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Ambil Foto</span>
                            </button>
                            <label className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer transition-all">
                                <Upload className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Upload</span>
                                <input type="file" multiple onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 max-h-48 overflow-y-auto">
                            {attachments.length === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">Belum ada lampiran</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                                            <div className="w-6 h-6 bg-emerald-50 rounded flex items-center justify-center text-emerald-600 shrink-0">
                                                <FileIcon className="w-3 h-3" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-bold text-slate-700 truncate">{file.name}</p>
                                            </div>
                                            <button 
                                                onClick={() => removeAttachment(idx)}
                                                className="p-1 text-slate-300 hover:text-rose-500"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Final Action - Compact */}
                    <div className="bg-slate-900 rounded-2xl p-5 shadow-xl shadow-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Realisasi</span>
                            <span className="text-xl font-black text-white italic tracking-tighter">Rp {realisasiNominal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => { alert('Berhasil disimpan ke Draft Saya!'); window.location.href = '/admin/pengajuan/draft-saya'; }}
                                disabled={!activeItem}
                                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" /> Simpan Draft
                            </button>
                            <button 
                                onClick={() => { alert('Berhasil dikirim ke Bendahara Unit!'); window.location.href = '/admin/pengajuan/rekap'; }}
                                disabled={!activeItem || (selisih > 0 && sisaKekurangan > 0)}
                                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider"
                            >
                                <Send className="w-3.5 h-3.5" /> Kirim LPJ
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- Camera Modal --- */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setIsCameraOpen(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl relative z-10">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">
                                <CameraIcon className="w-4 h-4 text-emerald-600" />
                                <h3 className="font-bold text-slate-800 text-xs">Ambil Foto Nota</h3>
                            </div>
                            <button onClick={() => setIsCameraOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="relative bg-black aspect-[3/4]">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-8 flex justify-center">
                                <button 
                                    onClick={capturePhoto}
                                    className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-4 border-slate-200"
                                >
                                    <div className="w-10 h-10 border-2 border-slate-900 rounded-full"></div>
                                </button>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 text-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Fokuskan pada area nota
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
