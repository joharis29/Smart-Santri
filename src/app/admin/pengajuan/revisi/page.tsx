'use client'

import React, { useState, useEffect, useMemo, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { FileEdit, Save, Plus, Trash2, ArrowRight, PlusCircle, Info, DollarSign, Calendar, Layers, GraduationCap, Building2, ChevronDown, Lock, Download, Bookmark, Send, AlertCircle } from 'lucide-react'
import ExcelJS from 'exceljs'
import { getApprovedRkaList, submitRevisiRka, getDraftRevisiById } from './actions'
import { createClient } from '@/utils/supabase/client'

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

const BIDANG_BY_UNIT: Record<string, string[]> = {
  'Pusat (Yayasan)': ['Kesekretariatan', 'Pendidikan', 'Sumber Daya Insani', 'Kesejahteraan Sosial', 'Sarana', 'Keuangan', 'Penelitian Dan Pengembangan'],
  'TK': ['Kurikulum', 'Sarana', 'Humas', 'Kesejahteraan', 'Tata Usaha (TU)', 'Bendahara', 'Bimbingan & Konseling (BK)', 'Kesantrian', 'Mudir'],
  'SDIT 1': ['Kurikulum', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Humas', 'Kesiswaan', 'Sarana', 'Tenaga Administari Sekolah (TAS)', 'Bendahara', 'Kesekretariatan'],
  'SDIT 2': ['Kurikulum', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Humas', 'Kesiswaan', 'Sarana', 'Tenaga Administari Sekolah (TAS)', 'Bendahara', 'Kesekretariatan'],
  'MTs': ['Kurikulum', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Humas', 'Kesantrian', 'Sarana', 'Perpustakaan', 'Bimbingan & Konseling (BK)', 'Kordinator Ekstrakurikuler', 'Lembaga Bahasa', 'Kordinator Pengembangan Prestasi', 'Lab Komputer', 'Tenaga Administari Sekolah (TAS)', 'Bendahara', 'Mudir'],
  'MA': ['Kurikulum', 'Bimbingan & Konseling (BK)', 'Lembaga Pengembangan Bahasa Asing (LPBA)', 'Kesantrian', 'Humas', 'Kordinator Piket', 'Pembina RG-UG', 'Kordinator Ekstrakurikuler', 'Perpustakaan', 'Tilawah & Hifdzil Qur\'an (THQ)', 'Mudir', 'Tenaga Administari Madrasah (TAM)', 'Operator', 'Kordinator Pengembangan Prestasi', 'Pendidik & Tenaga Kependidikan (PTK)', 'Lab Komputer', 'Lab Sains', 'Bendahara'],
  'Diniyah': ['Kurikulum', 'Sarana', 'Humas', 'Bendahara', 'Kesantrian'],
  'Asrama Putra': ['Sekretaris', 'Bendahara', 'Pendidikan Dan Pengasuhan', 'Kesantrian Dan Kedisiplinan', 'Pondok Tahfidz', 'Kesehatan Dan Kesejahteraan', 'Sarana Dan Kebersihan Lingkungan'],
  'Asrama Putri': ['Sekretaris', 'Bendahara', 'Pendidikan Dan Pengasuhan', 'Kesantrian Dan Kedisiplinan', 'Pondok Tahfidz', 'Kesehatan Dan Kesejahteraan', 'Sarana Dan Kebersihan Lingkungan'],
  'THQ': ['Sekretaris', 'Bendahara', 'Pendidikan Dan Pengasuhan', 'Kesantrian Dan Kedisiplinan', 'Pondok Tahfidz', 'Kesehatan Dan Kesejahteraan', 'Sarana Dan Kebersihan Lingkungan'],
  'Dapur Asrama Putra': ['Pengadaan Bahan', 'Operasional Dapur'],
  'Dapur Asrama Putri': ['Pengadaan Bahan', 'Operasional Dapur']
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
        <div ref={wrapperRef} className="relative w-full h-10">
            <div 
                onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
                className={`w-full h-full px-3 pr-8 bg-white outline-none text-[11px] font-black focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer flex items-center ${value === '' ? 'text-slate-400 italic' : 'text-emerald-900'}`}
            >
                <span className="truncate">{value || placeholder}</span>
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

export default function RkaRevisiPage() {
  const router = useRouter()
  const [rkaList, setRkaList] = useState<any[]>([])
  const [selectedRkaId, setSelectedRkaId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)

  // Gate Check States
  const [isRevisiActive, setIsRevisiActive] = useState(true)
  const [checkingActive, setCheckingActive] = useState(true)

  // Metadata States
  const [unit, setUnit] = useState('')
  const [bidang, setBidang] = useState('')
  const [bulan, setBulan] = useState('')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([])
  const [catatanRevisi, setCatatanRevisi] = useState('')

  // State for the editable revision rows
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    const checkGate = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('active_unit')
          .eq('user_id', user.id)
          .maybeSingle()

        const activeUnit = profile?.active_unit || 'Pusat (Yayasan)'

        // 1. Check Global Gate
        const { data: globalGate } = await supabase
          .from('kontrol_pengajuan')
          .select('revisi_rka_aktif')
          .eq('unit_name', 'GLOBAL')
          .maybeSingle()

        if (globalGate && globalGate.revisi_rka_aktif === false) {
          setIsRevisiActive(false)
          setCheckingActive(false)
          return
        }

        // 2. Check Unit Gate
        const { data: unitGate } = await supabase
          .from('kontrol_pengajuan')
          .select('revisi_rka_aktif')
          .eq('unit_name', activeUnit)
          .maybeSingle()

        if (unitGate && unitGate.revisi_rka_aktif === false) {
          setIsRevisiActive(false)
        } else {
          setIsRevisiActive(true)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setCheckingActive(false)
      }
    }

    checkGate()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('id');
      
      if (editId) {
        getDraftRevisiById(editId).then(draft => {
          if (draft && draft.jenis === 'REVISI_RKA' && (draft.status === 'DRAFT' || draft.status === 'REVISI' || draft.status === 'BUTUH_REVISI')) {
            setDraftId(draft.id);
            setUnit(draft.unit || '');
            setBidang(draft.bidang || '');
            const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            
            let savedBulan = monthNames[draft.periode_bulan] || 'Januari';
            if (draft.item_pengajuan && draft.item_pengajuan.length > 0) {
                try {
                    const firstItem = draft.item_pengajuan[0];
                    const details = typeof firstItem.rincian_json === 'string' ? JSON.parse(firstItem.rincian_json) : (firstItem.rincian_json || {});
                    if (details._tanggal_pengajuan) {
                        savedBulan = details._tanggal_pengajuan;
                    }
                } catch(e) {}
            }
            setBulan(savedBulan);
            
            setTahunAjaran(draft.periode_tahun ? `${draft.periode_tahun}/${Number(draft.periode_tahun)+1}` : '2025/2026');
            setCatatanRevisi(draft.catatan_revisi || '');
            
            // Map draft items to rows
            const mappedRows = (draft.item_pengajuan || []).map((item: any, idx: number) => {
              let details: any = { items: [], fundingSplits: [{ source: item.sumber_dana, percent: 100, nominal: item.nominal }] }
              try {
                if (typeof item.rincian_json === 'string') {
                  details = JSON.parse(item.rincian_json)
                } else if (item.rincian_json) {
                  details = item.rincian_json
                }
              } catch(e) {}
              
              return {
                id: `draft-row-${idx}`,
                program: item.judul_kegiatan?.replace('[REVISI] ', '') || '',
                operasional: item.kategori_coa || '',
                jumlah: details.jumlah_kegiatan || '1',
                waktu: item.waktu || '',
                tempat: item.tempat || '',
                pic: item.pic || '',
                sasaran: item.sasaran || '',
                nominal: Number(item.nominal) || 0,
                details: details
              }
            })
            setRows(mappedRows);
            setSelectedRkaId(draft.parent_id);
            
            getApprovedRkaList(draft.parent_id).then(data => {
              setRkaList(data)
              setLoading(false)
            })
          } else {
             setSelectedRkaId(editId);
             getApprovedRkaList(editId).then(data => {
               setRkaList(data)
               setLoading(false)
             })
          }
        });
        return; // Skip the default fetch below since it's chained
      }
    }

    // Default fetch for new revision
    getApprovedRkaList().then(data => {
      setRkaList(data)
      setLoading(false)
    })
  }, [])

  const selectedRka = useMemo(() => rkaList.find(r => String(r.id) === String(selectedRkaId)), [rkaList, selectedRkaId])

  useEffect(() => {
    if (draftId) return; // Skip populating from parent RKA if we already loaded a draft

    if (selectedRka && selectedRka.item_pengajuan) {
      setUnit(selectedRka.unit || '')
      setBidang(selectedRka.bidang || '')
      const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      setBulan(monthNames[selectedRka.periode_bulan] || 'Januari')
      setTahunAjaran(selectedRka.periode_tahun ? `${selectedRka.periode_tahun}/${Number(selectedRka.periode_tahun)+1}` : '2025/2026')

      // Map original items to editable rows
      const mappedRows = selectedRka.item_pengajuan.map((item: any, idx: number) => {
        let details: any = { items: [], fundingSplits: [{ source: item.sumber_dana, percent: 100, nominal: item.nominal }] }
        try {
          if (typeof item.rincian_json === 'string') {
            details = JSON.parse(item.rincian_json)
          } else if (item.rincian_json) {
            details = item.rincian_json
          }
        } catch(e) {}
        
        // Ensure funding splits have percent calculated
        if (details.fundingSplits && details.fundingSplits.length > 0) {
            details.fundingSplits.forEach((s: any) => {
                if (item.nominal > 0) s.percent = (s.nominal / item.nominal) * 100
                else s.percent = 0
            })
        }

        return {
          id: Date.now().toString() + idx,
          program: item.judul_kegiatan,
          operasional: item.kategori_coa,
          jumlah: item.jumlah_kegiatan || '1x',
          waktu: item.waktu || '',
          tempat: item.tempat || '',
          pic: item.pic || '',
          sasaran: item.sasaran || '',
          nominal: Number(item.nominal) || 0,
          details: details
        }
      })
      setRows(mappedRows)
      setErrorMsg('')
    } else {
      setRows([])
      setUnit('')
      setBidang('')
      setBulan('')
      setTahunAjaran('')
    }
  }, [selectedRka])

  useEffect(() => {
    const fetchPrograms = async () => {
      if (!unit) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('program_kegiatan')
          .select('program, nama_kegiatan')
          .eq('unit', unit);
          
        if (data) {
          const programSet = new Set<string>();
          data.forEach(item => {
            if (item.program && item.nama_kegiatan && item.nama_kegiatan !== '-') {
              programSet.add(`${item.program} - ${item.nama_kegiatan}`);
            } else if (item.program) {
              programSet.add(item.program);
            }
          });
          setAvailablePrograms(Array.from(programSet).sort((a, b) => a.localeCompare(b)));
        }
      } catch (err) {
        console.error("Gagal memuat program referensi:", err);
      }
    };
    fetchPrograms();
  }, [unit]);

  const totalOriginal = selectedRka ? Number(selectedRka.total_nominal) : 0
  const totalRevision = rows.reduce((acc, row) => acc + (Number(row.nominal) || 0), 0)
  const isOverBudget = totalRevision > totalOriginal

  const indukFundingAggregated = useMemo(() => {
    if (!selectedRka) return [];
    const splits: Record<string, number> = {};
    selectedRka.item_pengajuan?.forEach((it: any) => {
        try {
            const details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {});
            const itemSplits = details.fundingSplits || [{ source: it.sumber_dana, nominal: it.nominal }];
            itemSplits.forEach((s: any) => {
                const source = s.source || 'Lainnya';
                splits[source] = (splits[source] || 0) + Number(s.nominal || 0);
            });
        } catch(e) {}
    });
    return Object.entries(splits).map(([source, nominal]) => ({ source, nominal }));
  }, [selectedRka]);

  const updateRow = (id: string, field: string, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const removeRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id))
  }

  // --- Rincian Detail Management ---
  const updateRincianItem = (rowId: string, itemIdx: number, field: string, value: any) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newItems = [...(row.details?.items || [])]
        let cleanVal = value;
        if (field === 'price' || field === 'qty') {
           cleanVal = value.toString().replace(/\D/g, "");
           cleanVal = cleanVal ? Number(cleanVal) : 0;
        }
        const item = { ...newItems[itemIdx], [field]: cleanVal }
        if (field === 'price' || field === 'qty') {
           item.total = item.price * item.qty
        }
        newItems[itemIdx] = item
        const newNominal = newItems.reduce((acc: number, it: any) => acc + (it.total || 0), 0)
        
        // Recalculate funding splits nominals based on new nominal
        const newSplits = [...(row.details?.fundingSplits || [])]
        if (newNominal > 0 && newSplits.length > 0) {
            newSplits.forEach(s => {
                s.nominal = (s.percent / 100) * newNominal
            })
        } else if (newNominal === 0) {
            newSplits.forEach(s => { s.nominal = 0 })
        }

        return { 
           ...row, 
           nominal: newNominal,
           details: { ...row.details, items: newItems, fundingSplits: newSplits }
        }
      }
      return row
    }))
  }

  const addRincianItem = (rowId: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newItems = [...(row.details?.items || []), { name: '', unit: 'Pcs', price: 0, qty: 1, total: 0 }]
        return { ...row, details: { ...row.details, items: newItems } }
      }
      return row
    }))
  }

  const removeRincianItem = (rowId: string, itemIdx: number) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newItems = (row.details?.items || []).filter((_: any, idx: number) => idx !== itemIdx)
        const newNominal = newItems.reduce((acc: number, it: any) => acc + (it.total || 0), 0)
        
        const newSplits = [...(row.details?.fundingSplits || [])]
        if (newNominal > 0 && newSplits.length > 0) {
            newSplits.forEach(s => { s.nominal = (s.percent / 100) * newNominal })
        } else {
            newSplits.forEach(s => { s.nominal = 0 })
        }

        return { 
           ...row, 
           nominal: newNominal,
           details: { ...row.details, items: newItems, fundingSplits: newSplits } 
        }
      }
      return row
    }))
  }

  // --- Funding Splits Management ---
  const addFundingSplit = (rowId: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          details: { ...row.details, fundingSplits: [...(row.details?.fundingSplits || []), { source: '', percent: 0, nominal: 0 }] }
        }
      }
      return row
    }))
  }

  const removeFundingSplit = (rowId: string, splitIdx: number) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          details: { ...row.details, fundingSplits: (row.details?.fundingSplits || []).filter((_: any, i: number) => i !== splitIdx) }
        }
      }
      return row
    }))
  }

  const updateFundingSplit = (rowId: string, splitIdx: number, field: string, value: any) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const newSplits = [...(row.details?.fundingSplits || [])]
        const split = { ...newSplits[splitIdx], [field]: value }
        
        if (field === 'percent') {
            let val = Number(value);
            if (val < 0) val = 0;
            const otherTotal = newSplits.reduce((acc, s, i) => i !== splitIdx ? acc + (Number(s.percent) || 0) : acc, 0);
            if (otherTotal + val > 100) val = 100 - otherTotal;
            split.percent = val;
            split.nominal = (val / 100) * row.nominal;
        } else if (field === 'nominal') {
            const cleanVal = value.toString().replace(/\D/g, "");
            let val = Number(cleanVal);
            if (val < 0) val = 0;
            const otherTotalNominal = newSplits.reduce((acc, s, i) => i !== splitIdx ? acc + (Number(s.nominal) || 0) : acc, 0);
            if (otherTotalNominal + val > row.nominal) val = row.nominal - otherTotalNominal;
            split.nominal = val;
            split.percent = row.nominal > 0 ? (val / row.nominal) * 100 : 0;
        } else {
            split[field] = value
        }
        
        newSplits[splitIdx] = split
        return {
          ...row,
          details: { ...row.details, fundingSplits: newSplits }
        }
      }
      return row
    }))
  }

  const isFormValid = useMemo(() => {
    if (!selectedRka) return false;
    if (isOverBudget) return false;
    if (!rows || rows.length === 0) return false;

    for (const r of rows) {
      if (!r.program || !r.operasional) return false;

      if (r.details?.items?.length > 0) {
        for (let i = 0; i < r.details.items.length; i++) {
          const item = r.details.items[i];
          if (!item.name || item.price <= 0 || item.qty <= 0) {
            return false;
          }
        }
      }

      const splitsTotal = (r.details?.fundingSplits || []).reduce((sum: number, s: any) => sum + Number(s.percent || 0), 0);
      if (r.details?.fundingSplits?.length > 0 && Math.abs(splitsTotal - 100) > 0.1) {
         return false;
      }
    }
    return true;
  }, [selectedRka, isOverBudget, rows]);

  const submitRevisi = async (statusToSave: string = 'MENUNGGU_VERIFIKASI') => {
    if (!selectedRka) {
      setErrorMsg('Data RKA Induk tidak ditemukan. Gagal memproses data.')
      return
    }
    if (isOverBudget && statusToSave !== 'DRAFT') {
      setErrorMsg('Total Revisi melebihi Total Asli. Tidak dapat diajukan.')
      return
    }
    
    // Validation
    if (statusToSave !== 'DRAFT') {
      for (const r of rows) {
        if (!r.program || !r.operasional) {
          setErrorMsg('Harap lengkapi Program dan Deskripsi untuk semua baris.')
          return
        }
        if (r.details?.items?.length > 0) {
          for (let i = 0; i < r.details.items.length; i++) {
            const item = r.details.items[i]
            if (!item.name || item.price <= 0 || item.qty <= 0) {
              setErrorMsg(`Harap lengkapi Nama Item, Harga (>0), dan Qty (>0) pada Rincian Detail baris ${r.program}.`)
              return
            }
          }
        }
        const splitsTotal = (r.details?.fundingSplits || []).reduce((sum: number, s: any) => sum + Number(s.percent || 0), 0)
        if (r.details?.fundingSplits?.length > 0 && Math.abs(splitsTotal - 100) > 0.1) {
           setErrorMsg(`Total persentase Alokasi Sumber Dana pada baris ${r.program} harus 100%. Saat ini ${splitsTotal}%.`)
           return
        }
      }
    }

    setSubmitting(true)
    setErrorMsg('')

    const payload = {
      draft_id: draftId || undefined,
      parent_id: selectedRka.id,
      unit: unit,
      bidang: bidang,
      bulan: bulan,
      tahun_ajaran: tahunAjaran,
      total_nominal: totalRevision,
      data: rows,
      status: statusToSave,
      catatan_revisi: catatanRevisi
    }

    const res = await submitRevisiRka(payload)
    setSubmitting(false)

    if (res.error) {
      setErrorMsg(res.error)
      alert('Gagal menyimpan: ' + res.error)
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    } else {
      if (statusToSave === 'DRAFT') {
        router.push('/admin/pengajuan/draft-saya?tab=REVISI_RKA')
      } else {
        router.push('/admin/pengajuan/riwayat')
      }
    }
  }

  const handleSubmit = () => submitRevisi('MENUNGGU_VERIFIKASI')
  const handleSaveDraft = () => submitRevisi('DRAFT')

  const handleExportExcelProfessional = async () => {
    if (!selectedRka) return

    const reportTitle = "DOKUMEN REVISI RENCANA KEGIATAN DAN ANGGARAN (RKA)"

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Revisi RKA')

    // 1. Header Styling
    worksheet.mergeCells('A1:K1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = reportTitle
    titleCell.font = { name: 'Times New Roman', size: 14, bold: true }
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

    // 2. Metadata
    worksheet.getRow(3).values = ['Unit / Jenjang:', unit, '', 'Bidang / Dept:', bidang || '-']
    worksheet.getRow(4).values = ['Bulan:', bulan, '', 'Tahun Ajaran:', tahunAjaran]
    worksheet.getRow(3).font = { bold: true }
    worksheet.getRow(4).font = { bold: true }

    // 3. Tabel RKA Induk (Read Only)
    worksheet.getRow(6).values = ['TABEL 1: RKA INDUK (SEBELUM REVISI)']
    worksheet.getRow(6).font = { bold: true, size: 12 }
    
    const indukHeader = worksheet.getRow(7)
    indukHeader.values = ['No', 'Program / Kegiatan', 'Deskripsi Kegiatan', 'Jumlah', 'Waktu', 'Tempat', 'Penanggung Jawab', 'Sasaran', 'Anggaran']
    indukHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    indukHeader.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64748B' } }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })

    let currentRow = 8
    selectedRka.item_pengajuan.forEach((it: any, idx: number) => {
      const r = worksheet.getRow(currentRow)
      r.values = [
        idx + 1,
        it.judul_kegiatan,
        it.kategori_coa,
        it.jumlah_kegiatan || 1,
        it.waktu || '-',
        it.tempat || '-',
        it.pic || '-',
        it.sasaran || '-',
        Number(it.nominal || 0)
      ]
      r.getCell(9).numFmt = '"Rp"#,##0'
      r.font = { italic: true, color: { argb: 'FF475569' } }
      currentRow++
    })

    currentRow += 2

    // 4. Tabel Revisi RKA
    worksheet.getRow(currentRow).values = ['TABEL 2: RKA REVISI (PENGAJUAN BARU)']
    worksheet.getRow(currentRow).font = { bold: true, size: 12, color: { argb: 'FF059669' } }
    currentRow++

    const revisiHeader = worksheet.getRow(currentRow)
    revisiHeader.values = ['No', 'Program / Kegiatan', 'Deskripsi Kegiatan', 'Jumlah', 'Waktu', 'Tempat', 'Penanggung Jawab', 'Sasaran', 'Sumber Dana', 'Nominal Revisi']
    revisiHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    revisiHeader.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })
    currentRow++

    rows.forEach((row, idx) => {
      const r = worksheet.getRow(currentRow)
      const splitStr = (row.details?.fundingSplits || []).map((s:any) => `${s.source} (${s.percent}%)`).join(', ')
      
      r.values = [
        idx + 1,
        row.program,
        row.operasional,
        row.jumlah,
        row.waktu,
        row.tempat,
        row.pic,
        row.sasaran,
        splitStr || 'Lainnya',
        Number(row.nominal || 0)
      ]
      r.getCell(10).numFmt = '"Rp"#,##0'
      currentRow++
    })

    currentRow += 2
    worksheet.getRow(currentRow).values = ['Total RKA Asli:', totalOriginal]
    worksheet.getRow(currentRow).getCell(2).numFmt = '"Rp"#,##0'
    worksheet.getRow(currentRow).font = { bold: true }
    currentRow++
    worksheet.getRow(currentRow).values = ['Total Revisi:', totalRevision]
    worksheet.getRow(currentRow).getCell(2).numFmt = '"Rp"#,##0'
    worksheet.getRow(currentRow).font = { bold: true }

    if (catatanRevisi) {
      currentRow += 2
      worksheet.getRow(currentRow).values = ['Catatan Revisi:']
      worksheet.getRow(currentRow).font = { bold: true }
      currentRow++
      worksheet.getRow(currentRow).values = [catatanRevisi]
    }

    worksheet.columns.forEach((col, i) => { 
        if (i === 1) col.width = 35;
        else if (i === 2 || i === 8 || i === 9) col.width = 25;
        else col.width = 15;
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `Revisi_RKA_${unit}_${bulan}.xlsx`
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate Aggregated Funding Splits for Summary
  const rkaFundingAggregated = useMemo(() => {
    const agg: Record<string, number> = {};
    rows.forEach(row => {
      (row.details?.fundingSplits || []).forEach((s: any) => {
        if (s.source) {
          agg[s.source] = (agg[s.source] || 0) + Number(s.nominal || 0);
        }
      });
    });
    return Object.entries(agg).map(([source, nominal]) => ({ source, nominal }));
  }, [rows]);

  if (loading) return <div className="p-8 animate-pulse text-gray-500">Memuat data RKA...</div>

  // Date Logic for Rescheduling blocks
  const currentMonthIdx = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const isSecondHalf = currentMonthIdx < 7;
  const currentTaStartYear = isSecondHalf ? currentYear - 1 : currentYear;
  const currentTaString = `${currentTaStartYear}/${currentTaStartYear + 1}`;

  const isPastTahunAjaran = (ta: string) => {
     const taStartYear = parseInt(ta.split('/')[0] || '0');
     return taStartYear < currentTaStartYear;
  }

  const isPastBulan = (monthName: string, ta: string) => {
      if (isPastTahunAjaran(ta)) return true;
      if (ta !== currentTaString) return false;
      const monthMap: Record<string, number> = {
          'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
          'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
      };
      const mIdx = monthMap[monthName];
      const isMIdxSecondHalf = mIdx < 7;
      if (isSecondHalf) {
          if (!isMIdxSecondHalf) return true; 
          return mIdx < currentMonthIdx;
      } else {
          if (isMIdxSecondHalf) return false; 
          return mIdx < currentMonthIdx;
      }
  }

  const availableTahunAjaranList = ['2024/2025', '2025/2026', '2026/2027'];
  const monthNamesList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];


  if (checkingActive) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Memeriksa Akses...</p>
        </div>
      </div>
    )
  }

  if (!isRevisiActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Akses Ditutup</h1>
          <p className="text-sm font-bold text-slate-500 mb-8">Mohon maaf, pengisian Form Revisi RKA untuk unit Anda saat ini sedang dinonaktifkan oleh Pusat (Yayasan).</p>
          <button 
            onClick={() => router.push('/admin')}
            className="w-full bg-slate-900 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Kembali ke Dasbor
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <FileEdit size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Buat Revisi RKA</h1>
            <p className="text-gray-500">Ajukan perubahan (realokasi) pagu dan item rincian dari RKA yang sudah cair.</p>
          </div>
        </div>

        {selectedRka && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportExcelProfessional}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-sm whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor Excel
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {errorMsg}
        </div>
      )}

      {catatanRevisi && catatanRevisi.includes('- [') && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2.5 mb-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="text-xs font-black text-rose-800 uppercase tracking-widest">Catatan Revisi dari Pemberi Otoritas</h3>
          </div>
          <div className="pl-7">
            <p className="text-xs font-bold text-rose-700 italic leading-relaxed whitespace-pre-wrap">{catatanRevisi.replace(' [RESUBMITTED]', '')}</p>
          </div>
        </div>
      )}

      {/* STEP 1: PILIH RKA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            1. Pilih Dokumen RKA Induk
        </label>
        <select 
          value={selectedRkaId}
          onChange={(e) => setSelectedRkaId(e.target.value)}
          className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        >
          <option value="">-- Pilih RKA yang akan direvisi --</option>
          {rkaList.map(rka => (
            <option key={rka.id} value={rka.id}>
              [{rka.unit}] {rka.bidang} - Rp {Number(rka.total_nominal).toLocaleString('id-ID')}
            </option>
          ))}
        </select>
      </div>

      {/* STEP 2: METADATA FORM (UNIT, BIDANG, BULAN, TAHUN AJARAN) */}
      {selectedRka && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                2. Informasi Pengajuan (Metadata)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Unit */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 size={16} className="text-emerald-600" />
                    </div>
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                        disabled
                    >
                        <option value="">-- Unit --</option>
                        <option value={unit}>{unit}</option>
                    </select>
                </div>
                {/* Bidang */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Layers size={16} className="text-emerald-600" />
                    </div>
                    <select
                        value={bidang}
                        onChange={(e) => setBidang(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">-- Pilih Bidang --</option>
                        {(BIDANG_BY_UNIT[unit] || [bidang]).map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
                {/* Bulan */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-emerald-600" />
                    </div>
                    {unit === 'Dapur Asrama Putra' || unit === 'Dapur Asrama Putri' ? (
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
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer hover:border-emerald-300"
                      />
                    ) : (
                      <select
                          value={bulan}
                          onChange={(e) => setBulan(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer hover:border-emerald-300"
                      >
                          <option value="">-- Pilih Bulan --</option>
                          {monthNamesList.map(m => (
                              <option key={m} value={m} disabled={isPastBulan(m, tahunAjaran)}>
                                  {m} {isPastBulan(m, tahunAjaran) ? '(Berlalu)' : ''}
                              </option>
                          ))}
                      </select>
                    )}
                </div>
                {/* Tahun Ajaran */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap size={16} className="text-emerald-600" />
                    </div>
                    <select
                        value={tahunAjaran}
                        onChange={(e) => setTahunAjaran(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer hover:border-emerald-300"
                    >
                        <option value="">-- Pilih Tahun Ajaran --</option>
                        {availableTahunAjaranList.map(ta => (
                            <option key={ta} value={ta} disabled={isPastTahunAjaran(ta)}>
                                {ta} {isPastTahunAjaran(ta) ? '(Berlalu)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> Ubah Bulan atau Tahun Ajaran jika kegiatan dilakukan reschedule (Pergeseran Waktu).</p>
        </div>
      )}

      {/* STEP 3 & 4: FORM REVISI (UI PARITY DENGAN LPJ DUAL-TABLE) */}
      {selectedRka && (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* TABEL RKA INDUK (TOP - READ ONLY) */}
            <div className="bg-slate-50/50 rounded-3xl shadow-sm border border-slate-200 overflow-hidden opacity-95">
                <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-100">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" /> 3. Tabel Rencana Kegiatan & Anggaran (RKA Induk)
                    </h2>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-200 px-2 py-0.5 rounded-full">Read-Only</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[10px] min-w-[900px]">
                        <thead className="bg-slate-200/50 border-b border-slate-200">
                            <tr className="divide-x divide-slate-200">
                                <th className="px-2 py-1.5 w-10 text-center font-black text-slate-500 uppercase tracking-widest">No</th>
                                <th className="px-3 py-1.5 text-left font-black text-slate-500 uppercase tracking-widest">Program/ Kegiatan</th>
                                <th className="px-3 py-1.5 text-left font-black text-slate-500 uppercase tracking-widest">Deskripsi Kegiatan</th>
                                <th className="px-2 py-1.5 text-center w-16 font-black text-slate-500 uppercase tracking-widest leading-tight">Jumlah</th>
                                <th className="px-2 py-1.5 text-left font-black text-slate-500 uppercase tracking-widest">Waktu</th>
                                <th className="px-2 py-1.5 text-left font-black text-slate-500 uppercase tracking-widest">Tempat</th>
                                <th className="px-2 py-1.5 text-left font-black text-slate-500 uppercase tracking-widest leading-tight">Penanggung Jawab</th>
                                <th className="px-2 py-1.5 text-left font-black text-slate-500 uppercase tracking-widest">Sasaran</th>
                                <th className="px-3 py-1.5 text-right w-24 font-black text-slate-500 uppercase tracking-widest">Anggaran</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white/60">
                            {selectedRka.item_pengajuan.map((it: any, idx: number) => (
                                <tr key={idx} className="divide-x divide-slate-100 hover:bg-slate-100/50 transition-colors italic">
                                    <td className="px-2 py-1.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                                    <td className="px-3 py-1.5 font-bold text-slate-600">{it.judul_kegiatan}</td>
                                    <td className="px-3 py-1.5 font-medium text-slate-500">{it.kategori_coa}</td>
                                    <td className="px-2 py-1.5 text-center font-medium text-slate-500">{it.jumlah_kegiatan || 1}</td>
                                    <td className="px-2 py-1.5 text-slate-500">{it.waktu || '-'}</td>
                                    <td className="px-2 py-1.5 text-slate-500">{it.tempat || '-'}</td>
                                    <td className="px-2 py-1.5 text-slate-500">{it.pic || '-'}</td>
                                    <td className="px-2 py-1.5 text-slate-500">{it.sasaran || '-'}</td>
                                    <td className="px-3 py-1.5 text-right font-black text-slate-600 bg-slate-100/50">Rp {(it.nominal || 0).toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Detail Table Section for RKA Induk */}
                <div className="p-5 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Rincian Detail & Budgeting Plan:</p>
                            </div>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full border-collapse bg-white text-[10px]">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr className="divide-x divide-slate-200">
                                            <th className="px-2 py-2 w-10 text-center font-black text-slate-400 uppercase tracking-widest">No</th>
                                            <th className="px-3 py-2 text-left font-black text-slate-400 uppercase tracking-widest">Item / Spesifikasi</th>
                                            <th className="px-2 py-2 text-center w-16 font-black text-slate-400 uppercase tracking-widest">Satuan</th>
                                            <th className="px-2 py-2 text-right w-24 font-black text-slate-400 uppercase tracking-widest">Harga</th>
                                            <th className="px-2 py-2 text-center w-12 font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                            <th className="px-3 py-2 text-right w-28 font-black text-slate-500 uppercase tracking-widest bg-slate-100/50">Total (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 italic">
                                        {selectedRka ? (
                                            selectedRka.item_pengajuan?.flatMap((it: any) => {
                                                let details: any = {};
                                                try { details = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {}); } catch(e) {}
                                                return details.items || (Array.isArray(details) ? details : []);
                                            }).map((rin: any, rIdx: number) => (
                                                <tr key={rIdx} className="divide-x divide-slate-100 bg-white/60">
                                                    <td className="px-2 py-1.5 text-center text-slate-300 font-bold">{rIdx + 1}</td>
                                                    <td className="px-3 py-1.5 font-bold text-slate-500">{rin.name || rin.item}</td>
                                                    <td className="px-2 py-1.5 text-center font-medium text-slate-400">{rin.unit || rin.satuan || '-'}</td>
                                                    <td className="px-2 py-1.5 text-right font-medium text-slate-400">{(rin.price || rin.harga_satuan || 0).toLocaleString('id-ID')}</td>
                                                    <td className="px-2 py-1.5 text-center font-bold text-slate-500">{rin.qty || rin.jumlah || 1}</td>
                                                    <td className="px-3 py-1.5 text-right font-black text-slate-500 bg-slate-50">{( (rin.price || rin.harga_satuan || 0) * (rin.qty || rin.jumlah || 1) ).toLocaleString('id-ID')}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr className="divide-x divide-slate-100 text-slate-300">
                                                <td className="px-2 py-1.5 text-center">-</td>
                                                <td className="px-3 py-1.5">-</td>
                                                <td className="px-2 py-1.5 text-center">-</td>
                                                <td className="px-2 py-1.5 text-right">-</td>
                                                <td className="px-2 py-1.5 text-center">-</td>
                                                <td className="px-3 py-1.5 text-right font-bold">-</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="w-56 shrink-0 space-y-3">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alokasi Sumber Dana:</p>
                            </div>
                            <div className="bg-white/60 border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2 text-[10px] font-bold">
                                {indukFundingAggregated.length > 0 ? indukFundingAggregated.map((s, i) => (
                                    <div key={i} className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span className="text-slate-400">{s.source}</span>
                                        <span className="text-slate-600">Rp {s.nominal.toLocaleString('id-ID')}</span>
                                    </div>
                                )) : (
                                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span className="text-slate-400 italic">Belum ada data dana</span>
                                        <span className="text-slate-500">-</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-slate-100 text-slate-600">
                                    <span className="uppercase tracking-widest text-[9px] font-black">Total Anggaran</span>
                                    <span className="text-sm font-black italic tracking-tighter text-slate-600">Rp {totalOriginal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50 text-slate-500">
                                    <span className="uppercase tracking-widest text-[9px] font-black text-slate-400">Jenis Pencairan Dana</span>
                                    <span className="text-[10px] font-black text-slate-500 italic uppercase">
                                        {selectedRka?.metode_pencairan || selectedRka?.metode_pembayaran || 'CASH'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABEL REVISI RKA (BOTTOM - EDITABLE) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">4. Tabel Rencana Kegiatan & Anggaran (Revisi)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[11px] min-w-[900px]">
                        <thead className="bg-slate-100 border-b border-slate-200">
                            <tr className="divide-x divide-slate-200">
                                <th className="px-2 py-2 w-10 text-center font-black text-slate-900 uppercase tracking-widest">No</th>
                                <th className="px-3 py-2 text-left font-black text-slate-900 uppercase tracking-widest">
                                    Program/ Kegiatan <span className="text-rose-500">*</span>
                                </th>
                                <th className="px-3 py-2 text-left font-black text-slate-900 uppercase tracking-widest">
                                    Deskripsi Kegiatan <span className="text-rose-500">*</span>
                                </th>
                                <th className="px-2 py-2 text-center w-20 font-black text-slate-900 uppercase tracking-widest leading-tight">
                                    Jumlah <span className="text-rose-500">*</span>
                                </th>
                                <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest">
                                    Waktu <span className="text-rose-500">*</span>
                                </th>
                                <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest">
                                    Tempat <span className="text-rose-500">*</span>
                                </th>
                                <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest leading-tight">
                                    Penanggung Jawab <span className="text-rose-500">*</span>
                                </th>
                                <th className="px-2 py-2 text-left font-black text-slate-900 uppercase tracking-widest">
                                    Sasaran <span className="text-rose-500">*</span>
                                </th>
                                <th className="px-3 py-2 text-right w-28 font-black text-slate-900 uppercase tracking-widest">
                                    Revisi <span className="text-rose-500">*</span>
                                </th>
                                <th className="px-2 py-2 w-10 text-center font-black text-slate-900 uppercase tracking-widest">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {rows.map((row, idx) => (
                                <tr key={row.id} className="divide-x divide-slate-100 bg-white hover:bg-emerald-50/10 transition-colors group">
                                    <td className="px-3 py-2 text-center font-black text-slate-300">{idx + 1}</td>
                                    <td className="p-0 relative group border-r border-slate-100">
                                        <SearchableCombobox
                                            value={row.program}
                                            options={availablePrograms}
                                            onChange={(val) => updateRow(row.id, 'program', val)}
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-100">
                                        <input 
                                            type="text"
                                            value={row.operasional}
                                            onChange={(e) => updateRow(row.id, 'operasional', e.target.value)}
                                            className="w-full h-10 px-3 bg-white border-none outline-none text-[11px] font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 transition-all placeholder-slate-400"
                                            placeholder="Deskripsi kegiatan..."
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-100">
                                        <input 
                                            type="text"
                                            value={row.jumlah}
                                            onChange={(e) => updateRow(row.id, 'jumlah', e.target.value)}
                                            className="w-full h-10 px-2 bg-white border-none outline-none text-[11px] font-black text-center focus:ring-2 focus:ring-emerald-500"
                                            placeholder="1x"
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-100">
                                        <input 
                                            type="text"
                                            value={row.waktu}
                                            onChange={(e) => updateRow(row.id, 'waktu', e.target.value)}
                                            className="w-full h-10 px-3 bg-white border-none outline-none text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                                            placeholder="..."
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-100">
                                        <input 
                                            type="text"
                                            value={row.tempat}
                                            onChange={(e) => updateRow(row.id, 'tempat', e.target.value)}
                                            className="w-full h-10 px-3 bg-white border-none outline-none text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                                            placeholder="..."
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-100">
                                        <input 
                                            type="text"
                                            value={row.pic}
                                            onChange={(e) => updateRow(row.id, 'pic', e.target.value)}
                                            className="w-full h-10 px-3 bg-white border-none outline-none text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                                            placeholder="..."
                                        />
                                    </td>
                                    <td className="p-0 border-r border-slate-100">
                                        <input 
                                            type="text"
                                            value={row.sasaran}
                                            onChange={(e) => updateRow(row.id, 'sasaran', e.target.value)}
                                            className="w-full h-10 px-3 bg-white border-none outline-none text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                                            placeholder="..."
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-right font-black text-emerald-900 bg-emerald-50/20">
                                        Rp {(row.nominal || 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <button 
                                            onClick={() => removeRow(row.id)}
                                            className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors"
                                            title="Hapus Baris"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Detail Table Section for Rincian (Matches LPJ Detail) */}
                <div className="p-5 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1 space-y-8">
                            {rows.map((row, rowIdx) => (
                                <div key={row.id} className="space-y-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2">
                                            <Info className="w-3.5 h-3.5 text-emerald-600" />
                                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Rincian Detail Revisi: {row.program || `Baris ${rowIdx+1}`}</p>
                                        </div>
                                        <button 
                                            onClick={() => addRincianItem(row.id)}
                                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-[9px] transition-all uppercase tracking-widest shadow-md shadow-emerald-100"
                                        >
                                            <PlusCircle className="w-3.5 h-3.5" /> Tambah Item
                                        </button>
                                    </div>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full border-collapse bg-white text-[10px]">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr className="divide-x divide-slate-200">
                                                    <th className="px-2 py-2 w-10 text-center font-black text-slate-600 uppercase tracking-widest">No</th>
                                                    <th className="px-3 py-2 text-left font-black text-slate-600 uppercase tracking-widest">
                                                        Nama Item / Spesifikasi <span className="text-rose-500">*</span>
                                                    </th>
                                                    <th className="px-2 py-2 text-center w-16 font-black text-slate-600 uppercase tracking-widest">
                                                        Satuan <span className="text-rose-500">*</span>
                                                    </th>
                                                    <th className="px-2 py-2 text-right w-24 font-black text-slate-600 uppercase tracking-widest">
                                                        Harga <span className="text-rose-500">*</span>
                                                    </th>
                                                    <th className="px-2 py-2 text-center w-12 font-black text-slate-600 uppercase tracking-widest">
                                                        Qty <span className="text-rose-500">*</span>
                                                    </th>
                                                    <th className="px-3 py-2 text-right w-28 font-black text-emerald-800 uppercase tracking-widest bg-emerald-50/30">Total (Rp)</th>
                                                    <th className="px-2 py-2 w-10 text-center font-black text-slate-600 uppercase tracking-widest">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {(row.details?.items || []).map((rin: any, rIdx: number) => (
                                                    <tr key={`${row.id}-${rIdx}`} className="divide-x divide-slate-100 hover:bg-emerald-50/5 transition-colors">
                                                        <td className="px-2 py-1.5 text-center text-slate-400 font-bold">{rIdx + 1}</td>
                                                        <td className="p-0">
                                                            <input 
                                                                type="text"
                                                                value={rin.name}
                                                                onChange={(e) => updateRincianItem(row.id, rIdx, 'name', e.target.value)}
                                                                className="w-full h-8 px-3 bg-transparent border-none outline-none text-xs font-bold text-slate-800 focus:bg-emerald-50/10"
                                                                placeholder="Uraian item..."
                                                            />
                                                        </td>
                                                        <td className="p-0">
                                                            <input 
                                                                type="text"
                                                                value={rin.unit}
                                                                onChange={(e) => updateRincianItem(row.id, rIdx, 'unit', e.target.value)}
                                                                className="w-full h-8 px-2 bg-transparent border-none outline-none text-xs font-bold text-center text-slate-700 focus:bg-emerald-50/10"
                                                                placeholder="Pcs"
                                                            />
                                                        </td>
                                                        <td className="p-0">
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-2 text-[8px] font-bold text-slate-300">Rp</span>
                                                                <input 
                                                                    type="text"
                                                                    value={rin.price ? Number(rin.price).toLocaleString('id-ID') : ''}
                                                                    onChange={(e) => updateRincianItem(row.id, rIdx, 'price', e.target.value)}
                                                                    className="w-full h-8 pl-6 pr-2 bg-transparent border-none outline-none text-xs font-black text-right text-slate-800 focus:bg-emerald-50/10"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="p-0">
                                                            <input 
                                                                type="text"
                                                                value={rin.qty ? Number(rin.qty).toLocaleString('id-ID') : ''}
                                                                onChange={(e) => updateRincianItem(row.id, rIdx, 'qty', e.target.value)}
                                                                className="w-full h-8 px-2 bg-transparent border-none outline-none text-xs font-black text-center text-emerald-600 focus:bg-emerald-50/10"
                                                                placeholder="0"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-1.5 text-right font-black text-emerald-900 bg-emerald-50/10">
                                                            {(rin.total || 0).toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-2 py-1.5 text-center">
                                                            <button 
                                                                onClick={() => removeRincianItem(row.id, rIdx)}
                                                                className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                                                                title="Hapus Item"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(row.details?.items || []).length === 0 && (
                                                    <tr className="divide-x divide-slate-100 text-slate-300">
                                                        <td className="px-2 py-1.5 text-center">-</td>
                                                        <td className="px-3 py-1.5">-</td>
                                                        <td className="px-2 py-1.5 text-center">-</td>
                                                        <td className="px-2 py-1.5 text-right">-</td>
                                                        <td className="px-2 py-1.5 text-center">-</td>
                                                        <td className="px-3 py-1.5 text-right font-bold">-</td>
                                                        <td className="px-2 py-1.5 text-center">-</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* Smart Split inside each row */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Alokasi Sumber Dana (Smart Split)</p>
                                            </div>
                                            <button 
                                                onClick={() => addFundingSplit(row.id)}
                                                className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700"
                                            >
                                                <PlusCircle className="w-3 h-3" /> Tambah Sumber Dana
                                            </button>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <table className="w-full text-[10px]">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr className="divide-x divide-slate-200">
                                                        <th className="px-2 py-1.5 text-left font-black text-slate-600 uppercase tracking-widest">Sumber Dana</th>
                                                        <th className="px-2 py-1.5 text-center w-20 font-black text-slate-600 uppercase tracking-widest">% Persentase</th>
                                                        <th className="px-2 py-1.5 text-right w-32 font-black text-slate-600 uppercase tracking-widest">Nominal Alokasi</th>
                                                        <th className="px-2 py-1.5 text-center w-10 font-black text-slate-600 uppercase tracking-widest">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(row.details?.fundingSplits || []).map((split: any, sIdx: number) => (
                                                        <tr key={sIdx} className="divide-x divide-slate-100">
                                                            <td className="p-0">
                                                                <select
                                                                    value={split.source}
                                                                    onChange={(e) => updateFundingSplit(row.id, sIdx, 'source', e.target.value)}
                                                                    className="w-full h-8 px-2 bg-transparent outline-none font-bold text-slate-700"
                                                                >
                                                                    <option value="">Pilih Sumber Dana</option>
                                                                    {(FUNDING_SOURCES_BY_UNIT[unit] || ['Dana Pesantren/Yayasan']).map(fs => {
                                                                        const isBlocked = ['Tabungan Siswa', 'Iuran Non-Wajib', 'Uang Saku'].includes(fs);
                                                                        return <option key={fs} value={fs} disabled={isBlocked}>{fs} {isBlocked ? '(Diblokir)' : ''}</option>
                                                                    })}
                                                                </select>
                                                            </td>
                                                            <td className="p-0">
                                                                <input 
                                                                    type="number"
                                                                    value={split.percent || ''}
                                                                    onChange={(e) => updateFundingSplit(row.id, sIdx, 'percent', e.target.value)}
                                                                    className="w-full h-8 px-2 bg-transparent text-center font-black text-emerald-700 outline-none"
                                                                />
                                                            </td>
                                                            <td className="p-0">
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-1.5 text-[8px] font-bold text-slate-300">Rp</span>
                                                                    <input 
                                                                        type="text"
                                                                        value={split.nominal ? Number(split.nominal).toLocaleString('id-ID') : ''}
                                                                        onChange={(e) => updateFundingSplit(row.id, sIdx, 'nominal', e.target.value)}
                                                                        className="w-full h-8 pl-6 pr-2 bg-transparent text-right font-black text-emerald-900 outline-none"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <button onClick={() => removeFundingSplit(row.id, sIdx)} className="p-1 text-slate-300 hover:text-rose-600">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom Action & Summary Section */}
            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 mb-6 font-bold shadow-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
                {/* Summary Box */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between h-full">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Total RKA Asli</span>
                            <span className="text-slate-600 italic">Rp {totalOriginal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-50">
                            <span>Total RKA Revisi</span>
                            <span className="text-emerald-700 text-lg tracking-tighter italic">Rp {totalRevision.toLocaleString('id-ID')}</span>
                        </div>
                        <div className={`flex justify-between items-center text-[11px] font-black uppercase tracking-widest pt-2 border-t border-slate-50 ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                            <span>Selisih (Variance)</span>
                            <span>Rp {Math.abs(totalOriginal - totalRevision).toLocaleString('id-ID')} {isOverBudget ? '(Overbudget)' : ''}</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Catatan Revisi / Uraian Perubahan:</label>
                        <textarea
                            value={catatanRevisi}
                            onChange={(e) => setCatatanRevisi(e.target.value)}
                            placeholder="Jelaskan alasan mengapa program ini direvisi (opsional)..."
                            className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all placeholder:italic"
                        />
                    </div>
                </div>

                {/* Submit Box */}
                <div className="bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700 h-fit self-end relative overflow-hidden w-full">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                        <svg width="120" height="120" viewBox="0 0 100 100">
                            <pattern id="diagonal-stripe" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="currentColor" strokeWidth="2"/>
                            </pattern>
                            <rect width="100" height="100" fill="url(#diagonal-stripe)"/>
                        </svg>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-3">

                        <button 
                            onClick={handleSaveDraft}
                            disabled={!isFormValid || submitting}
                            className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                !isFormValid || submitting ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-amber-950 hover:shadow-lg hover:shadow-amber-500/20'
                            }`}
                        >
                            <Bookmark className="w-4 h-4" />
                            Simpan Draft
                        </button>

                        <button 
                            onClick={handleSubmit}
                            disabled={!isFormValid || submitting}
                            className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                !isFormValid || submitting ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600' : 'bg-emerald-500 text-slate-900 border border-emerald-400 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30'
                            }`}
                        >
                            {submitting ? 'Menyimpan...' : (
                                <>
                                    <Send className="w-4 h-4" />
                                    {isOverBudget ? 'Overbudget' : 'Kirim Revisi'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
