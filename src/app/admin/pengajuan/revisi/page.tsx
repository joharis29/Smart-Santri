'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FileEdit, Save, Plus, Trash2, ArrowRight } from 'lucide-react'
import { getApprovedRkaList, submitRevisiRka } from './actions'

export default function RkaRevisiPage() {
  const router = useRouter()
  const [rkaList, setRkaList] = useState<any[]>([])
  const [selectedRkaId, setSelectedRkaId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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
      // Map original items to editable rows
      const mappedRows = selectedRka.item_pengajuan.map((item: any, idx: number) => {
        let details = { fundingSplits: [{ source: item.sumber_dana, nominal: item.nominal }] }
        try {
          if (typeof item.rincian_json === 'string') {
            details = JSON.parse(item.rincian_json)
          } else if (item.rincian_json) {
            details = item.rincian_json
          }
        } catch(e) {}

        return {
          id: Date.now().toString() + idx,
          program: item.judul_kegiatan,
          operasional: item.kategori_coa,
          jumlah: item.jumlah_kegiatan || '1',
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
    }
  }, [selectedRka])

  const totalOriginal = selectedRka ? Number(selectedRka.total_nominal) : 0
  const totalRevision = rows.reduce((acc, row) => acc + (Number(row.nominal) || 0), 0)
  const isOverBudget = totalRevision > totalOriginal

  const addRow = () => {
    setRows([...rows, {
      id: Date.now().toString(),
      program: '', operasional: '', jumlah: '1', waktu: '', tempat: '', pic: '', sasaran: '', nominal: 0,
      details: { fundingSplits: [] }
    }])
  }

  const updateRow = (id: string, field: string, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const removeRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id))
  }

  const handleSubmit = async () => {
    if (!selectedRka) return
    if (isOverBudget) {
      setErrorMsg('Total Revisi melebihi Total Asli. Tidak dapat diajukan.')
      return
    }
    
    // Basic validation
    if (rows.some(r => !r.program || !r.operasional || r.nominal <= 0)) {
      setErrorMsg('Harap lengkapi semua baris dengan nominal lebih dari 0.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    const payload = {
      parent_id: selectedRka.id,
      unit: selectedRka.unit,
      bidang: selectedRka.bidang,
      bulan: selectedRka.periode_bulan?.toString() || '1',
      tahun_ajaran: selectedRka.periode_tahun?.toString() || '2025/2026',
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

  if (loading) return <div className="p-8 animate-pulse text-gray-500">Memuat data RKA...</div>

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
          <FileEdit size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Buat Revisi RKA</h1>
          <p className="text-gray-500">Ajukan perubahan (realokasi) pagu dari RKA yang sudah cair.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: PILIH RKA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <label className="block text-sm font-semibold text-gray-700">1. Pilih Dokumen RKA Induk</label>
        <select 
          value={selectedRkaId}
          onChange={(e) => setSelectedRkaId(e.target.value)}
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Pilih RKA yang akan direvisi --</option>
          {rkaList.map(rka => (
            <option key={rka.id} value={rka.id}>
              [{rka.unit}] {rka.bidang} - Rp {Number(rka.total_nominal).toLocaleString('id-ID')}
            </option>
          ))}
        </select>
      </div>

      {/* STEP 2: FORM REVISI */}
      {selectedRka && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">2. Rincian Revisi</h2>
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="text-gray-500">
                Asli: Rp {totalOriginal.toLocaleString('id-ID')}
              </div>
              <ArrowRight size={16} className="text-gray-400" />
              <div className={isOverBudget ? 'text-red-600 font-bold' : 'text-blue-600 font-bold'}>
                Revisi: Rp {totalRevision.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {rows.map((row, index) => (
              <div key={row.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 text-center font-bold text-gray-400 pt-3">{index + 1}</div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Baris 1 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Program/Kegiatan</label>
                      <input 
                        type="text" 
                        value={row.program} 
                        onChange={e => updateRow(row.id, 'program', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        placeholder="Nama kegiatan"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Kategori (COA)</label>
                      <select 
                        value={row.operasional} 
                        onChange={e => updateRow(row.id, 'operasional', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                      >
                        <option value="">Pilih Kategori</option>
                        <option value="KONSUMSI">Konsumsi</option>
                        <option value="HONOR">Honor/Insentif</option>
                        <option value="BARANG_JASA">Barang & Jasa</option>
                        <option value="TRANSPORT">Transport</option>
                        <option value="LAINNYA">Lainnya</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Jumlah Kegiatan</label>
                      <input 
                        type="text" 
                        value={row.jumlah} 
                        onChange={e => updateRow(row.id, 'jumlah', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        placeholder="Contoh: 1x, 2 Semester"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Waktu Pelaksanaan</label>
                      <input 
                        type="text" 
                        value={row.waktu} 
                        onChange={e => updateRow(row.id, 'waktu', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        placeholder="Contoh: Juni 2026"
                      />
                    </div>
                  </div>

                  {/* Baris 2 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Tempat</label>
                      <input 
                        type="text" 
                        value={row.tempat} 
                        onChange={e => updateRow(row.id, 'tempat', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        placeholder="Lokasi kegiatan"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Sasaran</label>
                      <input 
                        type="text" 
                        value={row.sasaran} 
                        onChange={e => updateRow(row.id, 'sasaran', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        placeholder="Target partisipan"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">PIC</label>
                      <input 
                        type="text" 
                        value={row.pic} 
                        onChange={e => updateRow(row.id, 'pic', e.target.value)}
                        className="w-full p-2 border rounded-md text-sm"
                        placeholder="Penanggung Jawab"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Nominal (Rp)</label>
                      <input 
                        type="number" 
                        value={row.nominal || ''} 
                        onChange={e => updateRow(row.id, 'nominal', e.target.value)}
                        className={`w-full p-2 border rounded-md text-sm font-semibold ${isOverBudget ? 'bg-red-50 text-red-700 border-red-300' : ''}`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeRow(row.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md mt-6"
                  title="Hapus Baris"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button 
              onClick={addRow}
              className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded-lg transition"
            >
              <Plus size={16} /> Tambah Baris Revisi
            </button>
          </div>

          <div className="p-4 bg-gray-50 border-t flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || isOverBudget}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition ${
                isOverBudget ? 'bg-red-400 cursor-not-allowed' : submitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save size={18} />
              {submitting ? 'Memproses...' : 'Ajukan Revisi'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
