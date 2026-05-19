'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/utils/supabase/server'

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
  try {
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
  } catch (err: any) {
    console.error("batchSavePengajuan unhandled error:", err)
    return { error: err.message || String(err) }
  }
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
  
  // 1. Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized: User not logged in' }

  // 2. Fetch the document using standard client first to ensure RLS access / check ownership
  const { data: doc, error: fetchError } = await supabase
    .from('dokumen_pengajuan')
    .select('pembuat_id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !doc) {
    return { error: 'Dokumen tidak ditemukan atau Anda tidak memiliki akses: ' + (fetchError?.message || '') }
  }

  // 3. Otoritas: Pembuat dokumen hanya dapat menghapus jika status 'DRAFT', 'REVISI', atau 'MENUNGGU_VERIFIKASI'
  // Atau jika user adalah ADMINISTRATOR / BENDAHARA_PUSAT
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const isCreator = doc.pembuat_id === user.id
  const isAllowedStatus = ['DRAFT', 'REVISI', 'MENUNGGU_VERIFIKASI'].includes(doc.status)
  const isAdminOrPusat = ['ADMINISTRATOR', 'BENDAHARA_PUSAT'].includes(profile?.role || '')

  if (!isAdminOrPusat && !(isCreator && isAllowedStatus)) {
    return { error: 'Anda tidak memiliki wewenang untuk menghapus dokumen dengan status ini.' }
  }

  // 4. Perform the deletion using the admin client (which bypasses RLS)
  const adminSupabase = createAdminClient()
  
  // Delete items first
  const { error: itemError } = await adminSupabase.from('item_pengajuan').delete().eq('dokumen_id', id)
  if (itemError) return { error: 'Gagal menghapus item: ' + itemError.message }

  // Delete document header
  const { error: docError } = await adminSupabase.from('dokumen_pengajuan').delete().eq('id', id)
  if (docError) return { error: 'Gagal menghapus dokumen: ' + docError.message }

  return { success: true }
}

export async function revisiPengajuan(id: string, catatan: string, itemNotes?: Record<string, string>) {
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

  // FETCH CURRENT ITEMS FOR SNAPSHOT
  const { data: currentItems } = await supabase
    .from('item_pengajuan')
    .select('*')
    .eq('dokumen_id', id)

  const snapshot = {
    tanggal_revisi: new Date().toISOString(),
    catatan_revisi: catatan,
    total_nominal: doc?.total_nominal,
    status_sebelumnya: doc?.status,
    items: currentItems?.map(it => {
      let rincian = {};
      try {
        rincian = typeof it.rincian_json === 'string' ? JSON.parse(it.rincian_json) : (it.rincian_json || {});
      } catch(e) {
        rincian = {};
      }
      return {
        id: it.id,
        judul_kegiatan: it.judul_kegiatan,
        kategori_coa: it.kategori_coa,
        sumber_dana: it.sumber_dana,
        nominal: it.nominal,
        rincian_json: rincian,
        catatan_revisi: it.catatan_revisi
      }
    }) || []
  };

  const oldHistory = Array.isArray(doc?.riwayat_revisi) ? doc.riwayat_revisi : [];
  const updatedHistory = [...oldHistory, snapshot];

  let data = null;
  let error = null;

  // Try updating with riwayat_revisi snapshot
  const mainUpdate = await supabase
    .from('dokumen_pengajuan')
    .update({ 
      status: 'REVISI',
      catatan_revisi: catatan,
      riwayat_revisi: updatedHistory
    })
    .eq('id', id)
    .select();

  data = mainUpdate.data;
  error = mainUpdate.error;

  // Fallback if riwayat_revisi column is not created yet
  if (error) {
    console.warn("riwayat_revisi column might be missing in Supabase, falling back...", error);
    const fallbackUpdate = await supabase
      .from('dokumen_pengajuan')
      .update({ 
        status: 'REVISI',
        catatan_revisi: catatan
      })
      .eq('id', id)
      .select();
    data = fallbackUpdate.data;
    error = fallbackUpdate.error;
  }

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

  // Save specific item notes if provided
  if (itemNotes) {
    for (const [itemId, note] of Object.entries(itemNotes)) {
      if (note !== undefined) {
        await supabase
          .from('item_pengajuan')
          .update({ catatan_revisi: note })
          .eq('id', itemId);
      }
    }
  }

  return { success: true }
}
export async function verifikasiPengajuan(id: string, nextStatus?: string, metodePencairan?: string) {
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

  const updatePayload: any = {
    status: nextStatus || 'MENUNGGU_KEPALA'
  }

  if (metodePencairan) {
    updatePayload.metode_pencairan = metodePencairan
  }

  const { data, error } = await supabase
    .from('dokumen_pengajuan')
    .update(updatePayload)
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

export async function saveLPJ(payload: {
  id?: string,
  rka_id: string,
  unit: string,
  bidang: string,
  bulan: string,
  tahun_ajaran: string,
  status: 'DRAFT' | 'MENUNGGU_VERIFIKASI' | 'REVISI',
  total_nominal: number,
  lpjRows: any[],
  narasi: string,
  subsidiSources: any[],
  attachments: Array<{ customName: string; base64?: string; url?: string }>
}) {
  try {
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

    // Resolve Unit Name to unit_id and jenjang_id
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

    let docId = payload.id;
    
    if (docId) {
      // Update existing LPJ Document Header
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
          jenis: 'LPJ',
          total_nominal: payload.total_nominal
        })
        .eq('id', docId);
      
      if (upError) return { error: 'Gagal update dokumen LPJ: ' + upError.message };

      // Delete old items to replace them
      await supabase.from('item_pengajuan').delete().eq('dokumen_id', docId);
    } else {
      // Create new LPJ Document Header
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
          jenis: 'LPJ',
          total_nominal: payload.total_nominal
        })
        .select('id')
        .single();

      if (docError) {
        console.error('Doc Error:', docError);
        return { error: 'Gagal membuat dokumen LPJ: ' + docError.message };
      }
      docId = dokumen.id;
    }

    // Save Items (Typically 1 item representing the realized activity in LPJ)
    const firstRow = payload.lpjRows[0] || {};
    const firstSource = firstRow.details?.fundingSplits?.find((s: any) => s.source && s.nominal > 0)?.source || 'Dana Pesantren/Yayasan';

    const finalDetails = {
      ...(firstRow.details || {}),
      rka_id: payload.rka_id,
      narasi: payload.narasi,
      subsidiSources: payload.subsidiSources,
      attachments: payload.attachments,
      jumlah_kegiatan: firstRow.jumlah || '1x'
    };

    const itemToInsert = {
      dokumen_id: docId,
      judul_kegiatan: firstRow.program || 'Realisasi Kegiatan',
      kategori_coa: firstRow.operasional || 'Lainnya',
      nominal: Number(payload.total_nominal) || 0,
      sumber_dana: firstSource,
      pic: firstRow.pic || '',
      waktu: firstRow.waktu || '',
      tempat: firstRow.tempat || '',
      sasaran: firstRow.sasaran || '',
      rincian_json: finalDetails
    };

    const { error: itemError } = await supabase
      .from('item_pengajuan')
      .insert(itemToInsert);

    if (itemError) {
      console.error('Item Error:', itemError);
      return { error: 'Gagal menyimpan rincian LPJ: ' + itemError.message };
    }

    return { success: true, id: docId }
  } catch (err: any) {
    console.error("saveLPJ unhandled error:", err)
    return { error: err.message || String(err) }
  }
}

