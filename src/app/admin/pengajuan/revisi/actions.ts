'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getApprovedRkaList() {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, unit_id, jenjang_id')
    .eq('id', user.user.id)
    .single()

  const adminClient = createAdminClient()

  let query = adminClient
    .from('dokumen_pengajuan')
    .select(`
      id,
      unit,
      bidang,
      periode_bulan,
      periode_tahun,
      total_nominal,
      created_at,
      item_pengajuan (
        id,
        judul_kegiatan,
        kategori_coa,
        nominal,
        rincian_json,
        waktu,
        tempat,
        pic,
        sasaran
      )
    `)
    .eq('jenis', 'RKA')
    .in('status', ['CAIR', 'SUDAH_DITERIMA'])
    .is('parent_id', null) // Hanya RKA asli yang bisa direvisi
    .order('created_at', { ascending: false })

  const role = profile?.role || '';
  if (['STAF', 'STAF_UNIT', 'STAFF_BIDANG', 'BENDAHARA_UNIT', 'KEPALA_UNIT'].includes(role)) {
    if (profile?.unit_id) {
      query = query.eq('unit_id', profile.unit_id);
    } else if (profile?.jenjang_id) {
      query = query.eq('jenjang_id', profile.jenjang_id);
    }
  } else if (['BENDAHARA_JENJANG', 'KEPALA_JENJANG'].includes(role)) {
    if (profile?.jenjang_id) {
      query = query.eq('jenjang_id', profile.jenjang_id);
    }
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching approved RKA:', error)
    return []
  }
  return data || []
}

export async function submitRevisiRka(payload: {
  parent_id: string,
  unit: string,
  bidang: string,
  bulan: string,
  tahun_ajaran: string,
  total_nominal: number,
  data: any[]
}) {
  try {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return { error: 'Unauthorized' }

    // Dapatkan data RKA Asli untuk mereplika metadata (unit_id, dll)
    const { data: parentRka } = await supabase
      .from('dokumen_pengajuan')
      .select('unit_id, jenjang_id, total_nominal')
      .eq('id', payload.parent_id)
      .single()

    if (!parentRka) return { error: 'RKA Induk tidak ditemukan' }
    if (payload.total_nominal > parentRka.total_nominal) {
      return { error: 'Total nominal revisi tidak boleh melebihi total RKA asli' }
    }

    const monthMap: Record<string, number> = {
      'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
      'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
    }
    const bulanInt = monthMap[payload.bulan] || new Date().getMonth() + 1
    const tahunInt = parseInt(payload.tahun_ajaran.match(/\d+/)?.[0] || new Date().getFullYear().toString())

    // Buat Dokumen Revisi (tetap sebagai RKA)
    const { data: doc, error: docError } = await supabase
      .from('dokumen_pengajuan')
      .insert({
        pembuat_id: user.user.id,
        periode_bulan: bulanInt,
        periode_tahun: tahunInt,
        status: 'MENUNGGU_VERIFIKASI', // Langsung masuk antrean approval
        unit: payload.unit,
        unit_id: parentRka.unit_id,
        jenjang_id: parentRka.jenjang_id,
        bidang: payload.bidang,
        jenis: 'RKA',
        total_nominal: payload.total_nominal,
        parent_id: payload.parent_id
      })
      .select('id')
      .single()

    if (docError) return { error: 'Gagal membuat dokumen revisi: ' + docError.message }

    // Insert Item Revisi
    const itemsToInsert = payload.data.map(row => {
      const firstSource = row.details?.fundingSplits?.find((s: any) => s.source && s.nominal > 0)?.source || 'Dana BOS'
      const finalDetails = {
        ...(row.details || {}),
        jumlah_kegiatan: row.jumlah || '1'
      }
      return {
        dokumen_id: doc.id,
        judul_kegiatan: '[REVISI] ' + row.program,
        kategori_coa: row.operasional,
        nominal: Number(row.nominal) || 0,
        sumber_dana: firstSource,
        pic: row.pic || '',
        waktu: row.waktu || '',
        tempat: row.tempat || '',
        sasaran: row.sasaran || '',
        rincian_json: finalDetails
      }
    })

    const { error: itemError } = await supabase.from('item_pengajuan').insert(itemsToInsert)
    if (itemError) return { error: 'Gagal menyimpan item revisi: ' + itemError.message }

    revalidatePath('/admin/pengajuan/riwayat')
    revalidatePath('/admin/pengajuan/rekap')
    revalidatePath('/admin/pengajuan/persetujuan')

    return { success: true, id: doc.id }
  } catch (err: any) {
    return { error: err.message || 'Server error' }
  }
}
