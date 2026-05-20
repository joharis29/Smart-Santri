/**
 * =======================================================================
 * Smart Santri — API Route: Audit Kepatuhan (Smart Compliance)
 * =======================================================================
 * Endpoint POST /api/audit
 *
 * Menerima data transaksi (RKA/LPJ) dari frontend dan mengembalikan
 * analisis kepatuhan berdasarkan regulasi yang telah di-embed.
 *
 * Jika OPENAI_API_KEY tidak tersedia, endpoint tetap berfungsi
 * dengan mengembalikan hasil mock (simulasi heuristik).
 * =======================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeCompliance,
  isAIAvailable,
  type TransactionData,
  type ComplianceResult,
} from '@/lib/rag';

/**
 * POST /api/audit
 *
 * Body (JSON):
 * {
 *   "jenis": "RKA" | "LPJ",
 *   "kegiatan": "Nama kegiatan",
 *   "unit": "SDIT 1",
 *   "bidang": "Pendidikan",
 *   "nominal": 5000000,
 *   "sumberDana": "Dana BOS",
 *   "narasi": "Pengadaan ATK untuk kegiatan belajar mengajar semester 2",
 *   "items": [...]  // opsional
 * }
 *
 * Response (JSON):
 * {
 *   "success": true,
 *   "aiAvailable": true/false,
 *   "result": { ...ComplianceResult }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // --- Validasi input ---
    const requiredFields = ['jenis', 'kegiatan', 'unit', 'nominal', 'sumberDana'];
    const missingFields = requiredFields.filter(field => !body[field] && body[field] !== 0);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Field wajib tidak lengkap: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (typeof body.nominal !== 'number' || body.nominal < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nominal harus berupa angka positif.',
        },
        { status: 400 }
      );
    }

    // --- Bangun data transaksi ---
    const transaction: TransactionData = {
      jenis: body.jenis,
      kegiatan: body.kegiatan,
      unit: body.unit,
      bidang: body.bidang || 'Umum',
      nominal: body.nominal,
      sumberDana: body.sumberDana,
      narasi: body.narasi || '',
      items: body.items || [],
    };

    // --- Jalankan analisis kepatuhan ---
    const result: ComplianceResult = await analyzeCompliance(transaction);

    return NextResponse.json({
      success: true,
      aiAvailable: isAIAvailable(),
      result,
    });
  } catch (error: any) {
    console.error('[API /api/audit] Error:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan internal saat melakukan analisis audit.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/audit
 * Health check endpoint — cek apakah AI tersedia.
 */
export async function GET() {
  return NextResponse.json({
    service: 'Smart Santri — Compliance Audit API',
    aiAvailable: isAIAvailable(),
    mode: isAIAvailable() ? 'LIVE (OpenAI)' : 'MOCK (Simulasi Heuristik)',
    timestamp: new Date().toISOString(),
  });
}
