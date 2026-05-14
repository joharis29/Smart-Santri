'use client'

import { useState } from 'react'
import { User, Lock, Eye, EyeOff, Mail } from 'lucide-react'
import { signup } from './actions'

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const passwordsMatch = password === confirmPassword
  const showWarning = confirmPassword.length > 0 && !passwordsMatch

  return (
    <form action={signup} onSubmit={(e) => { if (!passwordsMatch) e.preventDefault() }} className="space-y-3">
      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold text-secondary mb-1">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
            <User className="w-5 h-5" />
          </div>
          <input type="text" id="fullName" name="fullName" required
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-white transition-all text-sm text-gray-900"
            placeholder="Masukkan nama lengkap Anda" />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-secondary mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
            <Mail className="w-5 h-5" />
          </div>
          <input type="email" id="email" name="email" required
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-white transition-all text-sm text-gray-900"
            placeholder="nama@email.com" />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-secondary mb-1">
          Kata Sandi <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
            <Lock className="w-5 h-5" />
          </div>
          <input type={showPassword ? 'text' : 'password'} id="password" name="password" required minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-white transition-all text-sm text-gray-900"
            placeholder="Buat kata sandi (min. 6 karakter)" />

          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-secondary">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-secondary mb-1">
          Konfirmasi Kata Sandi <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
            <Lock className="w-5 h-5" />
          </div>
          <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" required minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`block w-full pl-10 pr-10 py-2 border rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all text-sm text-gray-900 ${showWarning ? 'border-red-300 focus:ring-red-500 focus:border-transparent' : 'border-gray-200 focus:ring-accent focus:border-transparent'}`}
            placeholder="Ketik ulang kata sandi" />

          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-secondary">
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {showWarning && (
          <p className="mt-1 text-xs text-red-600 font-medium">Kata sandi tidak cocok!</p>
        )}
      </div>

      <div className="pt-1">
        <button type="submit"
          disabled={!passwordsMatch && confirmPassword.length > 0}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-amber-200/50 text-sm font-bold text-primary bg-accent hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          Daftar Sekarang
        </button>
      </div>
    </form>
  )
}
