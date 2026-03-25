'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import {
  Trophy, Users, BookOpen, TrendingUp,
  LogOut, Loader2, Settings, PlusCircle, BarChart2, Bell
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGroups: 0,
    totalQuizzes: 0,
    totalAttempts: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (profileData?.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(profileData)

      const [students, groups, quizzes, attempts] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('groups').select('id', { count: 'exact' }),
        supabase.from('quizzes').select('id', { count: 'exact' }),
        supabase.from('quiz_attempts').select('id', { count: 'exact' }),
      ])

      setStats({
        totalStudents: students.count ?? 0,
        totalGroups: groups.count ?? 0,
        totalQuizzes: quizzes.count ?? 0,
        totalAttempts: attempts.count ?? 0,
      })
      setLoading(false)
    }
    fetchData()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">EduArena</span>
            <span className="ml-1 text-xs bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition">
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:block">Chiqish</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-black">Boshqaruv paneli</h1>
          <p className="text-gray-400 mt-1 text-sm">Xush kelibsiz, {profile?.full_name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { icon: <Users className="w-5 h-5" />, color: 'text-violet-600 bg-violet-50', label: 'Talabalar', value: stats.totalStudents },
            { icon: <BookOpen className="w-5 h-5" />, color: 'text-green-600 bg-green-50', label: 'Guruhlar', value: stats.totalGroups },
            { icon: <Trophy className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-50', label: 'Quizlar', value: stats.totalQuizzes },
            { icon: <BarChart2 className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50', label: 'Urinishlar', value: stats.totalAttempts },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-xl md:text-2xl font-black">{s.value}</p>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <button
            onClick={() => router.push('/admin/quizzes')}
            className="bg-white border border-gray-100 hover:border-violet-200 hover:shadow-md rounded-2xl p-4 md:p-6 text-left transition group shadow-sm"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-violet-50 group-hover:bg-violet-100 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-violet-600" />
            </div>
            <h3 className="font-black text-sm md:text-base mb-0.5 md:mb-1">Quizlar</h3>
            <p className="text-gray-400 text-xs md:text-sm">Quiz va savollarni boshqarish</p>
          </button>

          <button
            onClick={() => router.push('/admin/students')}
            className="bg-white border border-gray-100 hover:border-violet-200 hover:shadow-md rounded-2xl p-4 md:p-6 text-left transition group shadow-sm"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-green-50 group-hover:bg-green-100 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <h3 className="font-black text-sm md:text-base mb-0.5 md:mb-1">Talabalar</h3>
            <p className="text-gray-400 text-xs md:text-sm">Talabalar ro'yxati va reytingi</p>
          </button>

          <button
            onClick={() => router.push('/admin/groups')}
            className="bg-white border border-gray-100 hover:border-violet-200 hover:shadow-md rounded-2xl p-4 md:p-6 text-left transition group shadow-sm"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <h3 className="font-black text-sm md:text-base mb-0.5 md:mb-1">Guruhlar</h3>
            <p className="text-gray-400 text-xs md:text-sm">Guruhlarni boshqarish</p>
          </button>

          <button
            onClick={() => router.push('/admin/announcements')}
            className="bg-white border border-gray-100 hover:border-violet-200 hover:shadow-md rounded-2xl p-4 md:p-6 text-left transition group shadow-sm"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-orange-50 group-hover:bg-orange-100 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
            </div>
            <h3 className="font-black text-sm md:text-base mb-0.5 md:mb-1">E'lonlar</h3>
            <p className="text-gray-400 text-xs md:text-sm">E'lonlarni boshqarish</p>
          </button>

          <button
            onClick={() => router.push('/admin/analytics')}
            className="bg-white border border-gray-100 hover:border-violet-200 hover:shadow-md rounded-2xl p-4 md:p-6 text-left transition group shadow-sm col-span-2 md:col-span-1"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-50 group-hover:bg-purple-100 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition">
              <BarChart2 className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            </div>
            <h3 className="font-black text-sm md:text-base mb-0.5 md:mb-1">Analitika</h3>
            <p className="text-gray-400 text-xs md:text-sm">Statistika va grafiklar</p>
          </button>
        </div>

        {/* CTA */}
        <div className="bg-violet-600 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-white text-base md:text-lg mb-1">Yangi quiz yarating</h3>
            <p className="text-violet-200 text-sm">Talabalar uchun kunlik yoki haftalik quiz qo'shing</p>
          </div>
          <button
            onClick={() => router.push('/admin/quizzes/create')}
            className="flex items-center gap-2 bg-white text-violet-700 font-bold px-5 py-2.5 rounded-xl hover:bg-violet-50 transition flex-shrink-0 text-sm w-full md:w-auto justify-center"
          >
            <PlusCircle className="w-4 h-4" />
            Yaratish
          </button>
        </div>
      </main>
    </div>
  )
}