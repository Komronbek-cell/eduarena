'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('blocked') === 'true') {
      setError('Hisobingiz bloklangan. Administrator bilan bog\'laning.')
    }
  }, [searchParams])

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email yoki parol noto\'g\'ri')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', data.user.id)
      .single()

    if (profile?.is_blocked) {
      await supabase.auth.signOut()
      setError('Hisobingiz bloklangan. Administrator bilan bog\'laning.')
      setLoading(false)
      return
    }

    if (profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition placeholder:text-gray-400"

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-8 transition">
          <ArrowLeft className="w-4 h-4" />
          Bosh sahifa
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Image src="/logo.png" alt="GULDU" width={48} height={48} className="rounded-xl object-cover" />
            <div>
              <h1 className="font-black text-xl tracking-tight">EduArena</h1>
              <p className="text-xs text-gray-400">GULDU · Raqamli iqtisodiyot</p>
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Xush kelibsiz!</h2>
          <p className="text-gray-500 text-sm">Hisobingizga kiring va raqobatni davom eting</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 mb-5 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Parol</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className={inputClass + ' pr-12'}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded-xl py-3.5 transition flex items-center justify-center gap-2 shadow-lg shadow-violet-100 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Kirish...' : 'Kirish'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Hisobingiz yo'qmi?{' '}
          <Link href="/register" className="text-violet-600 font-semibold hover:text-violet-700">
            Ro'yxatdan o'ting
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  )
}