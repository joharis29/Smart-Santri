'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getApprovedRkaList(allowedParentId?: string) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, unit_id, jenjang_id, unit:unit_id(name), jenjang:jenjang_id(name)')
    .eq('id', user.user.id)
    .single()

  const adminClient = createAdminClient()

  let query = adminClient
    .from('dokumen_pengajuan')
    .select(`
      id,
      unit,
      unit_id,
      jenjang_id,
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
  
  const { data, error } = await query
  if (error) {
    console.error('Error fetching approved RKA:', error)
    return []
  }

  if (!data) return []

  let filteredData = data;

  if (role !== 'PIMPINAN' && role !== 'ADMINISTRATOR') {
    const { data: multiRoles } = await supabase
      .from('profiles_multi_role')
      .select('unit_id, jenjang_id, unit:unit_id(name), jenjang:jenjang_id(name)')
      .eq('user_id', user.user.id);

    const allowedUnitIds = new Set<string>();
    const allowedJenjangIds = new Set<string>();
    const allowedUnitNames = new Set<string>();

    if (profile?.unit_id) allowedUnitIds.add(profile.unit_id);
    if (profile?.jenjang_id) allowedJenjangIds.add(profile.jenjang_id);
    if ((profile as any)?.unit?.name) allowedUnitNames.add((profile as any).unit.name);
    if ((profile as any)?.jenjang?.name) allowedUnitNames.add((profile as any).jenjang.name);
    
    multiRoles?.forEach((mr: any) => {
      if (mr.unit_id) allowedUnitIds.add(mr.unit_id);
      if (mr.jenjang_id) allowedJenjangIds.add(mr.jenjang_id);
      if (mr.unit?.name) allowedUnitNames.add(mr.unit.name);
      if (mr.jenjang?.name) allowedUnitNames.add(mr.jenjang.name);
    });

    if (role === 'BENDAHARA_PUSAT') {
      allowedUnitNames.add('Pusat (Yayasan)');
    }

    filteredData = filteredData.filter((doc: any) => {
       if (doc.unit && allowedUnitNames.has(doc.unit)) return true;
       if (doc.unit_id && allowedUnitIds.has(doc.unit_id)) return true;
       if (doc.jenjang_id && allowedJenjangIds.has(doc.jenjang_id)) return true;
       return false;
    });
  }

  // Ambil semua dokumen untuk mengecek apakah RKA sudah direvisi atau masuk LPJ
  const { data: childDocs } = await adminClient
    .from('dokumen_pengajuan')
    .select('id, jenis, parent_id, item_pengajuan(rincian_json)')

  const processedRkaIds = new Set<string>()

  childDocs?.forEach(doc => {
    // 1. Jika dokumen ini adalah Revisi dari RKA (parent_id)
    if (doc.jenis === 'REVISI_RKA' && doc.parent_id) {
      processedRkaIds.add(doc.parent_id)
    }
    // 2. Jika dokumen ini adalah LPJ yang merujuk ke RKA (via rka_id di rincian_json)
    if (doc.jenis === 'LPJ') {
      doc.item_pengajuan?.forEach((it: any) => {
        try {
          const details = typeof it.rincian_json === 'string' 
            ? JSON.parse(it.rincian_json) 
            : (it.rincian_json || {})
          if (details.rka_id) {
            processedRkaIds.add(details.rka_id)
          }
        } catch(e) {}
      })
    }
  })

  // Saring RKA yang belum diproses di LPJ maupun Revisi, KECUALI jika ID-nya adalah allowedParentId (saat edit draft)
  return filteredData.filter((doc: any) => !processedRkaIds.has(doc.id) || (allowedParentId && String(doc.id) === String(allowedParentId)))
}

export async function getDraftRevisiById(draftId: string) {
  const supabase = await createClient()
  const { data: doc, error } = await supabase
    .from('dokumen_pengajuan')
    .select(`
      *,
      item_pengajuan(*)
    `)
    .eq('id', draftId)
    .single()

  if (error || !doc) return null
  return doc
}

export async function submitRevisiRka(payload: {
  draft_id?: string,
  parent_id: string,
  unit: string,
  bidang: string,
  bulan: string,
  tahun_ajaran: string,
  total_nominal: number,
  data: any[],
  status?: string,
  catatan_revisi?: string
}) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return { error: 'Unauthorized' }

    // Dapatkan data RKA Asli untuk mereplika metadata (unit_id, dll)
    const { data: parentRka } = await adminClient
      .from('dokumen_pengajuan')
      .select('unit_id, jenjang_id, total_nominal')
      .eq('id', payload.parent_id)
      .single()

    if (!parentRka) return { error: 'RKA Induk tidak ditemukan' }
    if (payload.status !== 'DRAFT' && payload.total_nominal > parentRka.total_nominal) {
      return { error: 'Total nominal revisi tidak boleh melebihi total RKA asli' }
    }

    const monthMap: Record<string, number> = {
      'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
      'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
    }
    let bulanInt = new Date().getMonth() + 1
    if (monthMap[payload.bulan]) {
      bulanInt = monthMap[payload.bulan]
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(payload.bulan)) {
      bulanInt = parseInt(payload.bulan.split('-')[1], 10)
    }
    const tahunInt = parseInt(payload.tahun_ajaran.match(/\d+/)?.[0] || new Date().getFullYear().toString())

    // Buat Dokumen Revisi (tetap sebagai RKA) atau Update jika draft_id ada
      let docId = payload.draft_id;
      let docError = null;
      let wasRejected = false;

      if (docId) {
        // Cek status sebelumnya
        const { data: oldDoc } = await adminClient.from('dokumen_pengajuan').select('status').eq('id', docId).single();
        if (oldDoc && oldDoc.status === 'REVISI' && (payload.status === 'MENUNGGU_VERIFIKASI')) {
           wasRejected = true;
        }

        let finalNote: string | null = payload.catatan_revisi || null;
        if (wasRejected) {
           if (finalNote && !finalNote.includes('[RESUBMITTED]')) {
               finalNote = finalNote + ' [RESUBMITTED]';
           } else if (!finalNote) {
               finalNote = '[RESUBMITTED]';
           }
        }

        const { error } = await adminClient
          .from('dokumen_pengajuan')
          .update({
            status: payload.status || 'MENUNGGU_VERIFIKASI',
            total_nominal: payload.total_nominal,
            catatan_revisi: finalNote
          })
          .eq('id', docId)
        docError = error;
      } else {
      const { data: doc, error } = await adminClient
        .from('dokumen_pengajuan')
        .insert({
          pembuat_id: user.user.id,
          periode_bulan: bulanInt,
          periode_tahun: tahunInt,
          status: payload.status || 'MENUNGGU_VERIFIKASI', // Langsung masuk antrean approval
          unit: payload.unit,
          unit_id: parentRka.unit_id,
          jenjang_id: parentRka.jenjang_id,
          bidang: payload.bidang,
          jenis: 'REVISI_RKA',
          total_nominal: payload.total_nominal,
          parent_id: payload.parent_id,
          catatan_revisi: payload.catatan_revisi || null
        })
        .select('id')
        .single()
      docError = error;
      if (doc) docId = doc.id;
    }

    if (docError) return { error: 'Gagal membuat/memperbarui dokumen revisi: ' + docError.message }

    // Jika update draft, hapus item lama
    if (payload.draft_id) {
      await adminClient.from('item_pengajuan').delete().eq('dokumen_id', docId)
    }

    // Insert Item Revisi
    if (payload.data && payload.data.length > 0) {
      const itemsToInsert = payload.data.map(row => {
        const firstSource = row.details?.fundingSplits?.find((s: any) => s.source && s.nominal > 0)?.source || 'Dana BOS'
        const finalDetails = {
          ...(row.details || {}),
          jumlah_kegiatan: row.jumlah || '1',
          _tanggal_pengajuan: payload.bulan
        }
        return {
          dokumen_id: docId,
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

      const { error: itemError } = await adminClient.from('item_pengajuan').insert(itemsToInsert)
      if (itemError) return { error: 'Gagal menyimpan item revisi: ' + itemError.message }
    }

    revalidatePath('/admin/pengajuan/riwayat')
    revalidatePath('/admin/pengajuan/rekap')
    revalidatePath('/admin/pengajuan/persetujuan')
    revalidatePath('/admin/pengajuan/draft-saya')

    return { success: true, id: docId }
  } catch (err: any) {
    return { error: err.message || 'Server error' }
  }
}
