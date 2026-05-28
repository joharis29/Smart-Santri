import { NextRequest, NextResponse } from 'next/server'
import { auditNarasi } from '@/lib/rag'

export async function POST(req: NextRequest) {
  try {
    const { jenis, narasi, kategoriCoa, sumberDana, nominal, rincian } = await req.json()

    if (!jenis || !narasi || !kategoriCoa || !sumberDana || nominal === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Eksekusi RAG Audit dengan Gemini (tanpa menyimpan ke DB karena ini pra-audit draft)
    const result = await auditNarasi(jenis, narasi, kategoriCoa, sumberDana, nominal, rincian)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('[Pra-Audit API Error]', error)
    
    // Fallback jika API limit
    if (error?.message?.includes('429') || error?.message?.toLowerCase().includes('quota')) {
      return NextResponse.json({
        status: 'GAGAL',
        alasan: 'Gagal terhubung ke AI karena sistem beroperasi pada kapasitas maksimal (Limit Kuota API). Proses Smart Audit tidak berhasil dilakukan.',
        referensi: [],
        skor_kepatuhan: 0
      })
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
