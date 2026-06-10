'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
    Banknote, 
    Building2, 
    Layers, 
    Plus, 
    Trash2, 
    RefreshCw, 
    AlertTriangle, 
    CheckCircle2,
    Lock,
    Unlock,
    HelpCircle
} from 'lucide-react';

interface BidangItem {
    id: string;
    unit_name: string;
    nama_bidang: string;
}

interface SumberDanaItem {
    id: string;
    unit_name: string;
    nama_sumber_dana: string;
    kategori_pembatasan?: string;
}

const ALL_UNITS = [
    'Pusat (Yayasan)',
    'TK',
    'Diniyah',
    'SDIT 1',
    'SDIT 2',
    'MTs',
    'MA',
    'THQ',
    'Asrama Putra',
    'Asrama Putri',
    'Dapur Asrama Putra',
    'Dapur Asrama Putri'
];

// Fallback defaults to show when database has no customized records yet
const DEFAULT_BIDANG: Record<string, string[]> = {
    'Pusat (Yayasan)': ['Kesekretariatan', 'Pendidikan', 'Sumber Daya Insani', 'Kesejahteraan Sosial', 'Sarana', 'Keuangan', 'Penelitian Dan Pengembangan'],
    'TK': ['Kurikulum', 'Sarana', 'Humas', 'Kesejahteraan', 'Tata Usaha (TU)', 'Bendahara', 'Bimbingan & Konseling (BK)', 'Kesantrian', 'Mudir'],
    'Diniyah': ['Kurikulum', 'Sarana', 'Humas', 'Bendahara', 'Kesantrian'],
    'SDIT 1': ['Kurikulum', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Humas', 'Kesiswaan', 'Sarana', 'Tenaga Administari Sekolah (TAS)', 'Bendahara', 'Kesekretariatan'],
    'SDIT 2': ['Kurikulum', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Humas', 'Kesiswaan', 'Sarana', 'Tenaga Administari Sekolah (TAS)', 'Bendahara', 'Kesekretariatan'],
    'MTs': ['Kurikulum', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Humas', 'Kesantrian', 'Sarana', 'Perpustakaan', 'Bimbingan & Konseling (BK)', 'Kordinator Ekstrakurikuler', 'Lembaga Bahasa', 'Kordinator Pengembangan Prestasi', 'Lab Komputer', 'Tenaga Administari Sekolah (TAS)', 'Bendahara', 'Mudir'],
    'MA': ['Kurikulum', 'Bimbingan & Konseling (BK)', 'Lembaga Pengembangan Bahasa Asing (LPBA)', 'Kesantrian', 'Humas', 'Kordinator Piket', 'Pembina RG-UG', 'Kordinator Ekstrakurikuler', 'Perpustakaan', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Mudir', 'Tenaga Administari Madrasah (TAM)', 'Operator', 'Kordinator Pengembangan Prestasi', 'Pendidik & Tenaga Kependidikan (PTK)', 'Lab Komputer', 'Lab Sains', 'Bendahara'],
    'Asrama Putra': ['Sekretaris', 'Bendahara', 'Pendidikan Dan Pengasuhan', 'Kesantrian Dan Kedisiplinan', 'Pondok Tahfidz', 'Kesehatan Dan Kesejahteraan', 'Sarana Dan Kebersihan Lingkungan'],
    'Asrama Putri': ['Sekretaris', 'Bendahara', 'Pendidikan Dan Pengasuhan', 'Kesantrian Dan Kedisiplinan', 'Pondok Tahfidz', 'Kesehatan Dan Kesejahteraan', 'Sarana Dan Kebersihan Lingkungan'],
    'THQ': ['Sekretaris', 'Bendahara', 'Pendidikan Dan Pengasuhan', 'Kesantrian Dan Kedisiplinan', 'Pondok Tahfidz', 'Kesehatan Dan Kesejahteraan', 'Sarana Dan Kebersihan Lingkungan'],
    'Dapur Asrama Putra': ['Pengadaan Bahan', 'Operasional Dapur'],
    'Dapur Asrama Putri': ['Pengadaan Bahan', 'Operasional Dapur']
};

const DEFAULT_SUMBER_DANA: Record<string, string[]> = {
    'Pusat (Yayasan)': ['Dana SPP', 'Dana Zakat', 'Dana Wakaf', 'Dana Infaq', 'Laba Usaha Koperasi', 'Laba Usaha Poskestren', 'Tabungan Wajib', 'Tabungan Siswa', 'Uang Saku'],
    'TK': ['Dana BOS', 'Dana Pesantren/Yayasan', 'Tabungan Siswa', 'Iuran Non-Wajib'],
    'SDIT 1': ['Dana BOS', 'Dana Pesantren/Yayasan', 'Tabungan Siswa'],
    'SDIT 2': ['Dana BOS', 'Dana Pesantren/Yayasan', 'Tabungan Siswa'],
    'MTs': ['Dana BOS', 'Dana Pesantren/Yayasan', 'Tabungan Siswa'],
    'MA': ['Dana BOS', 'Dana Pesantren/Yayasan', 'Tabungan Siswa'],
    'Diniyah': ['Dana Pesantren/Yayasan', 'Subsidi Pesantren', 'Infaq Siswa'],
    'Asrama Putra': ['Dana Pesantren/Yayasan', 'Kas Internal', 'Uang Saku'],
    'Asrama Putri': ['Dana Pesantren/Yayasan', 'Kas Internal', 'Uang Saku'],
    'THQ': ['Dana Pesantren/Yayasan', 'Uang Saku', 'Tabungan Siswa'],
    'Dapur Asrama Putra': ['Kas Internal'],
    'Dapur Asrama Putri': ['Kas Internal']
};

export default function KelolaSumberDanaPage() {
    const [selectedUnit, setSelectedUnit] = useState('');
    const [userRole, setUserRole] = useState('');
    const [assignedUnit, setAssignedUnit] = useState('');
    const [isCenterUser, setIsCenterUser] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Custom database records
    const [bidangs, setBidangs] = useState<BidangItem[]>([]);
    const [sources, setSources] = useState<SumberDanaItem[]>([]);

    // Loading states for actions
    const [isSavingBidang, setIsSavingBidang] = useState(false);
    const [isSavingSource, setIsSavingSource] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form inputs
    const [newBidangName, setNewBidangName] = useState('');
    const [newSourceName, setNewSourceName] = useState('');
    const [newSourceKategori, setNewSourceKategori] = useState('Tanpa Pembatasan');

    // Messages
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        loadUserProfile();
    }, []);

    useEffect(() => {
        if (selectedUnit) {
            loadUnitData(selectedUnit);
        }
    }, [selectedUnit]);

    const loadUserProfile = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('*, unit:unit_id(name)')
                .eq('id', user.id)
                .maybeSingle();

            if (profile) {
                const activeRoleKey = `activeRole_${user.id}`;
                const activeUnitKey = `activeUnit_${user.id}`;
                const dbRoleName = typeof profile.role === 'string' ? profile.role : (profile.role?.name || '');
                const roleName = localStorage.getItem(activeRoleKey) || dbRoleName;
                const unitName = localStorage.getItem(activeUnitKey) || profile.unit?.name || 'Pusat (Yayasan)';

                setUserRole(roleName);
                setAssignedUnit(unitName);

                const centerRoles = ['ADMINISTRATOR', 'BENDAHARA_PUSAT'];
                const center = centerRoles.includes(roleName);
                setIsCenterUser(center);

                // Lock selection if not center user
                if (!center) {
                    setSelectedUnit(unitName);
                } else {
                    setSelectedUnit(unitName || 'Pusat (Yayasan)');
                }
            }
        } catch (err) {
            console.error("Error loading user profile:", err);
            setErrorMessage("Gagal memuat profil pengguna.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadUnitData = async (unitName: string) => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const supabase = createClient();

            // 1. Fetch customized Bidangs from DB
            const { data: dbBidangs, error: errorBidang } = await supabase
                .from('pengaturan_bidang')
                .select('*')
                .eq('unit_name', unitName);

            if (errorBidang) throw errorBidang;
            setBidangs(dbBidangs || []);

            // 2. Fetch customized Sources from DB
            const { data: dbSources, error: errorSources } = await supabase
                .from('pengaturan_sumber_dana')
                .select('*')
                .eq('unit_name', unitName);

            if (errorSources) throw errorSources;
            setSources(dbSources || []);
        } catch (err: any) {
            console.error("Error loading unit dynamic metadata:", err);
            setErrorMessage("Gagal memuat data pengaturan unit. Pastikan skrip migrasi SQL telah dijalankan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBidang = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const name = newBidangName.trim();
        if (!name) return;

        // Check duplicates
        if (bidangs.find(b => b.nama_bidang.toLowerCase() === name.toLowerCase())) {
            alert('Nama bidang/departemen ini sudah terdaftar.');
            return;
        }

        setIsSavingBidang(true);
        setErrorMessage(null);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('pengaturan_bidang')
                .insert({
                    unit_name: selectedUnit,
                    nama_bidang: name
                })
                .select()
                .single();

            if (error) throw error;

            setBidangs(prev => [...prev, data]);
            setNewBidangName('');
            showToast(`Bidang "${name}" berhasil ditambahkan!`);
        } catch (err: any) {
            console.error("Error adding bidang:", err);
            setErrorMessage("Gagal menambahkan bidang baru. Silakan coba lagi.");
        } finally {
            setIsSavingBidang(false);
        }
    };

    const handleAddSource = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const name = newSourceName.trim();
        if (!name) return;

        // Check duplicates
        if (sources.find(s => s.nama_sumber_dana.toLowerCase() === name.toLowerCase())) {
            alert('Sumber dana ini sudah terdaftar.');
            return;
        }

        setIsSavingSource(true);
        setErrorMessage(null);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('pengaturan_sumber_dana')
                .insert({
                    unit_name: selectedUnit,
                    nama_sumber_dana: name,
                    kategori_pembatasan: newSourceKategori
                })
                .select()
                .single();

            if (error) throw error;

            setSources(prev => [...prev, data]);
            setNewSourceName('');
            setNewSourceKategori('Tanpa Pembatasan');
            showToast(`Sumber dana "${name}" berhasil ditambahkan!`);
        } catch (err: any) {
            console.error("Error adding source:", err);
            setErrorMessage("Gagal menambahkan sumber dana baru. Silakan coba lagi.");
        } finally {
            setIsSavingSource(false);
        }
    };

    const handleDeleteBidang = async (id: string, name: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus bidang "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
            return;
        }

        setDeletingId(id);
        setErrorMessage(null);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('pengaturan_bidang')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setBidangs(prev => prev.filter(b => b.id !== id));
            showToast(`Bidang "${name}" berhasil dihapus.`);
        } catch (err: any) {
            console.error("Error deleting bidang:", err);
            setErrorMessage(`Gagal menghapus bidang "${name}".`);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteSource = async (id: string, name: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus sumber dana "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
            return;
        }

        setDeletingId(id);
        setErrorMessage(null);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('pengaturan_sumber_dana')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSources(prev => prev.filter(s => s.id !== id));
            showToast(`Sumber dana "${name}" berhasil dihapus.`);
        } catch (err: any) {
            console.error("Error deleting source:", err);
            setErrorMessage(`Gagal menghapus sumber dana "${name}".`);
        } finally {
            setDeletingId(null);
        }
    };

    // Helper to trigger success toast
    const showToast = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // Auto load current fallback list if DB is empty
    const activeFallbackBidang = DEFAULT_BIDANG[selectedUnit] || ['Umum'];
    const activeFallbackSources = DEFAULT_SUMBER_DANA[selectedUnit] || ['Dana Pesantren/Yayasan'];

    if (isLoading && !selectedUnit) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest animate-pulse">Memuat Pengaturan Profil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 md:p-4 space-y-3 bg-slate-50/50 min-h-screen">
            
            {/* Unified Compact Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 px-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-md shadow-slate-100">
                        <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none mb-0.5">Kelola Bidang & Dana</h1>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Kustomisasi Departemen / Bidang & Anggaran Unit Pesantren</p>
                    </div>
                </div>

                {/* Compact Controls Area */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Lock Status / Info mini-badge */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${isCenterUser ? 'bg-amber-50 text-amber-600 border border-amber-200/50' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {isCenterUser ? <Unlock className="w-3 h-3 animate-pulse" /> : <Lock className="w-3 h-3" />}
                        {isCenterUser ? 'Akses Pusat' : 'Akses Terkunci'}
                    </div>

                    {/* Unit Selector */}
                    {isCenterUser ? (
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <select 
                                value={selectedUnit}
                                onChange={(e) => setSelectedUnit(e.target.value)}
                                className="bg-transparent text-slate-700 font-black focus:outline-none cursor-pointer text-[10px] uppercase outline-none"
                            >
                                {ALL_UNITS.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="bg-slate-50 text-slate-650 border border-slate-250 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            {selectedUnit}
                        </div>
                    )}

                    <button 
                        onClick={() => loadUnitData(selectedUnit)}
                        className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-650 text-[10px] font-black px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest shrink-0"
                    >
                        <RefreshCw className="w-3 h-3" /> Reload
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {errorMessage && (
                <div className="bg-rose-50 border border-rose-250 text-rose-800 p-2.5 px-4 rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <p className="text-[11px] font-bold leading-none">{errorMessage}</p>
                </div>
            )}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-2.5 px-4 rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-[11px] font-bold leading-none">{successMessage}</p>
                </div>
            )}

            {/* DUAL PANELS (BIDANG & SUMBER DANA) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* 1. BIDANG / DEPARTEMEN PANEL */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 px-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-650 shrink-0">
                                <Layers className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <h2 className="text-xs font-black text-slate-800 tracking-tight uppercase leading-none mb-0.5">Daftar Bidang / Departemen</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Grup Kegiatan Anggaran {selectedUnit}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{bidangs.length || activeFallbackBidang.length} Item</span>
                    </div>

                    {/* Inline Form to Add Bidang */}
                    <form onSubmit={handleAddBidang} className="p-2.5 px-4 border-b border-slate-100 bg-slate-50/20">
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={newBidangName}
                                onChange={(e) => setNewBidangName(e.target.value)}
                                placeholder="Tambah Bidang/Dept Baru..."
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 placeholder-slate-350 focus:outline-none focus:border-emerald-600 transition-colors"
                                disabled={isSavingBidang}
                            />
                            <button
                                type="submit"
                                disabled={isSavingBidang || !newBidangName.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 px-3 rounded-lg disabled:opacity-50 transition-colors shrink-0 flex items-center justify-center text-xs font-black uppercase tracking-wider gap-1"
                            >
                                <Plus className="w-4 h-4" /> Tambah
                            </button>
                        </div>
                    </form>

                    {/* Bidangs List */}
                    <div className="p-3 px-4 flex-1 overflow-y-auto max-h-[300px] scrollbar-thin">
                        {bidangs.length === 0 ? (
                            <div className="space-y-2.5">
                                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-2.5 px-4 rounded-xl flex items-start gap-2.5">
                                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-black uppercase">Menggunakan Daftar Bidang Bawaan</p>
                                        <p className="text-[9px] text-blue-600 font-bold mt-0.5 leading-relaxed">
                                            Anda belum menambahkan Bidang kustom. Sistem menampilkan data default pesantren. Tambahkan item di atas untuk mulai membuat daftar dinamis Anda.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-1.5">
                                    {activeFallbackBidang.map((fb, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-200/60 p-1.5 px-2.5 rounded-lg text-[10px] font-black text-slate-550 uppercase tracking-wide truncate" title={fb}>
                                            {fb}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-1.5">
                                {bidangs.map((b) => (
                                    <div key={b.id} className="flex justify-between items-center bg-slate-50 border border-slate-200/50 p-2 px-3 rounded-xl group hover:border-slate-355 transition-colors">
                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide truncate mr-2" title={b.nama_bidang}>{b.nama_bidang}</span>
                                        <button
                                            onClick={() => handleDeleteBidang(b.id, b.nama_bidang)}
                                            disabled={deletingId === b.id}
                                            className="text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                                            title="Hapus Bidang"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. SUMBER DANA PANEL */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 px-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-650 shrink-0">
                                <Banknote className="w-3.5 h-3.5" />
                            </div>
                            <div>
                                <h2 className="text-xs font-black text-slate-800 tracking-tight uppercase leading-none mb-0.5">Daftar Sumber Dana</h2>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alokasi Anggaran {selectedUnit}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{sources.length || activeFallbackSources.length} Item</span>
                    </div>

                    {/* Inline Form to Add Source */}
                    <form onSubmit={handleAddSource} className="p-2.5 px-4 border-b border-slate-100 bg-slate-50/20">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                                type="text"
                                value={newSourceName}
                                onChange={(e) => setNewSourceName(e.target.value)}
                                placeholder="Tambah Sumber Dana Baru..."
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 placeholder-slate-350 focus:outline-none focus:border-emerald-600 transition-colors"
                                disabled={isSavingSource}
                            />
                            <select
                                value={newSourceKategori}
                                onChange={(e) => setNewSourceKategori(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600 transition-colors w-full sm:w-auto"
                                disabled={isSavingSource}
                            >
                                <option value="Tanpa Pembatasan">Tanpa Pembatasan</option>
                                <option value="Dengan Pembatasan">Dengan Pembatasan</option>
                            </select>
                            <button
                                type="submit"
                                disabled={isSavingSource || !newSourceName.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 px-3 rounded-lg disabled:opacity-50 transition-colors shrink-0 flex items-center justify-center text-xs font-black uppercase tracking-wider gap-1"
                            >
                                <Plus className="w-4 h-4" /> Tambah
                            </button>
                        </div>
                    </form>

                    {/* Sources List */}
                    <div className="p-3 px-4 flex-1 overflow-y-auto max-h-[300px] scrollbar-thin">
                        {sources.length === 0 ? (
                            <div className="space-y-2.5">
                                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-2.5 px-4 rounded-xl flex items-start gap-2.5">
                                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-black uppercase">Menggunakan Daftar Sumber Dana Bawaan</p>
                                        <p className="text-[9px] text-blue-600 font-bold mt-0.5 leading-relaxed">
                                            Anda belum menambahkan Sumber Dana kustom. Sistem menampilkan data default pesantren. Tambahkan item di atas untuk mulai membuat daftar dinamis Anda.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-1.5">
                                    {activeFallbackSources.map((fb, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-200/60 p-1.5 px-2.5 rounded-lg text-[10px] font-black text-slate-550 uppercase tracking-wide truncate" title={fb}>
                                            {fb}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-1.5">
                                {sources.map((s) => (
                                    <div key={s.id} className="flex justify-between items-center bg-slate-50 border border-slate-200/50 p-2 px-3 rounded-xl group hover:border-slate-355 transition-colors">
                                        <div className="flex flex-col overflow-hidden mr-2">
                                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide truncate" title={s.nama_sumber_dana}>{s.nama_sumber_dana}</span>
                                            {s.kategori_pembatasan && (
                                                <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 w-fit px-1.5 py-0.5 rounded ${s.kategori_pembatasan === 'Dengan Pembatasan' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                                    {s.kategori_pembatasan}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSource(s.id, s.nama_sumber_dana)}
                                            disabled={deletingId === s.id}
                                            className="text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                                            title="Hapus Sumber Dana"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
