'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function saveDraftItem(formData: FormData) {
  const supabase = await createClient()

  // Ambil data dari form
  const unit_id = formData.get('unit') as string 
  const kategori_coa = formData.get('category') as string
  const judul_kegiatan = formData.get('description') as string
  const sumber_dana = formData.get('source') as string
  const nominal = Number(formData.get('nominal'))

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    return { error: 'Tidak dapat mengotentikasi sesi Anda. Silakan login kembali.' }
  }

  const pembuat_id = userData.user.id

  // 1. Cek apakah pengguna punya Dokumen Pengajuan berstatus DRAFT di bulan ini
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  let { data: dokumen, error: fetchError } = await supabase
    .from('dokumen_pengajuan')
    .select('id')
    .eq('pembuat_id', pembuat_id)
    .eq('status', 'DRAFT')
    .eq('periode_bulan', currentMonth)
    .eq('periode_tahun', currentYear)
    .maybeSingle()

  if (fetchError) {
    return { error: 'Gagal mengecek keranjang pengajuan.' }
  }

  // 2. Jika tidak punya, buat Dokumen Header baru
  if (!dokumen) {
    const { data: newDokumen, error: insertDocError } = await supabase
      .from('dokumen_pengajuan')
      .insert({
        pembuat_id,
        periode_bulan: currentMonth,
        periode_tahun: currentYear,
      })
      .select('id')
      .single()

    if (insertDocError || !newDokumen) {
      return { error: 'Gagal membuat dokumen pengajuan baru.' }
    }
    dokumen = newDokumen
  }

  // 3. Simpan item kegiatan ke dalam dokumen tersebut
  const { error: insertItemError } = await supabase
    .from('item_pengajuan')
    .insert({
      dokumen_id: dokumen.id,
      kategori_coa,
      sumber_dana,
      judul_kegiatan,
      nominal
    })

  if (insertItemError) {
    return { error: 'Gagal menambahkan rincian kegiatan.' }
  }

  // 4. Otomatis daftarkan judul kegiatan ke kamus_kegiatan
  await supabase
    .from('kamus_kegiatan')
    .upsert(
      { judul_kegiatan, kategori_coa }, 
      { onConflict: 'unit_id,judul_kegiatan', ignoreDuplicates: true }
    )

  revalidatePath('/admin/pengajuan/buat')
  revalidatePath('/admin/pengajuan/rekap')
  return { success: true }
}
