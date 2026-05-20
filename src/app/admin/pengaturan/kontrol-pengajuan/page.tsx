'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
    Sliders, 
    Building2, 
    Lock, 
    Unlock, 
    RefreshCw, 
    AlertTriangle, 
    CheckCircle2, 
    ToggleLeft, 
    ToggleRight,
    Settings,
    FileText,
    CheckSquare
} from 'lucide-react';

interface KontrolStatus {
    unit_name: string;
    rka_aktif: boolean;
    lpj_aktif: boolean;
    updated_at?: string;
}

export default function KontrolPengajuanPage() {
    const [statusList, setStatusList] = useState<KontrolStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null); // tracks unit_name being updated
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // List of standard pesantren units to guarantee display parity
    const STANDARDIZED_UNITS = [
        'Pusat (Yayasan)',
        'TK',
        'Diniyah',
        'SDIT 1',
        'SDIT 2',
        'MTs',
        'MA',
        'THQ',
        'Asrama Putra',
        'Asrama Putri',
        'Dapur Asrama Putra',
        'Dapur Asrama Putri'
    ];

    useEffect(() => {
        loadKontrolStatus();
    }, []);

    const loadKontrolStatus = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('kontrol_pengajuan')
                .select('*')
                .order('unit_name', { ascending: true });

            if (error) throw error;

            if (data) {
                // Ensure all standard units and GLOBAL exist in the state
                const mappedData = [...data];
                
                // Add default GLOBAL if missing
                if (!mappedData.find(d => d.unit_name === 'GLOBAL')) {
                    mappedData.push({ unit_name: 'GLOBAL', rka_aktif: true, lpj_aktif: true });
                }

                // Add default standard units if missing
                STANDARDIZED_UNITS.forEach(unit => {
                    if (!mappedData.find(d => d.unit_name === unit)) {
                        mappedData.push({ unit_name: unit, rka_aktif: true, lpj_aktif: true });
                    }
                });

                // Sort list to put GLOBAL at the very top, and the rest alphabetically
                mappedData.sort((a, b) => {
                    if (a.unit_name === 'GLOBAL') return -1;
                    if (b.unit_name === 'GLOBAL') return 1;
                    return a.unit_name.localeCompare(b.unit_name);
                });

                setStatusList(mappedData);
            }
        } catch (err: any) {
            console.error("Error loading kontrol status:", err);
            setErrorMessage("Gagal memuat data kontrol akses pengajuan. Pastikan skrip SQL migrasi sudah dijalankan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (unitName: string, type: 'rka' | 'lpj', currentVal: boolean) => {
        setIsSaving(unitName);
        setErrorMessage(null);
        setSuccessMessage(null);

        const updatedVal = !currentVal;
        const payload = {
            unit_name: unitName,
            [type === 'rka' ? 'rka_aktif' : 'lpj_aktif']: updatedVal,
            updated_at: new Date().toISOString()
        };

        try {
            const supabase = createClient();
            
            // Perform Upsert so that any missing record is dynamically created in Supabase
            const { error } = await supabase
                .from('kontrol_pengajuan')
                .upsert(payload, { onConflict: 'unit_name' });

            if (error) throw error;

            // Update local state instantly
            setStatusList(prev => prev.map(item => {
                if (item.unit_name === unitName) {
                    return {
                        ...item,
                        [type === 'rka' ? 'rka_aktif' : 'lpj_aktif']: updatedVal
                    };
                }
                return item;
            }));

            setSuccessMessage(`Berhasil memperbarui akses ${type === 'rka' ? 'RKA (Pengajuan)' : 'LPJ (Realisasi)'} untuk ${unitName === 'GLOBAL' ? 'Semua Unit' : unitName}`);
            
            // Auto hide success toast
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            console.error("Error updating toggle:", err);
            setErrorMessage(`Gagal menyimpan perubahan untuk ${unitName}. Silakan coba lagi.`);
        } finally {
            setIsSaving(null);
        }
    };

    const globalConfig = statusList.find(d => d.unit_name === 'GLOBAL') || { rka_aktif: true, lpj_aktif: true };
    const unitConfigs = statusList.filter(d => d.unit_name !== 'GLOBAL');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Memuat Konfigurasi Gerbang Pengajuan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 bg-slate-50/50 min-h-screen">
            
            {/* Header Title Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-3 rounded-[1.25rem] text-white shadow-xl shadow-slate-200">
                        <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none mb-1">Kontrol Pengajuan & LPJ</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manajemen Aktivasi Pengisian Formulir RKA & LPJ Pesantren</p>
                    </div>
                </div>

                <button 
                    onClick={loadKontrolStatus}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
            </div>

            {/* Error / Success Toast Messages */}
            {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <p className="text-xs font-bold">{errorMessage}</p>
                </div>
            )}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-xs font-bold">{successMessage}</p>
                </div>
            )}

            {/* 1. GLOBAL GATEWAYS PANEL (Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* GLOBAL RKA CARD */}
                <div className={`p-6 rounded-[2.5rem] border transition-all ${
                    globalConfig.rka_aktif 
                        ? 'bg-gradient-to-br from-emerald-50/50 to-white border-emerald-200 shadow-sm shadow-emerald-50' 
                        : 'bg-gradient-to-br from-slate-100 to-white border-slate-200'
                }`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl ${
                                globalConfig.rka_aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                            }`}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight leading-none mb-1">Global Pengajuan (RKA)</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Pengisian RKA Seluruh Unit</p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleToggle('GLOBAL', 'rka', globalConfig.rka_aktif)}
                            disabled={isSaving !== null}
                            className="focus:outline-none disabled:opacity-50 transition-opacity"
                        >
                            {globalConfig.rka_aktif ? (
                                <ToggleRight className="w-12 h-8 text-emerald-600 cursor-pointer" />
                            ) : (
                                <ToggleLeft className="w-12 h-8 text-slate-400 cursor-pointer" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-slate-100">
                        {globalConfig.rka_aktif ? (
                            <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Akses RKA Terbuka Secara Global</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Semua Pengisian RKA Dikunci Sementara</span>
                            </>
                        )}
                    </div>
                </div>

                {/* GLOBAL LPJ CARD */}
                <div className={`p-6 rounded-[2.5rem] border transition-all ${
                    globalConfig.lpj_aktif 
                        ? 'bg-gradient-to-br from-emerald-50/50 to-white border-emerald-200 shadow-sm shadow-emerald-50' 
                        : 'bg-gradient-to-br from-slate-100 to-white border-slate-200'
                }`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-2xl ${
                                globalConfig.lpj_aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                            }`}>
                                <CheckSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight leading-none mb-1">Global Realisasi (LPJ)</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status Laporan LPJ Seluruh Unit</p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleToggle('GLOBAL', 'lpj', globalConfig.lpj_aktif)}
                            disabled={isSaving !== null}
                            className="focus:outline-none disabled:opacity-50 transition-opacity"
                        >
                            {globalConfig.lpj_aktif ? (
                                <ToggleRight className="w-12 h-8 text-emerald-600 cursor-pointer" />
                            ) : (
                                <ToggleLeft className="w-12 h-8 text-slate-400 cursor-pointer" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-slate-100">
                        {globalConfig.lpj_aktif ? (
                            <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Akses LPJ Terbuka Secara Global</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Semua Pengisian LPJ Dikunci Sementara</span>
                            </>
                        )}
                    </div>
                </div>

            </div>

            {/* 2. UNIT SPECIFIC GRID CONTROL */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-base font-black text-slate-800 tracking-tight uppercase leading-none mb-1">Akses Pengajuan Per Unit & Jenjang</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matriks Izin Pengisian Dokumen Anggaran Per Sekolah/Lembaga</p>
                    </div>

                    {!globalConfig.rka_aktif || !globalConfig.lpj_aktif ? (
                        <div className="bg-amber-50 text-amber-800 border border-amber-200 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Catatan: Pengunci Global Sedang Aktif
                        </div>
                    ) : null}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-full lg:min-w-0">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">Unit / Jenjang Pesantren</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center w-1/4">Form Buat Pengajuan (RKA)</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center w-1/4">Form Buat LPJ (Realisasi)</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center w-1/6">Indikator Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {unitConfigs.map((config) => {
                                const isRkaAllowed = globalConfig.rka_aktif && config.rka_aktif;
                                const isLpjAllowed = globalConfig.lpj_aktif && config.lpj_aktif;

                                return (
                                    <tr key={config.unit_name} className="hover:bg-slate-50/50 transition-colors group">
                                        
                                        {/* Unit Name Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-650 shrink-0">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 leading-none mb-1">{config.unit_name}</p>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Pesantren Smart Santri</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* RKA Toggle Switch */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => handleToggle(config.unit_name, 'rka', config.rka_aktif)}
                                                    disabled={isSaving !== null}
                                                    className="focus:outline-none disabled:opacity-50 transition-all"
                                                >
                                                    {config.rka_aktif ? (
                                                        <ToggleRight className="w-10 h-7 text-emerald-600 cursor-pointer" />
                                                    ) : (
                                                        <ToggleLeft className="w-10 h-7 text-slate-400 cursor-pointer" />
                                                    )}
                                                </button>
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${
                                                    config.rka_aktif ? 'text-emerald-700' : 'text-slate-400'
                                                }`}>
                                                    {config.rka_aktif ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* LPJ Toggle Switch */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => handleToggle(config.unit_name, 'lpj', config.lpj_aktif)}
                                                    disabled={isSaving !== null}
                                                    className="focus:outline-none disabled:opacity-50 transition-all"
                                                >
                                                    {config.lpj_aktif ? (
                                                        <ToggleRight className="w-10 h-7 text-emerald-600 cursor-pointer" />
                                                    ) : (
                                                        <ToggleLeft className="w-10 h-7 text-slate-400 cursor-pointer" />
                                                    )}
                                                </button>
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${
                                                    config.lpj_aktif ? 'text-emerald-700' : 'text-slate-400'
                                                }`}>
                                                    {config.lpj_aktif ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Cumulative Gated Indicator Badge */}
                                        <td className="px-6 py-4 text-center">
                                            {isRkaAllowed && isLpjAllowed ? (
                                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider rounded-lg border border-emerald-100">
                                                    Fully Open
                                                </span>
                                            ) : !isRkaAllowed && !isLpjAllowed ? (
                                                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[8px] font-black uppercase tracking-wider rounded-lg border border-rose-100">
                                                    Fully Locked
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[8px] font-black uppercase tracking-wider rounded-lg border border-amber-100">
                                                    Partially Gated
                                                </span>
                                            )}
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Notes */}
                <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Total: {unitConfigs.length} Unit Pesantren Terdaftar
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-normal">
                        *Perubahan status saklar akan langsung diterapkan secara instan (real-time) ke seluruh user unit terkait.
                    </p>
                </div>

            </div>

        </div>
    );
}
