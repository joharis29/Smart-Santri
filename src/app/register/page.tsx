import Link from 'next/link'
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'
import RegisterForm from './RegisterForm'

export default async function RegisterPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const errorMsg = searchParams?.error as string | undefined;
  const message = searchParams?.message as string | undefined;

  return (
    <div className="font-sans antialiased bg-primary min-h-screen flex flex-col justify-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] z-0"></div>
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")', backgroundRepeat: 'repeat' }}
      ></div>

      {/* Back link */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
        <Link href="/" className="flex items-center gap-2 text-emerald-100 hover:text-white transition-colors font-medium group text-sm">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10">
          <div className="p-5 md:p-6">
            {/* Header */}
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-50 rounded-2xl mb-1 border border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-secondary">Buat Akun Demo</h1>
              <p className="text-gray-500 text-xs mt-1">Coba gratis Sistem Akuntansi Pesantren</p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">{message}</p>
              </div>
            )}

            {/* Client Component Form */}
            <RegisterForm />

            <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                    Sudah punya akun? <Link href="/login" className="text-emerald-600 font-bold hover:underline">Masuk di sini</Link>
                </p>
            </div>

            {/* Footer Notice */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400">
              <ShieldCheck className="w-3 h-3" />
              <span className="text-[9px] uppercase tracking-widest font-bold">Protected by Supabase RLS</span>
            </div>
          </div>
        </div>

        <p className="text-center mt-3 text-emerald-100/60 text-xs">
          &copy; 2026 Smart Santri - Digitalizing Trust.
        </p>
      </div>
    </div>
  )
}
