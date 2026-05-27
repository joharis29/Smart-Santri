'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, ChevronDown, Filter, FileText, CheckCircle2, AlertCircle, BookOpen, Save, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface RKAReference {
    id: string;
    unit: string;
    bidang: string;
    standar: string;
    program: string;
    namaKegiatan: string;
    kegiatan: string;
    pelaksana: string;
    sasaran: string;
    prioritas: string;
    indikator: string;
}

const STRUKTUR_BIDANG: Record<string, string[]> = {
    'Pesantren/Yayasan': ['Kesekretariatan', 'Pendidikan', 'Sumber Daya Insani', 'Kesejahteraan Sosial', 'Sarana', 'Keuangan', 'Penelitian Dan Pengembangan'],
    'TK': ['Kurikulum', 'Sarana', 'Humas', 'Kesejahteraan', 'Tata Usaha (TU)', 'Bendahara', 'Bimbingan & Konseling (BK)', 'Kesantrian', 'Mudir'],
    'Diniyah': ['Kurikulum', 'Kesiswaan', 'Sarana', 'Humas', 'Kesantrian'],
    'SDIT 1': ['Kurikulum', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Humas', 'Kesiswaan', 'Sarana', 'Tenaga Administari Sekolah (TAS)', 'Bendahara', 'Kesekretariatan'],
    'SDIT 2': ['Kurikulum', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Humas', 'Kesiswaan', 'Sarana', 'Tenaga Administari Sekolah (TAS)', 'Bendahara', 'Kesekretariatan'],
    'MTs': ['Kurikulum', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Humas', 'Kesantrian', 'Sarana', 'Perpustakaan', 'Bimbingan & Konseling (BK)', 'Kordinator Ektrakurikuler', 'Lembaga Bahasa', 'Kordinator Pengembangan Prestasi', 'Lab Komputer', 'Tenaga Administari Sekolah (TAS)', 'Bendahara', 'Mudir'],
    'MA': ['Kurikulum', 'Bimbingan & Konseling (BK)', 'Lembaga Pengembangan Bahasa Asing (LPBA)', 'Kesantrian', 'Humas', 'Kordinator Piket', 'Pembina RG-UG', 'Kordinator Ektrakurikuler', 'Perpustakaan', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Mudir', 'Tenaga Administari Madrasah (TAM)', 'Operator', 'Kordinator Pengembangan Prestasi', 'Pendidik & Tenaga Kependidikan (PTK)', 'Lab Komputer', 'Lab Sains', 'Bendahara'],
    'THQ': ['Kurikulum', 'Kesantrian', 'Sarana', 'Humas'],
    'Asrama Putra': ['Sekretaris', 'Bendahara', 'Pendidikan Dan Pengasuhan', 'Kesantrian Dan Kedisiplinan', 'Pondok Tahfidz', 'Kesehatan Dan Kesejahteraan', 'Sarana Dan Kebersihan Lingkungan'],
    'Asrama Putri': ['Sekretaris', 'Bendahara', 'Pendidikan Dan Pengasuhan', 'Kesantrian Dan Kedisiplinan', 'Pondok Tahfidz', 'Kesehatan Dan Kesejahteraan', 'Sarana Dan Kebersihan Lingkungan'],
    'Dapur': []
};

export default function RKAReferencePage() {
    const [data, setData] = useState<RKAReference[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [filterBidang, setFilterBidang] = useState('');

    const [userRole, setUserRole] = useState<string>('');
    const [userUnit, setUserUnit] = useState<string>('');
    const [isCentral, setIsCentral] = useState(true);

    const supabase = createClient();

    // Fetch Data from Supabase
    const fetchData = async (unitParam?: string) => {
        setIsLoading(true);
        try {
            let allData: any[] = [];
            let hasMore = true;
            let from = 0;
            const step = 1000;

            let query = supabase
                .from('program_kegiatan')
                .select('*')
                .order('created_at', { ascending: false })
                .order('id', { ascending: true }); // Deterministic sort
                
            if (unitParam && unitParam !== 'Pusat (Yayasan)' && unitParam !== 'Administrator') {
                query = query.eq('unit', unitParam);
            }

            while (hasMore) {
                const { data: result, error } = await query.range(from, from + step - 1);

                if (error) throw error;

                if (result && result.length > 0) {
                    allData = [...allData, ...result];
                    if (result.length < step) {
                        hasMore = false;
                    } else {
                        from += step;
                    }
                } else {
                    hasMore = false;
                }
            }

            if (allData.length > 0) {
                // Remove any duplicates just in case (e.g. from tied timestamps during pagination)
                const uniqueDataMap = new Map();
                allData.forEach(item => uniqueDataMap.set(item.id, item));
                const uniqueAllData = Array.from(uniqueDataMap.values());

                const formattedData: RKAReference[] = uniqueAllData.map((item: any) => ({
                    id: item.id,
                    unit: item.unit,
                    bidang: item.bidang,
                    standar: item.standar,
                    program: item.program,
                    namaKegiatan: item.nama_kegiatan,
                    kegiatan: item.detail_kegiatan || '',
                    pelaksana: item.pelaksana || '',
                    sasaran: item.sasaran || '',
                    prioritas: item.prioritas || '',
                    indikator: item.indikator || ''
                }));
                setData(formattedData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal memuat data referensi RKA.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const initUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                
                const activeRoleKey = `activeRole_${user.id}`;
                const activeUnitKey = `activeUnit_${user.id}`;
                const savedRole = localStorage.getItem(activeRoleKey) || (profile ? profile.role : 'GUEST');
                const savedUnit = localStorage.getItem(activeUnitKey) || 'Pusat (Yayasan)';

                setUserRole(savedRole);
                setUserUnit(savedUnit);
                
                const central = savedRole === 'Administrator' || savedUnit === 'Pusat (Yayasan)';
                setIsCentral(central);
                
                if (!central && savedUnit) {
                    setFilterUnit(savedUnit);
                    setFormData(prev => ({ ...prev, unit: savedUnit }));
                    fetchData(savedUnit);
                } else {
                    fetchData();
                }
            } else {
                fetchData();
            }
        };
        initUser();
    }, []);

    // Custom State logic (now mostly derived from actual data, but still allows adding new locally before save)
    const [customBidangs, setCustomBidangs] = useState<Record<string, string[]>>({});
    const [customPrograms, setCustomPrograms] = useState<Record<string, string[]>>({});
    const [customKegiatans, setCustomKegiatans] = useState<Record<string, Record<string, string[]>>>({});

    // Search Terms for Dropdowns
    const [programSearch, setProgramSearch] = useState('');
    const [kegiatanSearch, setKegiatanSearch] = useState('');
    const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
    const [isKegiatanDropdownOpen, setIsKegiatanDropdownOpen] = useState(false);
    const programDropdownRef = useRef<HTMLDivElement>(null);
    const kegiatanDropdownRef = useRef<HTMLDivElement>(null);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RKAReference | null>(null);
    const [isAddingNewBidang, setIsAddingNewBidang] = useState(false);
    const [isAddingNewProgram, setIsAddingNewProgram] = useState(false);
    const [isAddingNewKegiatan, setIsAddingNewKegiatan] = useState(false);
    const [newBidangName, setNewBidangName] = useState('');
    const [newProgramName, setNewProgramName] = useState('');
    const [newKegiatanName, setNewKegiatanName] = useState('');
    
    const defaultFormState = {
        unit: 'Asrama Putra',
        bidang: '',
        standar: '(-)',
        program: '',
        namaKegiatan: '',
        kegiatan: '',
        pelaksana: '',
        sasaran: '',
        prioritas: 'Program Tetap & Wajib',
        indikator: ''
    };
    
    const [formData, setFormData] = useState<Omit<RKAReference, 'id'>>(defaultFormState);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                item.program.toLowerCase().includes(searchLower) ||
                item.namaKegiatan.toLowerCase().includes(searchLower) ||
                item.kegiatan.toLowerCase().includes(searchLower);
            const matchesUnit = filterUnit === '' || item.unit === filterUnit;
            const matchesBidang = filterBidang === '' || item.bidang === filterBidang;
            return matchesSearch && matchesUnit && matchesBidang;
        });
    }, [data, searchQuery, filterUnit, filterBidang]);

    const units = useMemo(() => Object.keys(STRUKTUR_BIDANG), []);
    
    // Dynamic Dropdowns derived from DB + Local Custom Additions
    const availableBidangs = useMemo(() => {
        const base = STRUKTUR_BIDANG[formData.unit] || [];
        const dbBidangs = data.filter(d => d.unit === formData.unit).map(d => d.bidang);
        const custom = customBidangs[formData.unit] || [];
        return Array.from(new Set([...base, ...dbBidangs, ...custom])).filter(Boolean);
    }, [data, formData.unit, customBidangs]);

    const availablePrograms = useMemo(() => {
        const dbPrograms = data.filter(d => d.unit === formData.unit && (formData.bidang === '' || d.bidang === formData.bidang)).map(d => d.program);
        const custom = customPrograms[formData.unit] || [];
        const all = Array.from(new Set([...dbPrograms, ...custom])).filter(Boolean);
        if (!programSearch) return all;
        return all.filter(p => p.toLowerCase().includes(programSearch.toLowerCase()));
    }, [data, formData.unit, formData.bidang, customPrograms, programSearch]);

    const availableKegiatans = useMemo(() => {
        const dbKegiatans = data.filter(d => d.unit === formData.unit && d.program === formData.program).map(d => d.namaKegiatan);
        const custom = (customKegiatans[formData.unit] || {})[formData.program] || [];
        const all = Array.from(new Set([...dbKegiatans, ...custom])).filter(Boolean);
        if (!kegiatanSearch) return all;
        return all.filter(k => k.toLowerCase().includes(kegiatanSearch.toLowerCase()));
    }, [data, formData.unit, formData.program, customKegiatans, kegiatanSearch]);

    // Handle Click Outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (programDropdownRef.current && !programDropdownRef.current.contains(event.target as Node)) {
                setIsProgramDropdownOpen(false);
            }
            if (kegiatanDropdownRef.current && !kegiatanDropdownRef.current.contains(event.target as Node)) {
                setIsKegiatanDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filterBidangOptions = useMemo(() => {
        const dbBidangs = filterUnit ? data.filter(d => d.unit === filterUnit).map(d => d.bidang) : data.map(d => d.bidang);
        const staticBidangs = filterUnit ? (STRUKTUR_BIDANG[filterUnit] || []) : Object.values(STRUKTUR_BIDANG).flat();
        const customByUnit = filterUnit ? (customBidangs[filterUnit] || []) : Object.values(customBidangs).flat();
        return Array.from(new Set([...staticBidangs, ...dbBidangs, ...customByUnit])).filter(Boolean);
    }, [data, filterUnit, customBidangs]);

    const handleOpenAdd = () => {
        setEditingItem(null);
        setIsAddingNewBidang(false);
        setIsAddingNewProgram(false);
        setIsAddingNewKegiatan(false);
        setProgramSearch('');
        setKegiatanSearch('');
        setIsProgramDropdownOpen(false);
        setIsKegiatanDropdownOpen(false);
        setNewBidangName('');
        setNewProgramName('');
        setNewKegiatanName('');
        setFormData(defaultFormState);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: RKAReference) => {
        setEditingItem(item);
        setIsAddingNewBidang(false);
        setIsAddingNewProgram(false);
        setIsAddingNewKegiatan(false);
        setProgramSearch('');
        setKegiatanSearch('');
        setIsProgramDropdownOpen(false);
        setIsKegiatanDropdownOpen(false);
        setNewBidangName('');
        setNewProgramName('');
        setNewKegiatanName('');
        setFormData({
            unit: item.unit,
            bidang: item.bidang,
            standar: item.standar || '(-)',
            program: item.program,
            namaKegiatan: item.namaKegiatan || '',
            kegiatan: item.kegiatan || '',
            pelaksana: item.pelaksana || '',
            sasaran: item.sasaran || '',
            prioritas: item.prioritas || '',
            indikator: item.indikator || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus program referensi ini?')) {
            try {
                const { error } = await supabase.from('program_kegiatan').delete().eq('id', id);
                if (error) throw error;
                setData(prev => prev.filter(item => item.id !== id));
            } catch (err) {
                console.error("Error deleting:", err);
                alert("Gagal menghapus data.");
            }
        }
    };

    const handleAddNewBidang = () => {
        if (newBidangName.trim()) {
            setCustomBidangs(prev => ({
                ...prev,
                [formData.unit]: [...(prev[formData.unit] || []), newBidangName.trim()]
            }));
            setFormData(prev => ({ ...prev, bidang: newBidangName.trim() }));
            setIsAddingNewBidang(false);
            setNewBidangName('');
        }
    };

    const handleAddNewProgram = () => {
        if (newProgramName.trim()) {
            setCustomPrograms(prev => ({
                ...prev,
                [formData.unit]: [...(prev[formData.unit] || []), newProgramName.trim()]
            }));
            setFormData(prev => ({ ...prev, program: newProgramName.trim(), namaKegiatan: '' }));
            setIsAddingNewProgram(false);
            setNewProgramName('');
        }
    };

    const handleAddNewKegiatan = () => {
        if (newKegiatanName.trim()) {
            setCustomKegiatans(prev => ({
                ...prev,
                [formData.unit]: {
                    ...(prev[formData.unit] || {}),
                    [formData.program]: [...((prev[formData.unit] || {})[formData.program] || []), newKegiatanName.trim()]
                }
            }));
            setFormData(prev => ({ ...prev, namaKegiatan: newKegiatanName.trim() }));
            setIsAddingNewKegiatan(false);
            setNewKegiatanName('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        const payload = {
            unit: formData.unit,
            bidang: formData.bidang,
            standar: formData.standar,
            program: formData.program,
            nama_kegiatan: formData.namaKegiatan,
            detail_kegiatan: formData.kegiatan,
            pelaksana: formData.pelaksana,
            sasaran: formData.sasaran,
            prioritas: formData.prioritas,
            indikator: formData.indikator
        };

        try {
            if (editingItem) {
                const { data: updated, error } = await supabase
                    .from('program_kegiatan')
                    .update(payload)
                    .eq('id', editingItem.id)
                    .select()
                    .single();
                    
                if (error) throw error;
                
                if (updated) {
                    setData(prev => prev.map(item => item.id === editingItem.id ? { ...formData, id: updated.id } : item));
                }
            } else {
                const { data: inserted, error } = await supabase
                    .from('program_kegiatan')
                    .insert(payload)
                    .select()
                    .single();
                    
                if (error) throw error;
                
                if (inserted) {
                    setData(prev => [{ ...formData, id: inserted.id }, ...prev]);
                }
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error("Error saving:", err);
            alert("Gagal menyimpan data referensi.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-3 md:p-4 space-y-3 bg-slate-50/50 min-h-screen">
            {/* Compact Header */}
            <div className="bg-white rounded-xl p-3 px-4 shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-0.5">Program Referensi</h1>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Katalog Program & Kegiatan Institusi</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-lg text-[10px] transition-all shadow-md shadow-emerald-100 uppercase tracking-widest w-full sm:w-auto justify-center"
                    >
                        <Plus className="w-3.5 h-3.5" /> Tambah Program
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-2.5 px-3 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2.5 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari program atau kegiatan..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    {isCentral && (
                        <select
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-650 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                            value={filterUnit}
                            onChange={(e) => {
                                setFilterUnit(e.target.value);
                                setFilterBidang('');
                            }}
                        >
                            <option value="">Semua Unit</option>
                            {units.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    )}
                    <select
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-650 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        value={filterBidang}
                        onChange={(e) => setFilterBidang(e.target.value)}
                    >
                        <option value="">Semua Bidang</option>
                        {filterBidangOptions.map(bidang => (
                            <option key={bidang} value={bidang}>{bidang}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[300px]">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Memuat Data...</p>
                        </div>
                    </div>
                )}
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-10 text-center">No</th>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[110px]">Unit / Bidang</th>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Standar</th>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[160px]">Program</th>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[140px]">Kegiatan</th>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[220px]">Detail</th>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Pelaksana</th>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest min-w-[100px]">Sasaran</th>
                                <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!isLoading && filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-3 py-16 text-center">
                                        <div className="flex flex-col items-center gap-1.5 text-slate-350">
                                            <AlertCircle className="w-6 h-6 opacity-30" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada data ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/25 transition-colors group">
                                        <td className="px-3 py-2 text-center text-[10px] font-bold text-slate-450">{index + 1}</td>
                                        <td className="px-3 py-2">
                                            <p className="text-[9px] font-black text-slate-800 uppercase tracking-tight leading-none mb-0.5">{item.unit}</p>
                                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black rounded-md border border-emerald-100/60 uppercase tracking-tighter inline-block mt-0.5">
                                                {item.bidang}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="text-[9px] font-bold text-slate-450 uppercase italic leading-none">{item.standar}</p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="text-[10px] font-black text-slate-800 leading-snug">{item.program}</p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 leading-none">{item.prioritas}</p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="text-[10px] font-black text-emerald-700 leading-snug">{item.namaKegiatan}</p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="text-[10px] font-bold text-slate-550 leading-relaxed whitespace-pre-line">{item.kegiatan || '-'}</p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="text-[10px] font-bold text-slate-650 leading-none">{item.pelaksana || '-'}</p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="text-[10px] font-bold text-slate-450 leading-none">{item.sasaran || '-'}</p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-1 px-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all border border-transparent hover:border-emerald-100/60"
                                                    title="Edit Program"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all border border-transparent hover:border-rose-100/60"
                                                    title="Hapus Program"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Compact Header */}
                        <div className="px-4 py-3 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-650">
                                    {editingItem ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                        {editingItem ? 'Edit Program Referensi' : 'Tambah Program Referensi'}
                                    </h3>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Master Data Acuan</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-650 rounded-full transition-all border border-transparent hover:border-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Ultra Compact Form Body */}
                        <div className="overflow-y-auto custom-scrollbar scrollbar-thin">
                            <form onSubmit={handleSubmit} className="p-4 space-y-2.5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-0.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Unit / Jenjang</label>
                                        <select
                                            required
                                            disabled={!isCentral}
                                            className={`w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer ${!isCentral ? 'bg-slate-100 cursor-not-allowed opacity-80' : 'bg-slate-50 focus:bg-white'}`}
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value, bidang: '' })}
                                        >
                                            {units.map(unit => (
                                                <option key={unit} value={unit}>{unit}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-0.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Bidang / Departemen</label>
                                        {!isAddingNewBidang ? (
                                            <div className="relative">
                                                <select
                                                    required
                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                                    value={formData.bidang}
                                                    onChange={(e) => {
                                                        if (e.target.value === 'ADD_NEW') {
                                                            setIsAddingNewBidang(true);
                                                        } else {
                                                            setFormData({ ...formData, bidang: e.target.value });
                                                        }
                                                    }}
                                                >
                                                    <option value="" disabled>Pilih Bidang...</option>
                                                    {availableBidangs.map(bidang => (
                                                        <option key={bidang} value={bidang}>{bidang}</option>
                                                    ))}
                                                    <option value="ADD_NEW" className="text-emerald-600 font-black">+ TAMBAH BIDANG BARU</option>
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1.5 animate-in slide-in-from-right-2 duration-200">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    placeholder="Bidang baru..."
                                                    className="flex-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                    value={newBidangName}
                                                    onChange={(e) => setNewBidangName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddNewBidang();
                                                        }
                                                        if (e.key === 'Escape') setIsAddingNewBidang(false);
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddNewBidang}
                                                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingNewBidang(false)}
                                                    className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-0.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Standar RKA</label>
                                        <select
                                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                            value={formData.standar}
                                            onChange={(e) => setFormData({ ...formData, standar: e.target.value })}
                                        >
                                            <option value="Isi">Isi</option>
                                            <option value="Pengembangan Proses">Pengembangan Proses</option>
                                            <option value="Pengembangan Penilaian">Pengembangan Penilaian</option>
                                            <option value="Kompetensi Lulusan">Kompetensi Lulusan</option>
                                            <option value="Pengembangan Pendidik dan Tenaga Pendidikan">Pengembangan Pendidik dan Tenaga Pendidikan</option>
                                            <option value="Pengembangan Pengelolaan">Pengembangan Pengelolaan</option>
                                            <option value="Pengembangan Pembiayaan">Pengembangan Pembiayaan</option>
                                            <option value="Pengembangan Sarana dan Prasarana">Pengembangan Sarana dan Prasarana</option>
                                            <option value="(-)">(-)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-0.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Prioritas</label>
                                        <select
                                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                            value={formData.prioritas}
                                            onChange={(e) => setFormData({ ...formData, prioritas: e.target.value })}
                                        >
                                            <option value="Program Tetap & Wajib">Program Tetap & Wajib</option>
                                            <option value="Program Inti">Program Inti</option>
                                            <option value="Program Pendukung">Program Pendukung</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-0.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Pelaksana</label>
                                        <input
                                            type="text"
                                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                                            placeholder="Pelaksana..."
                                            value={formData.pelaksana}
                                            onChange={(e) => setFormData({ ...formData, pelaksana: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-0.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Sasaran</label>
                                        <input
                                            type="text"
                                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                                            placeholder="Target sasaran..."
                                            value={formData.sasaran}
                                            onChange={(e) => setFormData({ ...formData, sasaran: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-0.5 relative" ref={programDropdownRef}>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Nama Program</label>
                                    {!isAddingNewProgram ? (
                                        <div className="relative">
                                            <div 
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all flex items-center justify-between cursor-pointer"
                                                onClick={() => setIsProgramDropdownOpen(!isProgramDropdownOpen)}
                                            >
                                                <input
                                                    type="text"
                                                    placeholder={formData.program || "Cari & Pilih Program..."}
                                                    className="bg-transparent outline-none w-full cursor-pointer placeholder:text-slate-700 text-xs font-bold"
                                                    value={programSearch}
                                                    onChange={(e) => {
                                                        setProgramSearch(e.target.value);
                                                        setIsProgramDropdownOpen(true);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onFocus={() => setIsProgramDropdownOpen(true)}
                                                />
                                                <Filter className="w-3 h-3 text-slate-450 shrink-0" />
                                            </div>

                                            {isProgramDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                                                    {availablePrograms.length === 0 ? (
                                                        <div className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase text-center italic">Tidak ditemukan</div>
                                                    ) : (
                                                        availablePrograms.map(prog => (
                                                            <div
                                                                key={prog}
                                                                className="px-3 py-1.5 text-xs font-bold text-slate-650 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, program: prog, namaKegiatan: '' });
                                                                    setProgramSearch('');
                                                                    setIsProgramDropdownOpen(false);
                                                                }}
                                                            >
                                                                {prog}
                                                            </div>
                                                        ))
                                                    )}
                                                    <div
                                                        className="px-3 py-1.5 text-[10px] font-black text-emerald-600 hover:bg-emerald-600 hover:text-white cursor-pointer transition-colors border-t border-slate-100"
                                                        onClick={() => {
                                                            setIsAddingNewProgram(true);
                                                            setIsProgramDropdownOpen(false);
                                                        }}
                                                    >
                                                        + TAMBAH PROGRAM BARU
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex gap-1.5 animate-in slide-in-from-right-2 duration-200">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Program baru..."
                                                className="flex-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                value={newProgramName}
                                                onChange={(e) => setNewProgramName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') { e.preventDefault(); handleAddNewProgram(); }
                                                    if (e.key === 'Escape') setIsAddingNewProgram(false);
                                                }}
                                            />
                                            <button type="button" onClick={handleAddNewProgram} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"><Plus className="w-3.5 h-3.5" /></button>
                                            <button type="button" onClick={() => setIsAddingNewProgram(false)} className="p-1.5 bg-slate-100 text-slate-450 rounded-lg hover:bg-slate-200"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-0.5 relative" ref={kegiatanDropdownRef}>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Nama Kegiatan</label>
                                    {!isAddingNewKegiatan ? (
                                        <div className="relative">
                                            <div 
                                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all flex items-center justify-between cursor-pointer"
                                                onClick={() => setIsKegiatanDropdownOpen(!isKegiatanDropdownOpen)}
                                            >
                                                <input
                                                    type="text"
                                                    placeholder={formData.namaKegiatan || "Cari & Pilih Kegiatan..."}
                                                    className="bg-transparent outline-none w-full cursor-pointer placeholder:text-slate-700 text-xs font-bold"
                                                    value={kegiatanSearch}
                                                    onChange={(e) => {
                                                        setKegiatanSearch(e.target.value);
                                                        setIsKegiatanDropdownOpen(true);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onFocus={() => setIsKegiatanDropdownOpen(true)}
                                                />
                                                <Filter className="w-3 h-3 text-slate-455 shrink-0" />
                                            </div>

                                            {isKegiatanDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                                                    {availableKegiatans.length === 0 ? (
                                                        <div className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase text-center italic">Tidak ditemukan</div>
                                                    ) : (
                                                        availableKegiatans.map(keg => (
                                                            <div
                                                                key={keg}
                                                                className="px-3 py-1.5 text-xs font-bold text-slate-650 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, namaKegiatan: keg });
                                                                    setKegiatanSearch('');
                                                                    setIsKegiatanDropdownOpen(false);
                                                                }}
                                                            >
                                                                {keg}
                                                            </div>
                                                        ))
                                                    )}
                                                    <div
                                                        className="px-3 py-1.5 text-[10px] font-black text-emerald-600 hover:bg-emerald-600 hover:text-white cursor-pointer transition-colors border-t border-slate-100"
                                                        onClick={() => {
                                                            setIsAddingNewKegiatan(true);
                                                            setIsKegiatanDropdownOpen(false);
                                                        }}
                                                    >
                                                        + TAMBAH KEGIATAN BARU
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex gap-1.5 animate-in slide-in-from-right-2 duration-200">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Kegiatan baru..."
                                                className="flex-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                value={newKegiatanName}
                                                onChange={(e) => setNewKegiatanName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') { e.preventDefault(); handleAddNewKegiatan(); }
                                                    if (e.key === 'Escape') setIsAddingNewKegiatan(false);
                                                }}
                                            />
                                            <button type="button" onClick={handleAddNewKegiatan} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"><Plus className="w-3.5 h-3.5" /></button>
                                            <button type="button" onClick={() => setIsAddingNewKegiatan(false)} className="p-1.5 bg-slate-100 text-slate-450 rounded-lg hover:bg-slate-200"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-0.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Detail Rincian Kegiatan</label>
                                    <textarea
                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none min-h-[50px] transition-all resize-none leading-normal"
                                        placeholder="Detail kegiatan (opsional)..."
                                        value={formData.kegiatan}
                                        onChange={(e) => setFormData({ ...formData, kegiatan: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-0.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Indikator Keberhasilan (Target Output)</label>
                                    <textarea
                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none min-h-[50px] transition-all resize-none leading-normal"
                                        placeholder="Output keberhasilan..."
                                        value={formData.indikator}
                                        onChange={(e) => setFormData({ ...formData, indikator: e.target.value })}
                                    />
                                </div>

                                <div className="pt-2 flex gap-2 sticky bottom-0 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={isSaving}
                                        className="flex-1 py-2 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-[2] py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
                                        ) : (
                                            <><Save className="w-3.5 h-3.5" /> Simpan Data</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
