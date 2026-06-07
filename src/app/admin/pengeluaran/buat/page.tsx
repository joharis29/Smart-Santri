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

export default function InputPengeluaranPage() {
    const [currentUserUnit, setCurrentUserUnit] = useState<string>('Pusat (Yayasan)'); 
    const [currentUserName, setCurrentUserName] = useState<string>('Bendahara');
    const [activeTab, setActiveTab] = useState<string>('Dana SPP');
    const [liveWalletBalance, setLiveWalletBalance] = useState<number>(0);

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
    const [metodePencairan, setMetodePencairan] = useState<'Cash' | 'Transfer'>('Cash');
    const [namaBank, setNamaBank] = useState('-');
    const [keterangan, setKeterangan] = useState('');
    
    // Transaction History
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Helper map source name to wallet category enum
    const getKategoriEnum = (sourceName: string): string => {
        const lower = sourceName.toLowerCase();
        if (lower.includes('bos')) return 'BOS';
        if (lower.includes('spp')) return 'SPP';
        if (lower.includes('zakat')) return 'ZAKAT';
        if (lower.includes('infaq')) {
            if (lower.includes('terikat') || lower.includes('pembatasan')) {
                return 'INFAQ_TERIKAT';
            }
            return 'INFAQ';
        }
        if (lower.includes('koperasi')) return 'KOPERASI';
        if (lower.includes('poskestren')) return 'POSKESTREN';
        if (lower.includes('tabungan wajib')) return 'TABUNGAN_WAJIB';
        if (lower.includes('tabungan')) return 'TABUNGAN_SISWA';
        if (lower.includes('uang saku')) return 'UANG_SAKU';
        if (lower.includes('kas internal')) return 'KAS_INTERNAL';
        if (lower.includes('iuran non-wajib')) return 'IURAN_NON_WAJIB';
        return 'YAYASAN';
    };

    // Live Wallet balance fetcher
    const fetchWalletBalance = async (unitName: string, sourceName: string) => {
        try {
            const supabase = createClient();
            
            // Calculate exact balance from transactions (same as Dashboard Dynamic Widgets)
            const { data: txIn } = await supabase
                .from('transaksi_pendapatan')
                .select('nominal')
                .eq('unit', unitName.trim())
                .eq('sumber_dana', sourceName.trim());

            const { data: txOut } = await supabase
                .from('transaksi_pengeluaran')
                .select('nominal')
                .eq('unit', unitName.trim())
                .eq('sumber_dana', sourceName.trim());

            let totalIn = 0;
            if (txIn) {
                totalIn = txIn.reduce((sum, tx) => sum + Number(tx.nominal || 0), 0);
            }

            let totalOut = 0;
            if (txOut) {
                totalOut = txOut.reduce((sum, tx) => sum + Number(tx.nominal || 0), 0);
            }

            setLiveWalletBalance(totalIn - totalOut);
        } catch (err) {
            console.error("Error fetching live balance:", err);
            setLiveWalletBalance(0);
        }
    };

    // Fetch monthly manual expenditures
    const fetchMonthlyTransactions = async (unitName: string, year: number | null, month: number | null) => {
        try {
            const supabase = createClient();
            let query = supabase
                .from('transaksi_pengeluaran')
                .select('*')
                .eq('unit', unitName);

            if (year !== null && month !== null) {
                const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
                const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
                query = query.gte('tanggal', firstDay).lte('tanggal', lastDay);
            } else if (year !== null) {
                const firstDay = `${year}-01-01`;
                const lastDay = `${year}-12-31`;
                query = query.gte('tanggal', firstDay).lte('tanggal', lastDay);
            }

            const { data, error } = await query
                .order('tanggal', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            let result = data || [];
            if (year === null && month !== null) {
                result = result.filter(tx => {
                    const date = new Date(tx.tanggal);
                    return date.getMonth() === month;
                });
            }

            return result;
        } catch (err: any) {
            console.error('Error fetching transactions:', err);
            return [];
        }
    };

    const [availableSources, setAvailableSources] = useState<string[]>([]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                setCurrentUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Bendahara');
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*, unit:unit_id(name)')
                    .eq('id', user.id)
                    .single() as any;
                
                if (profile?.unit?.name) {
                    setCurrentUserUnit(profile.unit.name);
                }
            }
        };
        init();
    }, []);

    // Load monthly history when filters update
    useEffect(() => {
        const load = async () => {
            const transactions = await fetchMonthlyTransactions(currentUserUnit, selectedYear, selectedMonth);
            setRecentTransactions(transactions);
        };
        load();
    }, [currentUserUnit, selectedMonth, selectedYear]);

    // Track active tab category balance changes
    useEffect(() => {
        if (currentUserUnit && activeTab) {
            fetchWalletBalance(currentUserUnit, activeTab);
        }
    }, [activeTab, currentUserUnit]);

    // Load available sources dynamically
    useEffect(() => {
        const fetchCustomSources = async () => {
            if (!currentUserUnit) return;
            try {
                const supabase = createClient();
                const { data: dbSources } = await supabase
                    .from('pengaturan_sumber_dana')
                    .select('nama_sumber_dana')
                    .eq('unit_name', currentUserUnit);

                let sourcesList: string[] = [];
                if (dbSources && dbSources.length > 0) {
                    sourcesList = dbSources.map(s => s.nama_sumber_dana);
                } else {
                    // Fallback to static
                    let normalizedUnit = currentUserUnit;
                    if (currentUserUnit.includes('Yayasan')) normalizedUnit = 'Pusat (Yayasan)';
                    sourcesList = FUNDING_SOURCES_BY_UNIT[normalizedUnit] || ['Dana Pesantren/Yayasan'];
                }
                setAvailableSources(sourcesList);
                if (sourcesList[0]) {
                    setActiveTab(sourcesList[0]);
                    fetchWalletBalance(currentUserUnit, sourcesList[0]);
                }
            } catch (err) {
                console.error("Error loading dynamic sources for Pengeluaran:", err);
            }
        };
        fetchCustomSources();
    }, [currentUserUnit]);

    const getCardLabel = () => {
        if (selectedMonth === null && selectedYear === null) {
            return `Total Pengeluaran ${activeTab} Semua Periode`;
        } else if (selectedMonth === null) {
            return `Total Pengeluaran ${activeTab} Tahun ${selectedYear}`;
        } else if (selectedYear === null) {
            return `Total Pengeluaran ${activeTab} Bulan ${MONTH_NAMES[selectedMonth]} (Semua Tahun)`;
        } else {
            return `Total Pengeluaran ${activeTab} Bulan ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
        }
    };

    const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        setNominal(value);
    };

    useEffect(() => {
        if (metodePencairan === 'Cash') {
            setNamaBank('-');
        } else if (namaBank === '-') {
            setNamaBank('');
        }
    }, [metodePencairan]);

    const openAddModal = () => {
        setEditingId(null);
        setTanggal(new Date().toISOString().split('T')[0]);
        setSumberDana(activeTab);
        setNominal('');
        setMetodePencairan('Cash');
        setNamaBank('-');
        setKeterangan('');
        setMessage(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (tx: any) => {
        setEditingId(tx.id);
        setTanggal(tx.tanggal);
        setSumberDana(tx.sumber_dana);
        setNominal(tx.nominal.toString());
        setMetodePencairan(tx.metode_pencairan);
        setNamaBank(tx.nama_bank);
        setKeterangan(tx.keterangan || '');
        setMessage(null);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (txId: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini akan memulihkan saldo dompet dana terkait.')) {
            return;
        }

        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('transaksi_pengeluaran')
                .delete()
                .eq('id', txId)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error('Gagal menghapus dari database. Periksa kebijakan RLS.');
            }

            setRecentTransactions(recentTransactions.filter(tx => tx.id !== txId));
            fetchWalletBalance(currentUserUnit, activeTab);
        } catch (err: any) {
            console.error('Error deleting transaction:', err);
            alert(`Gagal: ${err.message || err}`);
        }
    };

    const handleSave = async () => {
        if (!sumberDana || !nominal || Number(nominal) <= 0 || (metodePencairan === 'Transfer' && (!namaBank || namaBank === '-'))) {
            setMessage({ type: 'error', text: 'Mohon lengkapi semua field yang wajib diisi.' });
            return;
        }

        if (!availableSources.includes(sumberDana)) {
            setMessage({ type: 'error', text: `SECURITY ALERT: Akses ditolak. Sumber dana "${sumberDana}" tidak diizinkan atau tidak terdaftar untuk unit ${currentUserUnit}.` });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            const supabase = createClient();
            
            // --- OVERDRAFT PROTECTION CHECK ---
            const { data: wallets, error: walletErr } = await supabase
                .from('dompet_dana')
                .select('*, unit:unit_id(name)');
            
            if (walletErr) throw walletErr;

            const categoryEnum = getKategoriEnum(sumberDana);
            const activeWallet = wallets?.find((w: any) => {
                const uName = w.unit?.name || 'Pusat (Yayasan)';
                return uName.trim() === currentUserUnit.trim() && w.kategori === categoryEnum;
            });

            // Allow negative balances as requested
            const inputNominal = Number(nominal);

            const { data: { user } } = await supabase.auth.getUser();

            const txData = {
                tanggal,
                unit: currentUserUnit,
                sumber_dana: sumberDana,
                nominal: inputNominal,
                metode_pencairan: metodePencairan,
                nama_bank: namaBank,
                keterangan,
                created_by: user?.id
            };

            let data: any;
            let error: any;

            if (editingId) {
                const { data: updatedData, error: updateError } = await supabase
                    .from('transaksi_pengeluaran')
                    .update({
                        tanggal,
                        sumber_dana: sumberDana,
                        nominal: inputNominal,
                        metode_pencairan: metodePencairan,
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
                    .from('transaksi_pengeluaran')
                    .insert([txData])
                    .select()
                    .single();
                
                data = insertedData;
                error = insertError;
            }

            if (error) throw error;

            if (editingId) {
                setRecentTransactions(recentTransactions.map(tx => tx.id === editingId ? data : tx));
                setMessage({ type: 'success', text: 'Pengeluaran berhasil diperbarui!' });
            } else {
                setRecentTransactions([data, ...recentTransactions]);
                setMessage({ type: 'success', text: 'Pengeluaran berhasil dicatat!' });
            }
            
            fetchWalletBalance(currentUserUnit, activeTab);

            setTimeout(() => {
                setIsModalOpen(false);
                setMessage(null);
            }, 1200);
            
        } catch (err: any) {
            console.error('Error saving transaction:', err);
            setMessage({ type: 'error', text: `Gagal: ${err.message || err}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        return recentTransactions.filter(tx => {
            const matchesTab = tx.sumber_dana === activeTab;
            const matchesMethod = selectedMethod === 'Semua' || tx.metode_pencairan === selectedMethod;
            return matchesTab && matchesMethod;
        });
    }, [recentTransactions, activeTab, selectedMethod]);

    const totalNominalSummary = useMemo(() => {
        return filteredTransactions.reduce((acc, curr) => acc + Number(curr.nominal), 0);
    }, [filteredTransactions]);

    const handleExportExcel = async () => {
        if (filteredTransactions.length === 0) {
            alert('Tidak ada data transaksi untuk diekspor!');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Pengeluaran');

            worksheet.columns = [
                { key: 'A', width: 5 },   // No
                { key: 'B', width: 25 },  // Tanggal
                { key: 'C', width: 20 },  // Nominal
                { key: 'D', width: 20 },  // Metode
                { key: 'E', width: 40 }   // Keterangan
            ];

            worksheet.mergeCells('A1:E1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `LAPORAN PENGELUARAN MANUAL (${activeTab.toUpperCase()})`;
            titleCell.font = { bold: true, size: 14, name: 'Times New Roman' };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

            worksheet.getRow(3).values = ['Unit / Jenjang:', currentUserUnit, '', 'Kategori Dana:', activeTab];
            worksheet.getRow(4).values = ['Periode:', getCardLabel().replace('Total Pengeluaran ', ''), '', 'User Pencatat:', currentUserName];
            worksheet.getRow(5).values = ['Tanggal Cetak:', new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), '', '', ''];

            ['A3', 'D3', 'A4', 'D4', 'A5'].forEach(ref => {
                worksheet.getCell(ref).font = { bold: true, name: 'Times New Roman' };
            });

            for (let r = 3; r <= 5; r++) {
                for (let c = 1; c <= 5; c++) {
                    worksheet.getCell(r, c).font = { ...worksheet.getCell(r, c).font, name: 'Times New Roman', size: 10 };
                }
            }

            worksheet.addRow([]);

            const headerRow = worksheet.addRow(['No', 'Tanggal Pengeluaran', 'Nominal Pengeluaran', 'Metode Pencairan', 'Keterangan / Catatan']);
            headerRow.height = 25;
            headerRow.eachCell(cell => {
                cell.font = { bold: true, name: 'Times New Roman', size: 11, color: { argb: 'FF000000' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00B050' } // Symmetrical green matching standard layout mockup
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            filteredTransactions.forEach((tx, idx) => {
                const dataRow = worksheet.addRow([
                    idx + 1,
                    tx.tanggal,
                    Number(tx.nominal),
                    tx.metode_pencairan,
                    tx.keterangan || '-'
                ]);

                dataRow.getCell(3).numFmt = '#,##0';

                dataRow.eachCell((cell, colNum) => {
                    cell.font = { name: 'Times New Roman', size: 10 };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };

                    if (colNum === 1 || colNum === 2 || colNum === 4) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    } else if (colNum === 3) {
                        cell.alignment = { horizontal: 'right', vertical: 'middle' };
                    } else {
                        cell.alignment = { horizontal: 'left', vertical: 'middle' };
                    }
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Laporan_Pengeluaran_Manual_${activeTab.replace(/\s+/g, '_')}_${currentUserUnit.replace(/\s+/g, '_')}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting excel:', err);
            alert('Gagal mengekspor laporan ke Excel.');
        }
    };

    return (
        <div className="p-3 md:p-6 space-y-4 md:space-y-6 bg-slate-50/50 min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-rose-600 p-3 rounded-[1.25rem] text-white shadow-xl shadow-rose-100">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none mb-1">Input Pengeluaran Manual</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pencatatan Debet Saldo Dompet Unit</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={openAddModal}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-6 py-3.5 rounded-2xl transition-all uppercase tracking-widest shadow-xl shadow-rose-100"
                    >
                        <Plus className="w-4 h-4" /> Catat Pengeluaran
                    </button>
                </div>
            </div>

            {/* dynamic source tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {availableSources.map((source) => (
                    <button
                        key={source}
                        onClick={() => setActiveTab(source)}
                        className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                            activeTab === source 
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {source}
                    </button>
                ))}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group">
                    <div className="bg-rose-50 p-3.5 rounded-2xl text-rose-600 shrink-0">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{getCardLabel()}</p>
                        <p className="text-xl font-black text-rose-600 tracking-tighter italic">Rp {totalNominalSummary.toLocaleString('id-ID')}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group">
                    <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600 shrink-0">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Saldo Aktif {activeTab} Unit</p>
                        <p className="text-xl font-black text-emerald-600 tracking-tighter italic">Rp {liveWalletBalance.toLocaleString('id-ID')}</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-[2rem] shadow-xl shadow-slate-200 flex items-center gap-4">
                    <div className="bg-white/10 p-3.5 rounded-2xl text-white shrink-0">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Unit Pencatat</p>
                        <p className="text-xl font-black text-white tracking-tighter uppercase">{currentUserUnit}</p>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-2.5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-3 flex-1">
                    <div className="flex gap-2">
                        <select
                            value={selectedMonth || ''}
                            onChange={(e) => setSelectedMonth(e.target.value === '' ? null : Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-slate-650 outline-none focus:ring-2 focus:ring-rose-500/20"
                        >
                            <option value="">Semua Bulan</option>
                            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>

                        <select
                            value={selectedYear || ''}
                            onChange={(e) => setSelectedYear(e.target.value === '' ? null : Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-slate-650 outline-none focus:ring-2 focus:ring-rose-500/20"
                        >
                            <option value="">Semua Tahun</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>

                        <select
                            value={selectedMethod}
                            onChange={(e) => setSelectedMethod(e.target.value as any)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-slate-650 outline-none focus:ring-2 focus:ring-rose-500/20"
                        >
                            <option value="Semua">Semua Metode</option>
                            <option value="Cash">Cash</option>
                            <option value="Transfer">Transfer</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={handleExportExcel}
                    className="flex items-center justify-center gap-2 border border-slate-250 bg-white hover:bg-slate-50 text-[10px] font-black px-6 py-3 rounded-2xl uppercase tracking-widest transition-all text-slate-700"
                >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
                </button>
            </div>

            {/* High Density History Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Tgl & ID</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/2">Keterangan / Deskripsi</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Sumber Dana</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Metode</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Nominal (Rp)</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <FileText className="w-16 h-16" />
                                            <p className="text-xs font-black uppercase tracking-[0.3em]">Belum ada data pengeluaran</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-3.5">
                                            <p className="text-[11px] font-black text-slate-600 leading-none mb-1 uppercase">{tx.tanggal}</p>
                                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{tx.id.substring(0, 8).toUpperCase()}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-[11px] font-black text-slate-800 leading-tight">{tx.keterangan || '-'}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-[10px] font-black text-rose-700 uppercase tracking-tighter">{tx.sumber_dana}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-lg inline-block">
                                                {tx.metode_pencairan} {tx.nama_bank !== '-' ? `(${tx.nama_bank})` : ''}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <p className="text-[11px] font-black text-rose-600 italic tracking-tighter">
                                                Rp {Number(tx.nominal).toLocaleString('id-ID')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100">
                                                <button
                                                    onClick={() => handleEditClick(tx)}
                                                    className="p-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg transition-all text-slate-600"
                                                    title="Edit Transaksi"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(tx.id)}
                                                    className="p-1.5 bg-slate-150 hover:bg-rose-600 hover:text-white rounded-lg transition-all text-rose-600"
                                                    title="Hapus Transaksi"
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

            {/* Input Modal PopUp Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        
                        {/* Header */}
                        <div className="bg-slate-900 text-white p-6 md:p-8 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-rose-500/20 p-2.5 rounded-2xl text-rose-400">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight uppercase leading-none mb-1.5">{editingId ? 'Edit Pengeluaran' : 'Catat Pengeluaran Manual'}</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Mengurangi saldo kategori dompet unit</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white/80 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        <div className="p-6 md:p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                            {message && (
                                <div className={`flex items-start gap-3 p-4 rounded-2xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
                                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                                    <p className="text-xs font-bold leading-relaxed">{message.text}</p>
                                </div>
                            )}

                            {/* 1. Tanggal */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> Tanggal Transaksi *</label>
                                <input 
                                    type="date"
                                    value={tanggal}
                                    onChange={(e) => setTanggal(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 transition-all"
                                />
                            </div>

                            {/* 2. Sumber Dana */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><DollarSign className="w-3 h-3" /> Sumber Dana / Kategori *</label>
                                <select
                                    value={sumberDana}
                                    onChange={(e) => setSumberDana(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 transition-all"
                                >
                                    <option value="" disabled>Pilih Sumber Dana</option>
                                    {availableSources.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* 3. Nominal */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><DollarSign className="w-3 h-3" /> Nominal Pengeluaran (Rp) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-xs font-black text-slate-400">Rp</span>
                                    <input 
                                        type="text"
                                        placeholder="0"
                                        value={nominal ? Number(nominal).toLocaleString('id-ID') : ''}
                                        onChange={handleNominalChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-xs font-black text-slate-800 focus:outline-none focus:border-rose-500 transition-all italic"
                                    />
                                </div>
                            </div>

                            {/* 4. Metode Pencairan */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><CreditCard className="w-3 h-3" /> Metode Pencairan *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMetodePencairan('Cash')}
                                        className={`py-3.5 rounded-xl text-xs font-bold border transition-all ${metodePencairan === 'Cash' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        Cash (Kas Tunai)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMetodePencairan('Transfer')}
                                        className={`py-3.5 rounded-xl text-xs font-bold border transition-all ${metodePencairan === 'Transfer' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        Transfer (Kas Bank)
                                    </button>
                                </div>
                            </div>

                            {/* 5. Nama Bank */}
                            {metodePencairan === 'Transfer' && (
                                <div className="space-y-1 animate-in fade-in duration-300">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><Banknote className="w-3 h-3" /> Nama Bank Operasional *</label>
                                    <input 
                                        type="text"
                                        placeholder="Contoh: Bank Syariah Indonesia (BSI), BNI, dll."
                                        value={namaBank}
                                        onChange={(e) => setNamaBank(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 transition-all"
                                    />
                                </div>
                            )}

                            {/* 6. Keterangan */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><FileText className="w-3 h-3" /> Keterangan / Deskripsi Transaksi</label>
                                <textarea 
                                    placeholder="Ketik keterangan atau peruntukan penarikan dana secara detail..."
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer / Submit Buttons */}
                        <div className="bg-slate-50 p-6 md:p-8 flex items-center justify-end gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3.5 bg-white border border-slate-250 text-slate-650 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-rose-100 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Menyimpan...' : (editingId ? 'Perbarui Transaksi' : 'Simpan Transaksi')}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
