'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, ChevronDown, Filter, FileText, CheckCircle2, AlertCircle, BookOpen, Save } from 'lucide-react';

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
    'Asrama Putri': ['Sekretaris', 'Bendahara', 'Pendidikan Dan Pengasuhan', 'Kesantrian Dan Kedisiplinan', 'Pondok Tahfidz', 'Kesehatan Dan Kesejahteraan', 'Sarana Dan Kebersihan Lingkungan']
};

const REFERENCE_RKA: Record<string, Record<string, string[]>> = {};

const INITIAL_DATA: RKAReference[] = [];

export default function RKAReferencePage() {
    const [data, setData] = useState<RKAReference[]>(INITIAL_DATA);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [filterBidang, setFilterBidang] = useState('');

    // Custom Bidangs State
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
    const [formData, setFormData] = useState<Omit<RKAReference, 'id'>>({
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
    });

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch =
                item.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.kegiatan.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesUnit = filterUnit === '' || item.unit === filterUnit;
            const matchesBidang = filterBidang === '' || item.bidang === filterBidang;
            return matchesSearch && matchesUnit && matchesBidang;
        });
    }, [data, searchQuery, filterUnit, filterBidang]);

    const units = useMemo(() => Object.keys(STRUKTUR_BIDANG), []);
    const availableBidangs = useMemo(() => {
        const base = STRUKTUR_BIDANG[formData.unit] || [];
        const custom = customBidangs[formData.unit] || [];
        return [...base, ...custom];
    }, [formData.unit, customBidangs]);

    const availablePrograms = useMemo(() => {
        const base = Object.keys(REFERENCE_RKA[formData.unit] || {});
        const custom = customPrograms[formData.unit] || [];
        const all = Array.from(new Set([...base, ...custom]));
        if (!programSearch) return all;
        return all.filter(p => p.toLowerCase().includes(programSearch.toLowerCase()));
    }, [formData.unit, customPrograms, programSearch]);

    const availableKegiatans = useMemo(() => {
        const base = (REFERENCE_RKA[formData.unit] || {})[formData.program] || [];
        const custom = (customKegiatans[formData.unit] || {})[formData.program] || [];
        const all = Array.from(new Set([...base, ...custom]));
        if (!kegiatanSearch) return all;
        return all.filter(k => k.toLowerCase().includes(kegiatanSearch.toLowerCase()));
    }, [formData.unit, formData.program, customKegiatans, kegiatanSearch]);

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
        const filteredByUnit = filterUnit ? (STRUKTUR_BIDANG[filterUnit] || []) : Object.values(STRUKTUR_BIDANG).flat();
        const customByUnit = filterUnit ? (customBidangs[filterUnit] || []) : Object.values(customBidangs).flat();
        return Array.from(new Set([...filteredByUnit, ...customByUnit]));
    }, [filterUnit, customBidangs]);

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
        setFormData({
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
        });
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
            kegiatan: item.kegiatan,
            pelaksana: item.pelaksana,
            sasaran: item.sasaran,
            prioritas: item.prioritas,
            indikator: item.indikator
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus program referensi ini?')) {
            setData(prev => prev.filter(item => item.id !== id));
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            setData(prev => prev.map(item => item.id === editingItem.id ? { ...formData, id: item.id } : item));
        } else {
            const newId = (Math.max(0, ...data.map(item => parseInt(item.id))) + 1).toString();
            setData(prev => [...prev, { ...formData, id: newId }]);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-700">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">Program</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Katalog Program & Kegiatan Institusi</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4" /> Tambah Program
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari program atau kegiatan..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500"
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
                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500"
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">No</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Unit / Bidang</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[150px]">Standar</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Program</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[180px]">Kegiatan</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[250px]">Detail</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[150px]">Pelaksana</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Sasaran</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <AlertCircle className="w-8 h-8 opacity-20" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Tidak ada data ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-4 py-3 text-center text-[11px] font-bold text-slate-400">{index + 1}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{item.unit}</p>
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-100 uppercase tracking-tighter mt-1 inline-block">
                                                {item.bidang}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase italic">{item.standar}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[11px] font-black text-slate-800 leading-tight">{item.program}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{item.prioritas}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[11px] font-black text-emerald-700 leading-tight">{item.namaKegiatan}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{item.kegiatan}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[11px] font-bold text-slate-700">{item.pelaksana}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[11px] font-bold text-slate-500">{item.sasaran}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
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
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Compact Header */}
                        <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                                    {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                        {editingItem ? 'Edit Program' : 'Tambah Program Baru'}
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Master Data Acuan</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all border border-transparent hover:border-slate-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Ultra Compact Form Body */}
                        <div className="overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit / Jenjang</label>
                                        <select
                                            required
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value, bidang: '' })}
                                        >
                                            {units.map(unit => (
                                                <option key={unit} value={unit}>{unit}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bidang / Departemen</label>
                                        {!isAddingNewBidang ? (
                                            <div className="relative">
                                                <select
                                                    required
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
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
                                            <div className="flex gap-2 animate-in slide-in-from-right-2 duration-200">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    placeholder="Nama bidang baru..."
                                                    className="flex-1 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
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
                                                    className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingNewBidang(false)}
                                                    className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Standar</label>
                                        <select
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                            value={formData.standar}
                                            onChange={(e) => setFormData({ ...formData, standar: e.target.value })}
                                        >
                                            <option value="Kompetensi Lulusan">Kompetensi Lulusan</option>
                                            <option value="Isi">Isi</option>
                                            <option value="Proses">Proses</option>
                                            <option value="Pendidik Dan Tenaga Kependidikan">Pendidik Dan Tenaga Kependidikan</option>
                                            <option value="Pengembangan Sarana Dan Prasarana">Pengembangan Sarana Dan Prasarana</option>
                                            <option value="Pengembangan Pengelolaan">Pengembangan Pengelolaan</option>
                                            <option value="Pengembangan Pembiayaan">Pengembangan Pembiayaan</option>
                                            <option value="Pengembangan Penilaian">Pengembangan Penilaian</option>
                                            <option value="(-)">(-)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prioritas</label>
                                        <select
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                            value={formData.prioritas}
                                            onChange={(e) => setFormData({ ...formData, prioritas: e.target.value })}
                                        >
                                            <option value="Program Tetap & Wajib">Program Tetap & Wajib</option>
                                            <option value="Program Inti">Program Inti</option>
                                            <option value="Program Pendukung">Program Pendukung</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pelaksana</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                                            placeholder="Jabatan pelaksana..."
                                            value={formData.pelaksana}
                                            onChange={(e) => setFormData({ ...formData, pelaksana: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1 relative" ref={programDropdownRef}>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Program</label>
                                    {!isAddingNewProgram ? (
                                        <div className="relative">
                                            <div 
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all flex items-center justify-between cursor-pointer"
                                                onClick={() => setIsProgramDropdownOpen(!isProgramDropdownOpen)}
                                            >
                                                <input
                                                    type="text"
                                                    placeholder={formData.program || "Cari & Pilih Program..."}
                                                    className="bg-transparent outline-none w-full cursor-pointer placeholder:text-slate-700"
                                                    value={programSearch}
                                                    onChange={(e) => {
                                                        setProgramSearch(e.target.value);
                                                        setIsProgramDropdownOpen(true);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onFocus={() => setIsProgramDropdownOpen(true)}
                                                />
                                                <Filter className="w-3 h-3 text-slate-400" />
                                            </div>

                                            {isProgramDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                                                    {availablePrograms.length === 0 ? (
                                                        <div className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-center italic">Tidak ditemukan</div>
                                                    ) : (
                                                        availablePrograms.map(prog => (
                                                            <div
                                                                key={prog}
                                                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
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
                                                        className="px-4 py-2 text-xs font-black text-emerald-600 hover:bg-emerald-600 hover:text-white cursor-pointer transition-colors border-t border-slate-100"
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
                                        <div className="flex gap-2 animate-in slide-in-from-right-2 duration-200">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Nama program baru..."
                                                className="flex-1 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                value={newProgramName}
                                                onChange={(e) => setNewProgramName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') { e.preventDefault(); handleAddNewProgram(); }
                                                    if (e.key === 'Escape') setIsAddingNewProgram(false);
                                                }}
                                            />
                                            <button type="button" onClick={handleAddNewProgram} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"><Plus className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => setIsAddingNewProgram(false)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200"><X className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1 relative" ref={kegiatanDropdownRef}>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Kegiatan</label>
                                    {!isAddingNewKegiatan ? (
                                        <div className="relative">
                                            <div 
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all flex items-center justify-between cursor-pointer"
                                                onClick={() => setIsKegiatanDropdownOpen(!isKegiatanDropdownOpen)}
                                            >
                                                <input
                                                    type="text"
                                                    placeholder={formData.namaKegiatan || "Cari & Pilih Kegiatan..."}
                                                    className="bg-transparent outline-none w-full cursor-pointer placeholder:text-slate-700"
                                                    value={kegiatanSearch}
                                                    onChange={(e) => {
                                                        setKegiatanSearch(e.target.value);
                                                        setIsKegiatanDropdownOpen(true);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onFocus={() => setIsKegiatanDropdownOpen(true)}
                                                />
                                                <Filter className="w-3 h-3 text-slate-400" />
                                            </div>

                                            {isKegiatanDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                                                    {availableKegiatans.length === 0 ? (
                                                        <div className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-center italic">Tidak ditemukan</div>
                                                    ) : (
                                                        availableKegiatans.map(keg => (
                                                            <div
                                                                key={keg}
                                                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
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
                                                        className="px-4 py-2 text-xs font-black text-emerald-600 hover:bg-emerald-600 hover:text-white cursor-pointer transition-colors border-t border-slate-100"
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
                                        <div className="flex gap-2 animate-in slide-in-from-right-2 duration-200">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Nama kegiatan baru..."
                                                className="flex-1 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                value={newKegiatanName}
                                                onChange={(e) => setNewKegiatanName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') { e.preventDefault(); handleAddNewKegiatan(); }
                                                    if (e.key === 'Escape') setIsAddingNewKegiatan(false);
                                                }}
                                            />
                                            <button type="button" onClick={handleAddNewKegiatan} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"><Plus className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => setIsAddingNewKegiatan(false)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200"><X className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Detail Kegiatan</label>
                                    <textarea
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none min-h-[80px] transition-all resize-none"
                                        placeholder="Rincian kegiatan yang akan dilakukan..."
                                        value={formData.kegiatan}
                                        onChange={(e) => setFormData({ ...formData, kegiatan: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sasaran</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                                            placeholder="Target sasaran..."
                                            value={formData.sasaran}
                                            onChange={(e) => setFormData({ ...formData, sasaran: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Indikator Keberhasilan</label>
                                        <textarea
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none min-h-[80px] transition-all resize-none"
                                            placeholder="Target output..."
                                            value={formData.indikator}
                                            onChange={(e) => setFormData({ ...formData, indikator: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3 sticky bottom-0 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-2.5 bg-slate-100 text-slate-500 text-xs font-black rounded-xl uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Simpan Data
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
