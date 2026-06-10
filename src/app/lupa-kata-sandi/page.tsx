'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { checkEmailExists } from './actions'
import { createClient } from '@/utils/supabase/client'

export default function LupaKataSandiPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setErrorMsg('')

    try {
      // 1. Cek dulu apakah email ada di database
      const checkRes = await checkEmailExists(email)
      if (!checkRes.exists) {
        setErrorMsg('Mohon maaf, akun tidak terdaftar di sistem.')
        setStatus('error')
        return
      }

      // 2. Jika ada, panggil reset dari browser client agar PKCE code_verifier tersimpan di browser
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-kata-sandi`,
      })

      if (error) {
        setErrorMsg(error.message || 'Gagal mengirim email reset. Pastikan layanan email aktif.')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Terjadi kesalahan. Silakan coba lagi.')
      setStatus('error')
    }
  }

  return (
    <div className="font-sans antialiased min-h-screen flex flex-col justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a5c3a 0%, #2d7a52 100%)' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-10"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")', backgroundRepeat: 'repeat' }}>
      </div>

      {/* Back link */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
        <Link href="/login" className="flex items-center gap-2 text-emerald-100 hover:text-white transition-colors font-medium group text-sm">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Login
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 rounded-2xl mb-3 border border-emerald-100">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Lupa Kata Sandi</h1>
              <p className="text-slate-500 text-xs mt-1">Masukkan email Anda dan kami akan mengirim link reset kata sandi</p>
            </div>

            {/* Success State */}
            {status === 'success' ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full border-2 border-emerald-200 mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Email Terkirim!</h3>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                    Link reset kata sandi telah dikirim ke <span className="font-bold text-emerald-700">{email}</span>.
                    Periksa kotak masuk email Anda dan ikuti petunjuk di dalamnya.
                  </p>
                  <p className="text-slate-400 text-[10px] mt-2">
                    Tidak menerima email? Periksa folder spam atau coba lagi.
                  </p>
                </div>
                <button
                  onClick={() => { setStatus('idle'); setEmail('') }}
                  className="text-xs text-emerald-700 font-bold hover:underline"
                >
                  Kirim ulang ke email lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Message */}
                {status === 'error' && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{errorMsg}</p>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email Pesantren
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all text-sm text-slate-900"
                      placeholder="nama@smartsantri.com"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-amber-200/50 text-sm font-bold text-emerald-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim Email...</>
                  ) : (
                    'Kirim Link Reset Kata Sandi'
                  )}
                </button>

                <div className="text-center">
                  <Link href="/login" className="text-xs text-slate-500 hover:text-emerald-700 transition-colors">
                    Ingat kata sandi? <span className="font-bold text-emerald-700">Masuk di sini</span>
                  </Link>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
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
