'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, Quiz } from '@/types'
import { Trophy, Flame, Star, Target, TrendingUp, Bell, LogOut, Loader2, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dailyQuiz, setDailyQuiz] = useState<Quiz | null>(null)
  const [weeklyQuiz, setWeeklyQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { router.push('/login'); return }

      const [{ data: profileData }, { data: quizzes }] = await Promise.all([
        supabase.from('profiles').select('*, groups(name)').eq('id', user.id).single(),
        supabase.from('quizzes').select('*').eq('status', 'active'),
      ])

      setProfile(profileData)

      if (quizzes) {
        setDailyQuiz(quizzes.find(q => q.type === 'daily') ?? null)
        setWeeklyQuiz(quizzes.find(q => q.type === 'weekly') ?? null)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg">EduArena</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-white transition">
            <Bell className="w-5 h-5" />
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
          <h1 className="text-2xl font-bold">
            Xush kelibsiz, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1">
            {(profile as any)?.groups?.name ?? 'Guruh belgilanmagan'} · Bugun ham g'alaba qozonish vaqti!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-indigo-400 mb-3">
              <Star className="w-5 h-5" />
              <span className="text-sm">Umumiy ball</span>
            </div>
            <p className="text-3xl font-bold">{profile?.total_score ?? 0}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-orange-400 mb-3">
              <Flame className="w-5 h-5" />
              <span className="text-sm">Streak</span>
            </div>
            <p className="text-3xl font-bold">
              {profile?.streak ?? 0}
              <span className="text-lg text-slate-400"> kun</span>
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-green-400 mb-3">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">Reyting</span>
            </div>
            <p className="text-3xl font-bold">#—</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-purple-400 mb-3">
              <Target className="w-5 h-5" />
              <span className="text-sm">Quizlar</span>
            </div>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>

        {/* Quiz kartalar */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Kunlik quiz */}
          <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <span className="text-sm text-indigo-300 font-medium">Kunlik Quiz</span>
            </div>
            {dailyQuiz ? (
              <>
                <h3 className="text-lg font-semibold mb-1">{dailyQuiz.title}</h3>
                <p className="text-slate-400 text-sm mb-4">
                  {dailyQuiz.time_limit / 60} daqiqa · {dailyQuiz.score_per_question} ball/savol
                </p>
                <button
                  onClick={() => router.push(`/quiz/${dailyQuiz.id}`)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
                >
                  Boshlash <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1">Bugungi quiz</h3>
                <p className="text-slate-400 text-sm">Hozircha faol quiz yo'q</p>
              </>
            )}
          </div>

          {/* Haftalik */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">Haftalik Musobaqa</span>
            </div>
            {weeklyQuiz ? (
              <>
                <h3 className="text-lg font-semibold mb-1">{weeklyQuiz.title}</h3>
                <p className="text-slate-400 text-sm mb-4">
                  {weeklyQuiz.time_limit / 60} daqiqa · {weeklyQuiz.score_per_question} ball/savol
                </p>
                <button
                  onClick={() => router.push(`/quiz/${weeklyQuiz.id}`)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
                >
                  Qatnashish <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1">Haftalik musobaqa</h3>
                <p className="text-slate-400 text-sm">Hozircha faol musobaqa yo'q</p>
              </>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Yutuqlar</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { icon: '🎯', title: 'Birinchi qadam' },
              { icon: '🔥', title: '3 kunlik streak' },
              { icon: '⚡', title: '7 kunlik streak' },
              { icon: '🏆', title: 'Top 10' },
              { icon: '👑', title: 'Hafta g\'olibi' },
              { icon: '🤝', title: 'Guruh fidoyisi' },
            ].map((a, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-700 opacity-40"
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-xs text-center text-slate-400 leading-tight">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}