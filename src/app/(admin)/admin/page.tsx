'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import {
  Trophy, Users, BookOpen, TrendingUp,
  LogOut, Loader2, Bell, Settings,
  PlusCircle, BarChart2
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

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

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
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">EduArena</span>
          <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-white transition">
            <Bell className="w-5 h-5" />
          </button>
          <button className="text-slate-400 hover:text-white transition">
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            Chiqish
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin boshqaruv paneli</h1>
          <p className="text-slate-400 mt-1">Xush kelibsiz, {profile?.full_name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Users className="w-5 h-5" />, color: 'text-indigo-400', label: 'Talabalar', value: stats.totalStudents },
            { icon: <BookOpen className="w-5 h-5" />, color: 'text-green-400', label: 'Guruhlar', value: stats.totalGroups },
            { icon: <Trophy className="w-5 h-5" />, color: 'text-yellow-400', label: 'Quizlar', value: stats.totalQuizzes },
            { icon: <BarChart2 className="w-5 h-5" />, color: 'text-purple-400', label: 'Urinishlar', value: stats.totalAttempts },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className={`flex items-center gap-2 ${s.color} mb-3`}>
                {s.icon}
                <span className="text-sm">{s.label}</span>
              </div>
              <p className="text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/admin/groups')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-left transition group"
          >
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="font-semibold mb-1">Guruhlar</h3>
            <p className="text-slate-400 text-sm">Guruhlarni boshqarish</p>
          </button>

          <button
            onClick={() => router.push('/admin/quizzes')}
            className="bg-slate-900 border border-slate-800 hover:border-green-500/50 rounded-2xl p-6 text-left transition group"
          >
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition">
              <BookOpen className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold mb-1">Quizlar</h3>
            <p className="text-slate-400 text-sm">Quiz va savollarni boshqarish</p>
          </button>

          <button
            onClick={() => router.push('/admin/students')}
            className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 text-left transition group"
          >
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-1">Talabalar</h3>
            <p className="text-slate-400 text-sm">Talabalar ro'yxati va reytingi</p>
          </button>
        </div>

        {/* Quick Add Quiz */}
        <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">Yangi quiz yarating</h3>
            <p className="text-slate-400 text-sm">Talabalar uchun kunlik yoki haftalik quiz qo'shing</p>
          </div>
          <button
            onClick={() => router.push('/admin/quizzes/create')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition"
          >
            <PlusCircle className="w-4 h-4" />
            Yaratish
          </button>
        </div>
      </main>
    </div>
  )
}