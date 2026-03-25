'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, ArrowLeft, ChevronDown } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string
}

const COURSES = ['1-kurs', '2-kurs', '3-kurs', '4-kurs']
const COURSE_YEAR_MAP: Record<string, string> = {
  '1-kurs': '25', '2-kurs': '24', '3-kurs': '23', '4-kurs': '22',
}

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchGroups = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('groups').select('*').order('name')
      setGroups(data ?? [])
    }
    fetchGroups()
  }, [])

  useEffect(() => {
    if (!selectedCourse) { setFilteredGroups([]); setSelectedGroupId(''); return }
    const year = COURSE_YEAR_MAP[selectedCourse]
    setFilteredGroups(groups.filter(g => g.name.endsWith(`-${year}`)))
    setSelectedGroupId('')
  }, [selectedCourse, groups])

  const handleRegister = async () => {
    if (!fullName || !email || !password || !selectedCourse || !selectedGroupId) {
      setError('Barcha maydonlarni to\'ldiring'); return
    }
    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak'); return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError('Xatolik: ' + error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email,
        role: 'student',
        group_id: selectedGroupId,
        total_score: 0,
        streak: 0,
      })
      router.push('/dashboard')
    }
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition placeholder:text-gray-400"

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Bosh sahifa
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Image src="/logo.png" alt="GULDU" width={48} height={48} className="rounded-xl object-cover" />
            <div>
              <h1 className="font-black text-xl tracking-tight">EduArena</h1>
              <p className="text-xs text-gray-400">GULDU · Raqamli iqtisodiyot</p>
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Qo'shiling!</h2>
          <p className="text-gray-500 text-sm">Ro'yxatdan o'ting va musobaqani boshlang</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 mb-5 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />{error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">To'liq ism</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ism Familiya" className={inputClass} />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kurs</label>
              <div className="grid grid-cols-4 gap-2">
                {COURSES.map(course => (
                  <button key={course} type="button" onClick={() => setSelectedCourse(course)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition border-2 ${
                      selectedCourse === course
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {course}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Guruh</label>
              {!selectedCourse ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400">Avval kursni tanlang</div>
              ) : (
                <div className="relative">
                  <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className={inputClass + ' appearance-none pr-10'}>
                    <option value="">Guruhni tanlang</option>
                    {filteredGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name} — {group.description}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              )}
            </div>

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
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  className={inputClass + ' pr-12'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded-xl py-3.5 transition flex items-center justify-center gap-2 shadow-lg shadow-violet-100 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Yuklanmoqda...' : "Ro'yxatdan o'tish"}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Hisobingiz bormi?{' '}
          <Link href="/login" className="text-violet-600 font-semibold hover:text-violet-700">Kirish</Link>
        </p>
      </div>
    </div>
  )
}