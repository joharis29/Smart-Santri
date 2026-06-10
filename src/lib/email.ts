import { Resend } from 'resend'

let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const MONTH_NAMES: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
}

export function getBulanName(bulanInt: number): string {
  return MONTH_NAMES[bulanInt] || String(bulanInt)
}

export type EmailEvent =
  | 'RKA_SUBMITTED'
  | 'LPJ_SUBMITTED'
  | 'FORWARDED_TO_KEPALA'
  | 'APPROVED_TO_PUSAT'
  | 'DANA_CAIR'
  | 'REVISI_DIMINTA'
  | 'SUDAH_DITERIMA'

interface SendEmailParams {
  event: EmailEvent
  toEmail: string
  toName: string
  unitName: string
  bidang: string
  totalNominal: number
  bulan: string
  tahun: string
  jumlahKegiatan?: number
  catatanRevisi?: string
  jenis?: 'RKA' | 'LPJ'
}

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smart-santri-eight.vercel.app'

export async function sendNotifikasiEmail(params: SendEmailParams): Promise<void> {
  const {
    event, toEmail, toName, unitName, bidang,
    totalNominal, bulan, tahun, jumlahKegiatan = 1,
    catatanRevisi, jenis = 'RKA'
  } = params

  const nominalFmt = `Rp ${totalNominal.toLocaleString('id-ID')}`

  const subjects: Record<EmailEvent, string> = {
    RKA_SUBMITTED:       `[Smart Santri] RKA Baru Menunggu Review — ${unitName} / ${bidang}`,
    LPJ_SUBMITTED:       `[Smart Santri] LPJ Baru Menunggu Review — ${unitName} / ${bidang}`,
    FORWARDED_TO_KEPALA: `[Smart Santri] ${jenis} Perlu Persetujuan Anda — ${unitName} / ${bulan} ${tahun}`,
    APPROVED_TO_PUSAT:   `[Smart Santri] ${jenis} Siap Diotorisasi Bendahara Pusat — ${unitName}`,
    DANA_CAIR:           `[Smart Santri] Dana ${nominalFmt} Telah Dicairkan — ${unitName}`,
    REVISI_DIMINTA:      `[Smart Santri] Dokumen ${jenis} Anda Perlu Direvisi`,
    SUDAH_DITERIMA:      `[Smart Santri] Dana Diterima & Saldo Diperbarui — ${unitName}`,
  }

  const messages: Record<EmailEvent, string> = {
    RKA_SUBMITTED:       `Terdapat <strong>${jumlahKegiatan} kegiatan</strong> baru dari bidang <strong>${bidang}</strong> (${unitName}) yang memerlukan review Anda.`,
    LPJ_SUBMITTED:       `LPJ dari bidang <strong>${bidang}</strong> (${unitName}) sudah masuk dan menunggu review Anda.`,
    FORWARDED_TO_KEPALA: `Rekapitulasi ${jenis} dari <strong>${unitName} / ${bidang}</strong> telah diverifikasi Bendahara Unit dan menunggu persetujuan Anda.`,
    APPROVED_TO_PUSAT:   `Dokumen ${jenis} dari <strong>${unitName}</strong> telah mendapat persetujuan Kepala Unit dan menunggu otorisasi akhir Anda.`,
    DANA_CAIR:           `Dana sejumlah <strong>${nominalFmt}</strong> untuk kegiatan bulan <strong>${bulan} ${tahun}</strong> telah resmi dicairkan. Silakan konfirmasi penerimaan di aplikasi.`,
    REVISI_DIMINTA:      `Dokumen ${jenis} Anda untuk periode <strong>${bulan} ${tahun}</strong> (${unitName}) dikembalikan untuk diperbaiki.<br>Catatan: <em>"${catatanRevisi || '-'}"</em>`,
    SUDAH_DITERIMA:      `Dana untuk kegiatan bulan <strong>${bulan} ${tahun}</strong> (${unitName}) telah dikonfirmasi diterima dan saldo unit telah diperbarui secara otomatis.`,
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#064e3b,#065f46);padding:28px 32px;">
            <span style="font-size:18px;font-weight:900;color:#fff;">🕌 Smart Santri</span><br>
            <span style="font-size:10px;color:#6ee7b7;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Sistem Informasi Akuntansi Pesantren</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Kepada Yth.</p>
            <p style="margin:0 0 24px;font-size:18px;font-weight:900;color:#0f172a;">${toName}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.7;">${messages[event]}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;margin-bottom:20px;">
              <tr><td style="padding:20px;">
                <table width="100%" cellpadding="4" cellspacing="0">
                  <tr>
                    <td style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;width:40%;">Unit</td>
                    <td style="font-size:12px;font-weight:800;color:#0f172a;">${unitName}</td>
                  </tr>
                  <tr>
                    <td style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;">Bidang</td>
                    <td style="font-size:12px;font-weight:800;color:#0f172a;">${bidang}</td>
                  </tr>
                  <tr>
                    <td style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;">Periode</td>
                    <td style="font-size:12px;font-weight:800;color:#0f172a;">${bulan} ${tahun}</td>
                  </tr>
                  <tr>
                    <td style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;">Total Nominal</td>
                    <td style="font-size:14px;font-weight:900;color:#065f46;">${nominalFmt}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#065f46;border-radius:12px;">
                  <a href="${APP_URL}/admin" style="display:inline-block;padding:14px 28px;color:#fff;font-size:11px;font-weight:900;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
                    Buka Aplikasi Smart Santri →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">Email ini dikirim otomatis oleh sistem Smart Santri. Jangan balas email ini.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;font-size:10px;color:#cbd5e1;text-transform:uppercase;letter-spacing:1.5px;">© 2025 Smart Santri · Sistem Akuntansi Digital Pesantren</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    if (!resend) {
      console.warn('[Smart Santri Email] Skipping email, RESEND_API_KEY is not set');
      return;
    }
    
    await resend.emails.send({
      from: process.env.NEXT_PUBLIC_FROM_EMAIL || 'Smart Santri <onboarding@resend.dev>',
      to: toEmail,
      subject: subjects[event],
      html
    })
  } catch (err) {
    // Intentionally silent — email failure must NOT break the main transaction
    console.error('[Smart Santri Email Error]', err)
  }
}
