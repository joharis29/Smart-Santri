import Link from 'next/link';
import { ShieldCheck, FileQuestion, ArrowLeft } from 'lucide-react';

export default function ArtikelPage() {
    return (
        <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Islamic pattern wrapper */}
            <div 
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}
            ></div>

            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-emerald-900/5 p-8 text-center border border-emerald-50 relative z-10">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <FileQuestion className="w-10 h-10 text-emerald-700" />
                </div>
                
                <h1 className="font-serif text-3xl font-bold text-slate-800 mb-4 tracking-tight">Segera Hadir!</h1>
                <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                    Halaman artikel seputar tata kelola pesantren dan panduan sistem saat ini sedang dalam tahap persiapan. Nantikan pembaruannya!
                </p>

                <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 hover:scale-105 transition-all shadow-lg shadow-emerald-200">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Beranda
                </Link>
            </div>

            <div className="mt-12 flex items-center gap-2 opacity-60 relative z-10">
                <ShieldCheck className="w-5 h-5 text-emerald-800" />
                <span className="font-serif text-lg font-bold text-emerald-900 tracking-tight">Smart <span className="text-amber-500">Santri</span></span>
            </div>
        </div>
    );
}
