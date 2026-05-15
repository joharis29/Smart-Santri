'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  Check
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveDraftItem } from './actions'

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
}

interface DapurRow {
  id: string
  tanggal: string
  item: string
  spesifikasi: string
  metode: 'Tunai' | 'Transfer'
  nominal: number
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

const OPERASIONAL_CATEGORIES = [
  'Konsumsi',
  'ATK & Fotocopy',
  'Honor / Insentif',
  'Transportasi',
  'Sewa Sarana',
  'Perlengkapan',
  'Pemeliharaan',
  'Lain-lain'
]

const RKA_PROGRAMS = [
  'Optimalisasi Manajemen Pengarsipan/Mengelola surat statis & dinamis',
  'Optimalisasi Manajemen Pengarsipan/Mutasi santri',
  'Optimalisasi Manajemen Pengarsipan/Arsip proposal/laporan',
  'Optimalisasi Manajemen Pengarsipan/Backup dokumen Naqieb',
  'Optimalisasi ATK & Sarpras/Pengadaan ATK',
  'Optimalisasi ATK & Sarpras/Sarpras kantor',
  'Optimalisasi ATK & Sarpras/Pemeliharaan sarpras',
  'Optimalisasi ATK & Sarpras/Inventarisasi aset',
  'Optimalisasi ATK & Sarpras/Seragam pengurus',
  'Manajemen Buku Admin/Pengadaan, pengisian rutin, dan evaluasi kelengkapan buku administrasi',
  'Database Santri/Update data semesteran & digitalisasi database santri',
  'Layanan & Komunikasi/WAG Ortu',
  'Layanan & Komunikasi/Booklet profil',
  'Layanan & Komunikasi/Buku santri',
  'Layanan & Komunikasi/Penyambutan santri baru',
  'Layanan & Komunikasi/Optimasi IG asrama',
  'Koordinasi Rapat/Rapat pekanan',
  'Koordinasi Rapat/Rapat terbatas',
  'Koordinasi Rapat/Rapat Naqieb',
  'Koordinasi Rapat/Rapat Kerja (Raker)',
  'Sistem Keuangan/Penyusunan RAB',
  'Sistem Keuangan/Pencairan dana',
  'Sistem Keuangan/Pencatatan BKU',
  'Sistem Keuangan/Pelaporan realisasi',
  'Manajemen Aset/Penitipan uang santri',
  'Manajemen Aset/Pengadaan sarpras kebutuhan santri',
  'Kegiatan Pendidikan/KISS (Kajian Senin Subuh)',
  'Kegiatan Pendidikan/Halaqah Masa',
  'Kegiatan Pendidikan/Bimbel sore',
  'Kegiatan Pendidikan/Rapot Asrama Bulanan',
  'Penegakan Disiplin/Operasi rambut/kerapihan',
  'Penegakan Disiplin/Sidak kamar',
  'Penegakan Disiplin/Pembinaan santri',
  'Penegakan Disiplin/Reward & punishment',
  'Minat Bakat/Muhadharah (Pidato)',
  'Minat Bakat/Olahraga pekanan',
  'Minat Bakat/Seni Bela Diri',
  'Program Tahfidz/Setoran hafalan harian',
  'Program Tahfidz/Tasmi\'',
  'Program Tahfidz/Munaqasyah',
  'Program Tahfidz/Wisuda Tahfidz',
  'Pembiasaan Ibadah/Shalat berjamaah 5 waktu',
  'Pembiasaan Ibadah/Tahajjud bersama',
  'Pembiasaan Ibadah/Puasa Sunnah',
  'Lingkungan & Kesehatan/Roan (Kerja bakti)',
  'Lingkungan & Kesehatan/Pengelolaan sampah',
  'Lingkungan & Kesehatan/Layanan Poskestren',
  'Lingkungan & Kesehatan/Sosialisasi PHBS',
  'Pemeliharaan/Perbaikan sarana rusak',
  'Pemeliharaan/Pembersihan fasilitas (Masjid, Kamar Mandi, Halaman)'
]

export default function BuatPengajuanPage() {
  // --- States ---
  const [unit, setUnit] = useState('SDIT 1')
  const [bidang, setBidang] = useState('')
  const [bulan, setBulan] = useState('')
  const [tahunAjaran, setTahunAjaran] = useState('')
  
  const isDapurMode = useMemo(() => unit.toLowerCase().includes('dapur'), [unit])

  // RKA Mode States
  const [rows, setRows] = useState<RkaRow[]>([
    { id: '1', program: '', operasional: '', jumlah: '', waktu: '', tempat: '', pic: '', sasaran: '', nominal: 0, details: JSON.parse(JSON.stringify(DEFAULT_DETAILS)), isFilled: false }
  ])

  // Dapur Mode States
  const [dapurRows, setDapurRows] = useState<DapurRow[]>([
    { id: '1', tanggal: new Date().toISOString().split('T')[0], item: '', spesifikasi: '', metode: 'Tunai', nominal: 0 }
  ])
  const [attachments, setAttachments] = useState<File[]>([])
  
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  
  // Temp states for Modal
  const [modalItems, setModalItems] = useState<RkaDetailItem[]>([])
  const [modalTemplate, setModalTemplate] = useState('')
  const [modalSplits, setModalSplits] = useState<FundingSplit[]>([])

  // Derived Modal Total (Sum of items)
  const modalTotal = useMemo(() => {
    return modalItems.reduce((acc, item) => acc + item.total, 0)
  }, [modalItems])

  // --- Logic: Calculations ---
  const summary = useMemo(() => {
    if (isDapurMode) return {}
    const acc: Record<string, number> = {}
    rows.forEach(row => {
      row.details.fundingSplits.forEach(split => {
        if (split.source && split.nominal > 0) {
          acc[split.source] = (acc[split.source] || 0) + split.nominal
        }
      })
    })
    return acc
  }, [rows, isDapurMode])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
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
    if (isDapurMode) {
      return dapurRows.reduce((acc, row) => acc + row.nominal, 0)
    }
    return Object.values(summary).reduce((a, b) => a + b, 0)
  }, [summary, dapurRows, isDapurMode])

  // --- Logic: Row Management (Dapur) ---
  const updateDapurRow = (id: string, field: keyof DapurRow, value: any) => {
    setDapurRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const addDapurRow = () => {
    const newId = (dapurRows.length + 1).toString()
    setDapurRows([...dapurRows, { id: newId, tanggal: new Date().toISOString().split('T')[0], item: '', spesifikasi: '', metode: 'Tunai', nominal: 0 }])
  }

  const deleteDapurRow = (id: string) => {
    if (dapurRows.length === 1) return
    setDapurRows(dapurRows.filter(r => r.id !== id))
  }

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
      const item = { ...newItems[index], [field]: value }
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
        split.nominal = Math.round((Number(value) / 100) * modalTotal)
      } else if (field === 'nominal') {
        split.percent = modalTotal > 0 ? Number(((Number(value) / modalTotal) * 100).toFixed(1)) : 0
      }
      
      newSplits[index] = split
      return newSplits
    })
  }

  const addSplit = () => {
    setModalSplits([...modalSplits, { source: '', percent: 0, nominal: 0 }])
  }

  const saveModalData = () => {
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

  const handleSaveDraft = () => {
    // Simulasi Simpan Draft Pribadi
    const payload = isDapurMode ? dapurRows : rows
    console.log('Saving personal draft:', payload)
    
    alert('Draf Berhasil Disimpan ke Folder "Draft Saya"!')
    router.push('/admin/pengajuan/draft-saya')
  }

  const handleKirim = () => {
    // Simulasi Pengiriman Data
    const payload = isDapurMode ? dapurRows : rows
    console.log('Sending payload:', payload)
    
    // Toast atau alert sukses
    alert(`${isDapurMode ? 'Laporan Reimbursement' : 'Pengajuan RKA'} Berhasil Dikirim ke Rekap Draft!`)
    
    // Redirect ke halaman Rekap Draft
    router.push('/admin/pengajuan/rekap')
  }

  const isViolation = (row: RkaRow) => {
    const isConsumption = row.program.toLowerCase().includes('konsumsi') || row.program.toLowerCase().includes('makan')
    const hasWakaf = row.details.fundingSplits.some(s => s.source.toLowerCase().includes('wakaf'))
    return isConsumption && hasWakaf
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
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Buat Pengajuan Dana Baru</h1>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Pilih Unit
                </label>
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="SDIT 1">SDIT 1</option>
                  <option value="SDIT 2">SDIT 2</option>
                  <option value="MA">MA</option>
                  <option value="Dapur Asrama Putra">Dapur Asrama Putra</option>
                  <option value="Dapur Asrama Putri">Dapur Asrama Putri</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3 text-emerald-600" /> Bidang
                </label>
                <select 
                  value={bidang} 
                  onChange={(e) => setBidang(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Pilih Bidang...</option>
                  <option value="Kurikulum">Kurikulum</option>
                  <option value="Kesiswaan">Kesiswaan</option>
                  <option value="Sarpras">Sarpras</option>
                  <option value="Humas">Humas</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-emerald-600" /> Bulan
                </label>
                <select 
                  value={bulan} 
                  onChange={(e) => setBulan(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400"
                  disabled={isDapurMode}
                >
                  <option value="">Pilih Bulan...</option>
                  <option value="Januari" disabled>Januari (Lampau)</option>
                  <option value="Februari" disabled>Februari (Lampau)</option>
                  <option value="Maret" disabled>Maret (Lampau)</option>
                  <option value="April" disabled>April (Lampau)</option>
                  <option value="Mei">Mei (Sekarang)</option>
                  <option value="Juni">Juni</option>
                  <option value="Juli">Juli</option>
                  <option value="Agustus">Agustus</option>
                  <option value="September">September</option>
                  <option value="Oktober">Oktober</option>
                  <option value="November">November</option>
                  <option value="Desember">Desember</option>
                  <option value="Tahunan">Tahunan (Full Year)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-emerald-600" /> Tahun Ajaran
                </label>
                <select 
                  value={tahunAjaran} 
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400"
                  disabled={isDapurMode}
                >
                  <option value="">Pilih Tahun...</option>
                  <option value="2024/2025" disabled>2024/2025 (Lampau)</option>
                  <option value="2025/2026">2025/2026 (Aktif)</option>
                  <option value="2026/2027">2026/2027</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <button className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-900 font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-amber-100">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Import Excel (Auto-Fill)
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-800 tracking-tight">
            {isDapurMode ? 'Laporan Belanja Harian (Reimbursement Dapur)' : 'Tabel Rencana Kegiatan & Anggaran (RKA)'}
          </h2>
          <button 
            onClick={handleSaveDraft}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold px-3 py-1 rounded-xl text-[10px] transition-all"
          >
            <Save className="w-3 h-3" /> Save to Draft
          </button>
        </div>

        <div className="overflow-x-auto">
          {isDapurMode ? (
            /* --- Mode Dapur: Laporan Belanja --- */
            <table className="w-full border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr className="divide-x divide-slate-200">
                  <th className="px-2 py-2 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest text-center w-10">No.</th>
                  <th className="px-2 py-2 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest w-36 text-center">Tgl Belanja</th>
                  <th className="px-2 py-2 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest min-w-[200px]">Item / Bahan Makanan</th>
                  <th className="px-2 py-2 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest min-w-[150px]">Spesifikasi / Detail</th>
                  <th className="px-2 py-2 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest w-28 text-center">Metode</th>
                  <th className="px-2 py-2 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest w-40 text-right">Nominal Riil</th>
                  <th className="px-2 py-2 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dapurRows.map((row, index) => (
                  <tr key={row.id} className="divide-x divide-slate-100 hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-center text-xs font-bold text-slate-400">{index + 1}</td>
                    <td className="p-0">
                      <input 
                        type="date" 
                        value={row.tanggal}
                        onChange={(e) => updateDapurRow(row.id, 'tanggal', e.target.value)}
                        className="w-full h-9 px-2 bg-transparent border-none outline-none text-[11px] font-medium text-center focus:bg-white"
                      />
                    </td>
                    <td className="p-0">
                      <input 
                        type="text" 
                        value={row.item}
                        onChange={(e) => updateDapurRow(row.id, 'item', e.target.value)}
                        className="w-full h-9 px-3 bg-transparent border-none outline-none text-[11px] font-bold text-slate-700 focus:bg-white"
                        placeholder="Contoh: Beras, Sayuran, Daging..."
                      />
                    </td>
                    <td className="p-0">
                      <input 
                        type="text" 
                        value={row.spesifikasi}
                        onChange={(e) => updateDapurRow(row.id, 'spesifikasi', e.target.value)}
                        className="w-full h-9 px-3 bg-transparent border-none outline-none text-[11px] font-medium text-slate-500 focus:bg-white"
                        placeholder="Detail jumlah/merk..."
                      />
                    </td>
                    <td className="p-0">
                      <select 
                        value={row.metode}
                        onChange={(e) => updateDapurRow(row.id, 'metode', e.target.value)}
                        className="w-full h-9 px-2 bg-transparent border-none outline-none text-[11px] font-bold text-center text-slate-600 focus:bg-white appearance-none"
                      >
                        <option value="Tunai">Tunai</option>
                        <option value="Transfer">Transfer</option>
                      </select>
                    </td>
                    <td className="p-0 bg-emerald-50/20">
                      <div className="relative">
                        <span className="absolute left-2 top-2.5 text-[9px] font-bold text-emerald-400">Rp</span>
                        <input 
                          type="number" 
                          value={row.nominal || ''}
                          onChange={(e) => updateDapurRow(row.id, 'nominal', parseInt(e.target.value) || 0)}
                          className="w-full h-9 pl-7 pr-3 bg-transparent border-none outline-none text-[11px] font-black text-right text-emerald-900 focus:bg-white"
                          placeholder="0"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button 
                        onClick={() => deleteDapurRow(row.id)}
                        className="p-1.5 bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* --- Mode Reguler: Tabel RKA --- */
            <table className="w-full border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr className="divide-x divide-slate-200">
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center w-10">No.</th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[200px]">Nama Program/ Kegiatan <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[150px]">Operasional <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[90px] text-center">Jml Kegiatan <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[90px]">Waktu <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[110px]">Tempat <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[120px]">Penanggung Jawab <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[110px]">Sasaran <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest min-w-[140px] text-right">Rencana Anggaran <span className="text-rose-600">*</span></th>
                  <th className="px-2 py-2 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center min-w-[80px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => {
                  const violation = isViolation(row)
                  const sourcesDisplay = row.details.fundingSplits.filter(s => s.source).map(s => s.source).join(', ')
                  return (
                    <tr key={row.id} className={`divide-x divide-slate-100 transition-colors ${violation ? 'bg-rose-50' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-3 py-2 text-center text-xs font-bold text-slate-400">
                        {row.isFilled ? index + 1 : <span className="opacity-20 italic">auto</span>}
                      </td>
                      <td className="p-0 relative group border-r border-slate-100">
                        <select 
                          value={row.program}
                          onChange={(e) => updateRow(row.id, 'program', e.target.value)}
                          className={`w-full h-10 px-3 bg-white border border-slate-200 outline-none text-[11px] font-black focus:ring-2 focus:ring-emerald-500 transition-all appearance-none ${row.program === '' ? 'text-slate-600 italic' : 'text-black'}`}
                        >
                          <option value="">Pilih Program...</option>
                          {RKA_PROGRAMS.map(prog => (
                            <option key={prog} value={prog}>{prog}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-3 w-3 h-3 text-slate-300 pointer-events-none group-hover:text-emerald-500" />
                      </td>
                      <td className="p-0 relative group border-r border-slate-100">
                        <select 
                          value={row.operasional}
                          onChange={(e) => updateRow(row.id, 'operasional', e.target.value)}
                          className={`w-full h-10 px-3 bg-white border border-slate-200 outline-none text-[11px] font-black focus:ring-2 focus:ring-emerald-500 transition-all appearance-none ${row.operasional === '' ? 'text-slate-600 italic' : 'text-emerald-900'}`}
                        >
                          <option value="">Pilih Operasional...</option>
                          {OPERASIONAL_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-3 w-3 h-3 text-slate-300 pointer-events-none group-hover:text-emerald-500" />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <input 
                          type="text" 
                          value={row.jumlah}
                          onChange={(e) => updateRow(row.id, 'jumlah', e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-slate-200 outline-none text-[11px] font-black text-center text-black focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <input 
                          type="text" 
                          value={row.waktu}
                          onChange={(e) => updateRow(row.id, 'waktu', e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-slate-200 outline-none text-[11px] font-black text-black focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder="-"
                        />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <input 
                          type="text" 
                          value={row.tempat}
                          onChange={(e) => updateRow(row.id, 'tempat', e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-slate-200 outline-none text-[11px] font-black text-black focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder="-"
                        />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <input 
                          type="text" 
                          value={row.pic}
                          onChange={(e) => updateRow(row.id, 'pic', e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-slate-200 outline-none text-[11px] font-black text-black focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder="-"
                        />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <input 
                          type="text" 
                          value={row.sasaran}
                          onChange={(e) => updateRow(row.id, 'sasaran', e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-slate-200 outline-none text-[11px] font-black text-black focus:ring-2 focus:ring-emerald-500 transition-all"
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
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {violation && (
                            <div title="Pelanggaran Kepatuhan Syariah!" className="animate-bounce">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Grid Info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button 
            onClick={isDapurMode ? addDapurRow : addRow}
            className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4" /> Tambah Baris Baru
          </button>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Wajib Isi Seluruh Kolom Bertanda Bintang (*)
          </div>
        </div>
      </div>

      {/* --- Section Baru: Lampiran Nota untuk Dapur --- */}
      {isDapurMode && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
                        <Paperclip className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Lampiran Bukti Nota / Struk Belanja</h3>
                        <p className="text-[10px] text-slate-500 font-medium italic">Satu pengajuan bisa berisi banyak nota harian (Mendukung hingga 30+ file).</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        {attachments.length} File Terunggah
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dropzone Area */}
                <div className="relative group">
                    <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className="border-2 border-dashed border-slate-200 group-hover:border-amber-400 group-hover:bg-amber-50/30 rounded-[2rem] p-8 flex flex-col items-center justify-center transition-all duration-300">
                        <div className="flex gap-4 mb-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-white transition-all shadow-sm">
                                <Upload className="w-8 h-8 text-slate-300 group-hover:text-amber-500" />
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault()
                                    setIsCameraOpen(true)
                                }}
                                className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center hover:scale-110 hover:bg-emerald-100 transition-all shadow-sm text-emerald-600 z-20"
                            >
                                <CameraIcon className="w-8 h-8" />
                            </button>
                        </div>
                        <p className="text-xs font-bold text-slate-600">Klik / seret file atau ambil foto</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">Mendukung Gambar & PDF (Max 5MB/file)</p>
                    </div>
                </div>

                {/* File Preview List */}
                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-4 max-h-48 overflow-y-auto">
                    {attachments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                            <ImageIcon className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-[10px] font-bold">Belum ada lampiran...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 animate-in zoom-in-90">
                                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                                        <FileIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-slate-700 truncate">{file.name}</p>
                                        <p className="text-[8px] text-slate-400 font-medium uppercase tracking-tighter">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button 
                                        onClick={() => removeAttachment(idx)}
                                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b pb-1.5">
            {isDapurMode ? 'Ringkasan Reimbursement' : 'Akumulasi Berdasarkan Operasional'}
          </h3>
          <div className="space-y-2">
            {!isDapurMode && Object.keys(summary).length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Belum ada data anggaran...</p>
            ) : !isDapurMode ? (
              Object.entries(summary).map(([source, amount]) => (
                <div key={source} className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600">{source}</span>
                  <span className="text-xs font-extrabold text-emerald-700">Rp {amount.toLocaleString('id-ID')}</span>
                </div>
              ))
            ) : (
                <div className="space-y-2">
                    <div className="flex justify-between items-center bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                        <span className="text-[11px] font-bold text-amber-800 italic">Jenis Pengajuan</span>
                        <span className="text-xs font-extrabold text-amber-900 uppercase tracking-widest">Reimbursement</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="text-[11px] font-bold text-slate-600">Total Item Belanja</span>
                        <span className="text-xs font-extrabold text-slate-800">{dapurRows.length} Item</span>
                    </div>
                </div>
            )}
          </div>
          <div className="pt-1.5 border-t mt-2 flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-800">{isDapurMode ? 'Total Laporan Belanja' : 'Total Pengajuan'}</span>
            <span className="text-lg font-extrabold text-emerald-900 tracking-tight">Rp {totalPengajuan.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleKirim}
            className={`w-full font-extrabold py-3 px-6 rounded-2xl shadow-lg transition-all hover:-translate-y-1 active:scale-[0.98] flex flex-col items-center group ${isDapurMode ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-amber-400 text-amber-900 shadow-amber-100 hover:bg-amber-500'}`}
          >
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              <span className="text-sm">{isDapurMode ? 'Kirim Laporan Reimbursement' : 'Kirim Pengajuan RKA'}</span>
            </div>
            <span className={`text-[9px] font-medium tracking-widest uppercase ${isDapurMode ? 'text-emerald-100/60' : 'text-amber-800/60'}`}>
                {isDapurMode ? 'Kirim ke Bendahara Pusat' : 'Kirim ke Tahap Persetujuan Unit'}
            </span>
          </button>
          {isDapurMode && (
            <div className="bg-amber-50 border-amber-100 border p-3 rounded-2xl flex gap-3">
              <div className="bg-amber-600 text-white p-1.5 rounded-lg h-fit">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-[11px] leading-relaxed font-medium text-amber-800">
                Laporan ini berbasis reimbursement (belanja riil). Pastikan seluruh lampiran nota sudah terunggah dengan jelas untuk verifikasi Bendahara Pusat.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- Camera Modal --- */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setIsCameraOpen(false)}></div>
            <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                            <CameraIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-slate-800 text-sm tracking-tight">Ambil Foto Nota</h3>
                    </div>
                    <button onClick={() => setIsCameraOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="relative bg-black aspect-[3/4] flex items-center justify-center">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-8 flex justify-center items-center gap-6 bg-gradient-to-t from-black/60 to-transparent">
                        <button 
                            onClick={capturePhoto}
                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all group"
                        >
                            <div className="w-12 h-12 border-4 border-slate-900 rounded-full group-hover:bg-slate-100 transition-colors"></div>
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                        <RotateCcw className="w-3 h-3" /> Posisikan nota tepat di tengah kamera
                    </p>
                </div>
            </div>
        </div>
      )}

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
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                    <Layout className="w-3 h-3 text-emerald-600" /> Template
                  </label>
                  <select 
                    value={modalTemplate}
                    onChange={(e) => setModalTemplate(e.target.value)}
                    className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Pilih Template...</option>
                    <option value="konsumsi">Standar Konsumsi Rapat</option>
                    <option value="atk">Daftar ATK Kantor</option>
                  </select>
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
                                type="number" 
                                value={item.price || ''}
                                onChange={(e) => updateDetailItem(idx, 'price', e.target.value)}
                                className="w-full h-8 pl-6 pr-2 bg-transparent border-none outline-none text-xs font-bold text-right focus:bg-emerald-50/30 text-slate-800 placeholder:text-slate-300"
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="p-0">
                            <input 
                              type="number" 
                              value={item.qty || ''}
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
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">Alokasi Sumber Dana (Smart Split)</label>
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
                            <option value="Dana BOS">Dana BOS</option>
                            <option value="Dana Yayasan">Dana Yayasan</option>
                            <option value="Dana Wakaf">Dana Wakaf</option>
                          </select>
                        </div>
                        <div className="w-24 relative">
                          <input 
                            type="number" 
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
                            type="number" 
                            value={split.nominal || ''}
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
  )
}
