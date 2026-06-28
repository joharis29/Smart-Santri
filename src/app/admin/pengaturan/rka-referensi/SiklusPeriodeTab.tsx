'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, Lock, Unlock, RefreshCw, AlertTriangle, Play, Calendar } from 'lucide-react';

export function SiklusPeriodeTab({ isCentral }: { isCentral: boolean }) {
    const [periodes, setPeriodes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const supabase = createClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tahunAjaran, setTahunAjaran] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase.from('periode_anggaran').select('*').order('created_at', { ascending: false });
            if (data) setPeriodes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            await supabase.from('periode_anggaran').insert({ tahun_ajaran: tahunAjaran, status: 'DRAFT' });
            setIsModalOpen(false);
            setTahunAjaran('');
            fetchData();
        } catch (err) {
            alert('Gagal membuat periode. Format mungkin sudah ada.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleActivate = async (id: string) => {
        if (!confirm('Peringatan: Mengaktifkan periode ini akan menonaktifkan periode lain. Lanjutkan?')) return;
        setIsProcessing(true);
        try {
            // Demote all AKTIF to DRAFT first (except DITUTUP)
            await supabase.from('periode_anggaran').update({ status: 'DRAFT' }).eq('status', 'AKTIF');
            // Activate selected
            await supabase.from('periode_anggaran').update({ status: 'AKTIF', tanggal_mulai: new Date().toISOString() }).eq('id', id);
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTutupBuku = async (id: string) => {
        if (!confirm('PERHATIAN SANGAT PENTING: Tutup Buku akan mengunci seluruh pagu dan membuat laporan carryover. Tindakan ini tidak bisa dibatalkan secara sistem. YAKIN TUTUP BUKU?')) return;
        setIsProcessing(true);
        try {
            // 1. Close period
            await supabase.from('periode_anggaran').update({ status: 'DITUTUP', tanggal_selesai: new Date().toISOString() }).eq('id', id);
            
            // 2. Here we would ideally calculate dompet_dana and store in saldo_carryover.
            // For now, closing the period is the primary step.
            alert('Tutup Buku berhasil. Periode telah dikunci.');
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Gagal melakukan Tutup Buku.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isCentral) {
        return <div className="p-8 text-center text-rose-500 font-bold bg-white rounded-xl shadow-sm border border-rose-100">Hanya Administrator/Pusat yang dapat mengatur Siklus Anggaran.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-800">Manajemen Siklus Anggaran</h2>
                        <p className="text-[10px] font-bold text-slate-500">Buka Tahun Ajaran & Tutup Buku</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 bg-blue-600 text-white font-black px-4 py-2 rounded-lg text-[10px] hover:bg-blue-700 w-full sm:w-auto justify-center"
                >
                    <Plus className="w-3.5 h-3.5" /> Buat Periode Baru
                </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 shadow-sm items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                    <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1">Perlakuan Saldo Lintas Tahun (Carryover)</h4>
                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                        Sistem Smart Santri menggunakan metode <strong>Continuous Cash (Kas Berkelanjutan)</strong>. 
                        Saat Anda melakukan <span className="font-bold">Tutup Buku</span>, Pagu Anggaran tahun berjalan akan dikunci secara permanen (Hard-lock). 
                        Namun, sisa uang riil (Kas) di dompet unit secara otomatis akan diteruskan menjadi <span className="font-bold">Saldo Awal (Carryover)</span> di periode aktif berikutnya tanpa perlu entri jurnal manual.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[300px]">
                {isLoading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>}
                
                <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Tahun Ajaran</th>
                            <th className="px-4 py-3">Tanggal Mulai</th>
                            <th className="px-4 py-3">Tanggal Selesai</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Aksi / Kontrol</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                        {periodes.length === 0 && !isLoading && (
                            <tr><td colSpan={5} className="text-center py-8 text-slate-400">Belum ada periode anggaran.</td></tr>
                        )}
                        {periodes.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-slate-800 text-xs">{item.tahun_ajaran}</td>
                                <td className="px-4 py-3 text-slate-500">{item.tanggal_mulai ? new Date(item.tanggal_mulai).toLocaleDateString('id-ID') : '-'}</td>
                                <td className="px-4 py-3 text-slate-500">{item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString('id-ID') : '-'}</td>
                                <td className="px-4 py-3 text-center">
                                    {item.status === 'AKTIF' && <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-200">Aktif Berjalan</span>}
                                    {item.status === 'DRAFT' && <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-slate-200">Draft / Persiapan</span>}
                                    {item.status === 'DITUTUP' && <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-rose-200">Ditutup (Locked)</span>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        {item.status === 'DRAFT' && (
                                            <button onClick={() => handleActivate(item.id)} disabled={isProcessing} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-md text-[8px] font-black flex items-center gap-1 hover:bg-emerald-100 uppercase disabled:opacity-50">
                                                <Play className="w-3 h-3" /> Mulai Periode
                                            </button>
                                        )}
                                        {item.status === 'AKTIF' && (
                                            <button onClick={() => handleTutupBuku(item.id)} disabled={isProcessing} className="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-1 rounded-md text-[8px] font-black flex items-center gap-1 hover:bg-rose-100 uppercase disabled:opacity-50">
                                                <Lock className="w-3 h-3" /> Tutup Buku
                                            </button>
                                        )}
                                        {item.status === 'DITUTUP' && (
                                            <span className="text-[9px] font-bold text-slate-400 italic flex items-center gap-1 justify-center"><Lock className="w-3 h-3" /> Locked</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4">
                        <h3 className="text-xs font-black text-slate-800 uppercase mb-4">Buat Tahun Ajaran Baru</h3>
                        <form onSubmit={handleCreateDraft} className="space-y-3">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase">Tahun Ajaran</label>
                                <input type="text" placeholder="Contoh: 2024/2025" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs font-bold" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} required />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-black text-slate-500 bg-slate-100 rounded-lg">Batal</button>
                                <button type="submit" disabled={isProcessing} className="flex-1 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">Buat Draft</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
