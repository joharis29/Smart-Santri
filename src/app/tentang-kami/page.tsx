import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Target, Shield, Users, Layers, LayoutDashboard } from 'lucide-react';

export default function TentangKamiPage() {
    return (
        <div className="font-sans text-slate-900 bg-slate-50 min-h-screen relative overflow-x-hidden">
            {/* Background Pattern */}
            <div 
                className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}
            ></div>

            {/* Header / Hero Section */}
            <div className="bg-gradient-to-b from-emerald-900 to-emerald-800 text-white pt-20 pb-24 relative z-10 border-b-8 border-accent">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
                    <Link href="/" className="inline-flex items-center gap-2 text-emerald-200 hover:text-white transition-colors mb-8 text-sm font-bold bg-white/10 px-4 py-2 rounded-full hover:bg-white/20">
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Beranda
                    </Link>
                    
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3">
                        <ShieldCheck className="w-10 h-10 text-emerald-700 -rotate-3" />
                    </div>
                    
                    <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 tracking-tight">Tentang Smart Santri</h1>
                    <p className="text-emerald-100 text-lg max-w-2xl mx-auto leading-relaxed">
                        Sistem Informasi Akuntansi berbasis web yang dirancang secara khusus untuk mendigitalkan dan menjaga tata kelola keuangan di lingkungan pondok pesantren.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 -mt-16">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-slate-100 space-y-8">
                    
                    {/* Apa itu */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-3">
                            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg"><LayoutDashboard className="w-5 h-5" /></div>
                            Apa Itu Smart Santri?
                        </h2>
                        <p className="text-slate-600 leading-relaxed text-base text-justify">
                            <strong className="text-slate-800 font-black">Smart Santri</strong> adalah Sistem Informasi Akuntansi berbasis web yang dirancang secara khusus untuk mendigitalkan dan menjaga tata kelola keuangan di lingkungan pondok pesantren. Kami menyebutnya sebagai <i>"Digital Guard"</i> atau penjaga amanah di era modern. Smart Santri menjembatani nilai-nilai kepercayaan lisan (tradisional) pesantren dengan sistem pencatatan terintegrasi, transparan, dan dapat diaudit secara profesional.
                        </p>
                    </section>

                    <hr className="border-slate-100" />

                    {/* Tujuan */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-3">
                            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg"><Target className="w-5 h-5" /></div>
                            Tujuan Kami
                        </h2>
                        <p className="text-slate-600 leading-relaxed text-base mb-4 text-justify">
                            Tujuan utama dari Smart Santri adalah <strong className="text-emerald-700 font-black">"Menjaga Kemurnian Harta Pesantren"</strong>. Kami memahami bahwa dana yang dikelola pesantren (seperti Dana BOS, Zakat, Wakaf, Infaq, dan SPP) memiliki pertanggungjawaban ganda: kepada umat (donatur/wali santri/pemerintah) dan kepada Allah SWT. Oleh karena itu, Smart Santri diciptakan agar pesantren senantiasa patuh terhadap ISAK 335, Pedoman Akuntansi Pesantren (PAP), Juknis BOS dan SOP Pesantren itu sendiri dengan cara:
                        </p>
                        <ul className="space-y-4">
                            {[
                                'Mencegah praktik Fund Commingling (tercampurnya dana terikat dan dana operasional umum).',
                                'Mempercepat siklus pengeluaran dan pelaporan keuangan tanpa mengorbankan ketelitian.',
                                'Menciptakan Jejak Audit digital yang permanen demi pertanggungjawaban yang jelas.'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{i+1}</div>
                                    <span className="text-slate-700">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <hr className="border-slate-100" />

                    {/* Keunggulan */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-4">
                            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg"><Shield className="w-5 h-5" /></div>
                            Keunggulan Utama
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Card 1 */}
                            <div className="bg-white border-2 border-emerald-50 rounded-2xl p-4 hover:shadow-lg transition-shadow group">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-700">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-slate-800 mb-1.5">1. Kepatuhan Syariah, ISAK 335 dan PAP</h3>
                                <p className="text-slate-500 text-sm leading-relaxed text-justify">
                                    Sistem pertama yang dilengkapi dengan <i>Automated Sharia Compliance Validator</i>. Smart Santri secara otomatis mendeteksi dan mencegah penggunaan dana yang tidak sesuai dengan akadnya. Misalnya, menolak (<i>auto-reject</i>) percobaan penggunaan Dana Wakaf untuk operasional rutin.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-white border-2 border-emerald-50 rounded-2xl p-4 hover:shadow-lg transition-shadow group">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors text-amber-700">
                                    <Users className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-slate-800 mb-1.5">2. Pengendalian Internal Berbasis COSO</h3>
                                <p className="text-slate-500 text-sm leading-relaxed text-justify">
                                    Menerapkan struktur otorisasi berjenjang (Mulai dari Staf, Bendahara Unit, Kepala Unit, Bendahara Pusat hingga Pimpinan). Secara drastis menekan risiko <i>human error</i> dan manipulasi (<i>fraud</i>) karena setiap pergerakan tercatat transparan.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="bg-white border-2 border-emerald-50 rounded-2xl p-4 hover:shadow-lg transition-shadow group">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-700">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-slate-800 mb-1.5">3. Pemisahan Dana (Fund Accounting)</h3>
                                <p className="text-slate-500 text-sm leading-relaxed text-justify">
                                    Secara bawaan, dompet dana dibagi mutlak:<br/>
                                    • <strong>Dana Dengan Pembatasan:</strong> Zakat, Wakaf Terikat, Titipan.<br/>
                                    • <strong>Dana Tanpa Pembatasan:</strong> BOS/BOP (operasional), Infaq Umum, SPP.<br/>
                                    Memudahkan pemantauan batas maksimal pencairan.
                                </p>
                            </div>

                            {/* Card 4 */}
                            <div className="bg-white border-2 border-emerald-50 rounded-2xl p-4 hover:shadow-lg transition-shadow group">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors text-purple-700">
                                    <LayoutDashboard className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-slate-800 mb-1.5">4. Transisi yang Mudah (User-Friendly)</h3>
                                <p className="text-slate-500 text-sm leading-relaxed text-justify">
                                    Meski menggunakan standar akuntansi profesional tinggi, antarmuka (UI/UX) Smart Santri didesain secara elegan dan sederhana agar mudah dipahami oleh staf pesantren tanpa latar belakang akuntansi formal.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="bg-slate-900 text-white p-6 rounded-2xl text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
                        <p className="font-serif text-lg md:text-xl font-bold relative z-10 italic">
                            &quot;Smart Santri – Digitizing Trust, Ensuring Sharia Compliance.&quot;
                        </p>
                    </div>

                </div>
            </div>
            
            {/* Footer space */}
            <div className="pb-20"></div>
        </div>
    );
}
