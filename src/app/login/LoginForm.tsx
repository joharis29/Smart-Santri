'use client'

import { useState } from 'react'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { login } from './actions'

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={login} className="space-y-3">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-secondary mb-1">Email Pesantren</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
            <User className="w-5 h-5" />
          </div>
          <input type="email" id="email" name="email" required
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-white transition-all text-sm text-gray-900"
            placeholder="nama@smartsantri.com" />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-secondary mb-1">Kata Sandi</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
            <Lock className="w-5 h-5" />
          </div>
          <input type={showPassword ? 'text' : 'password'} id="password" name="password" required
            className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-white transition-all text-sm text-gray-900"
            placeholder="Masukkan Kata Sandi" />

          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-secondary">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input id="remember-me" name="remember-me" type="checkbox"
            className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded cursor-pointer" />
          <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-600 cursor-pointer">
            Tetap Masuk
          </label>
        </div>
        <div className="text-xs">
          <a href="#" className="font-medium text-secondary hover:text-accent transition-colors">
            Lupa Kata Sandi?
          </a>
        </div>
      </div>

      <div>
        <button type="submit"
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-amber-200/50 text-sm font-bold text-primary bg-accent hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-200 active:scale-[0.98]">
          Masuk ke Sistem
        </button>
      </div>
    </form>
  )
}
