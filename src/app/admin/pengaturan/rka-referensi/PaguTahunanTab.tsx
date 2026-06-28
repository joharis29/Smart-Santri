'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';

export function PaguTahunanTab({ isCentral, units }: { isCentral: boolean, units: string[] }) {
    const [paguData, setPaguData] = useState<any[]>([]);
    const [periodeAktif, setPeriodeAktif] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: '', unit: '', sumber_dana: '', nominal_pagu: 0 });

    const SUMBER_DANA = ['Dana BOS', 'Dana Pesantren/Yayasan', 'Subsidi Pesantren', 'Tabungan Siswa', 'Infaq Siswa', 'Uang Saku', 'Kas Internal'];

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Get Active Period
            const { data: period } = await supabase.from('periode_anggaran').select('*').eq('status', 'AKTIF').maybeSingle();
            if (period) {
                setPeriodeAktif(period);
                // Get Pagu for active period
                const { data: pagu } = await supabase.from('pagu_unit').select('*').eq('periode_id', period.id);
                if (pagu) setPaguData(pagu);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!periodeAktif) return alert("Tidak ada periode aktif!");
        setIsSaving(true);
        try {
            const payload = {
                periode_id: periodeAktif.id,
                unit: formData.unit,
                sumber_dana: formData.sumber_dana,
                nominal_pagu: formData.nominal_pagu
            };

            if (formData.id) {
                await supabase.from('pagu_unit').update(payload).eq('id', formData.id);
            } else {
                await supabase.from('pagu_unit').insert(payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            alert('Gagal menyimpan Pagu. Pastikan kombinasi Unit & Sumber Dana belum ada.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Hapus pagu ini?')) {
            await supabase.from('pagu_unit').delete().eq('id', id);
            fetchData();
        }
    };

    if (!isCentral) {
        return <div className="p-8 text-center text-rose-500 font-bold bg-white rounded-xl shadow-sm border border-rose-100">Hanya Administrator/Pusat yang dapat mengatur Pagu Tahunan.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-black text-slate-800">Pagu Anggaran Tahunan</h2>
                    <p className="text-[10px] font-bold text-slate-500">
                        Periode Aktif: <span className="text-emerald-600">{periodeAktif ? periodeAktif.tahun_ajaran : 'Belum Ada'}</span>
                    </p>
                </div>
                <button 
                    onClick={() => { setFormData({ id: '', unit: units[0] || '', sumber_dana: SUMBER_DANA[0], nominal_pagu: 0 }); setIsModalOpen(true); }}
                    disabled={!periodeAktif}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white font-black px-4 py-2 rounded-lg text-[10px] hover:bg-emerald-700 disabled:opacity-50"
                >
                    <Plus className="w-3.5 h-3.5" /> Tambah Pagu
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px] relative">
                {isLoading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>}
                
                <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Unit</th>
                            <th className="px-4 py-3">Sumber Dana</th>
                            <th className="px-4 py-3 text-right">Pagu Maksimal (Rp)</th>
                            <th className="px-4 py-3 text-right">Terpakai (Rp)</th>
                            <th className="px-4 py-3 text-right">Sisa Pagu (Rp)</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                        {paguData.length === 0 && !isLoading && (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-400">Belum ada pagu ditetapkan.</td></tr>
                        )}
                        {paguData.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2 text-slate-800">{item.unit}</td>
                                <td className="px-4 py-2 text-emerald-700 bg-emerald-50/30">{item.sumber_dana}</td>
                                <td className="px-4 py-2 text-right">{Number(item.nominal_pagu).toLocaleString('id-ID')}</td>
                                <td className="px-4 py-2 text-right text-rose-600">{Number(item.terpakai).toLocaleString('id-ID')}</td>
                                <td className="px-4 py-2 text-right text-emerald-600">{Number(item.sisa_pagu).toLocaleString('id-ID')}</td>
                                <td className="px-4 py-2 text-center">
                                    <button onClick={() => { setFormData(item); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-emerald-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4">
                        <h3 className="text-xs font-black text-slate-800 uppercase mb-4">Set Pagu Unit</h3>
                        <form onSubmit={handleSave} className="space-y-3">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase">Unit</label>
                                <select className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs font-bold" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} required>
                                    <option value="">Pilih...</option>
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase">Sumber Dana</label>
                                <select className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs font-bold" value={formData.sumber_dana} onChange={e => setFormData({...formData, sumber_dana: e.target.value})} required>
                                    <option value="">Pilih...</option>
                                    {SUMBER_DANA.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase">Nominal Pagu (Rp)</label>
                                <input type="number" className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs font-bold" value={formData.nominal_pagu} onChange={e => setFormData({...formData, nominal_pagu: Number(e.target.value)})} required min="0" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-black text-slate-500 bg-slate-100 rounded-lg">Batal</button>
                                <button type="submit" disabled={isSaving} className="flex-1 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
