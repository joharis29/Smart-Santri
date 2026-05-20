'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Download, 
    Search, 
    Filter, 
    ArrowUpRight, 
    Calendar,
    Building2,
    BookOpen,
    ArrowDownLeft,
    ArrowUpRight as ArrowUpRightIcon,
    Wallet,
    Info,
    ChevronDown,
    FileText,
    Lock,
    X,
    Briefcase
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import * as XLSX from 'xlsx';

interface LedgerEntry {
    id: string;
    tanggal: string;
    keterangan: string;
    unit: string;
    coa: string;
    tipe: 'DEBET' | 'KREDIT';
    nominal: number;
    saldo: number;
    refId: string;
    metode?: string;
    bidang?: string;
    tahunAjaran?: string;
}

const MONTHS = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
];

export default function BukuBesarPage() {
    // --- AUTHENTICATION & ACCESS STATES ---
    const [userRole, setUserRole] = useState<string>('');
    const [userUnit, setUserUnit] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [authorizedUnits, setAuthorizedUnits] = useState<string[]>([]);
    
    // --- FILTER & DATA STATES ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [filterBidang, setFilterBidang] = useState('');
    const [filterCOA, setFilterCOA] = useState('');
    const [filterMonth, setFilterMonth] = useState(''); // '' means Semua Bulan
    const [filterTahunAjaran, setFilterTahunAjaran] = useState(''); // '' means Semua Tahun Ajaran
    
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    
    // Active transaction for the double-entry journal pop-up modal
    const [selectedJournalItem, setSelectedJournalItem] = useState<LedgerEntry | null>(null);
    
    const filterRef = useRef<HTMLDivElement>(null);

    // Dynamic School Year (Tahun Ajaran) helper from transaction date
    const getTahunAjaranFromDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-indexed
        if (month >= 7) {
            return `${year}/${year + 1}`;
        } else {
            return `${year - 1}/${year}`;
        }
    };

    // Helper functions to dynamically map standard accounting cash/bank asset names
    const getAssetAccountName = (item: LedgerEntry) => {
        const method = (item.metode || '').toLowerCase();
        if (method.includes('cash') || method.includes('tunai')) {
            return `Kas Tunai (${item.coa})`;
        }
        return `Kas Bank (${item.coa})`;
    };

    const getCentralSPPAccountName = (item: LedgerEntry) => {
        const method = (item.metode || '').toLowerCase();
        if (method.includes('cash') || method.includes('tunai')) {
            return `Kas Tunai (Dompet SPP)`;
        }
        return `Kas Bank (Dompet SPP)`;
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Check user profile and build list of authorized units
    useEffect(() => {
        const checkAccess = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoading(false);
                    return;
                }
                
                // Get primary profile details
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*, unit:unit_id(name)')
                    .eq('id', user.id)
                    .maybeSingle() as any;

                if (!profile) {
                    setIsLoading(false);
                    return;
                }

                const role = profile.role || '';
                const primaryUnit = profile.unit?.name || 'Pusat (Yayasan)';
                setUserRole(role);
                setUserUnit(primaryUnit);

                // Load any assigned multi-roles
                const { data: multiRoles } = await supabase
                    .from('profiles_multi_role')
                    .select('*, unit:unit_id(name)')
                    .eq('user_id', user.id);

                const allowedUnits = new Set<string>();
                if (role === 'BENDAHARA_PUSAT' || role === 'BENDAHARA_UNIT') {
                    allowedUnits.add(primaryUnit);
                }
                
                multiRoles?.forEach((mr: any) => {
                    if (mr.role === 'BENDAHARA_PUSAT' || mr.role === 'BENDAHARA_UNIT') {
                        if (mr.unit?.name) allowedUnits.add(mr.unit.name);
                    }
                });

                const allowedArr = Array.from(allowedUnits);
                setAuthorizedUnits(allowedArr);

                // Automatically default to the first authorized unit
                if (allowedArr.length > 0) {
                    setFilterUnit(allowedArr[0]);
                } else {
                    setFilterUnit(primaryUnit);
                }

            } catch (err) {
                console.error("Error checking ledger access:", err);
            } finally {
                setIsLoading(false);
            }
        };
        checkAccess();
    }, []);

    // --- REAL-TIME SUPABASE FETCH ENGINE ---
    const fetchLedger = async () => {
        if (!filterUnit) return;
        setIsFetching(true);
        try {
            const supabase = createClient();
            const entries: LedgerEntry[] = [];

            // 1. Pemasukan (Debet): Get manual incomes for active filterUnit
            const { data: incomes, error: incErr } = await supabase
                .from('transaksi_pendapatan')
                .select('*')
                .eq('unit', filterUnit);

            if (incErr) console.error("Error fetching ledger incomes:", incErr);

            incomes?.forEach((item: any) => {
                // Normalize COA names for SPP to ensure consistency
                let coaName = item.sumber_dana || 'Dana Pesantren/Yayasan';
                if (coaName === 'SPP' || coaName === 'Dana SPP') {
                    coaName = 'DANA SPP';
                }

                entries.push({
                    id: item.id.substring(0, 8).toUpperCase(),
                    tanggal: item.tanggal,
                    keterangan: item.keterangan || `Pemasukan Dana - ${item.sumber_dana}`,
                    unit: item.unit,
                    coa: coaName,
                    tipe: 'DEBET',
                    nominal: Number(item.nominal),
                    saldo: 0,
                    refId: item.id.substring(0, 8).toUpperCase(),
                    metode: item.jenis_penerimaan || 'Transfer',
                    bidang: 'Penerimaan',
                    tahunAjaran: getTahunAjaranFromDate(item.tanggal)
                });
            });

            // 2. Pengeluaran (Kredit): Get approved LPJ item expenses for active filterUnit
            const { data: lpjDocs, error: lpjErr } = await supabase
                .from('dokumen_pengajuan')
                .select('*, unit:unit_id(name), item_pengajuan(*)')
                .eq('jenis', 'LPJ')
                .eq('status', 'SELESAI');

            if (lpjErr) console.error("Error fetching completed LPJs:", lpjErr);

            lpjDocs?.forEach((doc: any) => {
                const docUnitName = (Array.isArray(doc.unit) ? doc.unit[0]?.name : doc.unit?.name) || 'Pusat (Yayasan)';
                if (docUnitName === filterUnit) {
                    doc.item_pengajuan?.forEach((item: any) => {
                        let coaName = item.sumber_dana || 'Dana Pesantren/Yayasan';
                        if (coaName === 'SPP' || coaName === 'Dana SPP') {
                            coaName = 'DANA SPP';
                        }

                        entries.push({
                            id: item.id.substring(0, 8).toUpperCase(),
                            tanggal: doc.tanggal_kebutuhan || doc.created_at.split('T')[0],
                            keterangan: item.judul_kegiatan || 'Realisasi Pengeluaran LPJ',
                            unit: docUnitName,
                            coa: coaName,
                            tipe: 'KREDIT',
                            nominal: Number(item.nominal),
                            saldo: 0,
                            refId: doc.nomor_dokumen || doc.id.substring(0, 8).toUpperCase(),
                            metode: doc.metode_pencairan || 'Transfer',
                            bidang: doc.bidang || 'Tanpa Bidang',
                            tahunAjaran: doc.tahun_ajaran || (doc.periode_tahun ? `${doc.periode_tahun}/${Number(doc.periode_tahun) + 1}` : getTahunAjaranFromDate(doc.tanggal_kebutuhan || doc.created_at.split('T')[0]))
                        });
                    });
                }
            });

            // 3. Kredit (Alokasi SPP - Khusus Pusat): Get approved RKAs funded by Central out of SPP
            if (filterUnit === 'Pusat (Yayasan)') {
                const { data: approvedRkas, error: rkaErr } = await supabase
                    .from('dokumen_pengajuan')
                    .select('*, unit:unit_id(name), item_pengajuan(*)')
                    .eq('jenis', 'RKA')
                    .eq('status', 'SUDAH_DITERIMA');

                if (rkaErr) console.error("Error fetching approved RKA outflows:", rkaErr);

                approvedRkas?.forEach((doc: any) => {
                    const receiverUnitName = (Array.isArray(doc.unit) ? doc.unit[0]?.name : doc.unit?.name) || 'Unit';
                    doc.item_pengajuan?.forEach((item: any) => {
                        // Extract Yayasan/Pesantren fund split amount
                        let yayasanAmount = 0;
                        try {
                            const details = typeof item.rincian_json === 'string' 
                                ? JSON.parse(item.rincian_json) 
                                : (item.rincian_json || {});
                            const splits = details.fundingSplits || [];
                            if (Array.isArray(splits) && splits.length > 0) {
                                splits.forEach((s: any) => {
                                    const source = (s.source || s.sumber || '').toLowerCase();
                                    if (source.includes('yayasan') || source.includes('pesantren')) {
                                        yayasanAmount += Number(s.amount || s.nominal || 0);
                                    }
                                });
                            } else {
                                const source = (item.sumber_dana || '').toLowerCase();
                                if (source.includes('yayasan') || source.includes('pesantren')) {
                                    yayasanAmount = Number(item.nominal || 0);
                                }
                            }
                        } catch (e) {}

                        if (yayasanAmount > 0) {
                            entries.push({
                                id: item.id.substring(0, 8).toUpperCase(),
                                tanggal: doc.created_at.split('T')[0],
                                keterangan: `Penyaluran RKA ke ${receiverUnitName}: ${item.judul_kegiatan || 'Alokasi Dana'}`,
                                unit: 'Pusat (Yayasan)',
                                coa: 'DANA SPP', // Standardized to 'DANA SPP'
                                tipe: 'KREDIT',
                                nominal: yayasanAmount,
                                saldo: 0,
                                refId: doc.nomor_dokumen || doc.id.substring(0, 8).toUpperCase(),
                                metode: doc.metode_pencairan || 'Transfer',
                                bidang: doc.bidang || 'Tanpa Bidang',
                                tahunAjaran: doc.tahun_ajaran || (doc.periode_tahun ? `${doc.periode_tahun}/${Number(doc.periode_tahun) + 1}` : getTahunAjaranFromDate(doc.created_at.split('T')[0]))
                            });
                        }
                    });
                });
            }

            // 4. Sort chronologically by date ascending
            entries.sort((a, b) => {
                const dateA = new Date(a.tanggal).getTime();
                const dateB = new Date(b.tanggal).getTime();
                if (dateA !== dateB) return dateA - dateB;
                return a.id.localeCompare(b.id);
            });

            setLedgerData(entries);

        } catch (err) {
            console.error("Error compiling ledger database:", err);
        } finally {
            setIsFetching(false);
        }
    };

    // Re-fetch transactions when active filterUnit is updated
    useEffect(() => {
        if (filterUnit) {
            fetchLedger();
        }
    }, [filterUnit]);

    // --- DYNAMIC IN-MEMORY QUERY FILTERS ---
    const filteredLedger = useMemo(() => {
        return ledgerData.filter(item => {
            const matchesSearch = item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 item.refId.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCOA = filterCOA === '' || item.coa === filterCOA;
            const matchesBidang = filterBidang === '' || item.bidang === filterBidang;
            const matchesTahunAjaran = filterTahunAjaran === '' || item.tahunAjaran === filterTahunAjaran;
            const matchesMonth = filterMonth === '' || (new Date(item.tanggal).getMonth() + 1 === Number(filterMonth));
            
            return matchesSearch && matchesCOA && matchesBidang && matchesTahunAjaran && matchesMonth;
        });
    }, [searchQuery, filterCOA, filterBidang, filterTahunAjaran, filterMonth, ledgerData]);

    // Recompute cumulative running balances on the filtered subset for perfect balance display
    const processedLedger = useMemo(() => {
        let runningBalance = 0;
        return filteredLedger.map(item => {
            if (item.tipe === 'DEBET') {
                runningBalance += item.nominal;
            } else {
                runningBalance -= item.nominal;
            }
            return {
                ...item,
                saldo: runningBalance
            };
        });
    }, [filteredLedger]);

    const stats = useMemo(() => {
        const totalDebet = processedLedger.filter(i => i.tipe === 'DEBET').reduce((acc, curr) => acc + curr.nominal, 0);
        const totalKredit = processedLedger.filter(i => i.tipe === 'KREDIT').reduce((acc, curr) => acc + curr.nominal, 0);
        return { totalDebet, totalKredit };
    }, [processedLedger]);

    const uniqueCOAs = useMemo(() => {
        return Array.from(new Set(ledgerData.map(i => i.coa)));
    }, [ledgerData]);

    const uniqueBidangs = useMemo(() => {
        return Array.from(new Set(ledgerData.map(i => i.bidang).filter(Boolean))) as string[];
    }, [ledgerData]);

    const uniqueTahunAjarans = useMemo(() => {
        return Array.from(new Set(ledgerData.map(i => i.tahunAjaran).filter(Boolean))) as string[];
    }, [ledgerData]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filterBidang) count++;
        if (filterCOA) count++;
        if (filterMonth) count++;
        if (filterTahunAjaran) count++;
        return count;
    }, [filterBidang, filterCOA, filterMonth, filterTahunAjaran]);

    const handleClearFilters = () => {
        setFilterBidang('');
        setFilterCOA('');
        setFilterMonth('');
        setFilterTahunAjaran('');
    };

    // --- HIGH FIDELITY EXCEL EXPORT ENGINE ---
    const handleExcelExport = () => {
        if (processedLedger.length === 0) {
            alert("Tidak ada entri Buku Besar untuk diekspor!");
            return;
        }

        const dataToExport = processedLedger.map((item, idx) => ({
            'No': idx + 1,
            'Tanggal': item.tanggal,
            'No. Ref': item.id,
            'Keterangan Transaksi': item.keterangan,
            'Unit Kerja': item.unit,
            'Bidang': item.bidang || '-',
            'Tahun Ajaran': item.tahunAjaran || '-',
            'Akun (COA)': item.coa,
            'Debet (Rp)': item.tipe === 'DEBET' ? item.nominal : 0,
            'Kredit (Rp)': item.tipe === 'KREDIT' ? item.nominal : 0,
            'Saldo Berjalan (Rp)': item.saldo
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        
        // Auto column widths sizing
        const colWidths = Object.keys(dataToExport[0]).map(key => {
            let maxLen = key.length;
            dataToExport.forEach(row => {
                const str = String((row as any)[key] || '');
                if (str.length > maxLen) maxLen = str.length;
            });
            return { wch: maxLen + 4 };
        });
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Buku Besar");
        
        const periodStr = filterMonth 
            ? `${MONTHS.find(m => m.value === Number(filterMonth))?.label}` 
            : 'Semua_Periode';

        XLSX.writeFile(
            workbook, 
            `Buku_Besar_${filterUnit.replace(/[^a-zA-Z0-9]/g, '_')}_${periodStr}.xlsx`
        );
    };

    // --- LOADING RENDER ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Memvalidasi Otoritas Keamanan...</p>
                </div>
            </div>
        );
    }

    // --- ACCESS ENFORCEMENT CONTROL ---
    const isAuthorized = userRole === 'BENDAHARA_PUSAT' || userRole === 'BENDAHARA_UNIT' || authorizedUnits.length > 0;

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
                <div className="bg-white max-w-md w-full p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100 flex flex-col items-center text-center space-y-6">
                    <div className="bg-rose-50 p-6 rounded-[2rem] text-rose-600 shadow-inner">
                        <Lock className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Akses Terkunci & Rahasia</h2>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Dokumen Terbatas Milik Bendahara</p>
                    </div>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed">
                        Maaf, Laporan Buku Besar (Ledger) ini bersifat sangat rahasia. Akses hanya diizinkan untuk peran **Bendahara Unit** dan **Bendahara Pusat**. Peran Anda ({userRole || 'Tamu'}) tidak memiliki izin.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/admin'}
                        className="w-full bg-slate-900 text-white text-[10px] font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-widest"
                    >
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 md:p-6 space-y-4 md:space-y-6 bg-slate-50/50 min-h-screen">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-3 rounded-[1.25rem] text-white shadow-xl shadow-slate-200">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none mb-1">Laporan Buku Besar</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Konsolidasi Jurnal & Mutasi Keuangan Real-time</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={handleExcelExport}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white text-[10px] font-black px-6 py-3.5 rounded-2xl hover:bg-emerald-700 transition-all uppercase tracking-widest shadow-xl shadow-emerald-100"
                    >
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
                    <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <ArrowDownLeft className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Pemasukan (Debet)</p>
                        <p className="text-xl font-black text-slate-800 tracking-tighter italic">Rp {stats.totalDebet.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-rose-200 transition-all">
                    <div className="bg-rose-50 p-3.5 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                        <ArrowUpRightIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Pengeluaran (Kredit)</p>
                        <p className="text-xl font-black text-rose-600 tracking-tighter italic">Rp {stats.totalKredit.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                
                <div className="bg-slate-900 p-5 rounded-[2rem] shadow-xl shadow-slate-200 flex items-center gap-4 border border-slate-800">
                    <div className="bg-white/10 p-3.5 rounded-2xl text-emerald-400">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Saldo Akhir Kumulatif</p>
                        <p className="text-xl font-black text-white tracking-tighter italic">Rp {(stats.totalDebet - stats.totalKredit).toLocaleString('id-ID')}</p>
                    </div>
                </div>
            </div>

            {/* Unified Toolbar */}
            <div className="bg-white p-2.5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                <div className="flex flex-col lg:flex-row gap-3 flex-1 lg:max-w-4xl">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Cari transaksi, keterangan, atau No. Ref..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    
                    <div className="flex gap-2 relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 border px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${isFilterOpen || activeFiltersCount > 0 ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter className="w-4 h-4" /> Filter Laporan {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
                        </button>

                        {isFilterOpen && (
                            <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-50 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Kriteria Laporan</h3>
                                        {activeFiltersCount > 0 && (
                                            <button 
                                                onClick={handleClearFilters}
                                                className="text-[9px] font-black text-rose-500 hover:underline uppercase"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* 1. UNIT FILTER */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> 1. Unit Kerja Aktif
                                        </label>
                                        <select 
                                            value={filterUnit}
                                            onChange={(e) => setFilterUnit(e.target.value)}
                                            disabled={authorizedUnits.length <= 1}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {authorizedUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    {/* 2. BIDANG FILTER */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Briefcase className="w-3 h-3" /> 2. Berdasarkan Bidang
                                        </label>
                                        <select 
                                            value={filterBidang}
                                            onChange={(e) => setFilterBidang(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Semua Bidang</option>
                                            {uniqueBidangs.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>

                                    {/* 3. COA CATEGORY FILTER */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Info className="w-3 h-3" /> 3. Kategori Akun (COA)
                                        </label>
                                        <select 
                                            value={filterCOA}
                                            onChange={(e) => setFilterCOA(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Semua Akun</option>
                                            {uniqueCOAs.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    {/* 4. BULAN FILTER */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> 4. Berdasarkan Bulan
                                        </label>
                                        <select 
                                            value={filterMonth}
                                            onChange={(e) => setFilterMonth(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Semua Bulan</option>
                                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                    </div>

                                    {/* 5. TAHUN AJARAN FILTER */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> 5. Tahun Ajaran
                                        </label>
                                        <select 
                                            value={filterTahunAjaran}
                                            onChange={(e) => setFilterTahunAjaran(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        >
                                            <option value="">Semua Tahun Ajaran</option>
                                            {uniqueTahunAjarans.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <button 
                                        onClick={() => setIsFilterOpen(false)}
                                        className="w-full bg-slate-900 text-white text-[10px] font-black py-3.5 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-widest"
                                    >
                                        Terapkan Filter
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 px-6 border-l border-slate-100">
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Posting</p>
                        <div className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 leading-none">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Up-to-date
                        </div>
                    </div>
                </div>
            </div>

            {/* High Density Ledger Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Tgl & ID</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/3">Keterangan Transaksi</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit & Bidang</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Akun (COA) & TA</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Debet (Rp)</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Kredit (Rp)</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right bg-slate-50/50">Saldo (Rp)</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Jurnal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isFetching ? (
                                <tr>
                                    <td colSpan={8} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Menarik mutasi kas terbaru...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : processedLedger.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <FileText className="w-16 h-16" />
                                            <p className="text-xs font-black uppercase tracking-[0.3em]">Tidak ada entri Buku Besar</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                processedLedger.map((item, idx) => (
                                    <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-3.5">
                                            <p className="text-[11px] font-black text-slate-600 leading-none mb-1 uppercase tracking-tighter">{item.tanggal}</p>
                                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{item.id}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-[11px] font-black text-slate-800 leading-tight">{item.keterangan}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-lg inline-block">{item.unit}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.bidang || '-'}</p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">{item.coa}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.tahunAjaran || '-'}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <p className={`text-[11px] font-black ${item.tipe === 'DEBET' ? 'text-emerald-600' : 'text-slate-200'}`}>
                                                {item.tipe === 'DEBET' ? item.nominal.toLocaleString('id-ID') : '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <p className={`text-[11px] font-black ${item.tipe === 'KREDIT' ? 'text-rose-600' : 'text-slate-200'}`}>
                                                {item.tipe === 'KREDIT' ? item.nominal.toLocaleString('id-ID') : '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5 text-right bg-slate-50/30">
                                            <p className="text-[11px] font-black text-slate-900 italic tracking-tighter">
                                                {item.saldo.toLocaleString('id-ID')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <button 
                                                onClick={() => setSelectedJournalItem(item)}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-[9px] font-black rounded-lg transition-all uppercase tracking-wider inline-flex items-center gap-1 shadow-sm"
                                                title="Lihat Jurnal Pembukuan"
                                            >
                                                <FileText className="w-3.5 h-3.5" /> Jurnal
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Menampilkan {processedLedger.length} Entri Jurnal Buku Besar</p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Mutasi: {(stats.totalDebet + stats.totalKredit).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Accounting Double-Entry Journal Modal Popup */}
            {selectedJournalItem && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-6 md:p-8 flex justify-between items-center border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-500/20 p-2.5 rounded-2xl text-emerald-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight uppercase leading-none mb-1.5">Jurnal Umum Pembukuan</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Pencatatan Sistem Akuntansi Double-Entry</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedJournalItem(null)}
                                className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white/80 hover:text-white transition-all shadow-inner"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Metadata Info */}
                        <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">No. Bukti / Ref</span>
                                <span className="text-xs font-black text-slate-850 leading-none">{selectedJournalItem.refId}</span>
                            </div>
                            <div>
                                <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Tanggal Post</span>
                                <span className="text-xs font-black text-slate-850 leading-none">{selectedJournalItem.tanggal}</span>
                            </div>
                            <div>
                                <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Unit / Bidang</span>
                                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg inline-block uppercase leading-none tracking-tighter">{selectedJournalItem.unit} / {selectedJournalItem.bidang || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Metode / TA</span>
                                <span className="text-xs font-black text-slate-650 bg-slate-100 px-2.5 py-0.5 rounded-lg inline-block uppercase leading-none tracking-tighter">
                                    {selectedJournalItem.metode || 'Transfer'} ({selectedJournalItem.tahunAjaran || '-'})
                                </span>
                            </div>
                        </div>

                        {/* Transaction Title */}
                        <div className="px-6 md:px-8 py-5 bg-white border-b border-slate-100">
                            <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Deskripsi Transaksi</span>
                            <p className="text-xs font-bold text-slate-700 leading-tight">{selectedJournalItem.keterangan}</p>
                        </div>

                        {/* Double-Entry Journal Table */}
                        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="pb-3 text-[9px] font-black uppercase text-slate-400 tracking-wider">Nama Akun (COA)</th>
                                        <th className="pb-3 text-[9px] font-black uppercase text-slate-400 tracking-wider text-right">Debet (Rp)</th>
                                        <th className="pb-3 text-[9px] font-black uppercase text-slate-400 tracking-wider text-right">Kredit (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {/* DEBET TRANSACTION TYPE */}
                                    {selectedJournalItem.tipe === 'DEBET' && (
                                        <>
                                            <tr>
                                                <td className="py-4 text-xs font-black text-slate-800">
                                                    {getAssetAccountName(selectedJournalItem)}
                                                </td>
                                                <td className="py-4 text-xs font-black text-emerald-600 text-right">
                                                    {selectedJournalItem.nominal.toLocaleString('id-ID')}
                                                </td>
                                                <td className="py-4 text-xs text-slate-350 text-right">-</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 text-xs font-black text-slate-500 pl-8">
                                                    Pendapatan {selectedJournalItem.coa}
                                                </td>
                                                <td className="py-4 text-xs text-slate-355 text-right">-</td>
                                                <td className="py-4 text-xs font-black text-emerald-600 text-right">
                                                    {selectedJournalItem.nominal.toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        </>
                                    )}

                                    {/* KREDIT TRANSACTION TYPE */}
                                    {selectedJournalItem.tipe === 'KREDIT' && (
                                        <>
                                            {selectedJournalItem.unit === 'Pusat (Yayasan)' && selectedJournalItem.coa === 'DANA SPP' ? (
                                                <>
                                                    <tr>
                                                        <td className="py-4 text-xs font-black text-slate-800">
                                                            Beban Penyaluran Dana RKA (SPP Pusat)
                                                        </td>
                                                        <td className="py-4 text-xs font-black text-rose-600 text-right">
                                                            {selectedJournalItem.nominal.toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="py-4 text-xs text-slate-350 text-right">-</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-4 text-xs font-black text-slate-500 pl-8">
                                                            {getCentralSPPAccountName(selectedJournalItem)}
                                                        </td>
                                                        <td className="py-4 text-xs text-slate-355 text-right">-</td>
                                                        <td className="py-4 text-xs font-black text-rose-600 text-right">
                                                            {selectedJournalItem.nominal.toLocaleString('id-ID')}
                                                        </td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <>
                                                    <tr>
                                                        <td className="py-4 text-xs font-black text-slate-800">
                                                            Beban Operasional {selectedJournalItem.coa}
                                                        </td>
                                                        <td className="py-4 text-xs font-black text-rose-600 text-right">
                                                            {selectedJournalItem.nominal.toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="py-4 text-xs text-slate-350 text-right">-</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-4 text-xs font-black text-slate-500 pl-8">
                                                            {getAssetAccountName(selectedJournalItem)}
                                                        </td>
                                                        <td className="py-4 text-xs text-slate-355 text-right">-</td>
                                                        <td className="py-4 text-xs font-black text-rose-600 text-right">
                                                            {selectedJournalItem.nominal.toLocaleString('id-ID')}
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Total Balance Footer */}
                        <div className="bg-slate-50 p-6 md:p-8 flex justify-between items-center border-t border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Kondisi Jurnal Balans</span>
                            <div className="flex gap-6">
                                <div>
                                    <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1 text-right">Total Debet</span>
                                    <span className="text-xs font-black text-emerald-600 tracking-tighter italic">Rp {selectedJournalItem.nominal.toLocaleString('id-ID')}</span>
                                </div>
                                <div>
                                    <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1 text-right">Total Kredit</span>
                                    <span className="text-xs font-black text-rose-600 tracking-tighter italic">Rp {selectedJournalItem.nominal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
