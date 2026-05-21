'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { createClient } from '@/utils/supabase/server'

export async function forwardPengajuanToKepala(docIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Akses ditolak: Anda harus login.' }
  }

  // Use admin client to bypass restrictive RLS policies for status transitions
  const adminClient = createAdminClient()
  
  const { data, error } = await adminClient
    .from('dokumen_pengajuan')
    .update({ status: 'MENUNGGU_KEPALA' })
    .in('id', docIds)
    .select('id')

  if (error) {
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return { error: 'Tidak ada dokumen yang berhasil diteruskan. Pastikan dokumen valid.' }
  }

  return { success: true, count: data.length }
}
