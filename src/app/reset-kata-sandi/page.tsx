'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function ResetKataSandiPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'invalid'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSessionReady, setIsSessionReady] = useState(false)

  // Supabase mengirim token via URL hash — kita perlu menunggu sesi terbentuk
  useEffect(() => {
    const supabase = createClient()

    // Dengarkan perubahan auth state (Supabase akan set session dari URL hash secara otomatis)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsSessionReady(true)
        setStatus('idle')
      } else if (event === 'SIGNED_IN' && session) {
        // Mungkin sudah redirect dari email dengan session aktif
        setIsSessionReady(true)
      }
    })

    // Cek apakah sudah ada session aktif (recovery)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsSessionReady(true)
      } else {
        // Tunggu sebentar, URL hash mungkin belum diproses
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (!s) {
              setStatus('invalid')
            } else {
              setIsSessionReady(true)
            }
          })
        }, 1500)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter.')
      setStatus('error')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Kata sandi dan konfirmasi kata sandi tidak cocok.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setErrorMsg(error.message || 'Gagal memperbarui kata sandi. Coba minta link reset baru.')
        setStatus('error')
      } else {
        setStatus('success')
        // Redirect ke login setelah 3 detik
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch {
      setErrorMsg('Terjadi kesalahan. Silakan coba lagi.')
      setStatus('error')
    }
  }

  // Strength indicator
  const getStrength = (pwd: string) => {
    if (pwd.length === 0) return { level: 0, label: '', color: '' }
    if (pwd.length < 6) return { level: 1, label: 'Terlalu Pendek', color: 'bg-red-400' }
    if (pwd.length < 8) return { level: 2, label: 'Lemah', color: 'bg-orange-400' }
    const hasUpper = /[A-Z]/.test(pwd)
    const hasNum = /[0-9]/.test(pwd)
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
    const score = [hasUpper, hasNum, hasSpecial].filter(Boolean).length
    if (score === 0) return { level: 2, label: 'Sedang', color: 'bg-yellow-400' }
    if (score === 1) return { level: 3, label: 'Kuat', color: 'bg-emerald-400' }
    return { level: 4, label: 'Sangat Kuat', color: 'bg-emerald-600' }
  }
  const strength = getStrength(password)

  return (
    <div className="font-sans antialiased min-h-screen flex flex-col justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a5c3a 0%, #2d7a52 100%)' }}>
      <div className="absolute inset-0 z-0 opacity-10"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")', backgroundRepeat: 'repeat' }}>
      </div>

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
              <h1 className="text-xl font-bold text-slate-800">Reset Kata Sandi</h1>
              <p className="text-slate-500 text-xs mt-1">Buat kata sandi baru yang kuat untuk akun Anda</p>
            </div>

            {/* Invalid token state */}
            {status === 'invalid' && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full border-2 border-red-200 mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Link Tidak Valid</h3>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                    Link reset kata sandi ini sudah kadaluarsa atau tidak valid. Silakan minta link baru.
                  </p>
                </div>
                <Link href="/lupa-kata-sandi"
                  className="inline-block mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                  Minta Link Baru
                </Link>
              </div>
            )}

            {/* Success state */}
            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full border-2 border-emerald-200 mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Kata Sandi Berhasil Diperbarui!</h3>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                    Kata sandi baru Anda telah berhasil disimpan. Anda akan diarahkan ke halaman login dalam beberapa detik...
                  </p>
                </div>
                <Link href="/login"
                  className="inline-block mt-2 px-4 py-2 bg-amber-400 text-emerald-900 text-xs font-bold rounded-xl hover:bg-amber-500 transition-colors">
                  Masuk Sekarang
                </Link>
              </div>
            )}

            {/* Loading session state */}
            {!isSessionReady && status !== 'invalid' && status !== 'success' && (
              <div className="text-center py-6">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
                <p className="text-slate-500 text-xs">Memverifikasi link reset...</p>
              </div>
            )}

            {/* Form */}
            {isSessionReady && status !== 'success' && status !== 'invalid' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === 'error' && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{errorMsg}</p>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Kata Sandi Baru
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all text-sm text-slate-900"
                      placeholder="Min. 8 karakter"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.level ? strength.color : 'bg-slate-200'}`} />
                        ))}
                      </div>
                      <p className={`text-[10px] font-bold ${strength.level <= 2 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white transition-all text-sm text-slate-900 ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-300 focus:ring-red-400'
                          : confirmPassword && confirmPassword === password
                          ? 'border-emerald-300 focus:ring-emerald-500'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                      placeholder="Ulangi kata sandi baru"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-[10px] text-red-500 font-bold mt-1">Kata sandi tidak cocok</p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Kata sandi cocok</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading' || password !== confirmPassword || password.length < 8}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-amber-200/50 text-sm font-bold text-emerald-900 bg-amber-400 hover:bg-amber-500 focus:outline-none transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    'Simpan Kata Sandi Baru'
                  )}
                </button>
              </form>
            )}

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
