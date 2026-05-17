'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
    Wallet, 
    Calendar, 
    DollarSign, 
    CreditCard, 
    Banknote, 
    FileText, 
    Plus, 
    CheckCircle2, 
    AlertCircle,
    Search,
    Building2,
    User,
    ChevronRight,
    X,
    Filter,
    Pencil,
    Trash2,
    FileSpreadsheet
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import ExcelJS from 'exceljs';

// Mapping Sumber Dana Berdasarkan Unit (Refined Logic by User)
const FUNDING_SOURCES_BY_UNIT: Record<string, string[]> = {
    'Pusat (Yayasan)': [
        'Dana SPP', 
        'Dana Zakat', 
        'Dana Wakaf', 
        'Dana Infaq', 
        'Laba Usaha Koperasi', 
        'Laba Usaha Poskestren', 
        'Tabungan Wajib', 
        'Tabungan Siswa', 
        'Uang Saku'
    ],
    'TK': [
        'Dana BOS', 
        'Dana Pesantren/Yayasan', 
        'Tabungan Siswa', 
        'Iuran Non-Wajib'
    ],
    'SDIT 1': [
        'Dana BOS', 
        'Dana Pesantren/Yayasan', 
        'Tabungan Siswa'
    ],
    'SDIT 2': [
        'Dana BOS', 
        'Dana Pesantren/Yayasan', 
        'Tabungan Siswa'
    ],
    'MTs': [
        'Dana BOS', 
        'Dana Pesantren/Yayasan', 
        'Tabungan Siswa'
    ],
    'MA': [
        'Dana BOS', 
        'Dana Pesantren/Yayasan', 
        'Tabungan Siswa'
    ],
    'Diniyah': [
        'Dana Pesantren/Yayasan', 
        'Subsidi Pesantren', 
        'Infaq Siswa'
    ],
    'Asrama Putra': [
        'Dana Pesantren/Yayasan', 
        'Kas Internal', 
        'Uang Saku'
    ],
    'Asrama Putri': [
        'Dana Pesantren/Yayasan', 
        'Kas Internal', 
        'Uang Saku'
    ],
    'THQ': [
        'Dana Pesantren/Yayasan', 
        'Uang Saku', 
        'Tabungan Siswa'
    ],
    'Dapur Asrama Putra': [
        'Kas Internal'
    ],
    'Dapur Asrama Putri': [
        'Kas Internal'
    ]
};

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const YEARS = [
    2025, 2026, 2027, 2028
];

export default function InputPendapatanPage() {
    // Current User / Unit State
    const [currentUserUnit, setCurrentUserUnit] = useState<string>('Pusat (Yayasan)'); 
    const [currentUserName, setCurrentUserName] = useState<string>('Bendahara');
    
    // Tab State
    const [activeTab, setActiveTab] = useState<string>('Dana SPP');

    // Filter States
    const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
    const [selectedMethod, setSelectedMethod] = useState<'Semua' | 'Cash' | 'Transfer'>('Semua');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Modal Popup State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form States
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [sumberDana, setSumberDana] = useState('');
    const [nominal, setNominal] = useState<string>('');
    const [jenisPenerimaan, setJenisPenerimaan] = useState<'Cash' | 'Transfer'>('Cash');
    const [namaBank, setNamaBank] = useState('-');
    const [keterangan, setKeterangan] = useState('');
    
    // Transaction History (For current month)
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Dynamic fetch of monthly transactions for current unit and selected period
    const fetchMonthlyTransactions = async (unitName: string, year: number | null, month: number | null) => {
        try {
            const supabase = createClient();
            let query = supabase
                .from('transaksi_pendapatan')
                .select('*')
                .eq('unit', unitName);

            // Filter by year and month dynamically
            if (year !== null && month !== null) {
                // Specific month & specific year
                const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
                const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
                query = query.gte('tanggal', firstDay).lte('tanggal', lastDay);
            } else if (year !== null) {
                // Specific year, all months
                const firstDay = `${year}-01-01`;
                const lastDay = `${year}-12-31`;
                query = query.gte('tanggal', firstDay).lte('tanggal', lastDay);
            }

            const { data, error } = await query
                .order('tanggal', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            let result = data || [];
            // If year is null but month is selected, filter by month in-memory
            if (year === null && month !== null) {
                result = result.filter(tx => {
                    const date = new Date(tx.tanggal);
                    return date.getMonth() === month;
                });
            }

            return result;
        } catch (err: any) {
            console.error('Error fetching transactions:', err.message || err);
            console.warn('TIPS: Pastikan Anda telah membuat tabel "transaksi_pendapatan" di database Anda dengan menjalankan query di docs/migration_pemasukan.sql');
            return [];
        }
    };

    // Initial Fetch (User Info & Dynamic Active Tab)
    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            
            // 1. Get User Info
            const { data: { user } } = await supabase.auth.getUser();
            let unitName = 'Pusat (Yayasan)';
            if (user) {
                setCurrentUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Bendahara');
                
                // Fetch user unit from profiles with join on unit
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*, unit:unit_id(name)')
                    .eq('id', user.id)
                    .single() as any;
                
                if (profile?.unit?.name) {
                    setCurrentUserUnit(profile.unit.name);
                    unitName = profile.unit.name;
                }
            }

            // Set active tab to the first source of that unit dynamically
            let normalizedUnit = unitName;
            if (unitName.includes('Yayasan')) normalizedUnit = 'Pusat (Yayasan)';
            const sources = FUNDING_SOURCES_BY_UNIT[normalizedUnit] || ['Dana Pesantren/Yayasan'];
            if (sources[0]) setActiveTab(sources[0]);
        };
        init();
    }, []);

    // Reactive Fetch of Transactions when unit or selected period changes
    useEffect(() => {
        const load = async () => {
            const transactions = await fetchMonthlyTransactions(currentUserUnit, selectedYear, selectedMonth);
            setRecentTransactions(transactions);
        };
        load();
    }, [currentUserUnit, selectedMonth, selectedYear]);

    // Get available sources for current unit
    const availableSources = useMemo(() => {
        let normalizedUnit = currentUserUnit;
        if (currentUserUnit.includes('Yayasan')) normalizedUnit = 'Pusat (Yayasan)';
        
        return FUNDING_SOURCES_BY_UNIT[normalizedUnit] || ['Dana Pesantren/Yayasan'];
    }, [currentUserUnit]);

    // Get dynamic card label based on selected filters
    const getCardLabel = () => {
        if (selectedMonth === null && selectedYear === null) {
            return `Total Pemasukan ${activeTab} Semua Periode`;
        } else if (selectedMonth === null) {
            return `Total Pemasukan ${activeTab} Tahun ${selectedYear}`;
        } else if (selectedYear === null) {
            return `Total Pemasukan ${activeTab} Bulan ${MONTH_NAMES[selectedMonth]} (Semua Tahun)`;
        } else {
            return `Total Pemasukan ${activeTab} Bulan ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
        }
    };

    // Handle Nominal Input (Masking)
    const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        setNominal(value);
    };

    // Auto reset bank name if Cash
    useEffect(() => {
        if (jenisPenerimaan === 'Cash') {
            setNamaBank('-');
        } else if (namaBank === '-') {
            setNamaBank('');
        }
    }, [jenisPenerimaan]);

    // Open Modal and pre-fill Sumber Dana based on active tab
    const openAddModal = () => {
        setEditingId(null);
        setTanggal(new Date().toISOString().split('T')[0]);
        setSumberDana(activeTab);
        setNominal('');
        setJenisPenerimaan('Cash');
        setNamaBank('-');
        setKeterangan('');
        setMessage(null);
        setIsModalOpen(true);
    };

    // Open Modal in Edit Mode
    const handleEditClick = (tx: any) => {
        setEditingId(tx.id);
        setTanggal(tx.tanggal);
        setSumberDana(tx.sumber_dana);
        setNominal(tx.nominal.toString());
        setJenisPenerimaan(tx.jenis_penerimaan);
        setNamaBank(tx.nama_bank);
        setKeterangan(tx.keterangan || '');
        setMessage(null);
        setIsModalOpen(true);
    };

    // Handle transaction delete
    const handleDeleteClick = async (txId: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('transaksi_pendapatan')
                .delete()
                .eq('id', txId)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error('Transaksi tidak terhapus di database. Ini biasanya terjadi karena kebijakan RLS (Row-Level Security) untuk operasi DELETE belum diaktifkan di Supabase Anda.');
            }

            // Remove locally
            setRecentTransactions(recentTransactions.filter(tx => tx.id !== txId));
        } catch (err: any) {
            console.error('Error deleting transaction:', err);
            alert(`Gagal menghapus transaksi: ${err.message || err}`);
        }
    };

    const handleSave = async () => {
        if (!sumberDana || !nominal || Number(nominal) <= 0 || (jenisPenerimaan === 'Transfer' && (!namaBank || namaBank === '-'))) {
            setMessage({ type: 'error', text: 'Mohon lengkapi semua field yang wajib diisi.' });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            const txData = {
                tanggal,
                unit: currentUserUnit,
                sumber_dana: sumberDana,
                nominal: Number(nominal),
                jenis_penerimaan: jenisPenerimaan,
                nama_bank: namaBank,
                keterangan,
                created_by: user?.id
            };

            let data: any;
            let error: any;

            if (editingId) {
                const { data: updatedData, error: updateError } = await supabase
                    .from('transaksi_pendapatan')
                    .update({
                        tanggal,
                        sumber_dana: sumberDana,
                        nominal: Number(nominal),
                        jenis_penerimaan: jenisPenerimaan,
                        nama_bank: namaBank,
                        keterangan
                    })
                    .eq('id', editingId)
                    .select()
                    .single();
                
                data = updatedData;
                error = updateError;
            } else {
                const { data: insertedData, error: insertError } = await supabase
                    .from('transaksi_pendapatan')
                    .insert([txData])
                    .select()
                    .single();
                
                data = insertedData;
                error = insertError;
            }

            if (error) throw error;

            if (editingId) {
                setRecentTransactions(recentTransactions.map(tx => tx.id === editingId ? data : tx));
                setMessage({ type: 'success', text: 'Pendapatan berhasil diperbarui!' });
            } else {
                setRecentTransactions([data, ...recentTransactions]);
                setMessage({ type: 'success', text: 'Pendapatan berhasil dicatat!' });
            }
            
            // Auto close modal after successful save
            setTimeout(() => {
                setIsModalOpen(false);
                setMessage(null);
            }, 1200);
            
        } catch (err: any) {
            console.error('Error saving transaction details:', {
                message: err?.message,
                details: err?.details,
                hint: err?.hint,
                code: err?.code,
                raw: err
            });
            const errMsg = err?.message || err?.details || err?.hint || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            setMessage({ type: 'error', text: `Gagal menyimpan: ${errMsg}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Export current filtered transactions to a beautiful Excel sheet
    const handleExportExcel = async () => {
        if (filteredTransactions.length === 0) {
            alert('Tidak ada data transaksi untuk diekspor!');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Penerimaan');

            // Set dynamic page title
            const reportTitle = `LAPORAN PENERIMAAN DANA (${activeTab.toUpperCase()})`;

            // Configure columns width
            worksheet.columns = [
                { key: 'A', width: 5 },   // No
                { key: 'B', width: 25 },  // Tanggal Penerimaan
                { key: 'C', width: 20 },  // Nominal Penerimaan
                { key: 'D', width: 20 },  // Metode Penerimaan
                { key: 'E', width: 40 }   // Keterangan / Catatan
            ];

            // 1. Add Title
            worksheet.mergeCells('A1:E1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = reportTitle;
            titleCell.font = { bold: true, size: 14, name: 'Times New Roman' };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

            // 2. Add Metadata Info
            worksheet.getRow(3).values = ['Unit / Jenjang:', currentUserUnit, '', 'Kategori Dana:', activeTab];
            worksheet.getRow(4).values = ['Periode:', getCardLabel().replace('Total Pemasukan ', ''), '', 'User Pencatat:', currentUserName];
            worksheet.getRow(5).values = ['Tanggal Cetak:', new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), '', '', ''];

            // Bold labels
            ['A3', 'D3', 'A4', 'D4', 'A5'].forEach(ref => {
                const cell = worksheet.getCell(ref);
                cell.font = { bold: true, name: 'Times New Roman' };
            });

            // Set font style for all metadata cells
            for (let r = 3; r <= 5; r++) {
                for (let c = 1; c <= 5; c++) {
                    worksheet.getCell(r, c).font = { ...worksheet.getCell(r, c).font, name: 'Times New Roman', size: 10 };
                }
            }

            // Spacer
            worksheet.addRow([]);

            // 3. Table Headers
            const headerRow = worksheet.addRow(['No', 'Tanggal Penerimaan', 'Nominal Penerimaan', 'Metode Penerimaan', 'Keterangan / Catatan']);
            headerRow.height = 25;
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF059669' } // emerald-600
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // 4. Populate Data
            filteredTransactions.forEach((tx, idx) => {
                const row = worksheet.addRow([
                    idx + 1,
                    new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                    Number(tx.nominal),
                    tx.jenis_penerimaan === 'Transfer' && tx.nama_bank !== '-' ? `${tx.jenis_penerimaan} (${tx.nama_bank})` : tx.jenis_penerimaan,
                    tx.keterangan || '-'
                ]);
                row.height = 20;

                // Format Nominal as Currency
                row.getCell(3).numFmt = '"Rp "#,##0';
                
                // Alignments
                row.getCell(1).alignment = { horizontal: 'center' };
                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(3).alignment = { horizontal: 'right' };
                row.getCell(4).alignment = { horizontal: 'center' };
                row.getCell(5).alignment = { horizontal: 'left' };

                // Apply Font & Borders
                row.eachCell(cell => {
                    cell.font = { name: 'Times New Roman', size: 10 };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

            // 5. Total Row
            const totalRow = worksheet.addRow([
                'TOTAL',
                '',
                Number(totalBulanIni),
                '',
                ''
            ]);
            totalRow.height = 22;
            worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
            
            // Format Total
            const totalLabelCell = totalRow.getCell(1);
            totalLabelCell.font = { bold: true, name: 'Times New Roman', size: 10 };
            totalLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };

            const totalValCell = totalRow.getCell(3);
            totalValCell.numFmt = '"Rp "#,##0';
            totalValCell.font = { bold: true, name: 'Times New Roman', size: 10, color: { argb: 'FF047857' } }; // emerald-700
            totalValCell.alignment = { horizontal: 'right', vertical: 'middle' };

            // Apply Borders to total row
            totalRow.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'double' },
                    right: { style: 'thin' }
                };
            });

            // Apply Times New Roman globally & ensure gridlines
            worksheet.views = [{ showGridLines: true }];

            // Generate and trigger download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Laporan_Penerimaan_${activeTab.replace(/ /g, '_')}_${currentUserUnit.replace(/ /g, '_')}_${Date.now()}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);

        } catch (error: any) {
            console.error('Error generating Excel file:', error);
            alert(`Gagal mengekspor data ke Excel: ${error.message || error}`);
        }
    };

    // Calculate sum of active source transactions for this month (Accumulation)
    const filteredTransactions = useMemo(() => {
        return recentTransactions.filter(tx => {
            const matchSource = tx.sumber_dana === activeTab;
            const matchMethod = selectedMethod === 'Semua' || tx.jenis_penerimaan === selectedMethod;
            return matchSource && matchMethod;
        });
    }, [recentTransactions, activeTab, selectedMethod]);

    const totalAkumulasi = useMemo(() => {
        return filteredTransactions.reduce((acc, curr) => acc + (curr.nominal || 0), 0);
    }, [filteredTransactions]);

    const totalBulanIni = useMemo(() => {
        return filteredTransactions.reduce((acc, curr) => acc + (curr.nominal || 0), 0);
    }, [filteredTransactions]);

    return (
        <div className="p-3 md:p-4 space-y-3 max-w-7xl mx-auto">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-100/50 hover:scale-105 transition-all cursor-pointer">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            INPUT PENDAPATAN 
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-widest font-black">Manual</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Unit: <span className="text-emerald-600 font-black">{currentUserUnit}</span>
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <User className="w-3 h-3" /> User: <span className="text-slate-600 font-black">{currentUserName}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sumber Dana Tabs */}
            <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200/80 overflow-x-auto scrollbar-none flex gap-1">
                {availableSources.map(source => (
                    <button 
                        key={source}
                        onClick={() => setActiveTab(source)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap ${
                            activeTab === source 
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {source}
                    </button>
                ))}
            </div>

            {/* Main Table Layout */}
            <div className="bg-white rounded-[1.75rem] shadow-sm border border-slate-200/80 relative">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[4rem] rounded-tr-[1.75rem] opacity-50 pointer-events-none"></div>
                
                <div className="p-5 space-y-4 relative z-10">
                    
                    {/* Header above table */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <h2 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">{getCardLabel()}</h2>
                            </div>
                            <p className="text-2xl font-black italic tracking-tighter text-slate-800">
                                Rp {totalBulanIni.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 relative">
                            {/* Filter Button */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-center active:scale-95 relative ${
                                        isFilterOpen 
                                            ? 'bg-slate-100 border-slate-300 text-slate-700' 
                                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 shadow-sm'
                                    }`}
                                >
                                    <Filter className="w-4 h-4" />
                                    {(selectedMethod !== 'Semua' || selectedMonth !== new Date().getMonth() || selectedYear !== new Date().getFullYear()) && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-bounce"></span>
                                    )}
                                </button>
                                
                                {/* Filter Dropdown Panel */}
                                {isFilterOpen && (
                                    <>
                                        {/* Backdrop overlay to close when clicking outside */}
                                        <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                                        
                                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filter Transaksi
                                            </h3>
                                            
                                            <div className="space-y-3">
                                                {/* Filter Bulan */}
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Periode Bulan</label>
                                                    <select 
                                                        value={selectedMonth === null ? 'all' : selectedMonth} 
                                                        onChange={(e) => setSelectedMonth(e.target.value === 'all' ? null : Number(e.target.value))}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                                                    >
                                                        <option value="all">Semua Bulan</option>
                                                        {MONTH_NAMES.map((name, index) => (
                                                            <option key={index} value={index}>{name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Filter Tahun */}
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Periode Tahun</label>
                                                    <select 
                                                        value={selectedYear === null ? 'all' : selectedYear} 
                                                        onChange={(e) => setSelectedYear(e.target.value === 'all' ? null : Number(e.target.value))}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                                                    >
                                                        <option value="all">Semua Tahun</option>
                                                        {YEARS.map(y => (
                                                            <option key={y} value={y}>{y}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Filter Metode */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Metode Penerimaan</label>
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        {(['Semua', 'Cash', 'Transfer'] as const).map(method => (
                                                            <button
                                                                key={method}
                                                                onClick={() => setSelectedMethod(method)}
                                                                className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                                                                    selectedMethod === method
                                                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                                                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                                                                }`}
                                                            >
                                                                {method}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Reset Button */}
                                                <button
                                                    onClick={() => {
                                                        setSelectedMonth(null);
                                                        setSelectedYear(null);
                                                        setSelectedMethod('Semua');
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className="w-full mt-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 px-3 rounded-lg border border-emerald-200 text-[9px] uppercase tracking-widest transition-all active:scale-95"
                                                >
                                                    Reset Filter (Semua)
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Export Excel Button */}
                            <button 
                                onClick={handleExportExcel}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2.5 px-3 rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-1.5 active:scale-95 group shadow-sm"
                                title="Ekspor data ke Excel"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] tracking-widest uppercase hidden md:inline">Export Excel</span>
                            </button>

                            <button 
                                onClick={openAddModal}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 group"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                                <span className="text-[9px] tracking-widest uppercase">Tambah Pemasukan</span>
                            </button>
                        </div>
                    </div>

                    {/* Table of Transactions */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-3">Tanggal Penerimaan</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nominal Penerimaan</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Metode Penerimaan</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Keterangan / Catatan</th>
                                    <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right pr-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="bg-slate-50 p-4 rounded-full border border-slate-100 shadow-inner">
                                                    <Search className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] leading-relaxed">
                                                    Belum ada pendapatan<br/>yang dicatat untuk kategori ini
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors group">
                                            {/* Tanggal */}
                                            <td className="px-4 py-3 font-semibold text-slate-700 text-xs pl-3">
                                                {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </td>
                                            {/* Nominal */}
                                            <td className="px-4 py-3 font-black text-emerald-600 italic text-xs tracking-tight">
                                                Rp {tx.nominal.toLocaleString('id-ID')}
                                            </td>
                                            {/* Metode */}
                                            <td className="px-4 py-3 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                                        tx.jenis_penerimaan === 'Cash' 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                            : 'bg-sky-50 text-sky-700 border-sky-100'
                                                    }`}>
                                                        {tx.jenis_penerimaan}
                                                    </span>
                                                    {tx.jenis_penerimaan === 'Transfer' && tx.nama_bank !== '-' && (
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[100px]">
                                                            {tx.nama_bank}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Keterangan */}
                                            <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate" title={tx.keterangan}>
                                                {tx.keterangan || <span className="text-slate-300">-</span>}
                                            </td>
                                            {/* Aksi */}
                                            <td className="px-4 py-3 text-right pr-3">
                                                <div className="flex items-center justify-end gap-1.5 opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <button 
                                                        onClick={() => handleEditClick(tx)}
                                                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all border border-slate-100 hover:border-emerald-100 active:scale-95"
                                                        title="Edit Transaksi"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(tx.id)}
                                                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-100 hover:border-rose-100 active:scale-95"
                                                        title="Hapus Transaksi"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {/* Footer - Akumulasi */}
                            {filteredTransactions.length > 0 && (
                                <tfoot>
                                    <tr className="border-t border-slate-200 bg-slate-50/50">
                                        <td className="px-4 py-3 font-black text-slate-700 uppercase tracking-wider text-[10px] pl-3">
                                            Akumulasi Penerimaan ({activeTab})
                                        </td>
                                        <td className="px-4 py-3 font-black text-emerald-600 italic text-sm tracking-tight">
                                            Rp {totalAkumulasi.toLocaleString('id-ID')}
                                        </td>
                                        <td colSpan={3} className="px-4 py-3 pr-3"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
 
            {/* Popup Modal Input */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[4rem] -mr-6 -mt-6 opacity-50 pointer-events-none"></div>
                        
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between relative z-10 bg-slate-50/50">
                            <div className="flex items-center gap-1.5">
                                <Wallet className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{editingId ? 'Edit Pemasukan' : 'Tambah Pemasukan Baru'}</h3>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Content / Form */}
                        <div className="p-5 space-y-4 relative z-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {message && (
                                <div className={`p-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                    <div className={`p-1 rounded-full ${message.type === 'success' ? 'bg-emerald-200/50' : 'bg-rose-200/50'}`}>
                                        {message.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-tight">{message.text}</p>
                                </div>
                            )}

                            {/* Tanggal */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Penerimaan</label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-2.5 flex items-center justify-center pointer-events-none">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                    <input 
                                        type="date" 
                                        value={tanggal}
                                        onChange={(e) => setTanggal(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-4 focus:ring-emerald-500/10 text-xs font-bold text-slate-700 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Sumber Dana */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sumber Dana</label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-2.5 flex items-center justify-center pointer-events-none">
                                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                    <select 
                                        value={sumberDana}
                                        onChange={(e) => setSumberDana(e.target.value)}
                                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-4 focus:ring-emerald-500/10 text-xs font-black text-slate-800 appearance-none transition-all cursor-pointer outline-none"
                                    >
                                        <option value="">Pilih Sumber Dana</option>
                                        {availableSources.map(source => (
                                            <option key={source} value={source}>{source}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-3.5 top-3.5 w-3.5 h-3.5 text-slate-300 rotate-90 pointer-events-none" />
                                </div>
                            </div>

                            {/* Nominal */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal Penerimaan</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-2 w-7 h-7 bg-emerald-600 rounded-md shadow-sm flex items-center justify-center text-white font-black text-[10px] pointer-events-none">Rp</div>
                                    <input 
                                        type="text" 
                                        value={nominal ? Number(nominal).toLocaleString('id-ID') : ''}
                                        onChange={handleNominalChange}
                                        placeholder="0"
                                        className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-4 focus:ring-emerald-500/10 text-sm font-black text-slate-900 transition-all placeholder:text-slate-300 tracking-tight italic outline-none"
                                    />
                                </div>
                            </div>

                            {/* Metode Penerimaan */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Metode Penerimaan</label>
                                <div className="flex gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-100 h-[44px]">
                                    <button 
                                        onClick={() => setJenisPenerimaan('Cash')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 rounded text-[9px] font-black tracking-widest transition-all ${jenisPenerimaan === 'Cash' ? 'bg-white shadow-sm text-emerald-600 border border-emerald-50' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Banknote className="w-3.5 h-3.5" /> CASH
                                    </button>
                                    <button 
                                        onClick={() => setJenisPenerimaan('Transfer')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 rounded text-[9px] font-black tracking-widest transition-all ${jenisPenerimaan === 'Transfer' ? 'bg-white shadow-sm text-sky-600 border border-sky-50' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <CreditCard className="w-3.5 h-3.5" /> TRANSFER
                                    </button>
                                </div>
                            </div>

                            {/* Nama Bank (Conditionally Shown) */}
                            {jenisPenerimaan === 'Transfer' && (
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Bank / Tujuan Transfer</label>
                                    <div className="relative group">
                                        <div className="absolute left-3.5 top-2.5 flex items-center justify-center pointer-events-none">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={namaBank === '-' ? '' : namaBank}
                                            onChange={(e) => setNamaBank(e.target.value)}
                                            placeholder="Contoh: BSI, Mandiri, BCA..."
                                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-4 focus:ring-sky-500/10 text-xs font-bold text-slate-800 transition-all placeholder:text-slate-300 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Keterangan */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Catatan</label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-2.5 flex items-center justify-center pointer-events-none">
                                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                    <textarea 
                                        value={keterangan}
                                        onChange={(e) => setKeterangan(e.target.value)}
                                        rows={2}
                                        placeholder="Tambahkan detail..."
                                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border-none rounded-lg focus:ring-4 focus:ring-emerald-500/10 text-xs font-bold text-slate-700 transition-all placeholder:text-slate-300 resize-none min-h-[60px] outline-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer / Save Button */}
                        <div className="p-4 px-6 bg-slate-50/50 border-t border-slate-100">
                            <button 
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-black py-3 rounded-xl shadow-md shadow-emerald-200/30 transition-all flex items-center justify-center gap-2 group active:scale-[0.97]"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                        <span className="tracking-[0.2em] uppercase text-[10px]">{editingId ? 'Simpan Perubahan' : 'Simpan Pemasukan'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
