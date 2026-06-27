'use client';

import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    CheckCircle, 
    XCircle, 
    X,
    AlertCircle,
    Database,
    ArrowUp, 
    ArrowDown, 
    ArrowUpDown,
    Download
} from 'lucide-react';
import { getKaryawan, upsertKaryawan, toggleKaryawanStatus, deleteKaryawan } from './actions';
import ExcelJS from 'exceljs';

const UNITS = [
    'TK', 
    'SDIT 1', 
    'SDIT 2', 
    'MTs', 
    'MA', 
    'Yayasan/Pesantren (Pusat)', 
    'THQ', 
    'Diniyah', 
    'Asrama Putra', 
    'Asrama Putri', 
    'Dapur Asrama Putra', 
    'Dapur Asrama Putri'
];

export default function KelolaKaryawanPage() {
    const [karyawan, setKaryawan] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tableError, setTableError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Sort State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Form State
    const [formData, setFormData] = useState<{
        id: string;
        nama: string;
        nik: string;
        jabatan: string;
        unit: string[];
        no_hp: string;
        email: string;
        alamat: string;
        is_active: boolean;
    }>({
        id: '',
        nama: '',
        nik: '',
        jabatan: '',
        unit: ['Yayasan/Pesantren (Pusat)'],
        no_hp: '',
        email: '',
        alamat: '',
        is_active: true
    });

    const fetchData = async () => {
        setIsLoading(true);
        const res = await getKaryawan();
        if (res.error === 'TABLE_NOT_FOUND') {
            setTableError(true);
        } else if (res.success) {
            setKaryawan(res.data);
            setTableError(false);
        } else {
            console.error('Error fetching data:', res.error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (item?: any) => {
        if (item) {
            setFormData({
                id: item.id,
                nama: item.nama || '',
                nik: item.nik || '',
                jabatan: item.jabatan || '',
                unit: item.unit ? item.unit.split(', ') : ['Yayasan/Pesantren (Pusat)'],
                no_hp: item.no_hp || '',
                email: item.email || '',
                alamat: item.alamat || '',
                is_active: item.is_active
            });
        } else {
            setFormData({
                id: '',
                nama: '',
                nik: '',
                jabatan: '',
                unit: ['Yayasan/Pesantren (Pusat)'],
                no_hp: '',
                email: '',
                alamat: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const res = await upsertKaryawan(formData);
        setIsSaving(false);
        if (res.success) {
            setIsModalOpen(false);
            fetchData();
        } else {
            alert('Gagal menyimpan data karyawan: ' + res.error);
        }
    };

    const handleDelete = async (id: string, nama: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus data karyawan ${nama}?`)) {
            const res = await deleteKaryawan(id);
            if (res.success) fetchData();
            else alert('Gagal menghapus data: ' + res.error);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const res = await toggleKaryawanStatus(id, !currentStatus);
        if (res.success) fetchData();
        else alert('Gagal mengubah status: ' + res.error);
    };

    const filteredData = karyawan.filter(k => 
        k.nama?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        k.nik?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.unit?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        
        let aValue = a[key] ?? '';
        let bValue = b[key] ?? '';
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleExportExcel = async () => {
        if (sortedData.length === 0) {
            alert('Tidak ada data karyawan untuk diekspor!');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Data Karyawan');

            worksheet.columns = [
                { header: 'No', key: 'no', width: 6 },
                { header: 'Nama Lengkap', key: 'nama', width: 28 },
                { header: 'NIK', key: 'nik', width: 20 },
                { header: 'Jabatan', key: 'jabatan', width: 22 },
                { header: 'Unit Penempatan', key: 'unit', width: 30 },
                { header: 'Nomor HP/WA', key: 'no_hp', width: 18 },
                { header: 'Alamat Email', key: 'email', width: 25 },
                { header: 'Alamat Lengkap', key: 'alamat', width: 40 },
                { header: 'Status', key: 'status', width: 15 }
            ];

            sortedData.forEach((k, idx) => {
                worksheet.addRow({
                    no: idx + 1,
                    nama: k.nama,
                    nik: k.nik || '-',
                    jabatan: k.jabatan,
                    unit: k.unit,
                    no_hp: k.no_hp,
                    email: k.email,
                    alamat: k.alamat,
                    status: k.is_active ? 'Aktif' : 'Non-Aktif'
                });
            });

            // Styling Header
            const headerRow = worksheet.getRow(1);
            headerRow.height = 24;
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Times New Roman', size: 11, bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70C160' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            });

            // Styling Data Rows
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                row.height = 20;
                row.eachCell((cell, colNumber) => {
                    cell.font = { name: 'Times New Roman', size: 11 };
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                    if (colNumber === 1 || colNumber === 9) { // No and Status
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    }
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Data_Karyawan_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error generating Excel file:', error);
            alert('Gagal mengekspor data ke Excel.');
        }
    };

    if (tableError) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                    <Database className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-2xl font-black text-rose-800 mb-2">Tabel Database Belum Tersedia</h2>
                    <p className="text-sm text-rose-600 font-bold mb-6">
                        Tabel <code className="bg-white px-2 py-1 rounded border border-rose-100 text-rose-800">karyawan</code> belum ditemukan di Supabase. 
                        Hal ini wajar karena fitur ini baru ditambahkan.
                    </p>
                    <div className="bg-white rounded-xl p-4 text-left max-w-2xl mx-auto border border-rose-100 shadow-sm overflow-x-auto">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Solusi:</p>
                        <ol className="list-decimal pl-5 text-sm font-bold text-slate-700 space-y-2">
                            <li>Buka folder proyek Anda.</li>
                            <li>Cari file bernama <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">supabase_karyawan_migration.sql</code> di folder root (utama).</li>
                            <li>Buka dashboard <strong>Supabase</strong> Anda, lalu masuk ke menu <strong>SQL Editor</strong>.</li>
                            <li><em>Copy</em> seluruh isi file tersebut dan jalankan <em>(Run)</em> di SQL Editor.</li>
                            <li>Setelah berhasil (Success), muat ulang (Refresh) halaman ini.</li>
                        </ol>
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-8 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-all shadow-lg shadow-rose-200"
                    >
                        Muat Ulang Halaman
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header Ultra-Compact */}
            <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Kelola Karyawan</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manajemen Data Pegawai & Unit</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Cari nama, NIK, atau unit..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <button 
                        onClick={handleExportExcel}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-2.5 md:px-5 md:py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm shrink-0"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden md:block">Ekspor Excel</span>
                    </button>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 md:px-5 md:py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-emerald-200 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:block">Tambah Pegawai</span>
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th 
                                    className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort('nama')}
                                >
                                    <div className="flex items-center gap-1">
                                        Informasi Pegawai
                                        {sortConfig?.key === 'nama' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort('email')}
                                >
                                    <div className="flex items-center gap-1">
                                        Kontak & Alamat
                                        {sortConfig?.key === 'email' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors text-center"
                                    onClick={() => requestSort('is_active')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Status
                                        {sortConfig?.key === 'is_active' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Data...</p>
                                    </td>
                                </tr>
                            ) : sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-500">Belum ada data karyawan.</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((k) => (
                                    <tr key={k.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center shrink-0 border border-emerald-200">
                                                    {k.nama?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{k.nama}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                            {k.nik || 'N/A'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                            {k.unit}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{k.jabatan || 'Staf'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-700">{k.no_hp || '-'}</p>
                                                <p className="text-xs font-bold text-blue-600">{k.email || '-'}</p>
                                                <p className="text-[10px] font-medium text-slate-500 line-clamp-2 max-w-[200px]">{k.alamat || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleToggleStatus(k.id, k.is_active)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors border ${
                                                    k.is_active 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                                }`}
                                            >
                                                {k.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {k.is_active ? 'Aktif' : 'Non-Aktif'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenModal(k)}
                                                    className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded-xl transition-colors"
                                                    title="Edit Data"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(k.id, k.nama)}
                                                    className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-xl transition-colors"
                                                    title="Hapus Data"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">{formData.id ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Lengkapi informasi di bawah ini</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 shadow-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nama Lengkap */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Lengkap <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.nama}
                                        onChange={(e) => setFormData({...formData, nama: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="Misal: Ahmad Fulan"
                                    />
                                </div>
                                {/* NIK */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nomor Induk Karyawan (NIK)</label>
                                    <input 
                                        type="text" 
                                        value={formData.nik}
                                        onChange={(e) => setFormData({...formData, nik: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="Opsional"
                                    />
                                </div>
                                {/* Jabatan */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jabatan <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.jabatan}
                                        onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="Misal: Guru, Staf IT, dll"
                                    />
                                </div>
                                {/* Unit */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit Penempatan <span className="text-rose-500">*</span></label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        {UNITS.map(u => (
                                            <label key={u} className="flex items-center gap-2 cursor-pointer group">
                                                <input 
                                                    type="checkbox"
                                                    value={u}
                                                    checked={formData.unit.includes(u)}
                                                    onChange={(e) => {
                                                        const currentUnits = [...formData.unit];
                                                        if (e.target.checked) {
                                                            setFormData({...formData, unit: [...currentUnits, u]});
                                                        } else {
                                                            setFormData({...formData, unit: currentUnits.filter(unit => unit !== u)});
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                                />
                                                <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">{u}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {(!formData.unit || formData.unit.length === 0) && (
                                        <p className="text-[10px] text-rose-500 font-bold mt-1">Pilih minimal satu unit penempatan.</p>
                                    )}
                                </div>
                                {/* No HP */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nomor HP/WA <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.no_hp}
                                        onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="0812xxxxxx"
                                    />
                                </div>
                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alamat Email <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="email" 
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                {/* Alamat */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alamat Lengkap <span className="text-rose-500">*</span></label>
                                    <textarea 
                                        required
                                        value={formData.alamat}
                                        onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px]"
                                        placeholder="Masukkan alamat domisili..."
                                    />
                                </div>
                            </div>
                        </form>
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving || !formData.nama || formData.unit.length === 0 || !formData.jabatan || !formData.no_hp || !formData.email || !formData.alamat}
                                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan Data'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
