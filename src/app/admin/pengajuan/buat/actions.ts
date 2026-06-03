'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { sendNotifikasiEmail, getBulanName } from '@/lib/email'

export async function batchSavePengajuan(payload: {
  id?: string, // Optional ID for updates
  unit: string,
  bidang: string,
  bulan: string,
  tahun_ajaran: string,
  status: 'DRAFT' | 'MENUNGGU_VERIFIKASI' | 'MENUNGGU_KEPALA' | 'REVISI',
  parent_id?: string,
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
    let bulanInt = new Date().getMonth() + 1
    if (monthMap[payload.bulan]) {
      bulanInt = monthMap[payload.bulan]
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(payload.bulan)) {
      bulanInt = parseInt(payload.bulan.split('-')[1], 10)
    }
    
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

    // Determine the final target status
    const targetStatus = payload.status;

    // 2. Create/Update Document Header
    // Strategy: Always save as DRAFT first so RLS allows item insertion,
    // then update status to target status after items are saved.
    let docId = payload.id;
    
    if (docId) {
      // Security Check: Verify ownership or admin role
      const { data: existingDoc } = await supabase
        .from('dokumen_pengajuan')
        .select('pembuat_id, status')
        .eq('id', docId)
        .maybeSingle();

      if (!existingDoc) return { error: 'Dokumen tidak ditemukan.' };

      if (existingDoc.pembuat_id !== pembuat_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', pembuat_id)
          .maybeSingle();

        if (!['ADMINISTRATOR', 'BENDAHARA_PUSAT'].includes(profile?.role || '')) {
          return { error: 'Anda tidak berhak mengubah dokumen ini.' };
        }
      }

      // If existing doc is not DRAFT, we need admin client to update it
      // Otherwise use regular client
      let updateClient = supabase;
      if (existingDoc.status !== 'DRAFT' && existingDoc.status !== 'REVISI') {
        try {
          updateClient = createAdminClient() as any;
        } catch {
          // Fallback to regular client
        }
      }

      // Update existing — set to DRAFT first so items can be inserted
      const { error: upError } = await updateClient
        .from('dokumen_pengajuan')
        .update({
          periode_bulan: bulanInt,
          periode_tahun: tahunInt,
          status: 'DRAFT',
          unit: payload.unit,
          unit_id: unit_id,
          jenjang_id: jenjang_id,
          bidang: payload.bidang,
          jenis: 'RKA',
          total_nominal: total_nominal,
          parent_id: payload.parent_id || null
        })
        .eq('id', docId);
      
      if (upError) return { error: 'Gagal update dokumen: ' + upError.message };

      // Delete old items to replace them (allowed because status is DRAFT now)
      await supabase.from('item_pengajuan').delete().eq('dokumen_id', docId);
    } else {
      // Create new — always as DRAFT initially
      const { data: dokumen, error: docError } = await supabase
        .from('dokumen_pengajuan')
        .insert({
          pembuat_id,
          periode_bulan: bulanInt,
          periode_tahun: tahunInt,
          status: 'DRAFT',
          unit: payload.unit,
          unit_id: unit_id,
          jenjang_id: jenjang_id,
          bidang: payload.bidang,
          jenis: 'RKA',
          total_nominal: total_nominal,
          parent_id: payload.parent_id || null
        })
        .select('id')
        .single();

      if (docError) {
        console.error('Doc Error:', docError);
        return { error: 'Gagal membuat dokumen: ' + docError.message };
      }
      docId = dokumen.id;
    }

    // 3. Save Items (RLS allows this because doc status is DRAFT)
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
        judul_kegiatan: row.program,
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

    const { error: itemError } = await supabase
      .from('item_pengajuan')
      .insert(itemsToInsert)

    if (itemError) {
      console.error('Item Error:', itemError)
      return { error: 'Gagal menyimpan rincian: ' + itemError.message }
    }

    // 4. Now update document status from DRAFT to the actual target status
    if (targetStatus !== 'DRAFT') {
      const { error: statusError } = await supabase
        .from('dokumen_pengajuan')
        .update({ status: targetStatus })
        .eq('id', docId)

      if (statusError) {
        console.error('Status Update Error:', statusError)
        // Don't fail the whole operation — items are saved, just status didn't change
        // Try with admin client as fallback
        try {
          const adminFallback = createAdminClient()
          await adminFallback
            .from('dokumen_pengajuan')
            .update({ status: targetStatus })
            .eq('id', docId)
        } catch {
          console.warn('Admin fallback for status update also failed, doc remains as DRAFT')
        }
      }
    }

    revalidatePath('/admin/pengajuan/draft-saya')
    revalidatePath('/admin/pengajuan/rekap')

    // Email notification — non-blocking, tidak mempengaruhi alur utama
    if (payload.status !== 'DRAFT') {
      try {
        const { data: bendahara } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'BENDAHARA_UNIT')
          .eq('unit_id', unit_id)
          .maybeSingle()
        if (bendahara?.email) {
          const bulanName = getBulanName(bulanInt)
          await sendNotifikasiEmail({
            event: 'RKA_SUBMITTED',
            toEmail: bendahara.email,
            toName: bendahara.full_name || 'Bendahara Unit',
            unitName: payload.unit,
            bidang: payload.bidang,
            jumlahKegiatan: payload.data.length,
            totalNominal: total_nominal,
            bulan: bulanName,
            tahun: payload.tahun_ajaran,
            jenis: 'RKA'
          })
        }
      } catch (emailErr) {
        console.error('[Email batchSavePengajuan]', emailErr)
      }
    }

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
  
  // 1. Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized: User not logged in' }

  // 2. Fetch the document using standard client first to ensure RLS access
  const { data: doc, error: fetchError } = await supabase
    .from('dokumen_pengajuan')
    .select('pembuat_id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !doc) return { error: 'Dokumen tidak ditemukan atau akses ditolak.' }

  // 3. Perform the update using the admin client to bypass RLS limits
  const adminClient = createAdminClient()
  const { error } = await adminClient
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
  if (!doc) return { error: "Dokumen tidak ditemukan." }

  // RESOLVE & HEAL UNIT_ID AND JENJANG_ID
  let docUnitId = doc.unit_id;
  let docJenjangId = doc.jenjang_id;
  if (!docUnitId || !docJenjangId) {
    const { data: unitData } = await supabase.from('unit').select('id, jenjang_id').eq('name', doc.unit).maybeSingle();
    if (unitData) {
      docUnitId = unitData.id;
      docJenjangId = unitData.jenjang_id;
    }
  }

  // MANUAL AUTHORIZATION CHECK
  let isAuthorized = false;
  const userRole = userProfile?.role;
  const approverRoles = ['KEPALA_UNIT', 'BENDAHARA_UNIT', 'KEPALA_JENJANG', 'BENDAHARA_JENJANG'];

  if (['ADMINISTRATOR', 'BENDAHARA_PUSAT', 'PIMPINAN'].includes(userRole)) {
    isAuthorized = true;
  } else {
    // Check main profile
    if (approverRoles.includes(userRole)) {
      if (userProfile?.unit_id === docUnitId || userProfile?.unit_id === docJenjangId || userProfile?.jenjang_id === docJenjangId) {
        isAuthorized = true;
      }
    }
    // Check multi-roles
    if (!isAuthorized) {
      for (const mr of multiRoleProfiles) {
        if (approverRoles.includes(mr.role) && (mr.unit_id === docUnitId || mr.unit_id === docJenjangId)) {
          isAuthorized = true; break;
        }
      }
    }
  }

  if (!isAuthorized) {
    const diag = `Role:${userRole}, U:${userProfile?.unit_id}, J:${userProfile?.jenjang_id}, DocU:${docUnitId}, DocJ:${docJenjangId}`;
    return { error: `Gagal memproses pengajuan: Anda tidak memiliki wewenang. [DIAG: ${diag}]` }
  }
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

  const adminClient = createAdminClient();

  // Try updating with riwayat_revisi snapshot & auto-heal missing references
  const mainUpdate = await adminClient
    .from('dokumen_pengajuan')
    .update({ 
      status: 'REVISI',
      catatan_revisi: catatan,
      riwayat_revisi: updatedHistory,
      unit_id: docUnitId,
      jenjang_id: docJenjangId
    })
    .eq('id', id)
    .select();

  data = mainUpdate.data;
  error = mainUpdate.error;

  // Fallback if riwayat_revisi column is not created yet
  if (error) {
    console.warn("riwayat_revisi column might be missing in Supabase, falling back...", error);
    const fallbackUpdate = await adminClient
      .from('dokumen_pengajuan')
      .update({ 
        status: 'REVISI',
        catatan_revisi: catatan,
        unit_id: docUnitId,
        jenjang_id: docJenjangId
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
        await adminClient
          .from('item_pengajuan')
          .update({ catatan_revisi: note })
          .eq('id', itemId);
      }
    }
  }

  // Email notification ke staf pembuat — non-blocking
  try {
    if (doc?.pembuat_id) {
      const { data: pembuat } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', doc.pembuat_id)
        .maybeSingle()
      if (pembuat?.email) {
        await sendNotifikasiEmail({
          event: 'REVISI_DIMINTA',
          toEmail: pembuat.email,
          toName: pembuat.full_name || 'Staf',
          unitName: doc.unit || '',
          bidang: doc.bidang || '',
          totalNominal: doc.total_nominal || 0,
          bulan: getBulanName(doc.periode_bulan),
          tahun: String(doc.periode_tahun || ''),
          catatanRevisi: catatan,
          jenis: doc.jenis === 'LPJ' ? 'LPJ' : 'RKA'
        })
      }
    }
  } catch (emailErr) {
    console.error('[Email revisiPengajuan]', emailErr)
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
  if (!doc) return { error: "Dokumen tidak ditemukan." }

  // RESOLVE & HEAL UNIT_ID AND JENJANG_ID
  let docUnitId = doc.unit_id;
  let docJenjangId = doc.jenjang_id;
  if (!docUnitId || !docJenjangId) {
    const { data: unitData } = await supabase.from('unit').select('id, jenjang_id').eq('name', doc.unit).maybeSingle();
    if (unitData) {
      docUnitId = unitData.id;
      docJenjangId = unitData.jenjang_id;
    }
  }

  // MANUAL AUTHORIZATION CHECK
  let isAuthorized = false;
  const userRole = userProfile?.role;
  const approverRoles = ['KEPALA_UNIT', 'BENDAHARA_UNIT', 'KEPALA_JENJANG', 'BENDAHARA_JENJANG'];

  if (['ADMINISTRATOR', 'BENDAHARA_PUSAT', 'PIMPINAN'].includes(userRole)) {
    isAuthorized = true;
  } else {
    // Check main profile
    if (approverRoles.includes(userRole)) {
      if (userProfile?.unit_id === docUnitId || userProfile?.unit_id === docJenjangId || userProfile?.jenjang_id === docJenjangId) {
        isAuthorized = true;
      }
    }
    // Check multi-roles
    if (!isAuthorized) {
      for (const mr of multiRoleProfiles) {
        if (approverRoles.includes(mr.role) && (mr.unit_id === docUnitId || mr.unit_id === docJenjangId)) {
          isAuthorized = true; break;
        }
      }
    }
  }

  if (!isAuthorized) {
    const diag = `Role:${userRole}, U:${userProfile?.unit_id}, J:${userProfile?.jenjang_id}, DocU:${docUnitId}, DocJ:${docJenjangId}`;
    return { error: `Gagal memproses pengajuan: Anda tidak memiliki wewenang. [DIAG: ${diag}]` }
  }

  const adminClient = createAdminClient();
  const updatePayload: any = {
    status: nextStatus || 'MENUNGGU_KEPALA',
    unit_id: docUnitId,
    jenjang_id: docJenjangId
  }

  if (metodePencairan) {
    updatePayload.metode_pencairan = metodePencairan
  }

  const { data, error } = await adminClient
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

  // =====================================================================
  // FINANCIAL MUTATION LOGIC (Bypassing RLS with adminClient)
  // =====================================================================
  try {
    if (nextStatus === 'SUDAH_DITERIMA' && doc?.jenis === 'RKA' && !doc?.parent_id) {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: items } = await adminClient.from('item_pengajuan').select('*').eq('dokumen_id', id);
      
      if (items && items.length > 0) {
        for (const item of items) {
          // Sesuai aturan bisnis: HANYA Dana Pesantren/Yayasan yang otomatis cair/ditransfer saat RKA disetujui.
          // Dana eksternal seperti BOS/BPOPP diinput manual oleh Bendahara Unit melalui Input Pendapatan.
          let itemYayasanAmount = 0;
          const details = typeof item.rincian_json === 'string' ? JSON.parse(item.rincian_json) : (item.rincian_json || {});
          const splits = details.fundingSplits || [];
          
          if (Array.isArray(splits) && splits.length > 0) {
              splits.forEach((s: any) => {
                  const source = (s.source || s.sumber || '').toLowerCase();
                  const amount = Number(s.amount || s.nominal || 0);
                  if (source.includes('yayasan') || source.includes('pesantren')) {
                      itemYayasanAmount += amount;
                  }
              });
          } else {
              const source = (item.sumber_dana || '').toLowerCase();
              if (source.includes('yayasan') || source.includes('pesantren')) {
                  itemYayasanAmount = Number(item.nominal || 0);
              }
          }

          if (itemYayasanAmount > 0) {
              const rkaLabel = item.judul_kegiatan || item.kegiatan || 'Pengajuan RKA';
              const receiverUnit = doc?.unit || 'Unit';
              const chosenMetode = metodePencairan || 'Transfer';

              // 1. Insert transaksi_pendapatan -> unit penerima (DEBET)
              const { error: insErr } = await adminClient
                  .from('transaksi_pendapatan')
                  .insert([{
                      tanggal: todayStr,
                      unit: receiverUnit,
                      sumber_dana: 'Dana Pesantren/Yayasan',
                      nominal: itemYayasanAmount,
                      jenis_penerimaan: chosenMetode,
                      nama_bank: '-',
                      keterangan: `Penerimaan Dana RKA dari Pusat: ${rkaLabel} (ID RKA: ${id})`,
                      created_by: user?.id || null
                  }]);
              if (insErr) {
                  console.error("Error inserting RKA pendapatan:", insErr);
                  throw new Error("Gagal menyimpan RKA Pendapatan: " + insErr.message);
              }

              // 2. Insert transaksi_pengeluaran -> Pusat (KREDIT)
              const { error: expErr } = await adminClient
                  .from('transaksi_pengeluaran')
                  .insert([{
                      tanggal: todayStr,
                      unit: 'Pusat (Yayasan)',
                      sumber_dana: 'Dana SPP',
                      nominal: itemYayasanAmount,
                      metode_pencairan: chosenMetode,
                      nama_bank: '-',
                      keterangan: `Penyaluran RKA ke ${receiverUnit}: ${rkaLabel} (ID RKA: ${id})`,
                      created_by: user?.id || null
                  }]);
              
              if (expErr) {
                  console.error("Error inserting RKA pengeluaran Pusat:", expErr);
                  throw new Error("Gagal menyimpan RKA Pengeluaran Pusat: " + expErr.message);
              }
          }
        }
      }
    }

    if (nextStatus === 'SELESAI' && doc?.jenis === 'LPJ') {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: items } = await adminClient.from('item_pengajuan').select('*').eq('dokumen_id', id);
      const lpjUnit = doc?.unit || 'Unit';

      if (items && items.length > 0) {
        for (const item of items) {
          const details = typeof item.rincian_json === 'string' ? JSON.parse(item.rincian_json) : (item.rincian_json || {});
          const splits = [...(details.fundingSplits || []), ...(details.subsidiSources || [])];
          const activityLabel = item.judul_kegiatan || item.kegiatan || 'Kegiatan LPJ';

          if (splits.length > 0) {
              for (const split of splits) {
                  const splitAmount = Number(split.amount || split.nominal || 0);
                  const splitSource = split.source || split.sumber || 'Dana Pesantren/Yayasan';

                  if (splitAmount > 0) {
                      const { error: lpjExpErr } = await adminClient
                          .from('transaksi_pengeluaran')
                          .insert([{
                              tanggal: todayStr,
                              unit: lpjUnit,
                              sumber_dana: splitSource,
                              nominal: splitAmount,
                              metode_pencairan: 'Transfer',
                              nama_bank: '-',
                              keterangan: `Realisasi LPJ: ${activityLabel} [${splitSource}] (ID LPJ: ${id})`,
                              created_by: user?.id || null
                          }]);
                      if (lpjExpErr) {
                          console.error(`Error inserting LPJ pengeluaran (${splitSource}):`, lpjExpErr);
                          throw new Error("Gagal mencatat pengeluaran LPJ: " + lpjExpErr.message);
                      }
                  }
              }
          } else {
              const amount = Number(item.nominal || 0);
              if (amount > 0) {
                  const { error: lpjExpErr } = await adminClient
                      .from('transaksi_pengeluaran')
                      .insert([{
                          tanggal: todayStr,
                          unit: lpjUnit,
                          sumber_dana: item.sumber_dana || 'Dana Pesantren/Yayasan',
                          nominal: amount,
                          metode_pencairan: 'Transfer',
                          nama_bank: '-',
                          keterangan: `Realisasi LPJ: ${activityLabel} (ID LPJ: ${id})`,
                          created_by: user?.id || null
                      }]);
                  if (lpjExpErr) {
                      console.error("Error inserting LPJ pengeluaran fallback:", lpjExpErr);
                      throw new Error("Gagal mencatat pengeluaran LPJ: " + lpjExpErr.message);
                  }
              }
          }
        }
      }
    }
  } catch (finErr: any) {
    console.error('[Financial Mutation Error]', finErr);
    // Kita harus membatalkan status jika mutasi gagal (rollback secara manual, karena tidak ada transaksi DB di Supabase Data API)
    await adminClient
      .from('dokumen_pengajuan')
      .update({ status: doc?.status || 'MENUNGGU_PUSAT' })
      .eq('id', id);
    return { error: 'Mutasi keuangan gagal: ' + finErr.message };
  }

  // Email notification berdasarkan nextStatus — non-blocking
  try {
    const supabaseFresh = await createClient()
    const bulanName = getBulanName(doc?.periode_bulan)
    const tahunStr = String(doc?.periode_tahun || '')
    const baseParams = {
      unitName: doc?.unit || '',
      bidang: doc?.bidang || '',
      totalNominal: doc?.total_nominal || 0,
      bulan: bulanName,
      tahun: tahunStr,
      jenis: (doc?.jenis === 'LPJ' ? 'LPJ' : 'RKA') as 'RKA' | 'LPJ'
    }

    if (nextStatus === 'MENUNGGU_KEPALA') {
      // Notify Kepala Unit
      const { data: kepala } = await supabaseFresh.from('profiles').select('email, full_name')
        .eq('role', 'KEPALA_UNIT').eq('unit_id', doc?.unit_id).maybeSingle()
      if (kepala?.email) {
        await sendNotifikasiEmail({ event: 'FORWARDED_TO_KEPALA', toEmail: kepala.email, toName: kepala.full_name || 'Kepala Unit', ...baseParams })
      }
    } else if (nextStatus === 'MENUNGGU_PUSAT' || nextStatus === 'MENUNGGU_VERIFIKASI_PUSAT') {
      // Notify semua Bendahara Pusat
      const { data: pusatList } = await supabaseFresh.from('profiles').select('email, full_name').eq('role', 'BENDAHARA_PUSAT')
      for (const p of (pusatList || [])) {
        if (p.email) await sendNotifikasiEmail({ event: 'APPROVED_TO_PUSAT', toEmail: p.email, toName: p.full_name || 'Bendahara Pusat', ...baseParams })
      }
    } else if (nextStatus === 'CAIR') {
      // Notify Bendahara Unit + Staf Pembuat
      const { data: bendahara } = await supabaseFresh.from('profiles').select('email, full_name').eq('role', 'BENDAHARA_UNIT').eq('unit_id', doc?.unit_id).maybeSingle()
      const { data: pembuat } = doc?.pembuat_id ? await supabaseFresh.from('profiles').select('email, full_name').eq('id', doc.pembuat_id).maybeSingle() : { data: null }
      for (const r of [bendahara, pembuat].filter(Boolean)) {
        if (r?.email) await sendNotifikasiEmail({ event: 'DANA_CAIR', toEmail: r.email, toName: r.full_name || 'Pengguna', ...baseParams })
      }
    } else if (nextStatus === 'SUDAH_DITERIMA') {
      // Notify Bendahara Unit + Staf Pembuat
      const { data: bendahara } = await supabaseFresh.from('profiles').select('email, full_name').eq('role', 'BENDAHARA_UNIT').eq('unit_id', doc?.unit_id).maybeSingle()
      const { data: pembuat } = doc?.pembuat_id ? await supabaseFresh.from('profiles').select('email, full_name').eq('id', doc.pembuat_id).maybeSingle() : { data: null }
      for (const r of [bendahara, pembuat].filter(Boolean)) {
        if (r?.email) await sendNotifikasiEmail({ event: 'SUDAH_DITERIMA', toEmail: r.email, toName: r.full_name || 'Pengguna', ...baseParams })
      }
    }
  } catch (emailErr) {
    console.error('[Email verifikasiPengajuan]', emailErr)
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

    const adminClient = createAdminClient();
    let docId = payload.id;
    
    if (docId) {
      // Security Check: Verify ownership
      const { data: existingDoc } = await supabase
        .from('dokumen_pengajuan')
        .select('pembuat_id')
        .eq('id', docId)
        .maybeSingle();

      if (existingDoc && existingDoc.pembuat_id !== pembuat_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', pembuat_id)
          .maybeSingle();

        if (!['ADMINISTRATOR', 'BENDAHARA_PUSAT'].includes(profile?.role || '')) {
          return { error: 'Anda tidak berhak mengubah dokumen LPJ ini.' };
        }
      }

      // Update existing LPJ Document Header using Admin Client to avoid RLS violation on status change
      const { error: upError } = await adminClient
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
      await adminClient.from('item_pengajuan').delete().eq('dokumen_id', docId);
    } else {
      // Create new LPJ Document Header using Admin Client
      const { data: dokumen, error: docError } = await adminClient
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

    const { error: itemError } = await adminClient
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

// Kirim notifikasi email ke Kepala Unit setelah Bendahara Unit meneruskan pengajuan
// Dipanggil dari rekap/page.tsx setelah update status ke MENUNGGU_KEPALA berhasil
export async function notifyKepalaForwarded(docIds: string[]): Promise<void> {
  if (!docIds || docIds.length === 0) return
  try {
    const supabase = await createClient()
    for (const docId of docIds) {
      try {
        const { data: doc } = await supabase
          .from('dokumen_pengajuan')
          .select('unit, unit_id, bidang, periode_bulan, periode_tahun, total_nominal, jenis')
          .eq('id', docId)
          .maybeSingle()
        if (!doc) continue
        const { data: kepala } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'KEPALA_UNIT')
          .eq('unit_id', doc.unit_id)
          .maybeSingle()
        if (!kepala?.email) continue
        await sendNotifikasiEmail({
          event: 'FORWARDED_TO_KEPALA',
          toEmail: kepala.email,
          toName: kepala.full_name || 'Kepala Unit',
          unitName: doc.unit || '',
          bidang: doc.bidang || '',
          totalNominal: doc.total_nominal || 0,
          bulan: getBulanName(doc.periode_bulan),
          tahun: String(doc.periode_tahun || ''),
          jenis: doc.jenis === 'LPJ' ? 'LPJ' : 'RKA'
        })
      } catch (innerErr) {
        console.error('[Email notifyKepalaForwarded inner]', innerErr)
      }
    }
  } catch (err) {
    console.error('[Email notifyKepalaForwarded]', err)
  }
}
