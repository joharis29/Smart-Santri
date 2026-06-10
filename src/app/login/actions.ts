'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // If login fails, check if the email actually exists in Supabase Auth using Admin Client
    const supabaseAdmin = createAdminClient()
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
    
    const authUser = listData.users.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!authUser) {
      redirect('/login?error=Mohon maaf, akun tidak terdaftar di sistem.')
    } else if (authUser.banned_until && new Date(authUser.banned_until) > new Date()) {
      redirect('/login?error=Akun Anda dinonaktifkan, hubungi admin untuk mengaktifkan kembali akun.')
    } else {
      redirect('/login?error=Kata sandi yang Anda masukkan salah.')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}
