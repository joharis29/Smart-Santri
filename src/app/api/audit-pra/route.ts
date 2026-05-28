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
        status: 'AMAN',
        alasan: 'Sistem Smart AI saat ini beroperasi pada kapasitas maksimal. Evaluasi otomatis dilewati agar pencatatan Anda tidak terhambat. Transaksi ditandai AMAN secara default.',
        referensi: [],
        skor_kepatuhan: 50
      })
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
