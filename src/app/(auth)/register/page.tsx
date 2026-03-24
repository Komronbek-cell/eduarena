'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Trophy, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError('Barcha maydonlarni to\'ldiring')
      return
    }
    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError('Ro\'yxatdan o\'tishda xatolik: ' + error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        role: 'student',
        total_score: 0,
        streak: 0,
      })

      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">EduArena</h1>
          <p className="text-slate-400 mt-1">Bilim musobaqasi platformasi</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Ro'yxatdan o'tish</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">To'liq ism</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ism Familiya"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Parol</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition pr-12"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Yuklanmoqda...' : 'Ro\'yxatdan o\'tish'}
            </button>
          </div>

          <p className="text-center text-slate-400 text-sm mt-6">
            Hisobingiz bormi?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}