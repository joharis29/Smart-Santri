'use client';

import { useState } from 'react';
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
    Layers
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
    const [open, setOpen] = useState(false);

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
                            <a href="#features" className="font-medium text-secondary hover:text-accent transition-colors">Artikel</a>
                            <a href="#about" className="font-medium text-secondary hover:text-accent transition-colors">Tentang Kami</a>
                            <div className="flex items-center gap-4">
                                <Link href="/admin" className="px-5 py-2 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent hover:text-white transition-all">Log In</Link>
                                <a href="#" className="px-5 py-2 bg-accent text-white font-semibold rounded-lg shadow-lg shadow-amber-200 hover:bg-accent-hover transition-all">Hubungi Kami</a>
                            </div>
                        </div>

                        <button onClick={() => setOpen(!open)} className="md:hidden text-primary">
                            {!open ? <Menu /> : <X />}
                        </button>
                    </div>
                </div>

                {open && (
                    <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-lg absolute w-full">
                        <a href="#features" onClick={() => setOpen(false)} className="block font-medium py-2 text-secondary hover:text-primary">Artikel</a>
                        <a href="#about" onClick={() => setOpen(false)} className="block font-medium py-2 text-secondary hover:text-primary">Tentang Kami</a>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                            <Link href="/admin" onClick={() => setOpen(false)} className="text-center py-2 border-2 border-accent text-accent rounded-lg font-semibold">Log In</Link>
                            <a href="#" onClick={() => setOpen(false)} className="text-center py-2 bg-accent text-white rounded-lg font-semibold">Hubungi Kami</a>
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
                            <p className="text-emerald-100 text-lg md:text-xl mb-8 leading-relaxed">
                                Tinggalkan pencatatan manual yang berisiko. Beralihlah ke SMART SANTRI—Sistem Informasi Akuntansi Kas berbasis web untuk menjaga kemurnian harta pesantren.
                            </p>
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
                                <div className="bg-slate-800 rounded-xl aspect-video flex items-center justify-center overflow-hidden border border-slate-700 relative group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000" alt="Dashboard Preview" className="opacity-80 group-hover:scale-110 transition-transform duration-500 w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-primary/80 p-4 rounded-full">
                                            <LayoutDashboard className="w-12 h-12 text-accent" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-accent p-4 rounded-lg shadow-xl hidden md:block z-20">
                                <p className="text-primary font-bold text-sm">✓ Terintegrasi ISAK 35</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="problem" className="py-20 bg-gray-50 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">Mengubah &quot;Kepercayaan Lisan&quot; Menjadi &quot;Sistem Terintegrasi&quot;</h2>
                        <p className="text-slate-600 italic">Smart Santri hadir mendigitalkan Siklus Pengeluaran Kas untuk menjaga amanah.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-500 transition-colors">
                                <AlertTriangle className="text-red-600 group-hover:text-white" />
                            </div>
                            <h3 className="font-bold text-xl mb-3 text-primary">Fund Commingling</h3>
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
            </section>

            <section id="about" className="py-20 overflow-hidden bg-white relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <div className="relative">
                                <div className="absolute -top-4 -left-4 w-64 h-64 bg-accent/20 rounded-full blur-3xl"></div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://images.unsplash.com/photo-1584291527905-f930791814b0?auto=format&fit=crop&q=80&w=800" alt="Philosophy" className="rounded-3xl shadow-2xl relative z-10 border-8 border-white w-full h-auto" />
                            </div>
                        </div>
                        <div className="lg:w-1/2">
                            <span className="text-accent font-bold tracking-widest uppercase text-sm">Filosofi Kami</span>
                            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-4 mb-6">Digital Guard: Penjaga Amanah di Era Modern</h2>
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
            </section>

            <section id="features" className="py-20 bg-white relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-primary rounded-[3rem] p-8 md:p-16 border-4 border-accent relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck className="w-64 h-64 text-white" />
                        </div>

                        <div className="relative z-10 text-center mb-12">
                            <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-4">Automated Sharia Compliance Validator</h2>
                            <p className="text-emerald-100 text-lg">Fitur premium pertama yang menjamin kepatuhan syariah secara real-time.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 relative z-10">
                            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                                <div className="text-accent mb-4"><FileSearch2 className="w-10 h-10" /></div>
                                <h4 className="text-white font-bold text-xl mb-2">Deteksi Akad Otomatis</h4>
                                <p className="text-emerald-50/70 text-sm">Kecerdasan buatan yang mengklasifikasikan transaksi sesuai standar ISAK 35.</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                                <div className="text-accent mb-4"><ArrowUpRightFromCircle className="w-10 h-10" /></div>
                                <h4 className="text-white font-bold text-xl mb-2">Validasi Peruntukan</h4>
                                <p className="text-emerald-50/70 text-sm">Mencegah penggunaan Dana Wakaf untuk keperluan operasional yang tidak sesuai akad.</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                                <div className="text-accent mb-4"><Lock className="w-10 h-10" /></div>
                                <h4 className="text-white font-bold text-xl mb-2">Pencegahan Preventif</h4>
                                <p className="text-emerald-50/70 text-sm">Fitur <i>Auto-Reject</i> jika sistem mendeteksi ketidaksesuaian antara dana dan akad.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-slate-50 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-serif text-center text-3xl md:text-4xl font-bold text-primary mb-16">Dua Pondasi Kokoh</h2>
                    <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl">
                        <div className="bg-emerald-800 p-12 text-white">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-accent rounded-lg text-primary"><BookOpen /></div>
                                <h3 className="text-2xl font-bold">Kepatuhan Syariah & Regulasi (ISAK 35)</h3>
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
                                <h3 className="text-2xl font-bold text-primary">Pengendalian Internal (COSO Framework)</h3>
                            </div>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Mengurangi risiko <i>human error</i> dan <i>fraud</i> melalui sistem otorisasi berjenjang dan pencatatan jejak audit digital yang permanen.
                            </p>
                            <div className="flex gap-4">
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase tracking-wider">Otorisasi</span>
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase tracking-wider">Audit Trail</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-white relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-serif text-center text-3xl font-bold text-primary mb-16">Alur Kerja Sistem Keuangan</h2>
                    <div className="relative">
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-emerald-100 -translate-y-1/2"></div>

                        <div className="grid md:grid-cols-4 gap-8 relative z-10">
                            <div className="bg-white p-6 rounded-xl border-2 border-emerald-50 text-center shadow-lg">
                                <div className="w-12 h-12 bg-primary text-accent rounded-full flex items-center justify-center mx-auto mb-4 font-bold">1</div>
                                <h4 className="font-bold text-primary">Staf Unit</h4>
                                <p className="text-xs text-slate-500 mt-2">Input pengajuan dana & unggah bukti/RAB</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border-2 border-emerald-50 text-center shadow-lg">
                                <div className="w-12 h-12 bg-primary text-accent rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
                                <h4 className="font-bold text-primary">Kepala Unit</h4>
                                <p className="text-xs text-slate-500 mt-2">Verifikasi kesesuaian program & anggaran</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border-2 border-emerald-50 text-center shadow-lg">
                                <div className="w-12 h-12 bg-primary text-accent rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
                                <h4 className="font-bold text-primary">Pimpinan</h4>
                                <p className="text-xs text-slate-500 mt-2">Otorisasi strategis (Persetujuan Akhir)</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border-2 border-emerald-50 text-center shadow-lg">
                                <div className="w-12 h-12 bg-primary text-accent rounded-full flex items-center justify-center mx-auto mb-4 font-bold">4</div>
                                <h4 className="font-bold text-primary">Bendahara</h4>
                                <p className="text-xs text-slate-500 mt-2">Eksekusi pembayaran & pencatatan jurnal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12 bg-gray-50 border-y border-gray-100 relative z-10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Powering by Modern Tech Stack</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 grayscale opacity-60">
                        <span className="text-2xl font-black text-slate-800">ASTRO</span>
                        <span className="text-2xl font-black text-slate-800">SUPABASE</span>
                        <span className="text-2xl font-black text-slate-800">CLOUDINARY</span>
                        <span className="text-2xl font-black text-slate-800">TAILWIND</span>
                    </div>
                </div>
            </section>

            <footer className="bg-primary text-white pt-20 pb-10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">Akuntabilitas Ganda: <br /><span className="text-accent underline decoration-wavy underline-offset-8">Kepada Umat dan Kepada Tuhan.</span></h2>
                        <p className="text-emerald-200 text-lg mt-6">Smart Santri - Digitizing Trust, Ensuring Sharia Compliance.</p>
                        <div className="mt-10">
                            <Link href="/admin" className="inline-block px-10 py-4 bg-accent text-primary font-black rounded-full hover:scale-110 transition-transform">Dapatkan Akses Sekarang</Link>
                        </div>
                    </div>

                    <hr className="border-emerald-800 mb-8" />

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-emerald-300">
                        <div className="flex items-center gap-2">
                            <div className="bg-accent p-1 rounded">
                                <ShieldCheck className="text-primary w-4 h-4" />
                            </div>
                            <span className="font-bold text-white">Smart Santri © 2024</span>
                        </div>
                        <div className="text-center md:text-right">
                            <p>Dikembangkan oleh: <span className="text-white font-semibold">Sidqi Alaudin Johari</span></p>
                            <p className="text-xs opacity-70">Mahasiswa Akuntansi Syariah, Universitas Tazkia.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}