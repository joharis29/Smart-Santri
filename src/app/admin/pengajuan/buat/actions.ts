'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function batchSavePengajuan(payload: {
  id?: string, // Optional ID for updates
  unit: string,
  bidang: string,
  bulan: string,
  tahun_ajaran: string,
  mode: 'RKA' | 'DAPUR',
  status: 'DRAFT' | 'MENUNGGU_VERIFIKASI' | 'MENUNGGU_KEPALA' | 'REVISI',
  data: any[]
}) {
  const supabase = await createClient()

  // 1. Get Real Authenticated User
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    return { error: 'Anda harus login untuk melakukan aksi ini.' }
  }
  const pembuat_id = userData.user.id

  // Helper to convert month name to integer
  const monthMap: Record<string, number> = {
    'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
    'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
  }
  const bulanInt = monthMap[payload.bulan] || new Date().getMonth() + 1
  
  const tahunInt = parseInt(payload.tahun_ajaran.match(/\d+/)?.[0] || new Date().getFullYear().toString())
  const total_nominal = payload.data.reduce((sum, row) => sum + (Number(row.nominal) || 0), 0);

  // 1.5. Resolve Unit Name to unit_id and jenjang_id
  let unit_id: string | null = null
  let jenjang_id: string | null = null
  
  if (payload.unit) {
    const { data: unitData } = await supabase
      .from('unit')
      .select('id, jenjang_id')
      .eq('name', payload.unit)
      .maybeSingle()
      
    if (unitData) {
      unit_id = unitData.id
      jenjang_id = unitData.jenjang_id
    }
  }

  // 2. Create/Update Document Header
  let docId = payload.id;
  
  if (docId) {
    // Update existing
    const { error: upError } = await supabase
      .from('dokumen_pengajuan')
      .update({
        periode_bulan: bulanInt,
        periode_tahun: tahunInt,
        status: payload.status,
        unit: payload.unit,
        unit_id: unit_id,
        jenjang_id: jenjang_id,
        bidang: payload.bidang,
        jenis: payload.mode,
        total_nominal: total_nominal
      })
      .eq('id', docId);
    
    if (upError) return { error: 'Gagal update dokumen: ' + upError.message };

    // Delete old items to replace them
    await supabase.from('item_pengajuan').delete().eq('dokumen_id', docId);
  } else {
    // Create new
    const { data: dokumen, error: docError } = await supabase
      .from('dokumen_pengajuan')
      .insert({
        pembuat_id,
        periode_bulan: bulanInt,
        periode_tahun: tahunInt,
        status: payload.status,
        unit: payload.unit,
        unit_id: unit_id,
        jenjang_id: jenjang_id,
        bidang: payload.bidang,
        jenis: payload.mode,
        total_nominal: total_nominal
      })
      .select('id')
      .single();

    if (docError) {
      console.error('Doc Error:', docError);
      return { error: 'Gagal membuat dokumen: ' + docError.message };
    }
    docId = dokumen.id;
  }

  // 3. Save Items (Including ALL columns)
  const itemsToInsert = payload.data.map(row => {
    // Attempt to get the first valid source from fundingSplits, fallback to 'Dana BOS'
    const firstSource = row.details?.fundingSplits?.find((s: any) => s.source && s.nominal > 0)?.source || 'Dana BOS';
    
    // Inject 'jumlah_kegiatan' into the details JSON since the column doesn't exist in DB
    const finalDetails = {
      ...(row.details || {}),
      jumlah_kegiatan: row.jumlah || '1'
    };

    return {
      dokumen_id: docId,
      judul_kegiatan: payload.mode === 'RKA' ? row.program : row.item,
      kategori_coa: payload.mode === 'RKA' ? row.operasional : 'DAPUR',
      nominal: Number(row.nominal) || 0,
      sumber_dana: firstSource,
      pic: row.pic || '',
      waktu: row.waktu || '',
      tempat: row.tempat || '',
      sasaran: row.sasaran || '',
      rincian_json: finalDetails
    }
  })

  const { error: itemError } = await supabase
    .from('item_pengajuan')
    .insert(itemsToInsert)

  if (itemError) {
    console.error('Item Error:', itemError)
    return { error: 'Gagal menyimpan rincian: ' + itemError.message }
  }

  revalidatePath('/admin/pengajuan/draft-saya')
  revalidatePath('/admin/pengajuan/rekap')
  return { success: true, id: docId }
}

export async function saveDraftItem(formData: FormData) {
  const supabase = await createClient()

  const kategori_coa = formData.get('category') as string
  const judul_kegiatan = formData.get('description') as string
  const sumber_dana = formData.get('source') as string
  const nominal = Number(formData.get('nominal'))

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'Anda harus login.' }
  const pembuat_id = userData.user.id

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  let { data: dokumen, error: fetchError } = await supabase
    .from('dokumen_pengajuan')
    .select('id')
    .eq('pembuat_id', pembuat_id)
    .eq('status', 'DRAFT')
    .eq('periode_bulan', currentMonth)
    .maybeSingle()

  if (fetchError) return { error: 'Gagal mengecek draf.' }

  if (!dokumen) {
    const { data: newDoc, error: insErr } = await supabase
      .from('dokumen_pengajuan')
      .insert({ pembuat_id, status: 'DRAFT', periode_bulan: currentMonth, periode_tahun: currentYear })
      .select('id').single()
    if (insErr) return { error: 'Gagal membuat draf.' }
    dokumen = newDoc
  }

  const { error } = await supabase.from('item_pengajuan').insert({
    dokumen_id: dokumen?.id,
    kategori_coa,
    sumber_dana,
    judul_kegiatan,
    nominal
  })

  if (error) return { error: 'Gagal menyimpan item.' }

  revalidatePath('/admin/pengajuan/buat')
  return { success: true }
}

export async function getPengajuanById(id: string) {
  const supabase = await createClient()
  
  // 1. Get Document Header
  const { data: dokumen, error: docError } = await supabase
    .from('dokumen_pengajuan')
    .select('*')
    .eq('id', id)
    .single()

  if (docError) return { error: docError.message }

  // 2. Get Items
  const { data: items, error: itemError } = await supabase
    .from('item_pengajuan')
    .select('*')
    .eq('dokumen_id', id)

  if (itemError) return { error: itemError.message }

  return { data: { ...dokumen, items } }
}

export async function submitPengajuan(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('dokumen_pengajuan')
    .update({ status: 'MENUNGGU_VERIFIKASI' })
    .eq('id', id)

  if (error) return { error: error.message }

  return { success: true }
}

export async function deletePengajuan(id: string) {
  const supabase = await createClient()
  
  // 1. Delete items first
  await supabase.from('item_pengajuan').delete().eq('dokumen_id', id)

  // 2. Delete document header
  const { error } = await supabase
    .from('dokumen_pengajuan')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  return { success: true }
}

export async function revisiPengajuan(id: string, catatan: string) {
  const supabase = await createClient()
  
  // FETCH USER INFO
  const { data: { user } } = await supabase.auth.getUser()
  let userProfile: any = null
  let multiRoleProfiles: any[] = []
  if (user) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    userProfile = p
    
    const { data: mr } = await supabase.from('profiles_multi_role').select('*').eq('user_id', user.id)
    multiRoleProfiles = mr || []
  }

  // FETCH DOCUMENT INFO
  const { data: doc } = await supabase.from('dokumen_pengajuan').select('*').eq('id', id).maybeSingle()

  const { data, error } = await supabase
    .from('dokumen_pengajuan')
    .update({ 
      status: 'DRAFT',
      catatan_revisi: catatan
    })
    .eq('id', id)
    .select()

  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    const diagMsg = `RLS Denied. Diag Info:
User ID: ${user?.id || 'none'}
User Role: ${userProfile?.role || 'none'}
User Unit: ${userProfile?.unit_id || 'none'}
User Jenjang: ${userProfile?.jenjang_id || 'none'}
Multi-Roles: ${JSON.stringify(multiRoleProfiles.map(m => ({ role: m.role, unit: m.unit_id })))}
Doc ID: ${id}
Doc Unit: ${doc?.unit_id || 'none'}
Doc Jenjang: ${doc?.jenjang_id || 'none'}
Target Status: DRAFT`
    return { error: diagMsg }
  }

  return { success: true }
}
export async function verifikasiPengajuan(id: string, nextStatus?: string) {
  const supabase = await createClient()
  
  // FETCH USER INFO
  const { data: { user } } = await supabase.auth.getUser()
  let userProfile: any = null
  let multiRoleProfiles: any[] = []
  if (user) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    userProfile = p
    
    const { data: mr } = await supabase.from('profiles_multi_role').select('*').eq('user_id', user.id)
    multiRoleProfiles = mr || []
  }

  // FETCH DOCUMENT INFO
  const { data: doc } = await supabase.from('dokumen_pengajuan').select('*').eq('id', id).maybeSingle()

  const { data, error } = await supabase
    .from('dokumen_pengajuan')
    .update({ 
      status: nextStatus || 'MENUNGGU_KEPALA'
    })
    .eq('id', id)
    .select()

  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    const diagMsg = `RLS Denied. Diag Info:
User ID: ${user?.id || 'none'}
User Role: ${userProfile?.role || 'none'}
User Unit: ${userProfile?.unit_id || 'none'}
User Jenjang: ${userProfile?.jenjang_id || 'none'}
Multi-Roles: ${JSON.stringify(multiRoleProfiles.map(m => ({ role: m.role, unit: m.unit_id })))}
Doc ID: ${id}
Doc Unit: ${doc?.unit_id || 'none'}
Doc Jenjang: ${doc?.jenjang_id || 'none'}
Target Status: ${nextStatus}`
    return { error: diagMsg }
  }

  return { success: true }
}
