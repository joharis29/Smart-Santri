'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    Settings, 
    ChevronDown, 
    ChevronRight, 
    Filter, 
    Download, 
    User, 
    Building, 
    ShieldCheck, 
    XCircle, 
    CheckCircle, 
    Clock, 
    Check, 
    X, 
    Edit3, 
    AlertCircle,
    FileText,
    ClipboardCheck,
    Search,
    ArrowUpRight,
    Info
} from 'lucide-react';
import { YayasanWidgets } from '@/components/dashboard/YayasanWidgets';
import { PendidikanWidgets } from '@/components/dashboard/PendidikanWidgets';
import { AsramaWidgets } from '@/components/dashboard/AsramaWidgets';
import { DapurWidgets } from '@/components/dashboard/DapurWidgets';

const UNITS = [
  'Pusat (Yayasan)', 'TK', 'SDIT 1', 'SDIT 2', 'MTs', 'MA', 'Diniyah', 
  'Asrama Putra', 'Asrama Putri', 'THQ', 'Dapur Asrama Putra', 'Dapur Asrama Putri'
];

const AVAILABLE_STATUSES = ['MENUNGGU KEPALA', 'PENDING', 'CAIR', 'DITOLAK', 'BUTUH REVISI', 'LUNAS/SELESAI', 'SUDAH DITERIMA', 'DRAFT'];

export default function AdminDashboardPage() {
  // --- CORE STATE ---
  const [activeUnit, setActiveUnit] = useState('Pusat (Yayasan)');
  const [showSettings, setShowSettings] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'STAFF' | 'BENDAHARA_UNIT' | 'KEPALA_UNIT' | 'BENDAHARA_PUSAT'>('BENDAHARA_PUSAT');
  const [activeTab, setActiveTab] = useState<'ALL' | 'RKA' | 'LPJ'>('ALL');

  // --- FILTER & MODAL STATE ---
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  
  const [selectedTrxForTracking, setSelectedTrxForTracking] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTrxForReview, setSelectedTrxForReview] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<any>(null);
  const [catatanRevisi, setCatatanRevisi] = useState('');
  const [editForm, setEditForm] = useState({ title: '', nominal: 0 });

  // --- SIMULATED DATA ---
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'RKA', unit: 'THQ', date: '05 Feb 2026', title: 'Beli ATK & Buku Hafalan', desc: 'Dana: Yayasan', status: 'PENDING', nominal: 1250000, statusColor: 'bg-orange-100 text-orange-700' },
    { id: 2, type: 'LPJ', unit: 'SDIT 1', date: '04 Feb 2026', title: 'Realisasi Service AC', desc: 'Dana: Yayasan', status: 'BUTUH REVISI', nominal: 800000, statusColor: 'bg-rose-100 text-rose-700', note: 'Nota kuitansi terpotong.' },
    { id: 3, type: 'RKA', unit: 'MA', date: '03 Feb 2026', title: 'Honor Kepanitiaan Lomba', desc: 'Dana: BOS', status: 'PENDING', nominal: 3500000, statusColor: 'bg-orange-100 text-orange-700' },
    { id: 4, type: 'LPJ', unit: 'Dapur Asrama Putra', date: '02 Feb 2026', title: 'Realisasi Belanja Beras', desc: 'Kas Internal', status: 'LUNAS/SELESAI', nominal: 8500000, statusColor: 'bg-emerald-100 text-emerald-700' },
    { id: 5, type: 'RKA', unit: 'SDIT 1', date: '01 Feb 2026', title: 'Perbaikan Gedung', desc: 'Dana: Yayasan', status: 'SUDAH DITERIMA', nominal: 750000, statusColor: 'bg-indigo-100 text-indigo-700' },
    { id: 6, type: 'RKA', unit: 'TK', date: '30 Jan 2026', title: 'Beli Crayon', desc: 'Dana: Yayasan', status: 'DRAFT', nominal: 250000, statusColor: 'bg-slate-100 text-slate-500' },
  ]);

  const [prefs, setPrefs] = useState({
    showSpp: true, showZakat: true, showInfaqYayasan: true, showKoperasi: true, showPoskestren: true, showTabungan: true, showUangSaku: true,
    showBos: true, showYayasan: true, showAntarJemput: true, showSubsidi: true, showInfaq: true,
    showKasInternal: true, showSaldo: true, showAkumulasi: true, showSupplier: true
  });

  // --- ACTIONS ---
  const togglePref = (key: keyof typeof prefs) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const handleApprove = (id: number) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status === 'BERHASIL DIAJUKAN') return { ...t, status: 'PENDING', statusColor: 'bg-orange-100 text-orange-700' };
        if (t.status === 'PENDING') return { ...t, status: 'CAIR', statusColor: 'bg-emerald-100 text-emerald-700' };
      }
      return t;
    }));
  };

  const confirmReject = () => {
    if (!selectedTrx) return;
    setTransactions(prev => prev.map(t => {
      if (t.id === selectedTrx.id) {
        return { 
          ...t, 
          status: 'DITOLAK', 
          statusColor: 'bg-rose-100 text-rose-700', 
          note: catatanRevisi,
          title: userRole === 'BENDAHARA_PUSAT' ? editForm.title : t.title,
          nominal: userRole === 'BENDAHARA_PUSAT' ? editForm.nominal : t.nominal
        };
      }
      return t;
    }));
    setIsRejectModalOpen(false);
    setSelectedTrx(null);
  };

  const handleReviewAction = (action: 'APPROVE' | 'REJECT') => {
    if (!selectedTrxForReview) return;
    
    setTransactions(prev => prev.map(t => {
      if (t.id === selectedTrxForReview.id) {
        if (action === 'APPROVE') {
          let nextStatus = t.status;
          let nextColor = t.statusColor;
          
          if (t.status === 'PENDING') {
              nextStatus = 'CAIR';
              nextColor = 'bg-emerald-100 text-emerald-700';
          } else if (t.status === 'BUTUH REVISI' || t.status === 'DRAFT' || t.status === 'MENUNGGU KEPALA') {
              nextStatus = 'PENDING';
              nextColor = 'bg-orange-100 text-orange-700';
          } else if (t.status === 'CAIR') {
              nextStatus = 'LUNAS/SELESAI';
              nextColor = 'bg-emerald-100 text-emerald-700';
          }
          
          return { ...t, status: nextStatus, statusColor: nextColor, note: reviewNote };
        } else {
          return { ...t, status: 'DITOLAK', statusColor: 'bg-rose-100 text-rose-700', note: reviewNote };
        }
      }
      return t;
    }));
    
    setIsReviewModalOpen(false);
    setSelectedTrxForReview(null);
    setReviewNote('');
  };

  // --- EFFECTS ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- DERIVED DATA ---
  const category = (unit: string) => {
    if (unit === 'Pusat (Yayasan)') return 'pusat';
    if (['TK', 'SDIT 1', 'SDIT 2', 'MTs', 'MA', 'Diniyah'].includes(unit)) return 'pendidikan';
    if (['Asrama Putra', 'Asrama Putri', 'THQ'].includes(unit)) return 'asrama';
    return 'dapur';
  };
  const activeCategory = category(activeUnit);

  let activePrefsKeys: (keyof typeof prefs)[] = [];
  if (activeCategory === 'pusat') activePrefsKeys = ['showSpp', 'showZakat', 'showInfaqYayasan', 'showKoperasi', 'showPoskestren', 'showTabungan', 'showUangSaku'];
  else if (activeCategory === 'pendidikan') activePrefsKeys = ['showBos', 'showYayasan', 'showTabungan', 'showAntarJemput', 'showSubsidi', 'showInfaq'];
  else if (activeCategory === 'asrama') activePrefsKeys = ['showYayasan', 'showKasInternal', 'showUangSaku'];
  else activePrefsKeys = ['showSaldo', 'showAkumulasi', 'showSupplier'];

  const availableMonths = Array.from(new Set(
    transactions.map(t => {
        const parts = t.date.split(' ');
        return parts.length === 3 ? `${parts[1]} ${parts[2]}` : t.date;
    })
  ));

  const filteredTransactions = transactions.filter(t => {
    // 1. Tab Filter (RKA/LPJ)
    if (activeTab !== 'ALL' && t.type !== activeTab) return false;
    // 2. Status Filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(t.status)) return false;
    // 3. Month Filter
    if (selectedMonths.length > 0) {
      const parts = t.date.split(' ');
      const tMonth = parts.length === 3 ? `${parts[1]} ${parts[2]}` : t.date;
      if (!selectedMonths.includes(tMonth)) return false;
    }
    return true;
  });

  const unitsToRender = activeCategory === 'pusat' ? UNITS.filter(u => u !== 'Pusat (Yayasan)') : [activeUnit];

  return (
    <div className="p-3 md:p-4 space-y-4">
      
      {/* Header Area */}
      <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center shadow-md">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-tighter">Unit:</h2>
            <div className="relative">
              <select 
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-bold py-1 pl-2 pr-6 rounded-md focus:outline-none text-[11px] cursor-pointer"
                value={activeUnit}
                onChange={(e) => setActiveUnit(e.target.value)}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="hidden lg:flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['STAFF', 'UNIT', 'UNIT', 'PUSAT'] as const).map((role, i) => (
                    <button key={i} onClick={() => setUserRole(i === 0 ? 'STAFF' : i === 1 ? 'BENDAHARA_UNIT' : i === 2 ? 'KEPALA_UNIT' : 'BENDAHARA_PUSAT')} className={`px-2 py-1 rounded text-[9px] font-black tracking-tighter uppercase ${ (i === 3 && userRole === 'BENDAHARA_PUSAT') ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>{role}</button>
                ))}
            </div>
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border border-slate-200"
            >
                <Settings className="w-3.5 h-3.5" /> Atur
            </button>
            {showSettings && (
                <div className="absolute right-6 mt-48 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in zoom-in-95">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic underline decoration-emerald-500">Konfigurasi Widget</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {activePrefsKeys.map(key => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={prefs[key]} onChange={() => togglePref(key)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-700 uppercase tracking-tight">{key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Widgets Area */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {activeCategory === 'pusat' && <YayasanWidgets preferences={prefs} />}
        {activeCategory === 'pendidikan' && <PendidikanWidgets unitType={activeUnit} preferences={prefs} />}
        {activeCategory === 'asrama' && <AsramaWidgets unitType={activeUnit} preferences={prefs} />}
        {activeCategory === 'dapur' && <DapurWidgets preferences={prefs} />}
      </div>

      {/* Integrated Audit Trail with Working Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-2 rounded-lg text-white">
                    <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-tight italic">Jejak Audit & Aktivitas Real-time</h2>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Filter:</p>
                </div>
                
                {/* WORKING FILTER DROPDOWN */}
                <div className="relative" ref={filterRef}>
                    <button 
                        onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                        className={`p-1.5 rounded-lg border transition-all ${selectedStatuses.length > 0 || selectedMonths.length > 0 || activeTab !== 'ALL' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    {isFilterDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 p-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Filter Aktivitas</span>
                                {(selectedStatuses.length > 0 || selectedMonths.length > 0 || activeTab !== 'ALL') && (
                                    <button onClick={() => { setSelectedStatuses([]); setSelectedMonths([]); setActiveTab('ALL'); }} className="text-[8px] text-rose-500 font-bold hover:underline">Reset</button>
                                )}
                            </div>
                            <div className="space-y-4 max-h-64 overflow-y-auto">
                                <div>
                                    <p className="text-[8px] font-black text-slate-300 uppercase mb-2">Berdasarkan Tipe</p>
                                    <div className="space-y-1.5">
                                        {(['ALL', 'RKA', 'LPJ'] as const).map(tab => (
                                            <label key={tab} className="flex items-center gap-2 cursor-pointer group">
                                                <input 
                                                    type="radio" 
                                                    name="activeTab"
                                                    checked={activeTab === tab} 
                                                    onChange={() => setActiveTab(tab)} 
                                                    className="rounded-full text-emerald-600 w-3 h-3 border-slate-300 focus:ring-emerald-500" 
                                                />
                                                <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-700 uppercase tracking-tighter">
                                                    {tab === 'ALL' ? 'Semua Tipe' : tab}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-300 uppercase mb-2">Berdasarkan Status</p>
                                    <div className="space-y-1.5">
                                        {AVAILABLE_STATUSES.map(st => (
                                            <label key={st} className="flex items-center gap-2 cursor-pointer group">
                                                <input type="checkbox" checked={selectedStatuses.includes(st)} onChange={(e) => e.target.checked ? setSelectedStatuses([...selectedStatuses, st]) : setSelectedStatuses(selectedStatuses.filter(s => s !== st))} className="rounded text-emerald-600 w-3 h-3" />
                                                <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-700 uppercase tracking-tighter">{st}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-300 uppercase mb-2">Berdasarkan Bulan</p>
                                    <div className="space-y-1.5">
                                        {availableMonths.map(mo => (
                                            <label key={mo} className="flex items-center gap-2 cursor-pointer group">
                                                <input type="checkbox" checked={selectedMonths.includes(mo)} onChange={(e) => e.target.checked ? setSelectedMonths([...selectedMonths, mo]) : setSelectedMonths(selectedMonths.filter(m => m !== mo))} className="rounded text-emerald-600 w-3 h-3" />
                                                <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-700 uppercase tracking-tighter">{mo}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="p-2 lg:p-3 space-y-1.5 bg-slate-50/20">
            {unitsToRender.map(unit => {
                const unitTrx = filteredTransactions.filter(t => t.unit === unit);
                const isExpanded = expandedUnit === unit;

                return (
                    <div key={unit} className={`border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'border-emerald-100 bg-white shadow-sm' : 'border-slate-50 bg-white'}`}>
                        <div className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-50/50" onClick={() => setExpandedUnit(isExpanded ? null : unit)}>
                            <div className="flex items-center gap-3">
                                <Building className={`w-3.5 h-3.5 ${isExpanded ? 'text-emerald-600' : 'text-slate-300'}`} />
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight italic">{unit}</span>
                                <span className="text-[9px] font-black text-emerald-600/70 ml-2 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50 shadow-sm">{unitTrx.length} Aktivitas Terlacak</span>
                            </div>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                        </div>

                        {isExpanded && (
                            <div className="border-t border-slate-50 overflow-x-auto">
                                <table className="w-full text-left text-[9px]">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest w-10 text-center">Tipe</th>
                                            <th className="px-2 py-2 font-black text-slate-400 uppercase tracking-widest">Detail Aktivitas</th>
                                            <th className="px-2 py-2 font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                            <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                                            <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest text-center">Opsi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {unitTrx.length === 0 ? (
                                            <tr><td colSpan={5} className="py-8 text-center italic text-slate-300 font-bold uppercase tracking-widest text-[8px]">Tidak ada data filter</td></tr>
                                        ) : (
                                            unitTrx.map(trx => (
                                                <tr key={trx.id} className="hover:bg-slate-50/30 group">
                                                    <td className="px-4 py-2 text-center">
                                                        <div className={`inline-flex p-1 rounded-md ${trx.type === 'RKA' ? 'bg-amber-50 text-amber-600 shadow-sm border border-amber-100' : 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'}`}>
                                                            {trx.type === 'RKA' ? <FileText className="w-3 h-3" /> : <ClipboardCheck className="w-3 h-3" />}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <p className="font-black text-slate-800 tracking-tight leading-none mb-0.5">{trx.title}</p>
                                                        <p className="text-[8px] text-slate-400 font-medium italic leading-none">{trx.date} • {trx.desc}</p>
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${trx.statusColor}`}>
                                                            {trx.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-black text-slate-800 italic tracking-tighter">
                                                        Rp {trx.nominal.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button 
                                                                onClick={() => setSelectedTrxForTracking(trx)}
                                                                className="p-1 text-slate-300 hover:text-emerald-600 transition-all" title="Lacak Progres"><ShieldCheck className="w-3.5 h-3.5" /></button>
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedTrxForReview(trx);
                                                                    setReviewNote(trx.note || '');
                                                                    setIsReviewModalOpen(true);
                                                                }}
                                                                className="p-1 text-slate-300 hover:text-emerald-600 transition-all" title="Tinjau Detail"><ArrowUpRight className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      {/* TRACKING MODAL - FULLY RESTORED */}
      {selectedTrxForTracking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Jejak Audit ID: {selectedTrxForTracking.id}</p>
                <h3 className="text-sm font-black italic tracking-tight">{selectedTrxForTracking.title}</h3>
              </div>
              <button onClick={() => setSelectedTrxForTracking(null)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="relative space-y-6">
                <div className="absolute left-[9px] top-1 bottom-1 w-[1px] bg-slate-100"></div>
                {[
                    { l: 'DRAFT', d: 'Staf Pengaju', r: 'INIT' },
                    { l: 'VERIFIKASI', d: 'Bendahara Unit', r: 'TREASURER' },
                    { l: 'PERSETUJUAN', d: 'Kepala Unit', r: 'HEAD' },
                    { l: 'OTORISASI', d: 'Bendahara Pusat', r: 'CENTRAL' },
                    { l: 'PENCAIRAN', d: 'Dana Siap/Cair', r: 'DONE' }
                ].map((step, i) => (
                    <div key={i} className="flex gap-4 relative z-10 items-start">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${i < 3 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                            {i < 3 ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        </div>
                        <div>
                            <p className={`text-[10px] font-black tracking-tight ${i < 3 ? 'text-slate-800' : 'text-slate-300'}`}>{step.l}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{step.d}</p>
                        </div>
                    </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end">
                <button onClick={() => setSelectedTrxForTracking(null)} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT/EDIT MODAL - FULLY RESTORED */}
      {isRejectModalOpen && selectedTrx && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100"><AlertCircle className="w-6 h-6" /></div>
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase italic">Tolak & Revisi</h3>
                    <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Kirim Balik ke Staf</p>
                </div>
            </div>
            <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-bold focus:ring-2 focus:ring-rose-500 outline-none min-h-[100px] italic"
                placeholder="Berikan alasan penolakan agar staf segera merevisi..."
                value={catatanRevisi}
                onChange={(e) => setCatatanRevisi(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
                <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 text-[10px] font-black rounded-xl uppercase tracking-widest">Batal</button>
                <button onClick={confirmReject} disabled={!catatanRevisi.trim()} className="flex-1 py-2 bg-rose-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-rose-200 disabled:opacity-50">Tolak</button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & APPROVAL MODAL */}
      {isReviewModalOpen && selectedTrxForReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className={`p-6 text-white flex justify-between items-start ${selectedTrxForReview.type === 'RKA' ? 'bg-amber-600' : 'bg-blue-600'}`}>
              <div className="flex gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                   {selectedTrxForReview.type === 'RKA' ? <FileText className="w-6 h-6" /> : <ClipboardCheck className="w-6 h-6" />}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest">ID: {selectedTrxForReview.id}</span>
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest">{selectedTrxForReview.type}</span>
                    </div>
                    <h3 className="text-lg font-black italic leading-tight">{selectedTrxForReview.title}</h3>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-tighter">{selectedTrxForReview.unit} • {selectedTrxForReview.date}</p>
                </div>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-8 space-y-6">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Saat Ini</p>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${selectedTrxForReview.statusColor}`}>
                            {selectedTrxForReview.status}
                        </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Nominal</p>
                        <p className="text-base font-black text-slate-800 italic">Rp {selectedTrxForReview.nominal.toLocaleString('id-ID')}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Edit3 className="w-3 h-3" /> Catatan Peninjauan</p>
                        <span className="text-[8px] font-bold text-slate-300 italic">Opsional</span>
                    </div>
                    <textarea 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:ring-0 outline-none transition-all min-h-[100px] italic placeholder:text-slate-300"
                        placeholder="Tambahkan catatan atau alasan penolakan di sini..."
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                    />
                </div>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                <button 
                    onClick={() => handleReviewAction('REJECT')}
                    className="flex-1 py-4 bg-white border-2 border-rose-100 text-rose-600 text-xs font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-rose-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <XCircle className="w-4 h-4" /> Tolak
                </button>
                <button 
                    onClick={() => handleReviewAction('APPROVE')}
                    className="flex-[2] py-4 bg-emerald-600 text-white text-xs font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                >
                    <CheckCircle className="w-4 h-4" /> Terima
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}