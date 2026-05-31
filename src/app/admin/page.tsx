'use client';

import React, { useState, useEffect, useRef, Fragment } from 'react';
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
    Info,
    Banknote
} from 'lucide-react';
import { YayasanWidgets } from '@/components/dashboard/YayasanWidgets';
import { PendidikanWidgets } from '@/components/dashboard/PendidikanWidgets';
import { AsramaWidgets } from '@/components/dashboard/AsramaWidgets';
import { DapurWidgets } from '@/components/dashboard/DapurWidgets';
import { verifikasiPengajuan, revisiPengajuan } from './pengajuan/buat/actions';
import { switchActiveProfile } from './users/actions';
import { createClient } from '@/utils/supabase/client';

const UNITS = [
  'Pusat (Yayasan)', 'TK', 'SDIT 1', 'SDIT 2', 'MTs', 'MA', 'Diniyah', 
  'Asrama Putra', 'Asrama Putri', 'THQ', 'Dapur Asrama Putra', 'Dapur Asrama Putri'
];

const AVAILABLE_STATUSES = ['MENUNGGU VERIFIKASI', 'MENUNGGU KEPALA', 'MENUNGGU PUSAT', 'MENUNGGU CAIR', 'CAIR', 'DITOLAK', 'BUTUH REVISI', 'SELESAI', 'SUDAH DITERIMA', 'DRAFT'];

export default function AdminDashboardPage() {
  // --- CORE STATE ---
  const [activeUnit, setActiveUnit] = useState('Pusat (Yayasan)');
  const [showSettings, setShowSettings] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'STAFF' | 'BENDAHARA_UNIT' | 'KEPALA_UNIT' | 'BENDAHARA_PUSAT'>('BENDAHARA_PUSAT');
  const [activeTab, setActiveTab] = useState<'ALL' | 'RKA' | 'LPJ'>('ALL');
  const [userId, setUserId] = useState<string>('');
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // --- FILTER & MODAL STATE ---
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const processingReviewRef = useRef(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  
  const [selectedTrxForTracking, setSelectedTrxForTracking] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTrxForReview, setSelectedTrxForReview] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [parentRkaData, setParentRkaData] = useState<any>(null);

  useEffect(() => {
    const fetchParentRka = async () => {
      if (!selectedTrxForReview || (selectedTrxForReview.type !== 'LPJ' && selectedTrxForReview.type !== 'REVISI_RKA')) {
        setParentRkaData(null);
        return;
      }
      
      let parentRkaId = null;
      if (selectedTrxForReview.type === 'REVISI_RKA') {
        parentRkaId = selectedTrxForReview.parent_id;
      } else if (selectedTrxForReview.items) {
        for (const item of selectedTrxForReview.items) {
          let details: any = {};
          try {
            details = typeof item.rincian_json === 'string' ? JSON.parse(item.rincian_json) : (item.rincian_json || {});
          } catch (e) {}
          if (details.rka_id) {
            parentRkaId = details.rka_id;
            break;
          }
        }
      }
      
      if (!parentRkaId) {
        setParentRkaData(null);
        return;
      }
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('dokumen_pengajuan')
          .select('*, item_pengajuan(*)')
          .eq('id', parentRkaId)
          .single();
          
        if (!error && data) {
          setParentRkaData(data);
        } else {
          setParentRkaData(null);
        }
      } catch (e) {
        console.error("Gagal mengambil referensi RKA:", e);
        setParentRkaData(null);
      }
    };
    
    fetchParentRka();
  }, [selectedTrxForReview]);
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<any>(null);
  const [catatanRevisi, setCatatanRevisi] = useState('');
  const [editForm, setEditForm] = useState({ title: '', nominal: 0 });

  // --- REAL DATA (Initialized Empty) ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const [balances, setBalances] = useState<Record<string, any>>({
    yayasan: 0,
    bos: 0,
    spp: 0,
  });

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

  const handleReviewAction = async (action: 'APPROVE' | 'REJECT', overrideNote?: string) => {
    if (!selectedTrxForReview || isVerifying || processingReviewRef.current) return;
    
    processingReviewRef.current = true;
    setIsVerifying(true);
    try {
        const finalNote = overrideNote || reviewNote;
        let calculatedNextStatus = selectedTrxForReview.rawStatus;

        if (action === 'APPROVE') {
            if (selectedTrxForReview.rawStatus === 'MENUNGGU_VERIFIKASI') {
                calculatedNextStatus = selectedTrxForReview.type === 'LPJ' ? 'MENUNGGU_KEPALA' : 'REKAP_BENDAHARA';
            } else if (selectedTrxForReview.rawStatus === 'REKAP_BENDAHARA') {
                calculatedNextStatus = 'MENUNGGU_KEPALA';
            } else if (selectedTrxForReview.rawStatus === 'MENUNGGU_KEPALA') {
                calculatedNextStatus = 'MENUNGGU_PUSAT';
            } else if (selectedTrxForReview.rawStatus === 'MENUNGGU_PUSAT') {
                calculatedNextStatus = selectedTrxForReview.type === 'LPJ' ? 'DISETUJUI' : 'MENUNGGU_CAIR';
            } else if (selectedTrxForReview.rawStatus === 'DISETUJUI') {
                calculatedNextStatus = 'SELESAI';
            } else if (selectedTrxForReview.rawStatus === 'MENUNGGU_CAIR') {
                calculatedNextStatus = 'CAIR';
            } else if (selectedTrxForReview.rawStatus === 'CAIR') {
                calculatedNextStatus = selectedTrxForReview.type === 'RKA' ? 'SUDAH_DITERIMA' : 'SELESAI';
            }
        } else {
            calculatedNextStatus = 'DRAFT';
        }

        // PERSIST TO DATABASE
        let res;
        let chosenMetode = 'Transfer';
        if (action === 'APPROVE') {
            let metode: string | undefined = undefined;
            if (finalNote && finalNote.startsWith('Dicairkan melalui ')) {
                metode = finalNote.replace('Dicairkan melalui ', ''); // 'Transfer' or 'Cash'
                chosenMetode = metode;
            }
            res = await verifikasiPengajuan(selectedTrxForReview.id, calculatedNextStatus, metode);
        } else {
            let consolidatedNote = '';
            const noteParts: string[] = [];
            Object.entries(itemNotes).forEach(([itemId, note]) => {
                if (note && note.trim()) {
                    const itemObj = selectedTrxForReview.items?.find((it: any) => it.id === itemId);
                    const itemTitle = itemObj?.judul_kegiatan || itemObj?.kegiatan || 'Kegiatan';
                    noteParts.push(`- [${itemTitle}]: ${note.trim()}`);
                }
            });
            if (noteParts.length > 0) {
                consolidatedNote = noteParts.join('\n');
            } else {
                consolidatedNote = selectedTrxForReview.type === 'LPJ' ? 'Butuh revisi pada pengajuan LPJ.' : 'Butuh revisi pada pengajuan RKA.';
            }
            const res = await revisiPengajuan(selectedTrxForReview.id, consolidatedNote, itemNotes);
            if (res && res.error) {
                alert("Gagal memproses pengajuan: " + res.error);
                return;
            }
        }
        
        if (action === 'APPROVE') {
            fetchLiveBalances();
        }

        setTransactions(prev => prev.map(t => {
          if (t.id === selectedTrxForReview.id) {
              const statusDisplay = calculatedNextStatus.replace(/_/g, ' ');
              let statusColor = 'bg-slate-100 text-slate-500';
              
              if (calculatedNextStatus === 'MENUNGGU_VERIFIKASI') statusColor = 'bg-sky-100 text-sky-700';
              else if (calculatedNextStatus === 'REKAP_BENDAHARA') statusColor = 'bg-purple-100 text-purple-700';
              else if (calculatedNextStatus === 'MENUNGGU_KEPALA') statusColor = 'bg-amber-100 text-amber-700';
              else if (calculatedNextStatus === 'MENUNGGU_PUSAT') statusColor = 'bg-orange-100 text-orange-700';
              else if (calculatedNextStatus === 'MENUNGGU_CAIR') statusColor = 'bg-blue-100 text-blue-700';
              else if (calculatedNextStatus === 'CAIR') statusColor = 'bg-emerald-100 text-emerald-700';
              else if (calculatedNextStatus === 'REVISI' || calculatedNextStatus === 'DRAFT') statusColor = 'bg-rose-100 text-rose-700';

              return { ...t, status: statusDisplay, rawStatus: calculatedNextStatus, statusColor: statusColor, note: finalNote };
          }
          return t;
        }));
        
        setIsReviewModalOpen(false);
        setSelectedTrxForReview(null);
        setReviewNote('');
    } catch (e) {
        console.error("Error in handleReviewAction:", e);
    } finally {
        setIsVerifying(false);
        processingReviewRef.current = false;
    }
  };

  const fetchVerificationQueue = async () => {
    const supabase = createClient();
    
    let statusFilters = ['MENUNGGU_VERIFIKASI'];
    if (userRole === 'BENDAHARA_UNIT') {
      statusFilters = ['MENUNGGU_VERIFIKASI', 'REKAP_BENDAHARA'];
    } else if (userRole === 'KEPALA_UNIT') {
      statusFilters = ['MENUNGGU_KEPALA'];
    } else if (userRole === 'BENDAHARA_PUSAT') {
      statusFilters = ['MENUNGGU_PUSAT', 'DISETUJUI', 'MENUNGGU_CAIR'];
    }

    const { data, error } = await supabase
        .from('dokumen_pengajuan')
        .select(`
            *,
            item_pengajuan(nominal)
        `)
        .in('status', statusFilters)
        .order('created_at', { ascending: false });

    if (!error && data) {
        const mapped = data.map(doc => ({
            id: doc.id,
            parent_id: doc.parent_id,
            shortId: String(doc.id).slice(0, 8).toUpperCase(),
            bidang: doc.bidang || 'Tanpa Bidang',
            periode: `${doc.periode_bulan} ${doc.periode_tahun}`,
            nominal: doc.item_pengajuan?.reduce((acc: number, curr: any) => acc + curr.nominal, 0) || 0,
            itemCount: doc.item_pengajuan?.length || 0,
            status: doc.status
        }));
        setVerificationQueue(mapped);
    }
  };

  const fetchTransactions = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('dokumen_pengajuan')
        .select(`
            *,
            item_pengajuan(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

    if (!error && data) {
        const mapped = data.map(doc => {
            const items = doc.item_pengajuan || [];
            const total = items.reduce((acc: number, curr: any) => acc + curr.nominal, 0) || 0;
            
            // Map status to color and labels used in Dashboard
            let statusDisplay = doc.status.replace(/_/g, ' ');
            let statusColor = 'bg-slate-100 text-slate-500';
            
            if (doc.status === 'MENUNGGU_VERIFIKASI') statusColor = 'bg-sky-100 text-sky-700';
            else if (doc.status === 'REKAP_BENDAHARA') statusColor = 'bg-purple-100 text-purple-700';
            else if (doc.status === 'MENUNGGU_KEPALA') statusColor = 'bg-amber-100 text-amber-700';
            else if (doc.status === 'MENUNGGU_PUSAT') statusColor = 'bg-orange-100 text-orange-700';
            else if (doc.status === 'DISETUJUI') statusColor = 'bg-emerald-100 text-emerald-700';
            else if (doc.status === 'REVISI') statusColor = 'bg-rose-100 text-rose-700';
            else if (doc.status === 'DRAFT') statusColor = 'bg-slate-100 text-slate-500';

            return {
                id: doc.id,
                parent_id: doc.parent_id,
                type: doc.jenis || 'RKA',
                title: doc.kegiatan || items[0]?.judul_kegiatan || items[0]?.kegiatan || 'Pengajuan Tanpa Judul',
                unit: doc.unit || 'SDIT 1', 
                desc: doc.bidang || 'Tanpa Bidang',
                date: new Date(doc.created_at).toLocaleDateString('id-ID'),
                month: new Date(doc.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
                nominal: total,
                items: items, 
                status: statusDisplay,
                rawStatus: doc.status, // Original DB status
                statusColor: statusColor,
                note: doc.catatan_revisi,
                isRevised: !!doc.catatan_revisi && doc.status !== 'REVISI' && (doc.jenis !== 'REVISI_RKA' || doc.catatan_revisi.includes('- ['))
            };
        });
        setTransactions(mapped);
    }
  };

  const handleDashboardApprove = async (id: string) => {
      setIsVerifying(true);
      const res = await verifikasiPengajuan(id);
      if (res.success) {
          setVerificationQueue(prev => prev.filter(i => i.id !== id));
      }
      setIsVerifying(false);
  };

  const handleDashboardReject = async (id: string, note: string) => {
      setIsVerifying(true);
      const res = await revisiPengajuan(id, note);
      if (res.success) {
          setVerificationQueue(prev => prev.filter(i => i.id !== id));
      }
      setIsVerifying(false);
  };

  // --- EFFECTS ---
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, unit:unit_id(name)')
          .eq('id', user.id)
          .single();

        if (profile) {
          const activeRoleKey = `activeRole_${user.id}`;
          const activeUnitKey = `activeUnit_${user.id}`;
          const savedRole = localStorage.getItem(activeRoleKey) || profile.role;
          const cleanRole = savedRole.toUpperCase();
          const isCenterRole = ['ADMINISTRATOR', 'BENDAHARA_PUSAT', 'PIMPINAN'].includes(cleanRole);

          let finalUnit = localStorage.getItem(activeUnitKey) || 'Pusat (Yayasan)';

          // Strict RBAC Enforcement: If NOT a center/super-user role, lock them strictly to their database-assigned unit!
          if (!isCenterRole) {
            const dbUnitName = (Array.isArray(profile.unit) ? profile.unit[0]?.name : (profile.unit as any)?.name) || 'Pusat (Yayasan)';
            if (finalUnit !== dbUnitName) {
              finalUnit = dbUnitName;
              localStorage.setItem(activeUnitKey, dbUnitName);
              // Sync with active profile action
              await switchActiveProfile({ role: savedRole, unitName: dbUnitName });
            }
          }

          const mapProfileRoleToDashboard = (dbRole: string) => {
            switch (dbRole) {
              case 'ADMINISTRATOR':
              case 'BENDAHARA_PUSAT':
              case 'PIMPINAN':
                return 'BENDAHARA_PUSAT';
              case 'KEPALA_UNIT':
              case 'KEPALA_JENJANG':
                return 'KEPALA_UNIT';
              case 'BENDAHARA_UNIT':
              case 'BENDAHARA_JENJANG':
                return 'BENDAHARA_UNIT';
              default:
                return 'STAFF';
            }
          };

          setActiveUnit(finalUnit);
          setUserRole(mapProfileRoleToDashboard(savedRole));
          setIsGuest(cleanRole === 'GUEST');
        }
      } catch (err) {
        console.error('Error fetching dashboard user role:', err);
      } finally {
        setIsProfileLoaded(true);
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLiveBalances = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('dompet_dana')
        .select('*, unit:unit_id(name)');
      
      if (error) throw error;
      
      if (data) {
        // Filter dompet milik unit aktif
        const activeWallets = data.filter((w: any) => {
          const uName = (Array.isArray(w.unit) ? w.unit[0]?.name : (w.unit as any)?.name) || 'Pusat (Yayasan)';
          return uName.trim() === activeUnit.trim();
        });

        const newBalances: Record<string, any> = {
          yayasan: 0,
          bos: 0,
          spp: 0
        };

        activeWallets.forEach((w: any) => {
          if (w.kategori === 'SPP') newBalances.spp = Number(w.saldo);
          else if (w.kategori === 'YAYASAN' || w.kategori === 'INFAQ') newBalances.yayasan = Number(w.saldo);
          else if (w.kategori === 'BOS') newBalances.bos = Number(w.saldo);

          // Save exact category balance
          newBalances[w.kategori] = Number(w.saldo);
        });

        setBalances(newBalances);
      }
    } catch (err) {
      console.error('Error fetching live balances:', err);
    }
  };

  useEffect(() => {
    if (!isProfileLoaded) return;
    
    // Jika user adalah tamu/baru (freemium), paksa data kosong dan jangan ambil dari database
    if (isGuest) {
      setTransactions([]);
      setVerificationQueue([]);
      setBalances({ yayasan: 0, bos: 0, spp: 0 });
      return;
    }

    fetchTransactions();
    fetchLiveBalances();
    if (userRole === 'BENDAHARA_UNIT' || userRole === 'KEPALA_UNIT' || userRole === 'BENDAHARA_PUSAT') {
        fetchVerificationQueue();
    }
  }, [userRole, activeUnit, isProfileLoaded, isGuest]);

  // --- DERIVED DATA ---
  const category = (unit: string) => {
    if (unit === 'Pusat (Yayasan)') return 'pusat';
    if (['TK', 'SDIT 1', 'SDIT 2', 'MTs', 'MA', 'Diniyah'].includes(unit)) return 'pendidikan';
    if (['Asrama Putra', 'Asrama Putri', 'THQ'].includes(unit)) return 'asrama';
    return 'dapur';
  };
  const activeCategory = category(activeUnit);

  let activePrefsKeys: (keyof typeof prefs)[] = [];
  const trimmedUnit = activeUnit.trim();

  if (activeCategory === 'pusat') {
    activePrefsKeys = ['showSpp', 'showZakat', 'showInfaqYayasan', 'showKoperasi', 'showPoskestren', 'showTabungan', 'showUangSaku'];
  } else if (activeCategory === 'pendidikan') {
    if (trimmedUnit === 'Diniyah') {
        activePrefsKeys = ['showYayasan', 'showSubsidi', 'showInfaq'];
    } else if (trimmedUnit === 'TK') {
        activePrefsKeys = ['showBos', 'showYayasan', 'showTabungan', 'showAntarJemput'];
    } else {
        // SDIT 1, SDIT 2, MTs, MA
        activePrefsKeys = ['showBos', 'showYayasan', 'showTabungan'];
    }
  } else if (activeCategory === 'asrama') {
    activePrefsKeys = ['showYayasan', 'showUangSaku'];
    if (trimmedUnit === 'THQ') {
        activePrefsKeys.push('showTabungan');
    } else {
        activePrefsKeys.push('showKasInternal');
    }
  } else {
    // Dapur
    activePrefsKeys = ['showSaldo', 'showAkumulasi', 'showSupplier'];
  }

  const availableMonths = Array.from(new Set(
    transactions.map(t => t.month || 'Lainnya')
  ));

  const filteredTransactions = transactions.filter(t => {
    // 1. Tab Filter (RKA/LPJ)
    if (activeTab !== 'ALL' && t.type !== activeTab) return false;
    // 2. Status Filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(t.status)) return false;
    // 3. Month Filter
    if (selectedMonths.length > 0 && !selectedMonths.includes(t.month || 'Lainnya')) return false;

    // 4. Role-Based Visibility (Workflow Logic Simulation)
    if (userRole === 'BENDAHARA_PUSAT') {
      // Pusat hanya melihat yang sudah disetujui Kepala Unit (MENUNGGU PUSAT) ke atas
      if (['DRAFT', 'MENUNGGU VERIFIKASI', 'REKAP BENDAHARA', 'MENUNGGU KEPALA', 'REVISI', 'BUTUH REVISI'].includes(t.status)) return false;
    } else if (userRole === 'KEPALA_UNIT') {
      // Kepala Unit melihat yang butuh persetujuannya (MENUNGGU KEPALA) atau yang sudah berjalan lebih lanjut
      if (['DRAFT', 'MENUNGGU VERIFIKASI', 'REKAP BENDAHARA', 'REVISI', 'BUTUH REVISI'].includes(t.status)) return false;
    } else if (userRole === 'BENDAHARA_UNIT') {
      // Bendahara Unit melihat progres, tapi DRAFT hanya muncul di halaman Rekap Draft
      if (t.status === 'DRAFT' || t.status === 'REVISI') return false;
    }
    
    // SEMUA ROLE: Sembunyikan status akhir (Sudah Diterima / Selesai) dan DRAFT dari Dasbor
    if (['SUDAH DITERIMA', 'SELESAI', 'DRAFT'].includes(t.status)) return false;

    return true;
  });

  const unitsToRender = activeCategory === 'pusat' ? UNITS.filter(u => u !== 'Pusat (Yayasan)') : [activeUnit];

  // Otorisasi Peninjauan RKA Berdasarkan Role Alur Approval
  const canReview = selectedTrxForReview ? (() => {
    const status = selectedTrxForReview.status; // e.g., 'MENUNGGU VERIFIKASI', 'MENUNGGU KEPALA'
    if (status === 'MENUNGGU VERIFIKASI' || status === 'REKAP BENDAHARA') {
      return userRole === 'BENDAHARA_UNIT' || userRole === 'BENDAHARA_PUSAT';
    }
    if (status === 'MENUNGGU KEPALA') {
      return userRole === 'KEPALA_UNIT' || userRole === 'BENDAHARA_PUSAT';
    }
    if (status === 'MENUNGGU PUSAT') {
      return userRole === 'BENDAHARA_PUSAT';
    }
    if (status === 'DISETUJUI') {
      return selectedTrxForReview.type === 'LPJ' && userRole === 'BENDAHARA_PUSAT';
    }
    if (status === 'MENUNGGU CAIR') {
      return userRole === 'BENDAHARA_PUSAT';
    }
    if (status === 'CAIR') {
      return userRole === 'BENDAHARA_UNIT' || userRole === 'BENDAHARA_PUSAT';
    }
    return false;
  })() : false;

  const requiredRoleName = selectedTrxForReview ? (() => {
    const status = selectedTrxForReview.status;
    if (status === 'MENUNGGU VERIFIKASI') return 'Bendahara Unit/Jenjang';
    if (status === 'REKAP BENDAHARA') return 'Bendahara Unit/Jenjang';
    if (status === 'MENUNGGU KEPALA') return 'Kepala Unit/Jenjang';
    if (status === 'MENUNGGU PUSAT') return 'Bendahara Pusat';
    if (status === 'DISETUJUI') return 'Bendahara Pusat';
    if (status === 'MENUNGGU CAIR') return 'Bendahara Pusat';
    if (status === 'CAIR') return 'Bendahara Unit/Pusat';
    return 'Pusat';
  })() : '';

  if (!isProfileLoaded) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Dasbor...</p>
        </div>
      </div>
    );
  }

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
              {userRole === 'BENDAHARA_PUSAT' ? (
                <>
                  <select 
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 font-bold py-1 pl-2 pr-6 rounded-md focus:outline-none text-[11px] cursor-pointer"
                    value={activeUnit}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setActiveUnit(val);
                      const activeRoleKey = userId ? `activeRole_${userId}` : 'activeRole';
                      const activeUnitKey = userId ? `activeUnit_${userId}` : 'activeUnit';
                      localStorage.setItem(activeUnitKey, val);
                      const savedRole = localStorage.getItem(activeRoleKey) || 'BENDAHARA_PUSAT';
                      await switchActiveProfile({ role: savedRole, unitName: val });
                      window.location.reload();
                    }}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </>
              ) : (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-black px-2.5 py-1 rounded-md text-[11px] tracking-tight">
                  🔒 {activeUnit}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {userRole !== 'STAFF' && (
                <div className="relative" ref={settingsRef}>
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border border-slate-200"
                    >
                        <Settings className="w-3.5 h-3.5" /> Atur
                    </button>
                    {showSettings && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in zoom-in-95">
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
            )}
        </div>
      </div>

      {/* Widgets Area */}
      {userRole !== 'STAFF' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {activeCategory === 'pusat' && (
              <YayasanWidgets 
                  preferences={prefs} 
                  balances={balances} 
              />
          )}
          {activeCategory === 'pendidikan' && (
              <PendidikanWidgets 
                  unitType={activeUnit} 
                  preferences={prefs} 
                  balances={balances}
              />
          )}
          {activeCategory === 'asrama' && (
              <AsramaWidgets 
                  unitType={activeUnit} 
                  preferences={prefs} 
                  balances={balances}
              />
          )}
          {activeCategory === 'dapur' && (
              <DapurWidgets 
                  preferences={prefs} 
                  balances={balances}
              />
          )}
        </div>
      ) : (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Sumber Dana Pesantren</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Akses terbatas demi menjaga kerahasiaan keuangan pesantren</p>
            </div>
          </div>
          <span className="bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-widest border border-slate-200">
            🔒 Terkunci
          </span>
        </div>
      )}

      {/* Integrated Audit Trail with Working Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-2 rounded-lg text-white">
                    <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Aktivitas Real-time</h2>
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
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter Aktivitas</span>
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
                                    <p className="text-[8px] font-black text-slate-300 uppercase mb-2">Status Aktif Dasbor</p>
                                    <div className="space-y-1.5">
                                        {AVAILABLE_STATUSES.filter(st => ['MENUNGGU KEPALA', 'MENUNGGU PUSAT', 'MENUNGGU CAIR', 'CAIR'].includes(st)).map(st => (
                                            <label key={st} className="flex items-center gap-2 cursor-pointer group">
                                                <input type="checkbox" checked={selectedStatuses.includes(st)} onChange={(e) => e.target.checked ? setSelectedStatuses([...selectedStatuses, st]) : setSelectedStatuses(selectedStatuses.filter(s => s !== st))} className="rounded text-emerald-600 w-3 h-3" />
                                                <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-700 uppercase tracking-tight">{st}</span>
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

        <div className="p-2 lg:p-3 space-y-1.5 bg-slate-50/20 rounded-b-2xl">
            {unitsToRender.map(unit => {
                const unitTrx = filteredTransactions.filter(t => t.unit === unit);
                const isExpanded = expandedUnit === unit;

                return (
                    <div key={unit} className={`border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'border-emerald-100 bg-white shadow-sm' : 'border-slate-50 bg-white'}`}>
                        <div className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-50/50" onClick={() => setExpandedUnit(isExpanded ? null : unit)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedUnit(isExpanded ? null : unit); }} role="button" tabIndex={0} aria-label="Toggle Expand Unit">
                            <div className="flex items-center gap-3">
                                <Building className={`w-3.5 h-3.5 ${isExpanded ? 'text-emerald-600' : 'text-slate-600'}`} />
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{unit}</span>
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
                                            <tr><td colSpan={5} className="py-8 text-center text-slate-300 font-bold uppercase tracking-widest text-[8px]">Tidak ada data filter</td></tr>
                                        ) : (
                                            unitTrx.map(trx => (
                                                <tr key={trx.id} className="hover:bg-slate-50/30 group">
                                                    <td className="px-4 py-2 text-center">
                                                        <div className={`inline-flex p-1 rounded-md ${trx.type === 'RKA' ? 'bg-amber-50 text-amber-600 shadow-sm border border-amber-100' : 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'}`}>
                                                            {trx.type === 'RKA' ? <FileText className="w-3 h-3" /> : <ClipboardCheck className="w-3 h-3" />}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-slate-800 tracking-tight leading-none">{trx.title}</p>
                                                            <span className={`px-1.5 py-0.5 text-[6px] rounded-sm font-black uppercase tracking-widest border ${
                                                                trx.type === 'RKA' 
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200/50' 
                                                                : 'bg-blue-50 text-blue-700 border-blue-200/50'
                                                            }`}>
                                                                {trx.type}
                                                            </span>
                                                            {trx.isRevised && (
                                                                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[6px] rounded-sm font-black uppercase tracking-widest border border-indigo-200">Revisi</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[8px] text-slate-400 font-medium leading-none mt-1">{trx.date} • {trx.desc}</p>
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${trx.statusColor}`}>
                                                            {trx.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-black text-slate-800 tracking-tighter">
                                                        Rp {trx.nominal.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button 
                                                                onClick={() => setSelectedTrxForTracking(trx)}
                                                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all shadow-sm border border-slate-100 hover:border-indigo-100" title="Lacak Progres">
                                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                            </button>
                                                            
                                                            {/* TOMBOL REVIEW UTAMA */}
                                                            <button 
                                                                 onClick={() => {
                                                                     setSelectedTrxForReview(trx);
                                                                     const notes: Record<string, string> = {};
                                                                     trx.items?.forEach((it: any) => {
                                                                         notes[it.id] = it.catatan_revisi || '';
                                                                     });
                                                                     setItemNotes(notes);
                                                                     setReviewNote(trx.note || '');
                                                                     setIsReviewModalOpen(true);
                                                                 }}
                                                                 className={`p-1 rounded transition-all shadow-sm border ${
                                                                     ((userRole === 'BENDAHARA_UNIT' && trx.status === 'MENUNGGU VERIFIKASI') || (userRole === 'BENDAHARA_PUSAT' && trx.status === 'MENUNGGU PUSAT'))
                                                                     ? 'text-emerald-600 hover:bg-emerald-50 border-emerald-100' 
                                                                     : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-slate-100 hover:border-indigo-100'
                                                                 }`} 
                                                                 title="Lihat Detail & Verifikasi"
                                                             >
                                                                 <ArrowUpRight className="w-3.5 h-3.5" />
                                                             </button>
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
                {(() => {
                    const statusRank: Record<string, number> = {
                        'DRAFT': 0,
                        'REVISI': 0,
                        'MENUNGGU_VERIFIKASI': 1,
                        'MENUNGGU_KEPALA': 2,
                        'MENUNGGU_PUSAT': 3,
                        'MENUNGGU_CAIR': 4,
                        'CAIR': 5,
                        'SUDAH_DITERIMA': 6,
                        'SELESAI': 6
                    };
                    const currentRank = statusRank[selectedTrxForTracking.rawStatus] || 0;

                    return [
                        { l: 'DRAFT', d: 'Staf Pengaju', rank: 1 },
                        { l: 'VERIFIKASI', d: 'Bendahara Unit', rank: 2 },
                        { l: 'PERSETUJUAN', d: 'Kepala Unit', rank: 3 },
                        { l: 'OTORISASI', d: 'Bendahara Pusat', rank: 4 },
                        { l: 'PENCAIRAN', d: 'Dana Siap/Cair', rank: 5 },
                        { l: 'SELESAI', d: 'Sudah Diterima', rank: 6 }
                    ].map((step, i) => {
                        const isDone = currentRank >= step.rank;
                        const isActive = currentRank === step.rank - 1;

                        return (
                            <div key={i} className="flex gap-4 relative z-10 items-start">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-all duration-500 ${isDone ? 'bg-indigo-600 text-white' : isActive ? 'bg-amber-400 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                                    {isDone ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black tracking-tight ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>{step.l}</p>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${isDone ? 'text-indigo-500/70' : 'text-slate-300'}`}>{step.d}</p>
                                </div>
                            </div>
                        );
                    });
                })()}
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
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header - Fixed Height */}
            <div className={`px-6 py-4 text-white flex justify-between items-start shrink-0 ${selectedTrxForReview.type === 'RKA' ? 'bg-amber-600' : 'bg-blue-600'}`}>
              <div className="flex gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                   {selectedTrxForReview.type === 'RKA' ? <FileText className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-black italic leading-tight uppercase tracking-tight">
                            {selectedTrxForReview.items?.[0]?.judul_kegiatan || selectedTrxForReview.title}
                        </h3>
                        {selectedTrxForReview.isRevised && (
                            <span className="px-2 py-0.5 bg-white/20 border border-white/30 rounded-full text-[8px] font-black uppercase tracking-widest">Hasil Revisi</span>
                        )}
                    </div>
                    <p className="text-[10px] font-bold opacity-90 uppercase tracking-tighter">
                        {selectedTrxForReview.unit} / {selectedTrxForReview.desc} • {selectedTrxForReview.date}
                    </p>
                </div>
              </div>
              <button onClick={() => setIsReviewModalOpen(false)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            
            {/* Funding Accumulation Summary - Professional Toolbar */}
            {selectedTrxForReview && (
                <div className="bg-slate-100/50 border-b border-slate-200 px-6 py-2 flex flex-wrap gap-3 items-center shrink-0">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Akumulasi Dana:</span>
                    {(() => {
                        const summary: Record<string, number> = {};
                        const subsidiSummary: Record<string, number> = {};
                        
                        if (selectedTrxForReview.type === 'RKA') {
                            selectedTrxForReview.items?.forEach((it: any) => {
                                let details: any = {};
                                try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                
                                const splits = details.fundingSplits || [];
                                if (Array.isArray(splits)) {
                                    splits.forEach((s: any) => {
                                        const source = s.source || s.sumber || 'Lainnya';
                                        const amount = Number(s.nominal || s.amount || 0);
                                        if (amount > 0) summary[source] = (summary[source] || 0) + amount;
                                    });
                                }
                            });
                        } else {
                            // LPJ: Subsidi Silang from LPJ
                            selectedTrxForReview.items?.forEach((it: any) => {
                                let details: any = {};
                                try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                
                                const subsidi = details.subsidiSources || [];
                                if (Array.isArray(subsidi)) {
                                    subsidi.forEach((s: any) => {
                                        const source = s.source || s.sumber || 'Lainnya';
                                        const amount = Number(s.nominal || s.amount || 0);
                                        if (amount > 0) subsidiSummary[source] = (subsidiSummary[source] || 0) + amount;
                                    });
                                }
                            });

                            // LPJ: Akumulasi Dana dari Realisasi LPJ (Bukan RKA)
                            selectedTrxForReview.items?.forEach((it: any) => {
                                let details: any = {};
                                try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                
                                const splits = details.fundingSplits || [];
                                if (Array.isArray(splits)) {
                                    splits.forEach((s: any) => {
                                        const source = s.source || s.sumber || 'Lainnya';
                                        const amount = Number(s.nominal || s.amount || 0);
                                        if (amount > 0) summary[source] = (summary[source] || 0) + amount;
                                    });
                                }
                            });
                        }
                        
                        return (
                            <Fragment>
                                {Object.entries(summary).map(([source, amount], idx) => (
                                    <div key={`main-${idx}`} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className={`w-1.5 h-1.5 rounded-full ${source.toLowerCase().includes('bos') ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">{source}:</span>
                                        <span className="text-[9px] font-black text-slate-950 italic">Rp {amount.toLocaleString('id-ID')}</span>
                                    </div>
                                ))}
                                {Object.entries(subsidiSummary).map(([source, amount], idx) => (
                                    <div key={`subsidi-${idx}`} className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-tighter">{source} (Subsidi Silang):</span>
                                        <span className="text-[9px] font-black text-emerald-950 italic">Rp {amount.toLocaleString('id-ID')}</span>
                                    </div>
                                ))}
                            </Fragment>
                        );
                    })()}
                </div>
            )}

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-50/30">
                {/* Status & Summary Bar */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${selectedTrxForReview.statusColor}`}>
                            {selectedTrxForReview.status}
                        </span>
                    </div>
                    
                    {(selectedTrxForReview.type === 'LPJ' || selectedTrxForReview.type === 'REVISI_RKA') && parentRkaData && (() => {
                        let rkaItemsToRender = parentRkaData.item_pengajuan || [];
                        
                        if (selectedTrxForReview.type === 'LPJ') {
                            const lpjActivityName = (selectedTrxForReview.items?.[0]?.judul_kegiatan || selectedTrxForReview.title || '').trim().toLowerCase();
                            const matchingRkaItems = parentRkaData.item_pengajuan?.filter((it: any) => {
                                const rkaActivityName = (it.judul_kegiatan || it.kegiatan || it.item || '').trim().toLowerCase();
                                return rkaActivityName === lpjActivityName;
                            }) || [];
                            rkaItemsToRender = matchingRkaItems.length > 0 ? matchingRkaItems : rkaItemsToRender;
                        }

                        const totalRka = rkaItemsToRender.reduce((sum: number, it: any) => sum + (it.nominal || 0), 0) || 0;
                        const totalTrx = selectedTrxForReview.nominal || 0;
                        const selisih = totalRka - totalTrx;
                        const isOverBudget = selisih < 0;

                        let details: any = {};
                        try {
                            const firstItem = selectedTrxForReview.items?.[0];
                            if (firstItem) {
                                details = typeof firstItem.rincian_json === 'string' 
                                    ? JSON.parse(firstItem.rincian_json) 
                                    : (firstItem.rincian_json || {});
                            }
                        } catch(e) {}
                        const subsidi = details.subsidiSources || [];
                        const isOverBudgetSolved = isOverBudget && subsidi.length > 0;
                        
                        return (
                            <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-inner animate-in fade-in zoom-in duration-300">
                                <div className="text-[9px] font-bold text-slate-500">
                                    Total RKA Asli: <span className="font-black text-slate-800">Rp {totalRka.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="w-[1px] h-3 bg-slate-200"></div>
                                <div className="text-[9px] font-bold text-slate-500">
                                    {selectedTrxForReview.type === 'REVISI_RKA' ? 'Total RKA Revisi:' : 'Total Realisasi:'} <span className="font-black text-slate-800">Rp {totalTrx.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="w-[1px] h-3 bg-slate-200"></div>
                                <div className="flex items-center gap-2">
                                    <div className={`text-[9px] font-black uppercase tracking-tight flex items-center gap-1 ${isOverBudget ? (selectedTrxForReview.type === 'REVISI_RKA' ? 'text-amber-600' : 'text-rose-600') : 'text-emerald-600'}`}>
                                        {selectedTrxForReview.type === 'REVISI_RKA' 
                                            ? (isOverBudget ? '📈 Penambahan Anggaran:' : '📉 Pengurangan Anggaran:') 
                                            : (isOverBudget ? '⚠️ Over-Budget:' : '✅ Sisa Anggaran:')}
                                        <span className="italic font-extrabold">Rp {Math.abs(selisih).toLocaleString('id-ID')}</span>
                                    </div>
                                    {isOverBudgetSolved && selectedTrxForReview.type === 'LPJ' && (
                                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                            Subsidi Silang Aktif (Kekurangan Rp 0)
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                    
                    <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                {selectedTrxForReview.type === 'LPJ' ? 'Total Realisasi LPJ:' : (selectedTrxForReview.type === 'REVISI_RKA' ? 'Total Revisi:' : 'Total Pengajuan:')}
                            </span>
                            <span className="text-sm font-black text-slate-800 italic">Rp {selectedTrxForReview.nominal.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                {selectedTrxForReview.type === 'REVISI_RKA' && selectedTrxForReview.note && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-1.5">
                            <FileText className="w-4 h-4 text-amber-600" />
                            <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Alasan Pengajuan Revisi (Catatan Pengaju)</h4>
                        </div>
                        <p className="text-xs font-bold text-slate-700 italic leading-relaxed">"{selectedTrxForReview.note}"</p>
                    </div>
                )}

                {(selectedTrxForReview.type === 'LPJ' || selectedTrxForReview.type === 'REVISI_RKA') ? (
                    // DUAL PANE COMPARISON FOR LPJ AND REVISI_RKA
                    <div className="space-y-6">
                        {/* SECTION 1: RKA (Target/Rencana) */}
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-3 duration-300">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-amber-500 rounded-full shadow-md shadow-amber-100"></div>
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                                        1. {selectedTrxForReview.type === 'REVISI_RKA' ? 'Rencana Kegiatan & Anggaran (RKA) Induk - Versi Asli' : 'Rencana Kegiatan & Anggaran (RKA) - Target/Rencana'}
                                    </h4>
                                </div>
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Rujukan Utama
                                </span>
                            </div>
                            
                            {!parentRkaData ? (
                                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500 mx-auto mb-2"></div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memuat Referensi RKA...</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-[9px] border-collapse">
                                        <thead className="bg-amber-50/50 border-b border-amber-100">
                                            <tr>
                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">No</th>
                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Program/Kegiatan</th>
                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Operasional</th>
                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest text-center">Jml Kegiatan</th>
                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Waktu/Tempat</th>
                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest">Penanggung Jawab / Sasaran</th>
                                                <th className="px-3 py-2 font-black text-amber-800 uppercase tracking-widest text-right">Nominal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(() => {
                                                let rkaItemsToRender = parentRkaData.item_pengajuan || [];
                                                
                                                if (selectedTrxForReview.type === 'LPJ') {
                                                    const lpjActivityName = (selectedTrxForReview.items?.[0]?.judul_kegiatan || selectedTrxForReview.title || '').trim().toLowerCase();
                                                    const matchingRkaItems = parentRkaData.item_pengajuan?.filter((it: any) => {
                                                        const rkaActivityName = (it.judul_kegiatan || it.kegiatan || it.item || '').trim().toLowerCase();
                                                        return rkaActivityName === lpjActivityName;
                                                    }) || [];
                                                    rkaItemsToRender = matchingRkaItems.length > 0 ? matchingRkaItems : rkaItemsToRender;
                                                }
                                                
                                                return rkaItemsToRender.map((it: any, idx: number) => (
                                                    <Fragment key={idx}>
                                                        <tr className="bg-white">
                                                            <td className="px-3 py-2 text-slate-500 font-bold">{idx + 1}</td>
                                                            <td className="px-3 py-2 font-black text-slate-900 italic">{it.judul_kegiatan || it.kegiatan || it.item}</td>
                                                            <td className="px-3 py-2"><span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md font-black uppercase text-[8px]">{it.kategori_coa || it.operasional}</span></td>
                                                            <td className="px-3 py-2 text-center font-black text-slate-800">{it.jumlah_kegiatan || 1}x</td>
                                                            <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{it.waktu || '-'} / {it.tempat || '-'}</td>
                                                            <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{it.pic || '-'} / {it.sasaran || '-'}</td>
                                                            <td className="px-3 py-2 text-right font-black text-slate-950 text-xs">Rp {(it.nominal || 0).toLocaleString('id-ID')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan={7} className="px-8 pb-4 bg-amber-50/10">
                                                                <div className="bg-white rounded-xl border border-amber-100 p-3 space-y-3 shadow-sm">
                                                                    <div className="flex items-center gap-2 mb-1 px-1">
                                                                        <div className="w-1 h-3 bg-amber-500 rounded-full"></div>
                                                                        <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Rincian Anggaran RKA</p>
                                                                    </div>
                                                                    <table className="w-full text-[9px]">
                                                                        <thead>
                                                                            <tr className="text-slate-600 font-black uppercase tracking-tighter border-b border-slate-100">
                                                                                <th className="py-1.5 text-left">Nama Item / Spesifikasi</th>
                                                                                <th className="py-1.5 text-center">Satuan</th>
                                                                                <th className="py-1.5 text-right">Harga Satuan</th>
                                                                                <th className="py-1.5 text-center">Qty</th>
                                                                                <th className="py-1.5 text-right">Total (Rp)</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-50">
                                                                            {(() => {
                                                                                let details: any = {};
                                                                                try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                                                let rincian = details.items || (Array.isArray(details) ? details : []);
                                                                                return rincian.map((rin: any, rIdx: number) => (
                                                                                    <tr key={rIdx}>
                                                                                        <td className="py-1.5 font-bold text-slate-800 italic">{rin.name || rin.item}</td>
                                                                                        <td className="py-1.5 text-center text-slate-600 font-bold">{rin.unit || rin.satuan || '-'}</td>
                                                                                        <td className="py-1.5 text-right text-slate-700 font-black">Rp {(rin.price || rin.harga_satuan || 0).toLocaleString('id-ID')}</td>
                                                                                        <td className="py-1.5 text-center font-black text-slate-900">{rin.qty || rin.jumlah || 1}</td>
                                                                                        <td className="py-1.5 text-right font-black text-slate-950">Rp {( (rin.price || rin.harga_satuan || 0) * (rin.qty || rin.jumlah || 1) ).toLocaleString('id-ID')}</td>
                                                                                    </tr>
                                                                                ));
                                                                            })()}
                                                                        </tbody>
                                                                    </table>
                                                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                                                        {(() => {
                                                                            let details: any = {};
                                                                            try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                                            let sd = details.fundingSplits || [];
                                                                            return (Array.isArray(sd) ? sd : []).map((s: any, sIdx: number) => (
                                                                                <span key={sIdx} className="text-[8px] font-black text-amber-800 uppercase bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                                                                                    {s.source || s.sumber}: {s.percent || s.percentage || 0}% (Rp {Number(s.amount || s.nominal || 0).toLocaleString('id-ID')})
                                                                                </span>
                                                                            ));
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </Fragment>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* SECTION 2: LPJ / REVISI RKA (Aktual/Realisasi/Revisi) */}
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-blue-600 rounded-full shadow-md shadow-blue-100"></div>
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                                        2. {selectedTrxForReview.type === 'REVISI_RKA' ? 'Draft Revisi Anggaran - Pengajuan Baru' : 'Realisasi Anggaran (LPJ) - Aktual/Realisasi'}
                                    </h4>
                                </div>
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                    Butuh Peninjauan
                                </span>
                            </div>
                            
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-left text-[9px] border-collapse">
                                    <thead className="bg-blue-50/50 border-b border-blue-100">
                                        <tr>
                                            <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest">No</th>
                                            <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest">Program/Kegiatan</th>
                                            <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest">Operasional</th>
                                            <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest text-center">Jml Kegiatan</th>
                                            <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest">Waktu/Tempat</th>
                                            <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest">Penanggung Jawab / Sasaran</th>
                                            <th className="px-3 py-2 font-black text-blue-800 uppercase tracking-widest text-right">Nominal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedTrxForReview.items?.map((it: any, idx: number) => (
                                            <Fragment key={idx}>
                                                <tr className="bg-white">
                                                    <td className="px-3 py-2 text-slate-500 font-bold">{idx + 1}</td>
                                                    <td className="px-3 py-2 font-black text-slate-900 italic">{it.judul_kegiatan || it.kegiatan || it.item}</td>
                                                    <td className="px-3 py-2"><span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md font-black uppercase text-[8px]">{it.kategori_coa || it.operasional}</span></td>
                                                    <td className="px-3 py-2 text-center font-black text-slate-800">{it.jumlah_kegiatan || 1}x</td>
                                                    <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{it.waktu || '-'} / {it.tempat || '-'}</td>
                                                    <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{it.pic || '-'} / {it.sasaran || '-'}</td>
                                                    <td className="px-3 py-2 text-right font-black text-slate-950 text-xs">Rp {(it.nominal || 0).toLocaleString('id-ID')}</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={7} className="px-8 pb-4 bg-blue-50/10">
                                                        <div className="bg-white rounded-xl border border-blue-100 p-3 space-y-3 shadow-sm">
                                                            <div className="flex items-center justify-between mb-1 px-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
                                                                    <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest">
                                                                        {selectedTrxForReview.type === 'REVISI_RKA' ? 'Detail Item Revisi' : 'Detail Realisasi LPJ & Bukti Fisik'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <table className="w-full text-[9px]">
                                                                <thead>
                                                                    <tr className="text-slate-600 font-black uppercase tracking-tighter border-b border-slate-100">
                                                                        <th className="py-1.5 text-left">Nama Item / Spesifikasi</th>
                                                                        <th className="py-1.5 text-center">Satuan</th>
                                                                        <th className="py-1.5 text-right">Harga Satuan</th>
                                                                        <th className="py-1.5 text-center">Qty</th>
                                                                        <th className="py-1.5 text-right">Total (Rp)</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50">
                                                                    {(() => {
                                                                        let details: any = {};
                                                                        try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                                        let rincian = details.items || (Array.isArray(details) ? details : []);
                                                                        return rincian.map((rin: any, rIdx: number) => (
                                                                            <tr key={rIdx}>
                                                                                <td className="py-1.5 font-bold text-slate-800 italic">{rin.name || rin.item}</td>
                                                                                <td className="py-1.5 text-center text-slate-600 font-bold">{rin.unit || rin.satuan || '-'}</td>
                                                                                <td className="py-1.5 text-right text-slate-700 font-black">Rp {(rin.price || rin.harga_satuan || 0).toLocaleString('id-ID')}</td>
                                                                                <td className="py-1.5 text-center font-black text-slate-900">{rin.qty || rin.jumlah || 1}</td>
                                                                                <td className="py-1.5 text-right font-black text-slate-950">Rp {( (rin.price || rin.harga_satuan || 0) * (rin.qty || rin.jumlah || 1) ).toLocaleString('id-ID')}</td>
                                                                            </tr>
                                                                        ));
                                                                    })()}
                                                                </tbody>
                                                            </table>
                                                            
                                                            {/* Removed funding splits for LPJ to align with LPJ creation page */}

                                                            {(() => {
                                                                let details: any = {};
                                                                try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                                const note = details.note || details.catatan || details.narasi || '';
                                                                const files = details.files || details.attachments || [];
                                                                
                                                                const subsidi = details.subsidiSources || [];
                                                                 if (note || (Array.isArray(files) && files.length > 0) || (Array.isArray(subsidi) && subsidi.length > 0)) {
                                                                    return (
                                                                        <div className="pt-2.5 mt-2.5 border-t border-slate-100 space-y-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                                                             {Array.isArray(subsidi) && subsidi.length > 0 && (
                                                                                 <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-left-3 duration-300">
                                                                                     <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                                                                                         <span className="flex h-2 w-2 relative">
                                                                                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                                             <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                                                         </span>
                                                                                         Alokasi Subsidi Silang (Over-Budget Terselesaikan):
                                                                                     </span>
                                                                                     <div className="flex flex-wrap gap-2">
                                                                                         {subsidi.map((sub: any, sIdx: number) => (
                                                                                             <div key={sIdx} className="inline-flex items-center gap-1.5 bg-white border border-emerald-200/50 px-2 py-1 rounded-lg text-[9px] font-black text-slate-700 shadow-sm animate-in zoom-in-95 duration-200">
                                                                                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                                                 <span>{sub.source}</span>
                                                                                                 <span className="text-[8px] text-slate-400">({sub.percent}%)</span>
                                                                                                 <span className="text-emerald-700 font-extrabold italic">Rp {Number(sub.amount || 0).toLocaleString('id-ID')}</span>
                                                                                             </div>
                                                                                         ))}
                                                                                     </div>
                                                                                     <p className="text-[8px] font-bold text-emerald-600/90 leading-tight">
                                                                                         ✅ Over-budget telah diselesaikan dan ditutupi sepenuhnya melalui alokasi dana tambahan di atas.
                                                                                     </p>
                                                                                 </div>
                                                                             )}
                                                                            {note && (
                                                                                <div>
                                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Catatan Realisasi (Staff):</span>
                                                                                    <p className="text-[9px] font-bold text-slate-700 italic mt-0.5">"{note}"</p>
                                                                                </div>
                                                                            )}
                                                                            {Array.isArray(files) && files.length > 0 && (
                                                                                <div>
                                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Lampiran Bukti Fisik:</span>
                                                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                                                        {files.map((f: any, fIdx: number) => (
                                                                                            <button 
                                                                                                key={fIdx} 
                                                                                                onClick={() => {
                                                                                                    const fileUrl = f.url || f.base64 || (typeof f === 'string' ? f : '');
                                                                                                    if (!fileUrl) return;
                                                                                                    if (fileUrl.startsWith('data:')) {
                                                                                                        const newWindow = window.open();
                                                                                                        if (newWindow) {
                                                                                                            newWindow.document.write(`<iframe src="${fileUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                                                                                        } else {
                                                                                                            const link = document.createElement('a');
                                                                                                            link.href = fileUrl;
                                                                                                            link.download = f.customName || `bukti-${fIdx + 1}`;
                                                                                                            document.body.appendChild(link);
                                                                                                            link.click();
                                                                                                            document.body.removeChild(link);
                                                                                                        }
                                                                                                    } else {
                                                                                                        window.open(fileUrl, '_blank');
                                                                                                    }
                                                                                                }} 
                                                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[8px] font-black text-blue-600 transition-all shadow-sm cursor-pointer"
                                                                                            >
                                                                                                📄 {f.customName || `Bukti ${fIdx + 1}`}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}

                                                            {canReview && (
                                                                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                                        <Edit3 className="w-2.5 h-2.5 text-blue-600" /> Catatan Peninjauan Realisasi LPJ
                                                                    </p>
                                                                    <textarea 
                                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-0 outline-none transition-all min-h-[50px] italic placeholder:text-slate-300 shadow-sm"
                                                                        placeholder="Tambahkan catatan khusus untuk Realisasi Program/Kegiatan ini..."
                                                                        value={itemNotes[it.id] || ''}
                                                                        onChange={(e) => setItemNotes(prev => ({
                                                                            ...prev,
                                                                            [it.id]: e.target.value
                                                                        }))}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    // STANDARD SINGLE PANEL FOR RKA
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-[9px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2 font-black text-slate-700 uppercase tracking-widest">No</th>
                                    <th className="px-3 py-2 font-black text-slate-700 uppercase tracking-widest">Program/Kegiatan</th>
                                    <th className="px-3 py-2 font-black text-slate-700 uppercase tracking-widest">Operasional</th>
                                    <th className="px-3 py-2 font-black text-slate-700 uppercase tracking-widest text-center">Jml Kegiatan</th>
                                    <th className="px-3 py-2 font-black text-slate-700 uppercase tracking-widest">Waktu/Tempat</th>
                                    <th className="px-3 py-2 font-black text-slate-700 uppercase tracking-widest">Penanggung Jawab / Sasaran</th>
                                    <th className="px-3 py-2 font-black text-slate-700 uppercase tracking-widest text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedTrxForReview.items?.map((it: any, idx: number) => (
                                    <Fragment key={idx}>
                                        <tr className="bg-white">
                                            <td className="px-3 py-2 text-slate-500 font-bold">{idx + 1}</td>
                                            <td className="px-3 py-2 font-black text-slate-900 italic">{it.judul_kegiatan || it.kegiatan || it.item}</td>
                                            <td className="px-3 py-2"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-black uppercase text-[8px]">{it.kategori_coa || it.operasional}</span></td>
                                            <td className="px-3 py-2 text-center font-black text-slate-800">{it.jumlah_kegiatan || 1}x</td>
                                            <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{it.waktu || '-'} / {it.tempat || '-'}</td>
                                            <td className="px-3 py-2 text-slate-700 font-bold leading-tight">{it.pic || '-'} / {it.sasaran || '-'}</td>
                                            <td className="px-3 py-2 text-right font-black text-slate-950 text-xs">Rp {(it.nominal || 0).toLocaleString('id-ID')}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={7} className="px-8 pb-4 bg-slate-50/50">
                                                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-3 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-1 px-1">
                                                        <div className="w-1 h-3 bg-emerald-600 rounded-full"></div>
                                                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Rincian Detail & Budgeting</p>
                                                    </div>
                                                    <table className="w-full text-[9px]">
                                                        <thead>
                                                            <tr className="text-slate-600 font-black uppercase tracking-tighter border-b border-slate-100">
                                                                <th className="py-1.5 text-left">Nama Item / Spesifikasi</th>
                                                                <th className="py-1.5 text-center">Satuan</th>
                                                                <th className="py-1.5 text-right">Harga Satuan</th>
                                                                <th className="py-1.5 text-center">Qty</th>
                                                                <th className="py-1.5 text-right">Total (Rp)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {(() => {
                                                                let details: any = {};
                                                                try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                                let rincian = details.items || (Array.isArray(details) ? details : []);
                                                                return rincian.map((rin: any, rIdx: number) => (
                                                                    <tr key={rIdx}>
                                                                        <td className="py-1.5 font-bold text-slate-800 italic">{rin.name || rin.item}</td>
                                                                        <td className="py-1.5 text-center text-slate-600 font-bold">{rin.unit || rin.satuan || '-'}</td>
                                                                        <td className="py-1.5 text-right text-slate-700 font-black">Rp {(rin.price || rin.harga_satuan || 0).toLocaleString('id-ID')}</td>
                                                                        <td className="py-1.5 text-center font-black text-slate-900">{rin.qty || rin.jumlah || 1}</td>
                                                                        <td className="py-1.5 text-right font-black text-slate-950">Rp {( (rin.price || rin.harga_satuan || 0) * (rin.qty || rin.jumlah || 1) ).toLocaleString('id-ID')}</td>
                                                                    </tr>
                                                                ));
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                    
                                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                                        {(() => {
                                                            let details: any = {};
                                                            try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                            let sd = details.fundingSplits || [];
                                                            return (Array.isArray(sd) ? sd : []).map((s: any, sIdx: number) => (
                                                                <span key={sIdx} className="text-[8px] font-black text-emerald-800 uppercase bg-emerald-100/50 px-2 py-1 rounded-md border border-emerald-200/50">
                                                                    {s.source || s.sumber}: {s.percentage}% (Rp {Number(s.amount || s.nominal || 0).toLocaleString('id-ID')})
                                                                </span>
                                                            ));
                                                        })()}
                                                    </div>

                                                    {canReview && (
                                                        <div className="space-y-1.5 pt-3 border-t border-slate-100">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                                <Edit3 className="w-2.5 h-2.5 text-emerald-600" /> Catatan Peninjauan Kegiatan
                                                            </p>
                                                            <textarea 
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-0 outline-none transition-all min-h-[50px] italic placeholder:text-slate-300 shadow-sm"
                                                                placeholder="Tambahkan catatan khusus untuk Program/Kegiatan ini..."
                                                                value={itemNotes[it.id] || ''}
                                                                onChange={(e) => setItemNotes(prev => ({
                                                                    ...prev,
                                                                    [it.id]: e.target.value
                                                                }))}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer Actions - Fixed Bottom */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-3 shrink-0">
                {canReview ? (
                    ['MENUNGGU VERIFIKASI', 'REKAP BENDAHARA', 'MENUNGGU PUSAT', 'MENUNGGU KEPALA'].includes(selectedTrxForReview.status) ? (
                        <>
                            <button 
                                onClick={() => handleReviewAction('REJECT')}
                                disabled={isVerifying}
                                className="flex-1 py-3 bg-white border-2 border-rose-100 text-rose-600 text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <XCircle className="w-3.5 h-3.5" /> Tolak
                            </button>
                            <button 
                                onClick={() => handleReviewAction('APPROVE')}
                                disabled={isVerifying}
                                className="flex-1 py-3 bg-emerald-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircle className="w-3.5 h-3.5" /> 
                                {isVerifying ? 'Memproses...' : (selectedTrxForReview.status === 'MENUNGGU VERIFIKASI' ? 'Setuju' : 'Terima')}
                            </button>
                        </>
                    ) : selectedTrxForReview.status === 'MENUNGGU CAIR' ? (
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => handleReviewAction('APPROVE', 'Dicairkan melalui Transfer')}
                                disabled={isVerifying}
                                className="flex-1 py-3 bg-amber-500 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Banknote className="w-3.5 h-3.5" /> 
                                {isVerifying ? 'Memproses...' : 'Cairkan melalui Transfer'}
                            </button>
                            <button 
                                onClick={() => handleReviewAction('APPROVE', 'Dicairkan melalui Cash')}
                                disabled={isVerifying}
                                className="flex-1 py-3 bg-indigo-500 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Banknote className="w-3.5 h-3.5" /> 
                                {isVerifying ? 'Memproses...' : 'Cairkan melalui Cash'}
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => handleReviewAction('APPROVE')}
                            disabled={isVerifying}
                            className="flex-1 py-3 bg-emerald-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle className="w-3.5 h-3.5" /> 
                            {isVerifying ? 'Memproses...' : (selectedTrxForReview.status === 'CAIR' ? 'Sudah Diterima' : 'Selesai')}
                        </button>
                    )
                ) : (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl w-full md:w-auto flex-1">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <p className="text-[10px] font-black text-amber-900 leading-tight uppercase tracking-tight">
                                Anda dalam mode lihat berkas. Otorisasi peninjauan hanya untuk <span className="underline decoration-2 decoration-amber-500">{requiredRoleName}</span>.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsReviewModalOpen(false)}
                            className="w-full md:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-2xl uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            Tutup Peninjauan
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}