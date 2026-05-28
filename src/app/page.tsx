'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    ShieldCheck,
    Menu,
    X,
    PlayCircle,
    LayoutDashboard,
    AlertTriangle,
    History,
    Clock,
    CheckCircle2,
    FileSearch2,
    ArrowUpRightFromCircle,
    Lock,
    BookOpen,
    Layers,
    Mail,
    Phone,
    MapPin,
    ChevronDown,
    FileText,
    BarChart3,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
    const [open, setOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                if (session) setIsLoggedIn(true);
            } catch (err) {
                console.error('Error checking auth state:', err);
            }
        };
        checkAuth();
    }, []);

    return (
        <div className="font-sans text-slate-900 bg-white overflow-x-hidden relative min-h-screen">
            <style dangerouslySetInnerHTML={{
                __html: `
        .islamic-pattern {
            background-color: #ffffff;
            background-image: url("https://www.transparenttextures.com/patterns/arabesque.png");
            opacity: 0.95;
        }
        .hero-gradient {
            background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
        }
      `}} />

            {/* Islamic pattern wrapper */}
            <div className="islamic-pattern fixed inset-0 z-[-1] pointer-events-none"></div>

            <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary p-2 rounded-lg">
                                <ShieldCheck className="text-accent w-6 h-6" />
                            </div>
                            <span className="font-serif text-2xl font-bold text-primary tracking-tight">Smart <span className="text-accent">Santri</span></span>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/artikel" className="font-medium text-secondary hover:text-accent transition-colors">Artikel</Link>
                            <Link href="/tentang-kami" className="font-medium text-secondary hover:text-accent transition-colors">Tentang Kami</Link>
                            <div className="flex items-center gap-4">
                                <Link href="/admin" className="px-5 py-2 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent hover:text-white transition-all">
                                    {isLoggedIn ? 'Dasbor' : 'Log In'}
                                </Link>
                                <button onClick={(e) => { e.preventDefault(); setIsContactModalOpen(true); }} className="px-5 py-2 bg-accent text-white font-semibold rounded-lg shadow-lg shadow-amber-200 hover:bg-accent-hover transition-all">Hubungi Kami</button>
                            </div>
                        </div>

                        <button onClick={() => setOpen(!open)} className="md:hidden text-primary">
                            {!open ? <Menu /> : <X />}
                        </button>
                    </div>
                </div>

                {open && (
                    <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-lg absolute w-full">
                        <Link href="/artikel" onClick={() => setOpen(false)} className="block font-medium py-2 text-secondary hover:text-primary">Artikel</Link>
                        <Link href="/tentang-kami" onClick={() => setOpen(false)} className="block font-medium py-2 text-secondary hover:text-primary">Tentang Kami</Link>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                            <Link href="/admin" onClick={() => setOpen(false)} className="text-center py-2 border-2 border-accent text-accent rounded-lg font-semibold">
                                {isLoggedIn ? 'Dasbor' : 'Log In'}
                            </Link>
                            <button onClick={(e) => { e.preventDefault(); setOpen(false); setIsContactModalOpen(true); }} className="text-center py-2 bg-accent text-white rounded-lg font-semibold">Hubungi Kami</button>
                        </div>
                    </div>
                )}
            </nav>

            <section id="home" className="pt-20 pb-16 md:pt-24 md:pb-20 hero-gradient text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/islamic-art.png')" }}></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                                Wujudkan Tata Kelola Keuangan Pesantren yang <span className="text-accent italic">Amanah</span>, Transparan, dan Sesuai Syariah.
                            </h1>
                            Tinggalkan pencatatan manual yang berisiko. Beralihlah ke SMART SANTRI—Sistem Informasi Akuntansi berbasis web untuk menjaga kemurnian harta pesantren.
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/register" className="px-8 py-4 bg-accent text-primary font-bold rounded-xl text-center hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2">
                                    <PlayCircle className="w-5 h-5" /> Coba Demo Sistem
                                </Link>
                                <a href="#problem" className="px-8 py-4 border-2 border-white/30 hover:border-white text-white font-bold rounded-xl text-center transition-all flex items-center justify-center gap-2">
                                    Pelajari Lebih Lanjut
                                </a>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
                                <div className="bg-slate-50 rounded-xl aspect-[4/3] overflow-hidden border border-slate-200 relative group flex flex-col shadow-inner">
                                    
                                    {/* Top Navigation Mock */}
                                    <div className="h-8 md:h-10 bg-white border-b border-slate-200 flex items-center px-4 justify-between z-10 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                            <span className="text-[10px] md:text-xs font-bold text-primary tracking-tight">Smart Santri</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-3 bg-slate-100 rounded-full hidden sm:block"></div>
                                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-100 border border-emerald-200"></div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-1 overflow-hidden">
                                        {/* Sidebar Mock */}
                                        <div className="w-12 md:w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-10 shadow-sm">
                                            <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center"><LayoutDashboard className="w-3 h-3 md:w-4 md:h-4 text-emerald-600"/></div>
                                            <div className="w-6 h-6 md:w-8 md:h-8 rounded hover:bg-slate-50 flex items-center justify-center transition-colors"><FileText className="w-3 h-3 md:w-4 md:h-4 text-slate-400"/></div>
                                            <div className="w-6 h-6 md:w-8 md:h-8 rounded hover:bg-slate-50 flex items-center justify-center transition-colors"><BarChart3 className="w-3 h-3 md:w-4 md:h-4 text-slate-400"/></div>
                                        </div>
                                        
                                        {/* Main Content Mock */}
                                        <div className="flex-1 p-4 md:p-6 bg-slate-50 flex flex-col gap-4">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-[9px] md:text-[11px] text-slate-500 mb-1 font-medium">Total Saldo Yayasan</div>
                                                    <div className="text-sm md:text-lg font-black text-slate-800 tracking-tight">Rp 1.250.000.000</div>
                                                </div>
                                                <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[8px] md:text-[10px] font-bold rounded">Bulan Ini</div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="text-[8px] md:text-[10px] text-slate-500 mb-1 font-medium">Pemasukan</div>
                                                    <div className="text-xs md:text-sm font-bold text-emerald-600">+ Rp 150.000.000</div>
                                                </div>
                                                <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="text-[8px] md:text-[10px] text-slate-500 mb-1 font-medium">Pengeluaran</div>
                                                    <div className="text-xs md:text-sm font-bold text-red-500">- Rp 45.000.000</div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex-1">
                                                <div className="text-[9px] md:text-xs font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">Aktivitas Terakhir</div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2 md:gap-3">
                                                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center"><ChevronRight className="w-3 h-3 text-emerald-500"/></div>
                                                            <div className="text-[9px] md:text-[11px] text-slate-600 font-medium">Penerimaan SPP</div>
                                                        </div>
                                                        <div className="text-[9px] md:text-[11px] font-bold text-emerald-600">+ Rp 2.500.000</div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2 md:gap-3">
                                                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-50 border border-red-100 flex items-center justify-center"><ChevronRight className="w-3 h-3 text-red-500"/></div>
                                                            <div className="text-[9px] md:text-[11px] text-slate-600 font-medium">Operasional Dapur</div>
                                                        </div>
                                                        <div className="text-[9px] md:text-[11px] font-bold text-red-500">- Rp 1.200.000</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interactive Overlay */}
                                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/90 transition-colors duration-500 flex flex-col items-center justify-center pointer-events-none z-20">
                                        <div className="opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-500 bg-white p-4 rounded-full shadow-2xl mb-3">
                                            <LayoutDashboard className="w-8 h-8 text-primary" />
                                        </div>
                                        <p className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 text-emerald-50 font-bold text-sm tracking-wide">
                                            Masuk ke Dasbor
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-accent p-4 rounded-lg shadow-xl hidden md:block z-20">
                                <p className="text-primary font-bold text-sm">✓ Terintegrasi ISAK 335</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blinking Scroll Arrow */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-20">
                    <a href="#problem" className="text-accent hover:text-white transition-colors" aria-label="Scroll Down">
                        <ChevronDown className="w-8 h-8 opacity-80" />
                    </a>
                </div>
            </section>

            <section id="problem" className="py-20 bg-gray-50 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">Mengubah &quot;Kepercayaan Lisan&quot; Menjadi &quot;Sistem Terintegrasi&quot;</h2>
                        <p className="text-slate-600 italic">Smart Santri hadir mendigitalkan Tata Kelola Keuangan untuk menjaga amanah.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-500 transition-colors">
                                <AlertTriangle className="text-red-600 group-hover:text-white" />
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-primary">Percampuran Dana</h3>
                            <p className="text-slate-600 leading-relaxed">Risiko tercampurnya dana zakat, wakaf, dan operasional yang membahayakan kepatuhan syariah.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
                                <History className="text-amber-600 group-hover:text-white" />
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-primary">Jejak Audit Lemah</h3>
                            <p className="text-slate-600 leading-relaxed">Sulit menelusuri penanggung jawab pengeluaran di masa lalu karena dokumentasi fisik yang berantakan.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
                                <Clock className="text-emerald-600 group-hover:text-white" />
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-primary">Manual & Lambat</h3>
                            <p className="text-slate-600 leading-relaxed">Proses persetujuan yang memakan waktu lama menghambat mobilitas program dakwah pesantren.</p>
                        </div>
                    </div>
                </div>

                {/* Blinking Scroll Arrow */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-20">
                    <a href="#about" className="text-emerald-600/40 hover:text-emerald-600 transition-colors" aria-label="Scroll Down">
                        <ChevronDown className="w-8 h-8" />
                    </a>
                </div>
            </section>

            <section id="about" className="py-20 overflow-hidden bg-white relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <div className="relative">
                                <div className="absolute -top-4 -left-4 w-64 h-64 bg-accent/20 rounded-full blur-3xl"></div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/philosophy-logo.png" alt="Logo Filosofi Smart Santri" className="rounded-3xl shadow-2xl relative z-10 border-8 border-white w-full h-auto object-cover aspect-square" />
                            </div>
                        </div>
                        <div className="lg:w-1/2">
                            <span className="text-accent font-bold tracking-widest uppercase text-sm">Filosofi Kami</span>
                            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-4 mb-6">Garda Digital: Penjaga Amanah di Era Modern</h2>
                            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                                Kami percaya bahwa teknologi bukan sekadar alat, melainkan wasilah untuk memastikan setiap rupiah yang dititipkan umat dikelola dengan standar akuntansi tertinggi.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-accent mt-1 shrink-0" />
                                    <span className="text-slate-700 font-medium">Validasi Akad otomatis di setiap transaksi.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="text-accent mt-1 shrink-0" />
                                    <span className="text-slate-700 font-medium">Pemisahan entitas dana sesuai regulasi organisasi nirlaba.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Blinking Scroll Arrow */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-20">
                    <a href="#features" className="text-emerald-600/40 hover:text-emerald-600 transition-colors" aria-label="Scroll Down">
                        <ChevronDown className="w-8 h-8" />
                    </a>
                </div>
            </section>

            <section id="features" className="py-20 bg-white relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-primary rounded-[3rem] p-8 md:p-16 border-4 border-accent relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck className="w-64 h-64 text-white" />
                        </div>

                        <div className="relative z-10 text-center mb-12">
                            <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-4">Validator Kepatuhan Syariah Otomatis</h2>
                            <p className="text-emerald-100 text-lg">Fitur premium pertama yang menjamin kepatuhan syariah secara waktu nyata (real-time).</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 relative z-10">
                            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                                <div className="text-accent mb-4"><FileSearch2 className="w-10 h-10" /></div>
                                <h4 className="text-white font-bold text-xl mb-2">Deteksi Akad Otomatis</h4>
                                <p className="text-emerald-50/70 text-sm">Kecerdasan buatan yang mengklasifikasikan transaksi sesuai standar ISAK 335, Pedoman Akuntansi Pesantren (PAP), dan Juknis BOS.</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                                <div className="text-accent mb-4"><ArrowUpRightFromCircle className="w-10 h-10" /></div>
                                <h4 className="text-white font-bold text-xl mb-2">Validasi Peruntukan</h4>
                                <p className="text-emerald-50/70 text-sm">Mencegah penggunaan Dana Zakat/Wakaf untuk keperluan operasional yang tidak sesuai akad serta Dana BOS yang tidak sesuai regulasi.</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                                <div className="text-accent mb-4"><Lock className="w-10 h-10" /></div>
                                <h4 className="text-white font-bold text-xl mb-2">Pencegahan Preventif</h4>
                                <p className="text-emerald-50/70 text-sm">Memberikan rekomendasi audit cerdas melalui teknologi <i>Retrieval-Augmented Generation (RAG)</i> saat terdeteksi ketidaksesuaian antara dana dan akad.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blinking Scroll Arrow */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-20">
                    <a href="#pondasi" className="text-emerald-600/40 hover:text-emerald-600 transition-colors" aria-label="Scroll Down">
                        <ChevronDown className="w-8 h-8" />
                    </a>
                </div>
            </section>

            <section id="pondasi" className="py-20 bg-slate-50 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-serif text-center text-3xl md:text-4xl font-bold text-primary mb-16">Dua Pondasi Kokoh</h2>
                    <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl">
                        <div className="bg-emerald-800 p-12 text-white">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-accent rounded-lg text-primary"><BookOpen /></div>
                                <h3 className="text-2xl font-bold">Kepatuhan Syariah, ISAK 335 & PAP</h3>
                            </div>
                            <p className="text-emerald-100 leading-relaxed mb-6">
                                Menjamin transparansi dengan memisahkan Dana Dengan Pembatasan (Zakat/Wakaf Terikat) dan Dana Tanpa Pembatasan (Operasional/Infaq Umum).
                            </p>
                            <div className="bg-white/10 p-4 rounded-lg text-sm italic">
                                &quot;Setiap pengeluaran kas harus memiliki dasar hukum syar&apos;i dan bukti dokumentasi yang sah.&quot;
                            </div>
                        </div>
                        <div className="bg-white p-12 text-slate-800 border-y md:border-y-0 md:border-r">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-primary rounded-lg text-accent"><Layers /></div>
                                <h3 className="text-2xl font-bold text-primary">Pengendalian Internal (Kerangka COSO)</h3>
                            </div>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Mengurangi risiko <i>human error</i> dan <i>fraud</i> melalui sistem otorisasi berjenjang dan pencatatan jejak audit digital yang permanen.
                            </p>
                            <div className="flex gap-4">
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase tracking-wider">Otorisasi</span>
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase tracking-wider">Jejak Audit</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blinking Scroll Arrow */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-20">
                    <a href="#alur" className="text-emerald-600/40 hover:text-emerald-600 transition-colors" aria-label="Scroll Down">
                        <ChevronDown className="w-8 h-8" />
                    </a>
                </div>
            </section>

            <section id="alur" className="py-20 bg-white relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-serif text-center text-3xl font-bold text-primary mb-16">Alur Kerja Sistem Keuangan</h2>
                    <div className="relative">
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-emerald-100 -translate-y-1/2"></div>

                        <div className="grid md:grid-cols-5 gap-4 relative z-10">
                            <div className="bg-white p-4 lg:p-6 rounded-xl border-2 border-emerald-50 text-center shadow-lg">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary text-accent rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4 font-bold text-sm lg:text-base">1</div>
                                <h4 className="font-bold text-primary text-sm lg:text-base">Staf Unit</h4>
                                <p className="text-[11px] lg:text-xs text-slate-500 mt-2 leading-relaxed">Input pengajuan dana & unggah bukti</p>
                            </div>
                            <div className="bg-white p-4 lg:p-6 rounded-xl border-2 border-emerald-50 text-center shadow-lg">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary text-accent rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4 font-bold text-sm lg:text-base">2</div>
                                <h4 className="font-bold text-primary text-sm lg:text-base">Bendahara Unit</h4>
                                <p className="text-[11px] lg:text-xs text-slate-500 mt-2 leading-relaxed">Verifikasi awal & ketersediaan dana</p>
                            </div>
                            <div className="bg-white p-4 lg:p-6 rounded-xl border-2 border-emerald-50 text-center shadow-lg">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary text-accent rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4 font-bold text-sm lg:text-base">3</div>
                                <h4 className="font-bold text-primary text-sm lg:text-base">Kepala Unit</h4>
                                <p className="text-[11px] lg:text-xs text-slate-500 mt-2 leading-relaxed">Persetujuan program & anggaran</p>
                            </div>
                            <div className="bg-white p-4 lg:p-6 rounded-xl border-2 border-emerald-50 text-center shadow-lg">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary text-accent rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4 font-bold text-sm lg:text-base">4</div>
                                <h4 className="font-bold text-primary text-sm lg:text-base">Bendahara Pusat</h4>
                                <p className="text-[11px] lg:text-xs text-slate-500 mt-2 leading-relaxed">Validasi akhir & eksekusi pencairan</p>
                            </div>
                            <div className="bg-white p-4 lg:p-6 rounded-xl border-2 border-emerald-50 text-center shadow-lg">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary text-accent rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4 font-bold text-sm lg:text-base">5</div>
                                <h4 className="font-bold text-primary text-sm lg:text-base">Pimpinan</h4>
                                <p className="text-[11px] lg:text-xs text-slate-500 mt-2 leading-relaxed">Pengawasan & pemantauan strategis</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blinking Scroll Arrow */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-20">
                    <a href="#footer" className="text-emerald-600/40 hover:text-emerald-600 transition-colors" aria-label="Scroll Down">
                        <ChevronDown className="w-8 h-8" />
                    </a>
                </div>
            </section>

            <footer id="footer" className="bg-primary text-white pt-20 pb-10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">Akuntabilitas Ganda: <br /><span className="text-accent underline decoration-wavy underline-offset-8">Kepada Umat dan Kepada Allah SWT.</span></h2>
                        <p className="text-emerald-200 text-lg mt-6">Smart Santri - Mendigitalkan Kepercayaan, Menjamin Kepatuhan Syariah.</p>
                    </div>

                    <hr className="border-emerald-800 mb-8" />

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-emerald-300">
                        <div className="flex items-center gap-2">
                            <div className="bg-accent p-1 rounded">
                                <ShieldCheck className="text-primary w-4 h-4" />
                            </div>
                            <span className="font-bold text-white">Smart Santri © 2026</span>
                        </div>
                        <div className="text-center md:text-right">
                            <p>Dikembangkan oleh: <span className="text-white font-semibold">Sidqi Alaudin Johari</span></p>
                            <p className="text-xs opacity-70">Mahasiswa Akuntansi Syariah, Universitas Tazkia.</p>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Contact Modal */}
            {isContactModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsContactModalOpen(false)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsContactModalOpen(false); }} role="button" tabIndex={0} aria-label="Tutup modal kontak"></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-emerald-100">
                        <div className="bg-primary p-6 text-white text-center relative">
                            <button onClick={() => setIsContactModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="font-serif text-2xl font-bold mb-2 tracking-tight">Hubungi Kami</h3>
                            <p className="text-emerald-100 text-sm">Ada pertanyaan? Kami siap membantu Anda.</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors shadow-inner">
                                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Administrator</p>
                                    <p className="text-lg font-black text-slate-800">Admin Sidqi</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <a href="mailto:sidqi.johari@gmail.com" className="flex items-center gap-4 p-3 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all group">
                                    <div className="p-2 bg-slate-50 group-hover:bg-white rounded-lg transition-colors">
                                        <Mail className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                                    </div>
                                    <span className="text-slate-600 font-medium group-hover:text-emerald-700">sidqi.johari@gmail.com</span>
                                </a>

                                <a href="https://wa.me/628141986019" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all group">
                                    <div className="p-2 bg-slate-50 group-hover:bg-white rounded-lg transition-colors">
                                        <Phone className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                                    </div>
                                    <span className="text-slate-600 font-medium group-hover:text-emerald-700">+62 814 1986 019</span>
                                </a>

                                <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 mt-2">
                                    <div className="p-2 bg-white rounded-lg shadow-sm mt-1 shrink-0">
                                        <MapPin className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 mb-1">Kantor Pusat</p>
                                        <p className="text-[13px] text-slate-500 leading-relaxed">
                                            Jl. Ir.H. Djuanda No.78, Sentul, Kota Bogor, Jawa Barat 16810
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}