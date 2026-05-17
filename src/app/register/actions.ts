'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

import { headers } from 'next/headers'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Dynamically obtain current origin (works on both localhost and Vercel automatically)
  const origin = (await headers()).get('origin') || 'http://localhost:3000'
  const emailRedirectTo = `${origin}/login?verified=true`

  // Note: We use raw_user_meta_data to store the full name so it gets synced to auth.users
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName,
      }
    }
  })

  if (error) {
    redirect('/register?error=' + encodeURIComponent(error.message))
  }

  // Redirect to register page with success message
  redirect('/register?message=' + encodeURIComponent('Pendaftaran berhasil! Silakan periksa kotak masuk email Anda untuk melakukan verifikasi akun.'))
}
