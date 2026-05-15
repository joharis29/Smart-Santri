'use client';

import { useState } from 'react';
import Link from 'next/link';
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [expensesOpen, setExpensesOpen] = useState(false);

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
                                    <Link href="/admin/pengajuan/buat" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                        <FileText className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                        <span>Buat Pengajuan</span>
                                    </Link>
                                    <Link href="/admin/realisasi/buat" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                        <ClipboardCheck className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                        <span>Buat Realisasi Anggaran</span>
                                    </Link>
                                    <Link href="/admin/pengajuan/draft-saya" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                        <PlusCircle className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                        <span>Draft Saya (Personal)</span>
                                    </Link>
                                    <Link href="/admin/pengajuan/rekap" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                        <CheckSquare className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                        <span>Rekap Draft (Bendahara)</span>
                                    </Link>
                                    <Link href="/admin/pengajuan/riwayat" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                        <ClipboardCheck className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                        <span>Riwayat Pengajuan</span>
                                    </Link>
                                    <Link href="/admin/realisasi/riwayat" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                        <History className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                        <span>Riwayat Dokumen</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Link href="/admin/laporan/buku-besar" className="flex items-center gap-3 px-3 py-2 hover:bg-emerald-800 hover:text-white rounded-lg transition-all group text-sm">
                            <BarChart3 className="w-4 h-4 opacity-70 group-hover:opacity-100 shrink-0" />
                            <span className="truncate">Laporan (Buku Besar)</span>
                        </Link>
                        
                        {/* Pengaturan Menu */}
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
                                    <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                        <Users className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 shrink-0" />
                                        <span className="truncate">Manajemen User</span>
                                    </Link>
                                    <Link href="/admin/roles" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                        <ShieldAlert className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 shrink-0" />
                                        <span className="truncate">Manajemen Role</span>
                                    </Link>
                                    <Link href="/admin/pengaturan/rka-referensi" className="flex items-center gap-3 px-3 py-2 text-emerald-100/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-all group text-xs font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400"></div>
                                        <FileText className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 shrink-0" />
                                        <span className="truncate">Program</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </nav>

                    <div className="p-4 border-t border-emerald-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center border border-emerald-600 shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-emerald-300 font-medium">Aktif Sebagai</p>
                                <p className="text-xs font-bold text-white truncate">Bendahara / Staf</p>
                            </div>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all font-bold text-xs">
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
