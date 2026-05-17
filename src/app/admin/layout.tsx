'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { switchActiveProfile } from './users/actions';
import {
    ShieldCheck,
    LayoutGrid,
    FileText,
    CheckSquare,
    History,
    BarChart3,
    User,
    Users,
    LogOut,
    Menu,
    ClipboardCheck,
    Settings,
    ChevronDown,
    ChevronRight,
    ShieldAlert,
    PlusCircle,
    Banknote
} from 'lucide-react';

const UNITS = [
    'Pusat (Yayasan)', 'TK', 'SDIT 1', 'SDIT 2', 'MTs', 'MA', 'Diniyah', 
    'Asrama Putra', 'Asrama Putri', 'THQ', 'Dapur Asrama Putra', 'Dapur Asrama Putri'
];

function hasMenuAccess(role: string, path: string): boolean {
    if (!role) return true; // Default fallback to avoid layout break while loading
    const cleanRole = role.toUpperCase();
    
    // Admin has access to everything
    if (cleanRole === 'ADMINISTRATOR') return true;

    switch (path) {
        case '/admin/users': // Manajemen Pengguna
        case '/admin/roles': // Manajemen Peran
            return cleanRole === 'ADMINISTRATOR';

        case '/admin/pengaturan/rka-referensi': // Program
            return ['BENDAHARA_PUSAT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT'].includes(cleanRole);

        case '/admin/laporan/buku-besar': // Laporan (Buku Besar)
            return ['BENDAHARA_PUSAT', 'PIMPINAN'].includes(cleanRole);

        case '/admin/pendapatan/buat': // Input Pendapatan
            return ['BENDAHARA_PUSAT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT'].includes(cleanRole);

        case '/admin/pengajuan/buat': // Buat Pengajuan
        case '/admin/realisasi/buat': // Buat LPJ
        case '/admin/pengajuan/draft-saya': // Draft Saya
            return ['BENDAHARA_JENJANG', 'BENDAHARA_UNIT', 'STAFF', 'STAFF_BIDANG'].includes(cleanRole);

        case '/admin/pengajuan/rekap': // Rekap Draft (Bendahara)
            return ['BENDAHARA_JENJANG', 'BENDAHARA_UNIT'].includes(cleanRole);

        case '/admin/pengajuan/riwayat': // Riwayat Pengajuan
        case '/admin/realisasi/riwayat': // Riwayat Dokumen
            return ['BENDAHARA_PUSAT', 'PIMPINAN', 'KEPALA_JENJANG', 'KEPALA_UNIT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT', 'STAFF', 'STAFF_BIDANG'].includes(cleanRole);

        default:
            return true;
    }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [expensesOpen, setExpensesOpen] = useState(false);
    const [incomeOpen, setIncomeOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<{ name: string; role: string } | null>(null);
    const [actualRole, setActualRole] = useState<string>('');
    const [activeRole, setActiveRole] = useState<string>('');
    const [activeUnit, setActiveUnit] = useState<string>('Pusat (Yayasan)');
    const [assignedRoles, setAssignedRoles] = useState<{ role: string; unit_name: string }[]>([]);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const supabase = createClient();
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) return;

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, role, unit_id')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profile) return;

                setActualRole(profile.role);

                // Fetch multi-roles from database
                const { data: multiRoles } = await supabase
                    .from('profiles_multi_role')
                    .select('role, unit_id, unit(name)')
                    .eq('user_id', user.id);

                if (multiRoles) {
                    const formatted = multiRoles.map((r: any) => ({
                        role: r.role,
                        unit_name: r.unit?.name || 'Pusat (Yayasan)'
                    }));
                    setAssignedRoles(formatted);
                }

                // Load simulated role and unit from localStorage, or fallback to real database profile
                const savedRole = localStorage.getItem('activeRole') || profile.role;
                const savedUnit = localStorage.getItem('activeUnit') || 'Pusat (Yayasan)';
                
                setActiveRole(savedRole);
                setActiveUnit(savedUnit);

                // Pre-populate if not set
                if (!localStorage.getItem('activeRole')) localStorage.setItem('activeRole', profile.role);
                if (!localStorage.getItem('activeUnit')) localStorage.setItem('activeUnit', savedUnit);

                const mapRoleToDisplay = (roleDb: string) => {
                    switch (roleDb) {
                        case 'ADMINISTRATOR': return 'Administrator';
                        case 'BENDAHARA_PUSAT': return 'Bendahara Pusat';
                        case 'PIMPINAN': return 'Pimpinan Pesantren';
                        case 'BENDAHARA_JENJANG': return 'Bendahara Jenjang';
                        case 'KEPALA_JENJANG': return 'Kepala Jenjang';
                        case 'KEPALA_UNIT': return 'Kepala Unit';
                        case 'BENDAHARA_UNIT': return 'Bendahara Unit';
                        case 'STAFF_BIDANG': return 'Staf Bidang';
                        case 'STAFF': return 'Staf Unit';
                        default: return 'Staf';
                    }
                };

                setUserProfile({
                    name: profile.full_name,
                    role: mapRoleToDisplay(savedRole) // Display the ACTIVE simulated role in the sidebar info card
                });
            } catch (err) {
                console.error('Error fetching layout profile:', err);
            }
        };

        const interval = setInterval(() => {
            const savedRole = localStorage.getItem('activeRole');
            const savedUnit = localStorage.getItem('activeUnit');
            if (savedRole && savedRole !== activeRole) {
                setActiveRole(savedRole);
            }
            if (savedUnit && savedUnit !== activeUnit) {
                setActiveUnit(savedUnit);
            }
        }, 500);

        fetchProfile();
        return () => clearInterval(interval);
    }, [activeRole, activeUnit]);

    const handleLogout = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/login';
        } catch (err) {
            console.error('Error during sign out:', err);
        }
    };

    return (
        <div className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-primary)] text-emerald-100 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-6">
                        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="bg-[var(--color-accent)] p-2 rounded-xl">
                                <ShieldCheck className="text-[var(--color-primary)] w-5 h-5" />
                            </div>
                            <span className="text-lg font-extrabold text-white tracking-tight">
                                Smart <span className="text-[var(--color-accent)]">Santri</span>
                            </span>
                        </Link>
                    </div>

                    <nav className="flex-1 px-4 space-y-1">
                        <Link href="/admin" className="flex items-center gap-3 px-3 py-2 hover:bg-emerald-800 hover:text-white rounded-lg transition-all group text-sm">
                            <LayoutGrid className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                            <span className="font-semibold">Dasbor</span>
                        </Link>

                        {/* Menu Pengeluaran (Dropdown) */}
                        {(hasMenuAccess(activeRole, '/admin/pengajuan/buat') ||
                          hasMenuAccess(activeRole, '/admin/realisasi/buat') ||
                          hasMenuAccess(activeRole, '/admin/pengajuan/draft-saya') ||
                          hasMenuAccess(activeRole, '/admin/pengajuan/rekap') ||
                          hasMenuAccess(activeRole, '/admin/pengajuan/riwayat') ||
                          hasMenuAccess(activeRole, '/admin/realisasi/riwayat')) && (
                            <div className="pt-1">
                                <button 
                                    onClick={() => setExpensesOpen(!expensesOpen)}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-emerald-800 hover:text-white rounded-lg transition-all group text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <Banknote className="w-4 h-4 opacity-70 group-hover:opacity-100 shrink-0" />
                                        <span className="font-semibold truncate">Pengeluaran</span>
                                    </div>
                                    {expensesOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                                </button>
                                
                                {expensesOpen && (
                                    <div className="mt-1 space-y-1 px-3">
                                        {hasMenuAccess(activeRole, '/admin/pengajuan/buat') && (
                                            <Link href="/admin/pengajuan/buat" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                                <FileText className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                                <span>Buat Pengajuan</span>
                                            </Link>
                                        )}
                                        {hasMenuAccess(activeRole, '/admin/realisasi/buat') && (
                                            <Link href="/admin/realisasi/buat" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                                <ClipboardCheck className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                                <span>Buat Realisasi Anggaran</span>
                                            </Link>
                                        )}
                                        {hasMenuAccess(activeRole, '/admin/pengajuan/draft-saya') && (
                                            <Link href="/admin/pengajuan/draft-saya" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                                <PlusCircle className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                                <span>Draft Saya (Personal)</span>
                                            </Link>
                                        )}
                                        {hasMenuAccess(activeRole, '/admin/pengajuan/rekap') && (
                                            <Link href="/admin/pengajuan/rekap" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                                <CheckSquare className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                                <span>Rekap Draft (Bendahara)</span>
                                            </Link>
                                        )}
                                        {hasMenuAccess(activeRole, '/admin/pengajuan/riwayat') && (
                                            <Link href="/admin/pengajuan/riwayat" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                                <ClipboardCheck className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                                <span>Riwayat Pengajuan</span>
                                            </Link>
                                        )}
                                        {hasMenuAccess(activeRole, '/admin/realisasi/riwayat') && (
                                            <Link href="/admin/realisasi/riwayat" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                                <History className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                                <span>Riwayat Dokumen</span>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Menu Pemasukan (Dropdown) */}
                        {hasMenuAccess(activeRole, '/admin/pendapatan/buat') && (
                            <div className="pt-1">
                                <button 
                                    onClick={() => setIncomeOpen(!incomeOpen)}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-emerald-800 hover:text-white rounded-lg transition-all group text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <PlusCircle className="w-4 h-4 opacity-70 group-hover:opacity-100 shrink-0" />
                                        <span className="font-semibold truncate">Pemasukan</span>
                                    </div>
                                    {incomeOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                                </button>
                                
                                {incomeOpen && (
                                    <div className="mt-1 space-y-1 px-3">
                                        <Link href="/admin/pendapatan/buat" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                            <FileText className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                            <span>Input Pendapatan</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {hasMenuAccess(activeRole, '/admin/laporan/buku-besar') && (
                            <Link href="/admin/laporan/buku-besar" className="flex items-center gap-3 px-3 py-2 hover:bg-emerald-800 hover:text-white rounded-lg transition-all group text-sm">
                                <BarChart3 className="w-4 h-4 opacity-70 group-hover:opacity-100 shrink-0" />
                                <span className="truncate">Laporan (Buku Besar)</span>
                            </Link>
                        )}
                        
                        {/* Pengaturan Menu */}
                        {(hasMenuAccess(activeRole, '/admin/users') ||
                          hasMenuAccess(activeRole, '/admin/roles') ||
                          hasMenuAccess(activeRole, '/admin/pengaturan/rka-referensi')) && (
                            <div className="pt-2">
                                <button 
                                    onClick={() => setSettingsOpen(!settingsOpen)}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-emerald-800 hover:text-white rounded-lg transition-all group text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <Settings className="w-4 h-4 opacity-70 group-hover:opacity-100 shrink-0" />
                                        <span className="font-semibold truncate">Pengaturan</span>
                                    </div>
                                    {settingsOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                                </button>
                                
                                {settingsOpen && (
                                    <div className="mt-1 space-y-1 px-3">
                                        {hasMenuAccess(activeRole, '/admin/users') && (
                                            <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                                <Users className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 shrink-0" />
                                                <span className="truncate">Manajemen Pengguna</span>
                                            </Link>
                                        )}
                                        {hasMenuAccess(activeRole, '/admin/roles') && (
                                            <Link href="/admin/roles" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                                <ShieldAlert className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 shrink-0" />
                                                <span className="truncate">Manajemen Peran</span>
                                            </Link>
                                        )}
                                        {hasMenuAccess(activeRole, '/admin/pengaturan/rka-referensi') && (
                                            <Link href="/admin/pengaturan/rka-referensi" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                                <FileText className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 shrink-0" />
                                                <span className="truncate">Program</span>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </nav>

                    <div className="p-4 border-t border-emerald-800 space-y-3">
                        {/* Interactive User Info Card / Switch Trigger */}
                        <div 
                            onClick={() => (actualRole === 'ADMINISTRATOR' || actualRole === 'BENDAHARA_PUSAT' || assignedRoles.length > 1) && setProfileMenuOpen(!profileMenuOpen)}
                            className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                                (actualRole === 'ADMINISTRATOR' || actualRole === 'BENDAHARA_PUSAT' || assignedRoles.length > 1) 
                                    ? 'hover:bg-emerald-800/40 cursor-pointer border border-transparent hover:border-emerald-700/30' 
                                    : ''
                            }`}
                            title={`Pengguna: ${userProfile ? userProfile.name : ''}. Klik untuk ganti peran/unit.`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center border border-emerald-600 shrink-0 text-white font-bold text-xs shadow-inner">
                                    {userProfile ? userProfile.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] text-emerald-300 font-extrabold uppercase tracking-wider truncate flex items-center gap-1">
                                        {userProfile ? userProfile.role : 'Aktif Sebagai'}
                                        {(actualRole === 'ADMINISTRATOR' || actualRole === 'BENDAHARA_PUSAT' || assignedRoles.length > 1) && (
                                            <span className="inline-block px-1 py-0.5 rounded-[4px] bg-emerald-500/25 text-[7px] text-emerald-300 font-black tracking-widest uppercase">
                                                Multi
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs font-bold text-white truncate">
                                        {activeUnit}
                                    </p>
                                </div>
                            </div>
                            {(actualRole === 'ADMINISTRATOR' || actualRole === 'BENDAHARA_PUSAT' || assignedRoles.length > 1) && (
                                <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-300 shrink-0 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                            )}
                        </div>

                        {/* Inline Expandable Switcher Panel */}
                        {profileMenuOpen && (
                            <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/60 space-y-2.5 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Pilih Peran & Unit</label>
                                    <select 
                                        value={`${activeRole}:${activeUnit}`}
                                        onChange={async (e) => {
                                            const [newRole, newUnit] = e.target.value.split(':');
                                            const res = await switchActiveProfile({ role: newRole, unitName: newUnit });
                                            if (res.success) {
                                                localStorage.setItem('activeRole', newRole);
                                                localStorage.setItem('activeUnit', newUnit);
                                                window.location.reload();
                                            } else {
                                                alert(res.error || 'Gagal mengubah peran/unit aktif');
                                            }
                                        }}
                                        className="w-full bg-emerald-900 border border-emerald-800 rounded-lg py-1.5 px-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer text-xs"
                                    >
                                        {assignedRoles.length > 0 ? (
                                            assignedRoles.map((r, idx) => {
                                                const mapRoleToName = (roleDb: string) => {
                                                    switch (roleDb) {
                                                        case 'ADMINISTRATOR': return '👑 Administrator';
                                                        case 'BENDAHARA_PUSAT': return '💰 Bendahara Pusat';
                                                        case 'BENDAHARA_UNIT': return '💵 Bendahara Unit';
                                                        case 'KEPALA_UNIT': return '👤 Kepala Unit';
                                                        case 'STAFF': return '📝 Staf Unit';
                                                        case 'PIMPINAN': return '👴 Pimpinan';
                                                        default: return roleDb;
                                                    }
                                                };
                                                return (
                                                    <option key={idx} value={`${r.role}:${r.unit_name}`}>
                                                        {mapRoleToName(r.role)} - {r.unit_name}
                                                    </option>
                                                );
                                            })
                                        ) : (
                                            <option value={`${activeRole}:${activeUnit}`}>
                                                {activeRole} - {activeUnit}
                                            </option>
                                        )}
                                    </select>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all font-bold text-xs"
                        >
                            <LogOut className="w-4 h-4" />
                            Keluar Sistem
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen flex flex-col">
                <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            >
                                <Menu />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sistem Informasi Akuntansi</h1>
                                <p className="text-sm text-slate-500 font-medium">Pesantren Smart Santri</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 bg-slate-50/50">
                    {children}
                </div>
            </main>
        </div>
    );
}
