'use client'

import React, { useState, useEffect, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { FileEdit, Save, Plus, Trash2, ArrowRight, PlusCircle, Info, DollarSign, Calendar, Layers, GraduationCap, Building2, ChevronDown } from 'lucide-react'
import { getApprovedRkaList, submitRevisiRka } from './actions'
import { createClient } from '@/utils/supabase/client'

const FUND_SOURCES = [
  'Dana Pesantren/Yayasan',
  'Dana BOS',
  'SPP Siswa',
  'Tabungan Siswa',
  'Kas Internal',
  'Uang Saku',
  'Infaq Siswa',
  'Subsidi Pesantren'
];

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

export default function RkaRevisiPage() {
  const router = useRouter()
  const [rkaList, setRkaList] = useState<any[]>([])
  const [selectedRkaId, setSelectedRkaId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Metadata States
  const [unit, setUnit] = useState('')
  const [bidang, setBidang] = useState('')
  const [bulan, setBulan] = useState('')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([])

  // State for the editable revision rows
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    getApprovedRkaList().then(data => {
      setRkaList(data)
      setLoading(false)
    })
  }, [])

  const selectedRka = useMemo(() => rkaList.find(r => r.id === selectedRkaId), [rkaList, selectedRkaId])

  useEffect(() => {
    if (selectedRka && selectedRka.item_pengajuan) {
      setUnit(selectedRka.unit || '')
      setBidang(selectedRka.bidang || '')
      const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      setBulan(monthNames[selectedRka.periode_bulan] || 'Januari')
      setTahunAjaran(selectedRka.periode_tahun ? `${selectedRka.periode_tahun}/${Number(selectedRka.periode_tahun)+1}` : '2025/2026')

      // Map original items to editable rows
      const mappedRows = selectedRka.item_pengajuan.map((item: any, idx: number) => {
        let details = { items: [], fundingSplits: [{ source: item.sumber_dana, percent: 100, nominal: item.nominal }] }
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
            if (item.program && item.nama_kegiatan) {
              programSet.add(`${item.program} / ${item.nama_kegiatan}`);
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
        const item = { ...newItems[itemIdx], [field]: value }
        if (field === 'price' || field === 'qty') {
           item.price = field === 'price' ? Number(value) : Number(item.price || 0)
           item.qty = field === 'qty' ? Number(value) : Number(item.qty || 0)
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
            split.percent = Number(value)
            split.nominal = (Number(value) / 100) * row.nominal
        } else if (field === 'nominal') {
            split.nominal = Number(value)
            split.percent = row.nominal > 0 ? (Number(value) / row.nominal) * 100 : 0
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

  const handleSubmit = async () => {
    if (!selectedRka) return
    if (isOverBudget) {
      setErrorMsg('Total Revisi melebihi Total Asli. Tidak dapat diajukan.')
      return
    }
    
    // Validation
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

    setSubmitting(true)
    setErrorMsg('')

    const payload = {
      parent_id: selectedRka.id,
      unit: unit,
      bidang: bidang,
      bulan: bulan,
      tahun_ajaran: tahunAjaran,
      total_nominal: totalRevision,
      data: rows
    }

    const res = await submitRevisiRka(payload)
    setSubmitting(false)

    if (res.error) {
      setErrorMsg(res.error)
    } else {
      router.push('/admin/pengajuan/riwayat')
    }
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
          <FileEdit size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Buat Revisi RKA</h1>
          <p className="text-gray-500">Ajukan perubahan (realokasi) pagu dan item rincian dari RKA yang sudah cair.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {errorMsg}
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

      {/* STEP 3: FORM REVISI (UI PARITY DENGAN LPJ) */}
      {selectedRka && (
        <div className="flex flex-col gap-6 w-full">
            {/* TABEL REVISI RKA (TOP) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">3. Tabel Rencana Kegiatan & Anggaran (Revisi)</h2>
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
                                        <input 
                                            type="text" 
                                            list={`programs-${row.id}`}
                                            value={row.program}
                                            onChange={(e) => updateRow(row.id, 'program', e.target.value)}
                                            className={`w-full h-10 px-3 pr-8 bg-white border-none outline-none text-[11px] font-black focus:ring-2 focus:ring-emerald-500 transition-all ${row.program === '' ? 'text-slate-400 italic' : 'text-emerald-900'}`}
                                            placeholder="Pilih/Ketik program..."
                                        />
                                        <datalist id={`programs-${row.id}`}>
                                            {availablePrograms.map(prog => (
                                                <option key={prog} value={prog} />
                                            ))}
                                        </datalist>
                                        <ChevronDown className="absolute right-2 top-3 w-3 h-3 text-slate-300 pointer-events-none group-hover:text-emerald-500" />
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
                                                                    type="number"
                                                                    value={rin.price || ''}
                                                                    onChange={(e) => updateRincianItem(row.id, rIdx, 'price', e.target.value)}
                                                                    className="w-full h-8 pl-6 pr-2 bg-transparent border-none outline-none text-xs font-black text-right text-slate-800 focus:bg-emerald-50/10"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="p-0">
                                                            <input 
                                                                type="number"
                                                                value={rin.qty || ''}
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
                                                                    {FUND_SOURCES.map(fs => <option key={fs} value={fs}>{fs}</option>)}
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
                                                                        type="number"
                                                                        value={split.nominal || ''}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
                {/* Summary Box */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
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
                </div>

                {/* Submit Box */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                        <Save size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Simpan & Ajukan Revisi</h3>
                        <p className="text-xs text-slate-500 mt-1">Revisi RKA akan diproses dan menggantikan data lama setelah disetujui.</p>
                    </div>
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting || isOverBudget}
                        className={`w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                            isOverBudget ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'
                        }`}
                    >
                        {submitting ? 'Menyimpan...' : (isOverBudget ? 'Melebihi Budget Asli' : 'Kirim Revisi RKA')}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
