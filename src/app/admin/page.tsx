'use client';

import { useState } from 'react';
import {
    ShieldCheck,
    LayoutGrid,
    FileText,
    CheckSquare,
    History,
    BarChart3,
    User,
    LogOut,
    Menu,
    Vault,
    GraduationCap,
    Wallet,
    Filter,
    Download,
    Shield
} from 'lucide-react';

export default function DashboardKeuangan() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="font-sans antialiased bg-slate-custom text-slate-900 min-h-screen">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-primary text-emerald-100 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    <div className="p-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-accent p-2 rounded-xl">
                                <ShieldCheck className="text-primary w-6 h-6" />
                            </div>
                            <span className="text-xl font-extrabold text-white tracking-tight">
                                Smart <span className="text-accent">Santri</span>
                            </span>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 space-y-2">
                        <a href="#" className="flex items-center gap-4 px-4 py-3 bg-emerald-800 text-white rounded-xl transition-all">
                            <LayoutGrid className="w-5 h-5" />
                            <span className="font-semibold">Beranda</span>
                        </a>
                        <a href="#" className="flex items-center gap-4 px-4 py-3 hover:bg-emerald-800 hover:text-white rounded-xl transition-all group">
                            <FileText className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                            <span>Pengajuan</span>
                        </a>
                        <a href="#" className="flex items-center gap-4 px-4 py-3 hover:bg-emerald-800 hover:text-white rounded-xl transition-all group">
                            <CheckSquare className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                            <span>Approval</span>
                            <span className="ml-auto bg-accent text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">3 Baru</span>
                        </a>
                        <a href="#" className="flex items-center gap-4 px-4 py-3 hover:bg-emerald-800 hover:text-white rounded-xl transition-all group">
                            <History className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                            <span>Riwayat</span>
                        </a>
                        <a href="#" className="flex items-center gap-4 px-4 py-3 hover:bg-emerald-800 hover:text-white rounded-xl transition-all group">
                            <BarChart3 className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                            <span>Laporan</span>
                        </a>
                    </nav>

                    <div className="p-6 border-t border-emerald-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center border border-emerald-600">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-300 font-medium">Aktif Sebagai</p>
                                <p className="text-sm font-bold text-white">Bendahara Unit (Pusat)</p>
                            </div>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all font-bold text-sm">
                            <LogOut className="w-4 h-4" />
                            Keluar Sistem
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-72 min-h-screen">
                <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                    <div className="flex items-center justify-between px-8 py-5">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            >
                                <Menu />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Keuangan Pesantren</h1>
                                <p className="text-sm text-slate-500 font-medium">Real-time monitoring dana (Restricted vs Unrestricted)</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status Sistem</p>
                                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 justify-end">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Sinkronisasi Aktif
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border-l-8 border-accent p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">Restricted</span>
                                <Vault className="text-slate-300 w-5 h-5" />
                            </div>
                            <p className="text-slate-500 text-sm font-semibold mb-1">Dana Wakaf / Zakat</p>
                            <h3 className="text-2xl font-extrabold text-primary tracking-tight">Rp 150.000.000</h3>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-50 pt-3">
                                <Shield className="w-3.5 h-3.5 text-accent" />
                                <span>Sharia Compliance Validator Active</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border-l-8 border-accent p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">Restricted</span>
                                <GraduationCap className="text-slate-300 w-5 h-5" />
                            </div>
                            <p className="text-slate-500 text-sm font-semibold mb-1">Dana BOS / Pendidikan</p>
                            <h3 className="text-2xl font-extrabold text-primary tracking-tight">Rp 100.000.000</h3>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-50 pt-3">
                                <Shield className="w-3.5 h-3.5 text-accent" />
                                <span>Sharia Compliance Validator Active</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border-l-8 border-emerald-500 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">Unrestricted</span>
                                <Wallet className="text-slate-300 w-5 h-5" />
                            </div>
                            <p className="text-slate-500 text-sm font-semibold mb-1">Dana Bebas / Operasional</p>
                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rp 45.000.000</h3>
                            <p className="mt-4 text-[10px] text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-1 rounded">Siap Digunakan Tanpa Syarat Akad Khusus</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Aktivitas Transaksi & Jejak Audit</h2>
                                <p className="text-xs text-slate-500 font-medium">Pencatatan real-time siklus pengeluaran kas pesantren.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200">
                                    <Filter className="w-4 h-4" />
                                </button>
                                <button className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tgl</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 text-sm text-slate-600 font-medium whitespace-nowrap">05 Feb 2026</td>
                                        <td className="px-8 py-5 text-sm font-bold text-primary">Tahfidz Putri</td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-slate-800">Beli Kitab Itmamu Ni&apos;mah</p>
                                            <p className="text-[10px] text-slate-400">Dana: Wakaf Terikat</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">PND</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="px-4 py-1.5 border border-emerald-600 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-600 hover:text-white transition-all">Lihat</button>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 text-sm text-slate-600 font-medium whitespace-nowrap">04 Feb 2026</td>
                                        <td className="px-8 py-5 text-sm font-bold text-primary">Operasional</td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-slate-800">Biaya Listrik Kantor</p>
                                            <p className="text-[10px] text-slate-400">Dana: Unrestricted</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">ACC</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all">Cair</button>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 text-sm text-slate-600 font-medium whitespace-nowrap">04 Feb 2026</td>
                                        <td className="px-8 py-5 text-sm font-bold text-primary">Asrama Putra</td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-slate-800">Pembelian AC Kamar</p>
                                            <p className="text-[10px] text-slate-400">Dana: Zakat (Inappropriate)</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">REJ</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="px-4 py-1.5 border border-slate-300 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed">Lihat</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="text-center text-slate-400 text-xs">
                        <p>&copy; 2026 Smart Santri - Dirancang untuk Akuntabilitas Umat oleh Sidqi Alaudin Johari.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}