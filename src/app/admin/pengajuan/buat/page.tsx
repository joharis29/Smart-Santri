'use client'

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  PlusCircle,
  FileSpreadsheet,
  Save,
  Send,
  AlertTriangle,
  Trash2,
  Maximize2,
  X,
  ChevronDown,
  Building2,
  Calendar,
  Layers,
  GraduationCap,
  Plus,
  Percent,
  Banknote,
  Layout,
  Calculator,
  Upload,
  File as FileIcon,
  Image as ImageIcon,
  Paperclip,
  Camera as CameraIcon,
  RotateCcw,
  Check,
  Download,
  Edit3,
  RefreshCw,
  ChevronRight,
  FileText,
  CheckSquare,
  History,
  ClipboardCheck,
  FileEdit,
  Lock,
  Bot,
  Loader2
} from 'lucide-react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { saveDraftItem, batchSavePengajuan, getPengajuanById } from './actions'
import { createClient } from '@/utils/supabase/client'

interface FundingSplit {
  source: string
  percent: number
  nominal: number
}

interface RkaDetailItem {
  name: string
  unit: string
  price: number
  qty: number
  total: number
}

interface RkaDetails {
  items: RkaDetailItem[]
  template: string
  fundingSplits: FundingSplit[]
  total: number
}

interface RkaRow {
  id: string
  program: string
  operasional: string
  jumlah: string
  waktu: string
  tempat: string
  pic: string
  sasaran: string
  nominal: number
  details: RkaDetails
  isFilled: boolean
  catatan_revisi?: string
  auditResult?: { status: string; alasan: string; referensi: string[] }
  isAuditing?: boolean
  lastAuditedHash?: string
}

const DEFAULT_DETAILS: RkaDetails = {
  items: [
    { name: '', unit: '', price: 0, qty: 0, total: 0 }
  ],
  template: '',
  fundingSplits: [
    { source: '', percent: 0, nominal: 0 },
    { source: '', percent: 0, nominal: 0 }
  ],
  total: 0
}


const DEFAULT_TEMPLATES: Record<string, RkaDetailItem[]> = {}





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
  ],
  'Dapur Umum': [
    'Kas Internal'
  ]
};

const ALL_UNITS = [
  'Pusat (Yayasan)',
  'TK',
  'SDIT 1',
  'SDIT 2',
  'MTs',
  'MA',
  'Diniyah',
  'Asrama Putra',
  'Asrama Putri',
  'THQ',
  'Dapur Asrama Putra',
  'Dapur Asrama Putri',
  'Dapur Umum'
];

const BIDANG_BY_UNIT: Record<string, string[]> = {
  'Pusat (Yayasan)': [
    'Kesekretariatan',
    'Pendidikan',
    'Sumber Daya Insani',
    'Kesejahteraan Sosial',
    'Sarana',
    'Keuangan',
    'Penelitian Dan Pengembangan'
  ],
  'TK': [
    'Kurikulum',
    'Sarana',
    'Humas',
    'Kesejahteraan',
    'Tata Usaha (TU)',
    'Bendahara',
    'Bimbingan & Konseling (BK)',
    'Kesantrian',
    'Mudir'
  ],
  'SDIT 1': [
    'Kurikulum',
    'Tilawah & Hifdzil Qur\'an (THQ)',
    'Humas',
    'Kesiswaan',
    'Sarana',
    'Tenaga Administari Sekolah (TAS)',
    'Bendahara',
    'Kesekretariatan'
  ],
  'SDIT 2': [
    'Kurikulum',
    'Tilawah & Hifdzil Qur\'an (THQ)',
    'Humas',
    'Kesiswaan',
    'Sarana',
    'Tenaga Administari Sekolah (TAS)',
    'Bendahara',
    'Kesekretariatan'
  ],
  'MTs': [
    'Kurikulum',
    'Tilawah & Hifdzil Qur\'an (THQ)',
    'Humas',
    'Kesantrian',
    'Sarana',
    'Perpustakaan',
    'Bimbingan & Konseling (BK)',
    'Kordinator Ekstrakurikuler',
    'Lembaga Bahasa',
    'Kordinator Pengembangan Prestasi',
    'Lab Komputer',
    'Tenaga Administari Sekolah (TAS)',
    'Bendahara',
    'Mudir'
  ],
  'MA': [
    'Kurikulum',
    'Bimbingan & Konseling (BK)',
    'Lembaga Pengembangan Bahasa Asing (LPBA)',
    'Kesantrian',
    'Humas',
    'Kordinator Piket',
    'Pembina RG-UG',
    'Kordinator Ekstrakurikuler',
    'Perpustakaan',
    'Tilawah & Hifdzil Qur\'an (THQ)',
    'Mudir',
    'Tenaga Administari Madrasah (TAM)',
    'Operator',
    'Kordinator Pengembangan Prestasi',
    'Pendidik & Tenaga Kependidikan (PTK)',
    'Lab Komputer',
    'Lab Sains',
    'Bendahara'
  ],
  'Diniyah': [
    'Kurikulum',
    'Sarana',
    'Humas',
    'Bendahara',
    'Kesantrian'
  ],
  'Asrama Putra': [
    'Sekretaris',
    'Bendahara',
    'Pendidikan Dan Pengasuhan',
    'Kesantrian Dan Kedisiplinan',
    'Pondok Tahfidz',
    'Kesehatan Dan Kesejahteraan',
    'Sarana Dan Kebersihan Lingkungan'
  ],
  'Asrama Putri': [
    'Sekretaris',
    'Bendahara',
    'Pendidikan Dan Pengasuhan',
    'Kesantrian Dan Kedisiplinan',
    'Pondok Tahfidz',
    'Kesehatan Dan Kesejahteraan',
    'Sarana Dan Kebersihan Lingkungan'
  ],
  'THQ': [
    'Sekretaris',
    'Bendahara',
    'Pendidikan Dan Pengasuhan',
    'Kesantrian Dan Kedisiplinan',
    'Pondok Tahfidz',
    'Kesehatan Dan Kesejahteraan',
    'Sarana Dan Kebersihan Lingkungan'
  ],
  'Dapur Asrama Putra': [
    'Pengadaan Bahan',
    'Operasional Dapur'
  ],
  'Dapur Asrama Putri': [
    'Pengadaan Bahan',
    'Operasional Dapur'
  ],
  'Dapur Umum': [
    'Pengadaan Bahan',
    'Operasional Dapur'
  ]
};

const SearchableCombobox = ({ value, options, onChange, placeholder = "-- Pilih Program --" }: { value: string, options: string[], onChange: (val: string) => void, placeholder?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node) &&
                !(dropdownRef.current && dropdownRef.current.contains(e.target as Node))) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: Math.max(rect.width, 300),
                zIndex: 99999
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleScroll = (e: Event) => {
            if (isOpen) {
                if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
                setIsOpen(false);
            }
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isOpen]);

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        return options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
    }, [options, search]);

    return (
        <div ref={wrapperRef} className="relative w-full h-full min-h-[40px]">
            <div 
                onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setIsOpen(!isOpen); setSearch(''); e.preventDefault(); } }}
                role="button"
                tabIndex={0}
                className={`w-full h-full min-h-[40px] px-3 py-2 pr-8 bg-white outline-none text-[11px] font-black focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer flex items-start ${value === '' ? 'text-slate-400 italic' : 'text-black'}`}
            >
                <span className="whitespace-normal break-words leading-snug w-full">{value || placeholder}</span>
                <ChevronDown className="absolute right-2 top-3 w-3 h-3 text-slate-300 pointer-events-none group-hover:text-emerald-500" />
            </div>
            
            {isOpen && typeof document !== 'undefined' && createPortal(
                <div ref={dropdownRef} style={dropdownStyle} className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <input
                            type="text"
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Ketik untuk mencari program..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:font-normal text-slate-700 shadow-inner"
                        />
                    </div>
                    <ul className="max-h-56 overflow-y-auto p-1 bg-white">
                        {!options.includes(value) && value !== '' && !search && (
                            <li 
                                onClick={() => { onChange(value); setIsOpen(false); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onChange(value); setIsOpen(false); e.preventDefault(); } }}
                                role="button"
                                tabIndex={0}
                                className="px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-md cursor-pointer mb-1 bg-slate-50 border border-slate-100 italic"
                            >
                                {value} (Asli)
                            </li>
                        )}
                        {filteredOptions.length === 0 ? (
                            <li className="px-3 py-4 text-center text-[10px] text-slate-400 italic">Program tidak ditemukan</li>
                        ) : (
                            filteredOptions.map(opt => (
                                <li 
                                    key={opt}
                                    onClick={() => { onChange(opt); setIsOpen(false); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onChange(opt); setIsOpen(false); e.preventDefault(); } }}
                                    role="button"
                                    tabIndex={0}
                                    className={`px-3 py-2 text-[10px] font-bold rounded-md cursor-pointer mb-0.5 transition-colors ${value === opt ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {opt}
                                </li>
                            ))
                        )}
                    </ul>
                </div>,
                document.body
            )}
        </div>
    );
};

function BuatPengajuanContent() {
  const importRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [unit, setUnit] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeUnit') || 'SDIT 1'
    }
    return 'SDIT 1'
  })
  const [bidang, setBidang] = useState('')
  const [bulan, setBulan] = useState('')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [waktuKebutuhan, setWaktuKebutuhan] = useState('')
  const [docStatus, setDocStatus] = useState<'DRAFT' | 'REVISI' | 'MENUNGGU_KEPALA' | ''>('')
  const [catatanRevisi, setCatatanRevisi] = useState('')
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([])
  const [programIdMap, setProgramIdMap] = useState<Record<string, string>>({})
  const [periodeAktif, setPeriodeAktif] = useState<any>(null)
  const [paguProgramList, setPaguProgramList] = useState<any[]>([])

  useEffect(() => {
    const fetchPrograms = async () => {
      if (!unit) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('program_kegiatan')
          .select('id, program, nama_kegiatan')
          .eq('unit', unit);
          
        if (error) throw error;
        
        if (data) {
          const programSet = new Set<string>();
          const idMap: Record<string, string> = {};
          data.forEach(item => {
            let key = item.program;
            if (item.program && item.nama_kegiatan && item.nama_kegiatan !== '-') {
              key = `${item.program} - ${item.nama_kegiatan}`;
            }
            programSet.add(key);
            idMap[key] = item.id;
          });
          setAvailablePrograms(Array.from(programSet).sort((a, b) => a.localeCompare(b)));
          setProgramIdMap(idMap);
        }
      } catch (err) {
        console.error("Gagal memuat program referensi:", err);
      }
    };
    
    fetchPrograms();
  }, [unit]);
  // RKA Mode States
  const [rows, setRows] = useState<RkaRow[]>([
    { id: '1', program: '', operasional: '', jumlah: '', waktu: '', tempat: '', pic: '', sasaran: '', nominal: 0, details: JSON.parse(JSON.stringify(DEFAULT_DETAILS)), isFilled: false }
  ])

  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const isFormValid = useMemo(() => {
    if (!unit || !bidang || !bulan || !tahunAjaran || !waktuKebutuhan) return false;
    
    return rows.length > 0 && rows.every(r => 
      r.program && 
      r.operasional && 
      r.jumlah !== '' && 
      r.waktu && 
      r.tempat && 
      r.pic && 
      r.sasaran && 
      r.nominal > 0
    );
  }, [unit, bidang, bulan, tahunAjaran, waktuKebutuhan, rows]);
  
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Temp states for Modal
  const [modalItems, setModalItems] = useState<RkaDetailItem[]>([])
  const [modalTemplate, setModalTemplate] = useState('')
  const [modalSplits, setModalSplits] = useState<FundingSplit[]>([])

  // Custom Templates State
  const [customTemplates, setCustomTemplates] = useState<Record<string, RkaDetailItem[]>>({})
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')

  // Karyawan State for PIC Dropdown
  const [karyawanList, setKaryawanList] = useState<any[]>([])


  const [userRole, setUserRole] = useState('')
  const [assignedUnit, setAssignedUnit] = useState('')
  const isGuest = userRole === 'GUEST'

  const [isRkaActive, setIsRkaActive] = useState<boolean>(true)
  const [checkingActive, setCheckingActive] = useState<boolean>(true)

  // Check if RKA (Buat Pengajuan) is active for this unit / globally
  useEffect(() => {
    const checkRkaGate = async () => {
      setCheckingActive(true)
      try {
        const supabase = createClient()
        // Optimize: Use getSession (reads from local storage instantly) instead of getUser (network request)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setCheckingActive(false)
          return
        }

        const user = session.user

        // Optimize: Read role from localStorage directly to skip profile network request
        const activeRoleKey = `activeRole_${user.id}`
        const roleName = localStorage.getItem(activeRoleKey) || localStorage.getItem('activeRole') || ''
        
        // Administrator and Central Treasurer bypass any gate checks
        if (['ADMINISTRATOR', 'BENDAHARA_PUSAT'].includes(roleName)) {
          setIsRkaActive(true)
          setCheckingActive(false)
          return
        }

        // Optimize: Fetch global and unit gate concurrently
        const [globalRes, unitRes] = await Promise.all([
          supabase.from('kontrol_pengajuan').select('rka_aktif').eq('unit_name', 'GLOBAL').maybeSingle(),
          supabase.from('kontrol_pengajuan').select('rka_aktif').eq('unit_name', unit).maybeSingle()
        ])

        if (globalRes.data && globalRes.data.rka_aktif === false) {
          setIsRkaActive(false)
          return
        }

        if (unitRes.data && unitRes.data.rka_aktif === false) {
          setIsRkaActive(false)
        } else {
          setIsRkaActive(true)
        }
      } catch (err) {
        console.error("Error checking RKA gate status:", err)
      } finally {
        setCheckingActive(false)
      }
    }

    if (unit) {
      checkRkaGate()
    }
  }, [unit])

  // Fetch Karyawan
  useEffect(() => {
    const fetchKaryawan = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('karyawan').select('nama, unit').eq('is_active', true)
      if (data) setKaryawanList(data)
    }
    fetchKaryawan()
  }, [])

  const unitKaryawan = karyawanList.filter(k => k.unit?.split(',').map((u: string) => u.trim()).includes(unit))

  // Load User Profile to handle Role-Based Access Control on Unit & Bidang selections
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('*, unit:unit_id(name)')
          .eq('id', user.id)
          .single()

        if (profile) {
          const activeRoleKey = `activeRole_${user.id}`
          const activeUnitKey = `activeUnit_${user.id}`
          
          const dbRoleName = typeof profile.role === 'string' 
            ? profile.role 
            : (profile.role?.name || '')
            
          const roleName = localStorage.getItem(activeRoleKey) || dbRoleName
          const unitName = (Array.isArray(profile.unit) ? profile.unit[0]?.name : (profile.unit as any)?.name) || ''
          
          setUserRole(roleName)
          setAssignedUnit(unitName)

          const isCenterUser = ['ADMINISTRATOR', 'PIMPINAN', 'BENDAHARA_PUSAT'].includes(roleName)
          if (!editId) {
            if (!isCenterUser && unitName) {
              setUnit(unitName)
            } else {
              const savedActiveUnit = localStorage.getItem(activeUnitKey) || localStorage.getItem('activeUnit')
              if (savedActiveUnit) {
                setUnit(savedActiveUnit)
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user profile in buat pengajuan:', err)
      }
    }
    fetchUserProfile()
  }, [editId])

  const isCenter = useMemo(() => {
    return ['ADMINISTRATOR', 'PIMPINAN', 'BENDAHARA_PUSAT'].includes(userRole)
  }, [userRole])

  const [availableBidangs, setAvailableBidangs] = useState<string[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  useEffect(() => {
    const fetchCustomMetadata = async () => {
      if (!unit || isGuest) {
        if (isGuest) {
            setAvailableBidangs([]);
            setAvailableSources([]);
        }
        return;
      }
      try {
        const supabase = createClient();
        
        // 1. Fetch custom Bidang
        const { data: dbBidangs } = await supabase
          .from('pengaturan_bidang')
          .select('nama_bidang')
          .eq('unit_name', unit);

        if (dbBidangs && dbBidangs.length > 0) {
          setAvailableBidangs(dbBidangs.map(b => b.nama_bidang));
        } else {
          // Fallback to static
          let normalizedUnit = unit;
          if (unit.includes('Yayasan')) normalizedUnit = 'Pusat (Yayasan)';
          setAvailableBidangs(BIDANG_BY_UNIT[normalizedUnit] || BIDANG_BY_UNIT[unit] || ['Umum']);
        }

        // 2. Fetch custom Sources
        const { data: dbSources } = await supabase
          .from('pengaturan_sumber_dana')
          .select('nama_sumber_dana')
          .eq('unit_name', unit);

        if (dbSources && dbSources.length > 0) {
          setAvailableSources(dbSources.map(s => s.nama_sumber_dana));
        } else {
          // Fallback to static
          let normalizedUnit = unit;
          if (unit.includes('Yayasan')) normalizedUnit = 'Pusat (Yayasan)';
          setAvailableSources(FUNDING_SOURCES_BY_UNIT[normalizedUnit] || FUNDING_SOURCES_BY_UNIT[unit] || ['Dana Pesantren/Yayasan']);
        }
      } catch (err) {
        console.error("Error loading dynamic metadata:", err);
      }
    };
    fetchCustomMetadata();
  }, [unit]);

  useEffect(() => {
    const fetchPeriodeAndPagu = async () => {
      if (!unit || isGuest) return;
      try {
        const supabase = createClient();
        const { data: periodData } = await supabase.from('periode_anggaran').select('*').eq('status', 'AKTIF').maybeSingle();
        if (periodData) {
          setPeriodeAktif(periodData);
          if (!editId) {
            setTahunAjaran(periodData.tahun_ajaran);
          }
          const { data: paguData } = await supabase.from('pagu_program').select('*').eq('periode_id', periodData.id);
          if (paguData) {
            setPaguProgramList(paguData);
          } else {
            setPaguProgramList([]);
          }
        }
      } catch (err) {
        console.error("Error fetching pagu:", err);
      }
    };
    fetchPeriodeAndPagu();
  }, [unit, editId, isGuest]);

  // Remove problematic useEffect that resets bidang prematurely

  // Load Edit Data if ID present
  useEffect(() => {
    if (editId && !isGuest) {
      const loadData = async () => {
        const res = await getPengajuanById(editId)
        if (res.data) {
          const d = res.data
          const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
          
          setUnit(d.unit || 'SDIT 1')
          setBidang(d.bidang || '')
          
          let savedBulan = monthNames[d.periode_bulan] || String(d.periode_bulan)
          
          if (d.items && d.items.length > 0) {
            try {
                const firstDetails = typeof d.items[0].rincian_json === 'string' ? JSON.parse(d.items[0].rincian_json) : (d.items[0].rincian_json || {})
                if (firstDetails._tanggal_pengajuan) {
                   savedBulan = firstDetails._tanggal_pengajuan
                }
                if (firstDetails._waktu_kebutuhan) {
                   setWaktuKebutuhan(firstDetails._waktu_kebutuhan)
                }
            } catch(e) {}
          }
          setBulan(savedBulan)
          
          // Reconstruct Tahun Ajaran string from integer (e.g. 2025 -> 2025/2026)
          if (d.periode_tahun) {
            setTahunAjaran(`${d.periode_tahun}/${Number(d.periode_tahun) + 1}`)
          }
          
          setDocStatus(d.status)
          setCatatanRevisi(d.catatan_revisi || '')
          
          if (d.items && d.items.length > 0) {
            const mappedRows: RkaRow[] = d.items.map((it: any, index: number) => {
              // Read jumlah_kegiatan from rincian_json since it's not a column
              const details = it.rincian_json || {};
              const savedJumlah = details.jumlah_kegiatan || '1';

              return {
                id: String(index + 1),
                program: it.judul_kegiatan,
                operasional: it.kategori_coa,
                jumlah: savedJumlah, 
                waktu: it.waktu || '-',
                tempat: it.tempat || '-',
                pic: it.pic || '-',
                sasaran: it.sasaran || '-',
                nominal: it.nominal,
                details: it.rincian_json || JSON.parse(JSON.stringify(DEFAULT_DETAILS)),
                isFilled: true,
                catatan_revisi: it.catatan_revisi || ''
              };
            })
            setRows(mappedRows)
          }
        }
      }
      loadData()
    }
  }, [editId])

  // Load Custom Templates
  useEffect(() => {
    const saved = localStorage.getItem('smart_santri_custom_templates')
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse custom templates", e)
      }
    }
  }, [])

  // Derived Modal Total (Sum of items)
  const modalTotal = useMemo(() => {
    return modalItems.reduce((acc, item) => acc + item.total, 0)
  }, [modalItems])

  // --- Logic: Calculations ---
  const summary = useMemo(() => {
    const acc: Record<string, number> = {}
    rows.forEach(row => {
      row.details.fundingSplits.forEach(split => {
        if (split.source && split.nominal > 0) {
          acc[split.source] = (acc[split.source] || 0) + split.nominal
        }
      })
    })
    return acc
  }, [rows])

  const paguStatus = useMemo(() => {
    if (!periodeAktif) return { isOverBudget: true, statusList: [] };
    if (paguProgramList.length === 0) return { isOverBudget: true, statusList: [] };

    let isOverBudget = false;
    
    // Hitung total request per program dari semua baris form
    const requestedPerProgram: Record<string, number> = {};
    rows.forEach(row => {
      if (row.program && row.nominal > 0) {
        requestedPerProgram[row.program] = (requestedPerProgram[row.program] || 0) + row.nominal;
      }
    });

    const statusList = Object.keys(requestedPerProgram).map(programStr => {
      const requested = requestedPerProgram[programStr];
      const pId = programIdMap[programStr];
      const pagu = paguProgramList.find(p => p.program_id === pId);
      
      const sisa = pagu ? Number(pagu.sisa_pagu) : 0;
      const isOver = requested > sisa;
      if (isOver) isOverBudget = true;
      
      return {
        sumber_dana: programStr, // Use sumber_dana property name just to keep UI component compatibility
        sisa_pagu: sisa,
        requested,
        isOver
      };
    });

    return { isOverBudget, statusList };
  }, [rows, paguProgramList, periodeAktif, programIdMap]);

  const [stream, setStream] = useState<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (err) {
      alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.")
      setIsCameraOpen(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setAttachments(prev => [...prev, file].slice(0, 50))
            setIsCameraOpen(false)
            stopCamera()
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }

  useEffect(() => {
    if (isCameraOpen) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [isCameraOpen])
  const totalPengajuan = useMemo(() => {
    return Object.values(summary).reduce((a, b) => a + b, 0)
  }, [summary])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments(prev => [...prev, ...newFiles].slice(0, 50)) // Limit 50 files
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // --- Logic: Row Management ---
  const updateRow = (id: string, field: keyof RkaRow, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value }
        const isFilled = !!(updatedRow.program && updatedRow.jumlah && updatedRow.nominal > 0)
        return { ...updatedRow, isFilled }
      }
      return row
    }))
  }

  const addRow = () => {
    const newId = (rows.length + 1).toString()
    setRows([...rows, { id: newId, program: '', operasional: '', jumlah: '', waktu: '', tempat: '', pic: '', sasaran: '', nominal: 0, details: JSON.parse(JSON.stringify(DEFAULT_DETAILS)), isFilled: false }])
  }

  const deleteRow = (id: string) => {
    if (rows.length === 1) return
    setRows(rows.filter(r => r.id !== id))
  }

  const handleSmartAudit = async (id: string) => {
    const row = rows.find(r => r.id === id)
    if (!row) return

    if (!row.program || !row.operasional || row.nominal === 0) {
      alert('Mohon isi Program, Deskripsi, dan Nominal (melalui ikon kuning) terlebih dahulu sebelum melakukan Audit AI.')
      return
    }

    setRows(prev => prev.map(r => r.id === id ? { ...r, isAuditing: true, auditResult: undefined } : r))

    try {
      const response = await fetch('/api/audit-pra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenis: 'Rencana Kerja / RKA',
          narasi: `Program: ${row.program} | Deskripsi: ${row.operasional} | Jml Kegiatan: ${row.jumlah} | Waktu: ${row.waktu} | Tempat: ${row.tempat} | PIC: ${row.pic} | Sasaran: ${row.sasaran}`,
          kategoriCoa: 'RKA',
          sumberDana: row.details.fundingSplits.filter(s => s.nominal > 0).map(s => s.source).join(', ') || 'Belum Ditentukan',
          nominal: row.nominal,
          rincian: row.details.items
        })
      })

      if (!response.ok) throw new Error('Gagal melakukan audit')
      
      const result = await response.json()
      
      const currentDataHash = `${row.program}|${row.operasional}|${row.jumlah}|${row.waktu}|${row.tempat}|${row.pic}|${row.sasaran}|${row.nominal}`;
      setRows(prev => prev.map(r => r.id === id ? { ...r, isAuditing: false, auditResult: result, lastAuditedHash: currentDataHash } : r))
    } catch (error) {
      setRows(prev => prev.map(r => r.id === id ? { ...r, isAuditing: false, auditResult: { status: 'ERROR', alasan: 'Gagal terhubung ke AI. Silakan coba lagi.', referensi: [] } } : r))
    }
  }

  // --- Auto Smart Audit Effect ---
  useEffect(() => {
    const timeoutIds: NodeJS.Timeout[] = [];
    
    rows.forEach(row => {
      // Periksa apakah baris sudah lengkap untuk diaudit
      if (row.isFilled && row.program && row.operasional && row.nominal > 0 && !row.isAuditing) {
        // Cek apakah data ini sudah diaudit sebelumnya dengan nilai yang sama
        const currentDataHash = `${row.program}|${row.operasional}|${row.jumlah}|${row.waktu}|${row.tempat}|${row.pic}|${row.sasaran}|${row.nominal}`;
        
        if (row.lastAuditedHash !== currentDataHash) {
           const timer = setTimeout(() => {
              handleSmartAudit(row.id);
           }, 2000); // Debounce 2 detik
           timeoutIds.push(timer);
        }
      }
    });

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [rows]);

  // --- Logic: Rincian Modal ---
  const openRincian = (id: string) => {
    const row = rows.find(r => r.id === id)
    if (row) {
      setActiveRowId(id)
      setModalItems(row.details.items)
      setModalTemplate(row.details.template)
      setModalSplits(row.details.fundingSplits)
      setIsModalOpen(true)
    }
  }

  // Effect to sync splits when modalTotal changes
  useEffect(() => {
    if (isModalOpen) {
      setModalSplits(prev => prev.map(s => ({
        ...s,
        nominal: Math.round((s.percent / 100) * modalTotal)
      })))
    }
  }, [modalTotal, isModalOpen])

  const updateDetailItem = (index: number, field: keyof RkaDetailItem, value: any) => {
    setModalItems(prev => {
      const newItems = [...prev]
      let cleanVal = value;
      if (field === 'price' || field === 'qty') {
         cleanVal = value.toString().replace(/\D/g, "");
         cleanVal = cleanVal ? Number(cleanVal) : 0;
      }
      const item = { ...newItems[index], [field]: cleanVal }
      if (field === 'price' || field === 'qty') {
        item.total = Number(item.price) * Number(item.qty)
      }
      newItems[index] = item
      return newItems
    })
  }

  const updateSplit = (index: number, field: keyof FundingSplit, value: any) => {
    setModalSplits(prev => {
      const newSplits = [...prev]
      const split = { ...newSplits[index], [field]: value }
      
      if (field === 'percent') {
        let val = Number(value);
        if (val < 0) val = 0;
        const otherTotal = newSplits.reduce((acc, s, i) => i !== index ? acc + (Number(s.percent) || 0) : acc, 0);
        if (otherTotal + val > 100) val = 100 - otherTotal;
        split.percent = val;
        split.nominal = Math.round((val / 100) * modalTotal)
      } else if (field === 'nominal') {
        const cleanVal = value.toString().replace(/\D/g, "");
        let val = Number(cleanVal);
        if (val < 0) val = 0;
        const otherTotalNominal = newSplits.reduce((acc, s, i) => i !== index ? acc + (Number(s.nominal) || 0) : acc, 0);
        if (otherTotalNominal + val > modalTotal) val = modalTotal - otherTotalNominal;
        split.nominal = val;
        split.percent = modalTotal > 0 ? Number(((val / modalTotal) * 100).toFixed(1)) : 0;
      }
      
      newSplits[index] = split
      return newSplits
    })
  }

  const addSplit = () => {
    setModalSplits([...modalSplits, { source: '', percent: 0, nominal: 0 }])
  }

  const saveModalData = () => {
    // Validate total percentage must be 100%
    const totalPercent = modalSplits.reduce((acc, s) => acc + (Number(s.percent) || 0), 0);
    if (Math.round(totalPercent) !== 100) {
      alert(`Gagal menyimpan: Total alokasi sumber dana harus tepat 100%. Saat ini akumulasi Anda adalah ${totalPercent}%. Mohon sesuaikan kembali.`);
      return;
    }

    if (activeRowId) {
      const updatedDetails: RkaDetails = {
        items: modalItems,
        template: modalTemplate,
        fundingSplits: modalSplits,
        total: modalTotal
      }
      setRows(prev => prev.map(row => {
        if (row.id === activeRowId) {
          return { ...row, details: updatedDetails, nominal: modalTotal, isFilled: !!(row.program && row.jumlah && modalTotal > 0) }
        }
        return row
      }))
      setIsModalOpen(false)
    }
  }

  const handleApplyTemplate = (templateKey: string) => {
    setModalTemplate(templateKey)
    if (!templateKey) return

    let itemsToApply: RkaDetailItem[] = []
    
    // Check default templates
    if (DEFAULT_TEMPLATES[templateKey as keyof typeof DEFAULT_TEMPLATES]) {
      itemsToApply = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES[templateKey as keyof typeof DEFAULT_TEMPLATES]))
    } 
    // Check custom templates
    else if (customTemplates[templateKey]) {
      itemsToApply = JSON.parse(JSON.stringify(customTemplates[templateKey]))
    }

    if (itemsToApply.length > 0) {
      setModalItems(itemsToApply)
    }
  }

  const handleSaveCustomTemplate = () => {
    if (!newTemplateName.trim()) return
    
    const newTemplates = {
      ...customTemplates,
      [newTemplateName]: modalItems.map(item => ({ ...item, qty: 0, total: 0 })) // Save with zero qty
    }
    
    setCustomTemplates(newTemplates)
    localStorage.setItem('smart_santri_custom_templates', JSON.stringify(newTemplates))
    setModalTemplate(newTemplateName)
    setIsSavingTemplate(false)
    setNewTemplateName('')
    alert(`Template "${newTemplateName}" berhasil disimpan!`)
  }

  const handleDeleteTemplate = (templateName: string) => {
    if (!confirm(`Hapus template "${templateName}"?`)) return
    const newTemplates = { ...customTemplates }
    delete newTemplates[templateName]
    setCustomTemplates(newTemplates)
    localStorage.setItem('smart_santri_custom_templates', JSON.stringify(newTemplates))
    if (modalTemplate === templateName) setModalTemplate('')
  }

  const handleSaveDraft = async () => {
    const isConfirmed = confirm('Simpan data ini ke folder "Draft Saya"?')
    if (!isConfirmed) return

    setLoading(true)
    const payload = {
      id: editId || undefined,
      unit,
      bidang,
      bulan,
      tahun_ajaran: tahunAjaran,
      waktu_kebutuhan: waktuKebutuhan,
      status: 'DRAFT' as const,
      data: rows
    }

    try {
      const res = await batchSavePengajuan(payload)
      
      if (res.success) {
        alert('Draf Berhasil Disimpan!')
        router.push('/admin/pengajuan/draft-saya')
      } else {
        alert('Gagal menyimpan draf: ' + res.error)
      }
    } catch (err: any) {
      alert("Terjadi kesalahan sistem/jaringan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKirim = async () => {
    const isConfirmed = confirm(`Kirim Pengajuan ini untuk diperiksa Bendahara?`)
    if (!isConfirmed) return

    setLoading(true)
    const payload = {
      id: editId || undefined,
      unit,
      bidang,
      bulan,
      tahun_ajaran: tahunAjaran,
      waktu_kebutuhan: waktuKebutuhan,
      status: 'MENUNGGU_VERIFIKASI' as const,
      data: rows
    }

    try {
      const res = await batchSavePengajuan(payload)
      
      if (res.success) {
        alert(`Pengajuan Berhasil Dikirim!`)
        router.push('/admin')
      } else {
        alert('Gagal mengirim pengajuan: ' + res.error)
      }
    } catch (err: any) {
      alert("Terjadi kesalahan sistem/jaringan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const isViolation = (row: RkaRow) => {
    const isConsumption = row.program.toLowerCase().includes('konsumsi') || row.program.toLowerCase().includes('makan')
    const hasWakaf = row.details.fundingSplits.some(s => s.source.toLowerCase().includes('wakaf'))
    return isConsumption && hasWakaf
  }

  const handleExportExcel = () => {
    let dataToExport = []
    let fileName = `Pengajuan_${unit}_${bulan}_${Date.now()}.xlsx`

    dataToExport = rows.map((row, idx) => ({
      'No': idx + 1,
      'Program': row.program,
      'Operasional': row.operasional,
      'Jumlah Kegiatan': row.jumlah,
      'Waktu': row.waktu,
      'Tempat': row.tempat,
      'PIC': row.pic,
      'Sasaran': row.sasaran,
      'Nominal': row.nominal
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, fileName)
  }

  const handleExportExcelPremium = () => {
    let reportTitle = "PENGAJUAN RENCANA KEGIATAN DAN ANGGARAN (RKA)"
    if (bulan === 'Tahunan') {
      reportTitle = "PENGAJUAN RENCANA KEGIATAN DAN ANGGARAN TAHUNAN (RKAT)"
    }

    const header = [
      [reportTitle],
      ['Unit / Jenjang', ':', unit],
      ['Bidang / Dept', ':', bidang || '-'],
      ['Periode', ':', `${bulan} ${tahunAjaran}`],
      [], // Spacer
    ]

    let tableHeader: any[][] = []
    let tableData: any[][] = []

    tableHeader = [['No', 'Deskripsi (Kegiatan / Rincian)', 'Jumlah Kegiatan', 'Satuan', 'Harga Satuan', 'Qty', 'Total (Rp)', 'Waktu', 'Tempat', 'PIC', 'Sasaran']]
      
    rows.forEach((row, idx) => {
        // Main Row
        tableData.push([
          idx + 1,
          row.program,
          row.jumlah,
          '',
          '',
          '',
          row.nominal,
          row.waktu,
          row.tempat,
          row.pic,
          row.sasaran
        ])

        // Add Rincian (Nested Items) if they exist and are filled
        const hasValidRincian = row.details.items.some(item => item.name || item.total > 0)
        if (hasValidRincian) {
          row.details.items.forEach(item => {
            if (item.name || item.total > 0) {
              tableData.push([
                '', // No
                `   • ${item.name || '(Tanpa Nama)'}`, // Indented
                '', // Jumlah Kegiatan (empty for sub-items)
                item.unit || '-',
                item.price,
                item.qty,
                item.total,
                '', // Waktu
                '', // Tempat
                '', // PIC
                ''  // Sasaran
              ])
            }
          })
          // Add a small spacer after rincian for readability
          tableData.push(['', '', '', '', '', '', '', '', '', '', ''])
        }
      })

    const summaryHeader = [
      [], // Spacer
      ['RINGKASAN ANGGARAN PER SUMBER DANA'],
    ]

    const summaryData = Object.entries(summary).map(([source, amount]) => [
      source, amount
    ])

    const footer = [
      ['TOTAL KESELURUHAN', totalPengajuan]
    ]

    const finalAOA = [
      ...header,
      ...tableHeader,
      ...tableData,
      ...summaryHeader,
      ...summaryData,
      [],
      ...footer
    ]

    const ws = XLSX.utils.aoa_to_sheet(finalAOA)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    
    const fileName = `${reportTitle.replace(/ /g, '_')}_${unit}_${Date.now()}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const aoa: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      // 1. Parse Metadata (Horizontal professional layout on row 2, or vertical fallback)
      let parsedHorizontal = false
      const row2 = aoa[1] // Excel Row 2 is index 1 in SheetJS aoa
      if (row2 && row2.length >= 2) {
        const cellA = String(row2[0] || '').toLowerCase()
        if (cellA.includes('unit')) {
          // Horizontal Layout detected:
          // A2: "Unit / Jenjang:", B2: unit, D2: "Bidang / Dept:", E2: bidang, G2: "Bulan:", H2: bulan, J2: "Tahun Ajaran:", K2: tahunAjaran
          const importedUnit = String(row2[1] || '').trim()
          const importedBidang = String(row2[4] || '').trim()
          const importedBulan = String(row2[7] || '').trim()
          const importedTahun = String(row2[10] || '').trim()

          if (importedUnit) setUnit(importedUnit)
          if (importedBidang && importedBidang !== '-') setBidang(importedBidang)
          if (importedBulan) setBulan(importedBulan)
          if (importedTahun) setTahunAjaran(importedTahun)
          
          parsedHorizontal = true
        }
      }

      if (!parsedHorizontal) {
        // Vertical Fallback Layout
        aoa.forEach(row => {
          const label = String(row[0] || '').toLowerCase()
          const value = String(row[2] || '').trim()
          if (label.includes('unit') && value) setUnit(value)
          if (label.includes('bidang') && value) setBidang(value)
          if (label.includes('periode') && value) {
            const parts = value.split(' ')
            if (parts[0]) setBulan(parts[0])
            if (parts[1]) setTahunAjaran(parts[1])
          }
        })
      }

      // 2. Start Row
      const startRowIdx = aoa.findIndex(row => String(row[0]) === 'No' || String(row[1]) === 'Nama Program/ Kegiatan')
      
      if (startRowIdx === -1) {
        alert("Format file tidak dikenali. Pastikan menggunakan template yang di-export dari sistem.")
        return
      }

      const dataRows = aoa.slice(startRowIdx + 1)

      // 3. Parse Summary Section (Funding Sources) for RKA mode
      const summaryStartIdx = aoa.findIndex(row => String(row[0] || '').includes('RINGKASAN ANGGARAN PER SUMBER DANA'))
      const summarySources: { source: string, amount: number, ratio: number }[] = []
      let totalSummaryAmount = 0

      if (summaryStartIdx !== -1) {
        // First pass: get names and amounts
        aoa.slice(summaryStartIdx + 1).forEach(row => {
          const sourceName = String(row[0] || '')
          const amount = Number(row[7] || 0)
          if (sourceName && !sourceName.includes('TOTAL KESELURUHAN') && sourceName.trim() !== '' && amount > 0) {
            summarySources.push({ source: sourceName, amount, ratio: 0 })
            totalSummaryAmount += amount
          }
        })
        // Second pass: calculate ratios
        if (totalSummaryAmount > 0) {
          summarySources.forEach(s => s.ratio = s.amount / totalSummaryAmount)
        }
      }

      // --- Import Mode RKA ---
        const newRkaRows: RkaRow[] = []
        let currentParent: RkaRow | null = null

        dataRows.forEach((row) => {
          const no = row[0]
          const desc = String(row[1] || '')

          if (no && !isNaN(Number(no))) {
            // It's a Main Row
            const mainRow: RkaRow = {
              id: (newRkaRows.length + 1).toString(),
              program: desc,
              operasional: String(row[2] || ''),
              jumlah: String(row[3] || ''),
              nominal: Number(row[7] || 0),
              waktu: String(row[8] || ''),
              tempat: String(row[9] || ''),
              pic: String(row[10] || ''),
              sasaran: String(row[11] || ''),
              details: JSON.parse(JSON.stringify(DEFAULT_DETAILS)),
              isFilled: true
            }
            mainRow.details.items = [] // Clear default item
            
            // Auto-populate funding split based on global summary ratios
            if (summarySources.length > 0) {
              mainRow.details.fundingSplits = summarySources.map(s => ({
                source: s.source,
                percent: Math.round(s.ratio * 100),
                nominal: Math.round(mainRow.nominal * s.ratio)
              }))
              // Add one empty row for UI consistency
              mainRow.details.fundingSplits.push({ source: '', percent: 0, nominal: 0 })
            } else {
              // Fallback if no summary found
              mainRow.details.fundingSplits = [
                { source: 'Dana BOS', percent: 100, nominal: mainRow.nominal },
                { source: '', percent: 0, nominal: 0 }
              ]
            }

            newRkaRows.push(mainRow)
            currentParent = mainRow
          } else if (desc.includes('•') && currentParent) {
            // It's a Detail Item
            const itemName = desc.replace(/•/g, '').trim()
            currentParent.details.items.push({
              name: itemName,
              unit: String(row[4] || ''),
              price: Number(row[5] || 0),
              qty: Number(row[6] || 0),
              total: Number(row[7] || 0)
            })
          }
        })

        if (newRkaRows.length > 0) {
          // Re-calculate totals and update parent rows
          const finalizedRows = newRkaRows.map(row => ({
            ...row,
            details: {
              ...row.details,
              total: row.details.items.length > 0 
                ? row.details.items.reduce((acc, it) => acc + it.total, 0)
                : row.nominal,
              fundingSplits: row.details.fundingSplits
            }
          }))
          setRows(finalizedRows)
        }

      alert("Data berhasil di-import!")
      if (importRef.current) importRef.current.value = '' // Reset input
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExportExcelProfessional = async () => {
    let reportTitle = "PENGAJUAN RENCANA KEGIATAN DAN ANGGARAN (RKA)"
    if (bulan === 'Tahunan') {
      reportTitle = "PENGAJUAN RENCANA KEGIATAN DAN ANGGARAN TAHUNAN (RKAT)"
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Laporan')

    // 1. Header Styling & Data
    worksheet.mergeCells('A1:K1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = reportTitle
    titleCell.font = { name: 'Times New Roman', size: 14, bold: true }
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

    // 2. Metadata Row (Horizontal Layout)
    const metaRow = worksheet.getRow(2)
    metaRow.values = [
      'Unit / Jenjang:', unit, 
      '', 
      'Bidang / Dept:', bidang || '-', 
      '', 
      'Bulan:', bulan, 
      '', 
      'Tahun Ajaran:', tahunAjaran
    ]
    metaRow.font = { name: 'Times New Roman', size: 10 }
    
    // Bold & Right Align labels
    ;['A2', 'D2', 'G2', 'J2'].forEach(ref => {
      const cell = worksheet.getCell(ref)
      cell.font = { bold: true, name: 'Times New Roman' }
      cell.alignment = { horizontal: 'right' }
    })
    worksheet.addRow([]) 
    worksheet.getRow(3).values = [] 

    // 2. Table Headers
    let tableHeader = [
        'No', 
        'Nama Program/ Kegiatan', 
        'Operasional', 
        'Jumlah Kegiatan', 
        'Satuan', 
        'Harga Satuan', 
        'Qty', 
        'Rencana Anggaran', 
        'Waktu', 
        'Tempat', 
        'Penanggung Jawab', 
        'Sasaran'
      ]

    const headerRow = worksheet.addRow(tableHeader)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, name: 'Times New Roman' }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' } // slate-100
      }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // 3. Table Data
    rows.forEach((row, idx) => {
        // Main Row
        const mainRow = worksheet.addRow([
          idx + 1,
          row.program,
          row.operasional,
          row.jumlah,
          '',
          '',
          '',
          Number(row.nominal),
          row.waktu,
          row.tempat,
          row.pic,
          row.sasaran
        ])
        mainRow.font = { bold: true, name: 'Times New Roman' }
        mainRow.getCell(8).numFmt = '"Rp "#,##0'
        mainRow.eachCell(cell => {
          cell.font = { bold: true, name: 'Times New Roman' }
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        })

        // Rincian
        const hasValidRincian = row.details.items.some(item => item.name || item.total > 0)
        if (hasValidRincian) {
          // Add a "Rincian Budget" sub-header for this activity
          const rincianLabelRow = worksheet.addRow(['', '   --- RINCIAN BUDGET ---'])
          rincianLabelRow.getCell(2).font = { italic: true, size: 9, color: { argb: 'FF64748B' } }

          row.details.items.forEach(item => {
            if (item.name || item.total > 0) {
              const subRow = worksheet.addRow([
                '',
                `   • ${item.name || '(Tanpa Nama)'}`,
                '', // Operasional
                '', // Jml Kegiatan
                item.unit || '-',
                Number(item.price),
                Number(item.qty),
                Number(item.total),
                '', '', '', ''
              ])
              subRow.getCell(6).numFmt = '"Rp "#,##0'
              subRow.getCell(8).numFmt = '"Rp "#,##0'
              subRow.eachCell(cell => {
                cell.font = { name: 'Times New Roman' }
                cell.border = {
                  top: { style: 'thin' },
                  left: { style: 'thin' },
                  bottom: { style: 'thin' },
                  right: { style: 'thin' }
                }
              })
            }
          })
          worksheet.addRow([]) // Spacer after rincian
        }
      })

    // 4. Summary Section
    worksheet.addRow([])
    const summaryHeader = worksheet.addRow(['RINGKASAN ANGGARAN PER SUMBER DANA'])
    summaryHeader.getCell(1).font = { bold: true, name: 'Times New Roman' }

    Object.entries(summary).forEach(([source, amount]) => {
      const r = worksheet.addRow([source, '', '', '', '', '', '', Number(amount)])
      r.getCell(1).font = { bold: true, name: 'Times New Roman' }
      r.getCell(8).numFmt = '"Rp "#,##0'
      r.getCell(8).font = { bold: true, name: 'Times New Roman' }
    })

    worksheet.addRow([])
    const totalRow = worksheet.addRow(['TOTAL KESELURUHAN', '', '', '', '', '', '', Number(totalPengajuan)])
    totalRow.getCell(1).font = { bold: true, size: 12, name: 'Times New Roman' }
    totalRow.getCell(8).font = { bold: true, size: 12, color: { argb: 'FF065F46' }, name: 'Times New Roman' }
    totalRow.getCell(8).numFmt = '"Rp "#,##0'

    // Final Auto Column Width (approximate)
    worksheet.columns.forEach((col, i) => {
      if (i === 1) col.width = 45 // Nama Program
      else if (i === 2) col.width = 20 // Operasional
      else col.width = 15
    })

    // SECTION: Otorisasi & Tanda Tangan
    worksheet.addRow([])
    worksheet.addRow([])
    let signRow = worksheet.lastRow!.number + 1
    
    // Bendahara Unit
    worksheet.mergeCells(`B${signRow}:D${signRow}`)
    worksheet.getCell(`B${signRow}`).value = 'Bendahara Unit,'
    worksheet.getCell(`B${signRow}`).font = { name: 'Times New Roman', bold: true }
    worksheet.getCell(`B${signRow}`).alignment = { horizontal: 'center' }

    // Kepala Unit
    worksheet.mergeCells(`E${signRow}:G${signRow}`)
    worksheet.getCell(`E${signRow}`).value = 'Kepala Unit,'
    worksheet.getCell(`E${signRow}`).font = { name: 'Times New Roman', bold: true }
    worksheet.getCell(`E${signRow}`).alignment = { horizontal: 'center' }

    // Bendahara Pusat
    worksheet.mergeCells(`H${signRow}:K${signRow}`)
    worksheet.getCell(`H${signRow}`).value = 'Bendahara Pusat,'
    worksheet.getCell(`H${signRow}`).font = { name: 'Times New Roman', bold: true }
    worksheet.getCell(`H${signRow}`).alignment = { horizontal: 'center' }

    // Signature Spaces
    let nameRow = signRow + 5
    
    // Underlines for names
    worksheet.mergeCells(`B${nameRow}:D${nameRow}`)
    worksheet.getCell(`B${nameRow}`).border = { bottom: { style: 'thin' } }
    
    worksheet.mergeCells(`E${nameRow}:G${nameRow}`)
    worksheet.getCell(`E${nameRow}`).border = { bottom: { style: 'thin' } }
    
    worksheet.mergeCells(`H${nameRow}:K${nameRow}`)
    worksheet.getCell(`H${nameRow}`).border = { bottom: { style: 'thin' } }

    // Generate and Download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${reportTitle.replace(/ /g, '_')}_${unit}_${Date.now()}.xlsx`
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua data input? Seluruh baris dan metadata akan dikosongkan.")) {
      const isCenterUser = ['ADMINISTRATOR', 'PIMPINAN', 'BENDAHARA_PUSAT'].includes(userRole)
      const defaultUnit = !isCenterUser && assignedUnit 
        ? assignedUnit 
        : (localStorage.getItem('activeUnit') || 'SDIT 1')
      setUnit(defaultUnit)
      setBidang('')
      setBulan('')
      setTahunAjaran('')
      setRows([
        { id: '1', program: '', operasional: '', jumlah: '', waktu: '', tempat: '', pic: '', sasaran: '', nominal: 0, details: JSON.parse(JSON.stringify(DEFAULT_DETAILS)), isFilled: false }
      ])
      setAttachments([])
      if (importRef.current) importRef.current.value = ''
    }
  }

  if (checkingActive) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Memeriksa Status Pembukuan...</p>
        </div>
      </div>
    )
  }

  if (!isRkaActive) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100 flex flex-col items-center text-center space-y-6">
          <div className="bg-rose-50 p-6 rounded-[2rem] text-rose-600 shadow-inner">
            <Lock className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Pengisian RKA Ditutup</h2>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Jendela Pengajuan Anggaran Dibekukan</p>
          </div>
          <p className="text-xs font-bold text-slate-400 leading-relaxed">
            Maaf, pengisian formulir **Buat Pengajuan (RKA)** saat ini sedang dinonaktifkan oleh Bendahara Pusat untuk unit Anda **({unit})**. Silakan hubungi Bendahara Pusat untuk informasi lebih lanjut mengenai jadwal pembukaan kembali.
          </p>
          <button 
            onClick={() => router.push('/admin')}
            className="w-full bg-slate-900 text-white text-[10px] font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all uppercase tracking-widest"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-4 space-y-3 md:space-y-4">
      
      {/* Header Section */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700 shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    {(docStatus === 'REVISI' || catatanRevisi) ? 'Revisi Pengajuan Dana' : 'Buat Pengajuan Dana Baru'}
                    {(docStatus === 'REVISI' || catatanRevisi) && (
                        <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-md animate-pulse">REVISI</span>
                    )}
                </h1>
              </div>
            </div>

            {catatanRevisi && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3 animate-in slide-in-from-top-2">
                    <div className="bg-rose-500 text-white p-1.5 rounded-lg h-fit">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Catatan Revisi dari Bendahara:</p>
                        <p className="text-xs font-bold text-rose-800 leading-relaxed italic">"{catatanRevisi}"</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-emerald-600" /> Pilih Unit <span className="text-rose-600">*</span>
                </label>
                <select 
                  value={unit} 
                  onChange={(e) => {
                      setUnit(e.target.value)
                      setBidang('')
                  }}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={!isCenter}
                >
                  <option value="">Pilih Unit...</option>
                  {ALL_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3 text-emerald-600" /> Bidang <span className="text-rose-600">*</span>
                </label>
                <select 
                  value={bidang} 
                  onChange={(e) => setBidang(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Pilih Bidang...</option>
                  {availableBidangs.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-emerald-600" /> {unit === 'Dapur Asrama Putra' || unit === 'Dapur Asrama Putri' || unit === 'Dapur Umum' ? 'Tanggal' : 'Bulan'} <span className="text-rose-600">*</span>
                </label>
                {unit === 'Dapur Asrama Putra' || unit === 'Dapur Asrama Putri' || unit === 'Dapur Umum' ? (
                  <input 
                    type="date"
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).showPicker();
                      } catch (err) {}
                    }}
                    onKeyDown={(e) => e.preventDefault()}
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                ) : (
                  <select 
                    value={bulan} 
                    onChange={(e) => setBulan(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Pilih Bulan...</option>
                    {(() => {
                      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                      const currentMonthIndex = new Date().getMonth();
                      return months.map((m, i) => {
                        if (i < currentMonthIndex) {
                          return <option key={m} value={m} disabled>{m} (Lampau)</option>;
                        } else if (i === currentMonthIndex) {
                          return <option key={m} value={m}>{m} (Sekarang)</option>;
                        } else {
                          return <option key={m} value={m}>{m}</option>;
                        }
                      });
                    })()}
                    <option value="Tahunan">Tahunan (Full Year)</option>
                  </select>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-emerald-600" /> Tahun Ajaran <span className="text-rose-600">*</span>
                </label>
                <input 
                  value={periodeAktif ? periodeAktif.tahun_ajaran : tahunAjaran}
                  readOnly={!!periodeAktif}
                  onChange={(e) => !periodeAktif && setTahunAjaran(e.target.value)}
                  className={`w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold ${periodeAktif ? 'text-emerald-800 cursor-not-allowed opacity-90' : 'text-emerald-800'} outline-none focus:ring-2 focus:ring-emerald-500`}
                  placeholder="Contoh: 2024/2025"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-emerald-600" /> Kebutuhan Dana <span className="text-rose-600">*</span>
                </label>
                <input 
                  type="date"
                  value={waktuKebutuhan}
                  onChange={(e) => setWaktuKebutuhan(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input 
              type="file" 
              ref={importRef}
              onChange={handleImportExcel}
              className="hidden" 
              accept=".xlsx,.xls"
            />
            <button 
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-900 font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-amber-100"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Impor Excel
            </button>
            <button 
              onClick={handleExportExcelProfessional}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor Excel
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-800 tracking-tight">
            Tabel Rencana Kegiatan & Anggaran (RKA)
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 font-bold px-3 py-1 rounded-xl text-[10px] transition-all shadow-sm"
            >
              <RotateCcw className="w-3 h-3" /> Reset Data
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={!isFormValid}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-100 disabled:text-slate-300 text-amber-900 font-bold px-3 py-1 rounded-xl text-[10px] transition-all"
            >
              <Save className="w-3 h-3" /> Simpan ke Draft
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
            {/* --- Mode Reguler: Tabel RKA --- */}
            <table className="w-full border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr className="divide-x divide-slate-200">
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center w-10">No.</th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[200px]">Nama Program/ Kegiatan <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[150px]">Deskripsi Kegiatan <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[90px] text-center">Jumlah Kegiatan <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[90px] text-center">Waktu <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[100px] text-center">Tempat <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[110px] text-center">Penanggung Jawab <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[100px] text-center">Sasaran <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[120px] text-right">Rencana Anggaran <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center min-w-[80px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => {
                  const violation = isViolation(row)
                  return (
                    <React.Fragment key={row.id}>
                      <tr className={`divide-x divide-slate-100 transition-colors ${violation ? 'bg-rose-50' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-3 py-2 text-center text-xs font-bold text-slate-400">
                        {row.isFilled ? index + 1 : <span className="opacity-20 italic">auto</span>}
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <SearchableCombobox 
                          value={row.program}
                          options={availablePrograms}
                          onChange={(val) => updateRow(row.id, 'program', val)}
                          placeholder="Pilih atau ketik program..."
                        />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <AutoResizeTextarea 
                          value={row.operasional}
                          onChange={(e) => updateRow(row.id, 'operasional', e.target.value)}
                          className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 outline-none text-[11px] font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 transition-all placeholder-slate-400 resize-none break-words whitespace-normal"
                          placeholder="Ketikan deskripsi..."
                        />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <AutoResizeTextarea 
                          value={row.jumlah}
                          onChange={(e) => updateRow(row.id, 'jumlah', e.target.value)}
                          className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 outline-none text-[11px] font-black text-center text-black focus:ring-2 focus:ring-emerald-500 transition-all resize-none break-words whitespace-normal"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <AutoResizeTextarea 
                          value={row.waktu}
                          onChange={(e) => updateRow(row.id, 'waktu', e.target.value)}
                          className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 outline-none text-[11px] font-black text-black focus:ring-2 focus:ring-emerald-500 transition-all resize-none break-words whitespace-normal"
                          placeholder="-"
                        />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <AutoResizeTextarea 
                          value={row.tempat}
                          onChange={(e) => updateRow(row.id, 'tempat', e.target.value)}
                          className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 outline-none text-[11px] font-black text-black focus:ring-2 focus:ring-emerald-500 transition-all resize-none break-words whitespace-normal"
                          placeholder="-"
                        />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <select 
                          value={row.pic}
                          onChange={(e) => updateRow(row.id, 'pic', e.target.value)}
                          className="w-full h-full min-h-[40px] px-2 py-2 bg-white border border-slate-200 outline-none text-[11px] font-black text-black focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer appearance-none"
                        >
                          <option value="">Pilih PIC...</option>
                          {unitKaryawan.map((k, idx) => (
                            <option key={idx} value={k.nama}>{k.nama}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <AutoResizeTextarea 
                          value={row.sasaran}
                          onChange={(e) => updateRow(row.id, 'sasaran', e.target.value)}
                          className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 outline-none text-[11px] font-black text-black focus:ring-2 focus:ring-emerald-500 transition-all resize-none break-words whitespace-normal"
                          placeholder="-"
                        />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <div className="relative">
                          <span className="absolute left-2 top-2.5 text-[9px] font-bold text-slate-300">Rp</span>
                          <div className="w-full h-9 pl-7 pr-2 flex items-center justify-end text-[11px] font-bold text-slate-700 bg-slate-50/50">
                            {row.nominal.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => openRincian(row.id)}
                            className={`p-1.5 rounded-lg transition-all ${row.details.total > 0 ? 'bg-amber-400 text-amber-900 shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-700'}`}
                            title="Isi Rincian & Anggaran"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => deleteRow(row.id)}
                            className="p-1.5 bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-all"
                            title="Hapus Baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {row.isAuditing && (
                            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-500" title="Sedang mengaudit AI...">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            </div>
                          )}
                          {violation && (
                            <div title="Pelanggaran Kepatuhan Syariah!" className="animate-bounce">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {row.catatan_revisi && (
                      <tr className="bg-amber-50/70 divide-x divide-amber-100 border-t border-b border-amber-100/50">
                        <td colSpan={10} className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-100 text-amber-800 uppercase tracking-wider shrink-0">
                              Catatan Peninjauan
                            </span>
                            <p className="text-[10px] font-bold text-amber-900 leading-relaxed italic">{row.catatan_revisi}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {row.auditResult && (
                      <tr className={`${row.auditResult.status === 'AMAN' ? 'bg-emerald-50/50' : 'bg-rose-50/50'} border-b border-slate-100`}>
                        <td colSpan={10} className="p-0">
                          <div className="sticky left-0 px-4 py-3 max-w-[calc(100vw-300px)] xl:max-w-4xl">
                            <div className="flex gap-3">
                              <div className="mt-0.5 shrink-0">
                                {row.auditResult.status === 'AMAN' ? (
                                  <Bot className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <p className={`text-[11px] font-black ${row.auditResult.status === 'AMAN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  Hasil Audit AI: {row.auditResult.status}
                                </p>
                                <p className="text-[10px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                                  {row.auditResult.alasan}
                                </p>
                                {row.auditResult.referensi && row.auditResult.referensi.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {row.auditResult.referensi.map((ref: string, i: number) => (
                                      <span key={i} className="inline-block px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold max-w-full truncate" title={ref}>
                                        {ref}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
                })}
              </tbody>
            </table>
        </div>

        {/* Footer Grid Info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button 
            onClick={addRow}
            className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4" /> Tambah Baris Baru
          </button>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Wajib Isi Seluruh Kolom Bertanda Bintang (*)
          </div>
        </div>
      </div>

      {/* --- Summary Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">

          <div className="space-y-3">
             <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-blue-500" /> Sisa Pagu Anggaran Tahunan</h3>
             {!periodeAktif ? (
                 <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-bold italic border border-amber-200">Menunggu Sinkronisasi Periode...</div>
             ) : paguStatus.statusList.length === 0 ? (
                 <div className="p-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-bold italic border border-slate-200 flex items-start gap-2">
                     <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                     <span>Silakan pilih Program/Kegiatan dan isi nominal pada baris rincian di atas untuk memvalidasi sisa anggaran.</span>
                 </div>
             ) : (
                 <div className="space-y-2">
                     {paguStatus.statusList.map(status => (
                         <div key={status.sumber_dana} className={`p-3 rounded-xl border ${status.isOver ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                             <div className="flex justify-between items-center mb-1">
                                 <span className="text-[10px] font-extrabold text-slate-700 max-w-[70%] leading-tight">{status.sumber_dana}</span>
                                 <span className={`text-[11px] font-black shrink-0 ${status.isOver ? 'text-rose-700' : 'text-emerald-700'}`}>Rp {status.sisa_pagu.toLocaleString('id-ID')}</span>
                             </div>
                             <div className="flex justify-between items-center text-[9px] font-bold">
                                 <span className="text-slate-500">Total Diajukan: Rp {status.requested.toLocaleString('id-ID')}</span>
                                 {status.isOver && <span className="text-rose-600 uppercase tracking-wider font-black flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Overbudget!</span>}
                             </div>
                         </div>
                     ))}
                 </div>
             )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Pengajuan</span>
            <span className="text-xl font-black text-emerald-700 tracking-tighter italic">Rp {totalPengajuan.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-end">
          <button 
            onClick={handleKirim}
            disabled={!isFormValid || paguStatus.isOverBudget || loading}
            className="w-full max-w-[320px] bg-amber-400 hover:bg-amber-500 disabled:bg-slate-100 disabled:text-slate-300 text-amber-900 font-extrabold py-3 px-6 rounded-2xl shadow-xl shadow-amber-100 transition-all flex flex-col items-center justify-center gap-0.5 group relative overflow-hidden active:scale-95 border-b-4 border-amber-500 disabled:border-slate-200"
          >
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              <span className="text-[12px] uppercase tracking-widest">
                  {docStatus === 'REVISI' ? 'Ajukan Ulang Pengajuan RKA' : 'Kirim Pengajuan RKA'}
              </span>
            </div>
            <span className="text-[8px] font-bold tracking-widest uppercase text-amber-800/60">
                Kirim ke Tahap Persetujuan Unit
            </span>
            {!isFormValid && (
              <div className="absolute inset-0 bg-slate-50/30 flex items-center justify-center backdrop-blur-[1px]">
                  <p className="bg-rose-600 text-white text-[7px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg">Lengkapi Seluruh Kolom Wajib (*)</p>
              </div>
            )}
          </button>
        </div>
      </div>



      {/* Rincian Modal (Smart Spreadsheet) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
            {/* Modal Header */}
            <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-amber-400 p-2 rounded-xl">
                  <Calculator className="w-5 h-5 text-amber-900" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Rincian Detail & Budgeting: <span className="text-emerald-600">{rows.find(r => r.id === activeRowId)?.operasional || 'Baris Baru'}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Breakdown Spesifikasi & Alokasi Sumber Dana</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {!isSavingTemplate ? (
                    <>
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <Layout className="w-3 h-3 text-emerald-600" /> Template
                      </label>
                      <div className="flex items-center gap-1">
                        <select 
                          value={modalTemplate}
                          onChange={(e) => handleApplyTemplate(e.target.value)}
                          className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 min-w-[150px]"
                        >
                          <option value="">Pilih Template...</option>
                          {Object.keys(customTemplates).length > 0 && (
                            <optgroup label="Template Saya">
                              {Object.keys(customTemplates).map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                        <button 
                          onClick={() => setIsSavingTemplate(true)}
                          className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-lg transition-all"
                          title="Simpan sebagai template baru"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        {customTemplates[modalTemplate] && (
                          <button 
                            onClick={() => handleDeleteTemplate(modalTemplate)}
                            className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-lg transition-all"
                            title="Hapus template ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                      <input 
                        type="text"
                        autoFocus
                        placeholder="Nama template baru..."
                        className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveCustomTemplate()
                          if (e.key === 'Escape') setIsSavingTemplate(false)
                        }}
                      />
                      <button 
                        onClick={handleSaveCustomTemplate}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-all uppercase"
                      >
                        Simpan
                      </button>
                      <button 
                        onClick={() => setIsSavingTemplate(false)}
                        className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
              
              {/* Item Details Grid (Multi-Column) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Daftar Item & Spesifikasi (Spreadsheet Mode)</label>
                  <button 
                    onClick={() => setModalItems([...modalItems, { name: '', unit: '', price: 0, qty: 0, total: 0 }])}
                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Tambah Baris Rincian
                  </button>
                </div>
                
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="divide-x divide-slate-200">
                        <th className="w-10 px-2 py-2 text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">No.</th>
                        <th className="px-3 py-2 text-[10px] font-extrabold text-slate-600 uppercase tracking-widest text-left">Nama Item / Spesifikasi</th>
                        <th className="w-24 px-2 py-2 text-[10px] font-extrabold text-slate-600 uppercase tracking-widest text-center">Satuan</th>
                        <th className="w-32 px-2 py-2 text-[10px] font-extrabold text-slate-600 uppercase tracking-widest text-right">Harga Satuan</th>
                        <th className="w-20 px-2 py-2 text-[10px] font-extrabold text-slate-600 uppercase tracking-widest text-center">Qty</th>
                        <th className="w-32 px-2 py-2 text-[10px] font-extrabold text-slate-600 uppercase tracking-widest text-right">Total (Rp)</th>
                        <th className="w-10 px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {modalItems.map((item, idx) => (
                        <tr key={idx} className="divide-x divide-slate-100 group">
                          <td className="px-2 py-1 text-center text-[10px] font-bold text-slate-300">{idx + 1}</td>
                          <td className="p-0">
                            <input 
                              type="text" 
                              value={item.name}
                              onChange={(e) => updateDetailItem(idx, 'name', e.target.value)}
                              className="w-full h-8 px-3 bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:bg-emerald-50/30"
                              placeholder="Masukkan nama item..."
                            />
                          </td>
                          <td className="p-0">
                            <input 
                              type="text" 
                              value={item.unit}
                              onChange={(e) => updateDetailItem(idx, 'unit', e.target.value)}
                              className="w-full h-8 px-2 bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder:text-slate-300 text-center focus:bg-emerald-50/30"
                              placeholder="box/pcs"
                            />
                          </td>
                          <td className="p-0">
                            <div className="relative">
                              <span className="absolute left-2 top-2 text-[8px] font-bold text-slate-300">Rp</span>
                              <input 
                                type="text" 
                                value={item.price ? Number(item.price).toLocaleString('id-ID') : ''}
                                onChange={(e) => updateDetailItem(idx, 'price', e.target.value)}
                                className="w-full h-8 pl-6 pr-2 bg-transparent border-none outline-none text-xs font-bold text-right focus:bg-emerald-50/30 text-slate-800 placeholder:text-slate-300"
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="p-0">
                            <input 
                              type="text" 
                              value={item.qty ? Number(item.qty).toLocaleString('id-ID') : ''}
                              onChange={(e) => updateDetailItem(idx, 'qty', e.target.value)}
                              className="w-full h-8 px-2 bg-transparent border-none outline-none text-xs font-bold text-center focus:bg-emerald-50/30 text-slate-800 placeholder:text-slate-300"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-1 text-right text-xs font-black text-slate-800 bg-slate-50/50">
                            {item.total.toLocaleString('id-ID')}
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button 
                              onClick={() => setModalItems(modalItems.filter((_, i) => i !== idx))}
                              className="p-1 text-slate-200 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right text-[10px] font-extrabold text-slate-700 uppercase tracking-widest">Akumulasi Total Rincian</td>
                        <td className="px-3 py-3 text-right text-sm font-black text-emerald-800 bg-emerald-50/50">
                          Rp {modalTotal.toLocaleString('id-ID')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Funding Split Section (Integrated) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-slate-100">
                
                {/* Visual Summary */}
                <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-5 space-y-3">
                  <label className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5" /> Ringkasan Anggaran
                  </label>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-600 font-bold">Total Pengajuan Baris Ini</p>
                    <p className="text-2xl font-black text-amber-900 tracking-tight">Rp {modalTotal.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-2xl border border-amber-200/50">
                    <p className="text-[9px] text-amber-800 leading-relaxed italic font-medium">
                      * Anggaran ini akan otomatis membagi sumber dana di samping berdasarkan persentase yang Anda tetapkan.
                    </p>
                  </div>
                </div>

                {/* Funding Splits Grid */}
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">Alokasi Sumber Dana (Smart Split)</label>
                      {(() => {
                        const totalP = modalSplits.reduce((acc, s) => acc + (Number(s.percent) || 0), 0);
                        const isPerfect = Math.round(totalP) === 100;
                        return (
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isPerfect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'} transition-all`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isPerfect ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-tighter">Total Akumulasi: {totalP}%</span>
                          </div>
                        );
                      })()}
                    </div>
                    <button 
                      onClick={addSplit}
                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Tambah Alokasi Dana
                    </button>
                  </div>
                  <div className="space-y-2">
                    {modalSplits.map((split, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-right-2">
                        <div className="flex-1">
                          <select 
                            value={split.source}
                            onChange={(e) => updateSplit(idx, 'source', e.target.value)}
                            className="w-full px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                          >
                            <option value="">Pilih Sumber...</option>
                            {availableSources.map(src => (
                              <option 
                                key={src} 
                                value={src} 
                                disabled={['Iuran Non-Wajib', 'Iuaran Non-Wajib', 'Tabungan Siswa', 'Tabungan SIswa', 'Uang Saku'].includes(src)}
                              >
                                {src}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24 relative">
                          <input 
                            min="0"
                            max="100"
                            value={split.percent || ''}
                            onChange={(e) => updateSplit(idx, 'percent', e.target.value)}
                            className="w-full pl-3 pr-6 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-xs font-black text-amber-800 outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="0"
                          />
                          <Percent className="absolute right-2 top-1.5 w-3 h-3 text-amber-400" />
                        </div>
                        <div className="w-40 relative">
                          <span className="absolute left-2 top-2 text-[10px] font-bold text-amber-400">Rp</span>
                          <input 
                            type="text" 
                            value={split.nominal ? Number(split.nominal).toLocaleString('id-ID') : ''}
                            onChange={(e) => updateSplit(idx, 'nominal', e.target.value)}
                            className="w-full pl-6 pr-2 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-xs font-black text-amber-800 outline-none focus:ring-2 focus:ring-amber-500 text-right"
                            placeholder="0"
                          />
                        </div>
                        <button 
                          onClick={() => setModalSplits(modalSplits.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-200 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Area */}
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-3 border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 text-sm transition-all"
                >
                  Batalkan
                </button>
                <button 
                  onClick={saveModalData}
                  className="flex-1 px-8 py-3 bg-amber-400 text-amber-900 font-extrabold rounded-2xl hover:bg-amber-500 text-sm shadow-xl shadow-amber-100 transition-all active:scale-[0.98]"
                >
                  Simpan & Sinkronkan RKA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center pt-8 border-t border-slate-100">
        <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">Smart Santri Accounting RKA Grid • Universitas Tazkia</p>
      </div>

    </div>
    );
};

const AutoResizeTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [props.value]);

    return (
        <textarea
            {...props}
            ref={textareaRef}
            style={{ overflow: 'hidden', ...props.style }}
            onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
                if (props.onInput) props.onInput(e);
            }}
        />
    );
};

export default function PengajuanDanaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Memuat halaman pengajuan...</p>
        </div>
      </div>
    }>
      <BuatPengajuanContent />
    </Suspense>
  )
}
