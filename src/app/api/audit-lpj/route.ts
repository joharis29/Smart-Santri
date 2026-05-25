import { NextRequest, NextResponse } from 'next/server'
import { auditNarasi } from '@/lib/rag'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jenis, id, narasi, kategoriCoa, sumberDana, nominal } = await req.json()

    if (!jenis || !id || !narasi || !kategoriCoa || !sumberDana || nominal === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Eksekusi RAG Audit dengan Gemini
    const result = await auditNarasi(jenis, narasi, kategoriCoa, sumberDana, nominal)

    const catatan = JSON.stringify({
      alasan: result.alasan,
      referensi: result.referensi,
      skor_kepatuhan: result.skor_kepatuhan,
      audited_at: new Date().toISOString()
    })

    // Update database (keduanya tersimpan di item_pengajuan)
    const { error } = await supabase
      .from('item_pengajuan')
      .update({
        status_audit_ai: result.status,
        catatan_ai: catatan
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('[API Audit Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
