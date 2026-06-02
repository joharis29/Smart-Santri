import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Test insert transaksi_pendapatan for 'SDIT 1'
    const { error: insErr } = await supabase
        .from('transaksi_pendapatan')
        .insert([{
            tanggal: new Date().toISOString().split('T')[0],
            unit: 'SDIT 1',
            sumber_dana: 'Dana Pesantren/Yayasan',
            nominal: 100,
            jenis_penerimaan: 'Transfer',
            nama_bank: '-',
            keterangan: 'Test Debug RKA',
        }]);

    // Test insert pengeluaran for Pusat
    const { error: expErr } = await supabase
        .from('transaksi_pengeluaran')
        .insert([{
            tanggal: new Date().toISOString().split('T')[0],
            unit: 'Pusat (Yayasan)',
            sumber_dana: 'Dana SPP',
            nominal: 100,
            metode_pencairan: 'Transfer',
            nama_bank: '-',
            keterangan: 'Test Debug RKA',
        }]);

    return NextResponse.json({ 
        pendapatan_error: insErr || null,
        pengeluaran_error: expErr || null 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
