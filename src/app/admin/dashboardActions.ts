'use server'

import { createAdminClient, createClient } from '@/utils/supabase/server';

export async function getDashboardBalances(activeUnit: string, activeTahunAjaran: string) {
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Bypassing RLS so Kepala Unit and Bendahara Unit see EXACTLY the same thing
    const adminClient = createAdminClient();

    // 1. Fetch Dompet Dana
    const { data: dompetData } = await adminClient
        .from('dompet_dana')
        .select('*, unit:unit_id(name)');

    // 2. Fetch Pengaturan Sumber Dana
    const { data: sourcesData } = await adminClient
        .from('pengaturan_sumber_dana')
        .select('nama_sumber_dana, kategori_pembatasan')
        .eq('unit_name', activeUnit.trim());

    // 3. Fetch Transaksi (Tahun Ajaran Aktif)
    const [startYear] = activeTahunAjaran.split('/').map(Number);
    const endYear = startYear + 1;
    const firstDay = `${startYear}-07-01`;
    const lastDay = `${endYear}-06-30`;

    const { data: txOutTA } = await adminClient
        .from('transaksi_pengeluaran')
        .select('nominal, sumber_dana')
        .eq('unit', activeUnit.trim())
        .gte('tanggal', firstDay)
        .lte('tanggal', lastDay);

    const { data: txInTA } = await adminClient
        .from('transaksi_pendapatan')
        .select('nominal, sumber_dana')
        .eq('unit', activeUnit.trim())
        .gte('tanggal', firstDay)
        .lte('tanggal', lastDay);

    // 4. Fetch Transaksi (All Time for exactBalances)
    const { data: allTxOut } = await adminClient
        .from('transaksi_pengeluaran')
        .select('nominal, sumber_dana')
        .eq('unit', activeUnit.trim());
        
    const { data: allTxIn } = await adminClient
        .from('transaksi_pendapatan')
        .select('nominal, sumber_dana')
        .eq('unit', activeUnit.trim());

    return {
        dompetData,
        sourcesData,
        txOutTA,
        txInTA,
        allTxOut,
        allTxIn
    };
}
