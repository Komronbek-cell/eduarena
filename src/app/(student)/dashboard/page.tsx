'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, Quiz } from '@/types'
import {
  Trophy, Flame, Star, Target, TrendingUp,
  LogOut, Loader2, ChevronRight, Medal, Zap
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dailyQuiz, setDailyQuiz] = useState<Quiz | null>(null)
  const [weeklyQuiz, setWeeklyQuiz] = useState<Quiz | null>(null)
  const [rank, setRank] = useState<number>(0)
  const [quizCount, setQuizCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: profileData }, { data: quizzes }, { data: attempts }, { data: allStudents }] = await Promise.all([
        supabase.from('profiles').select('*, groups(name)').eq('id', user.id).single(),
        supabase.from('quizzes').select('*').eq('status', 'active'),
        supabase.from('quiz_attempts').select('id').eq('user_id', user.id),
        supabase.from('profiles').select('id, total_score').eq('role', 'student').order('total_score', { ascending: false }),
      ])

      setProfile(profileData)
      setQuizCount(attempts?.length ?? 0)

      if (allStudents) {
        const rankIndex = allStudents.findIndex(s => s.id === user.id)
        setRank(rankIndex + 1)
      }

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
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const groupName = (profile as any)?.groups?.name

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">EduArena</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/leaderboard')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <Medal className="w-4 h-4" />
              Reyting
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Chiqish
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Salom, {profile?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              {groupName ? `${groupName} guruhi` : 'Guruh belgilanmagan'} · Bugun ham g'alaba qozonish vaqti!
            </p>
          </div>
          {profile?.streak && profile.streak > 0 ? (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 px-4 py-2 rounded-xl">
              <Flame className="w-4 h-4" />
              <span className="font-bold text-sm">{profile.streak} kunlik streak!</span>
            </div>
          ) : null}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Star className="w-5 h-5" />,
              color: 'text-violet-600 bg-violet-50',
              label: 'Umumiy ball',
              value: profile?.total_score ?? 0,
              suffix: ''
            },
            {
              icon: <Flame className="w-5 h-5" />,
              color: 'text-orange-500 bg-orange-50',
              label: 'Streak',
              value: profile?.streak ?? 0,
              suffix: ' kun'
            },
            {
              icon: <TrendingUp className="w-5 h-5" />,
              color: 'text-green-600 bg-green-50',
              label: 'Reyting',
              value: rank > 0 ? `#${rank}` : '#—',
              suffix: ''
            },
            {
              icon: <Target className="w-5 h-5" />,
              color: 'text-blue-600 bg-blue-50',
              label: 'Quizlar',
              value: quizCount,
              suffix: ' ta'
            },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-black text-gray-900">{s.value}{s.suffix}</p>
              <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quiz kartalar */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Kunlik quiz */}
          <div className={`rounded-2xl p-6 border ${
            dailyQuiz
              ? 'bg-violet-600 border-violet-600'
              : 'bg-white border-gray-100'
          }`}>
            <div className={`flex items-center gap-2 mb-3 ${dailyQuiz ? 'text-violet-200' : 'text-gray-400'}`}>
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">Kunlik Quiz</span>
              {dailyQuiz && (
                <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">Faol</span>
              )}
            </div>
            {dailyQuiz ? (
              <>
                <h3 className="text-xl font-black text-white mb-1">{dailyQuiz.title}</h3>
                <p className="text-violet-200 text-sm mb-5">
                  {dailyQuiz.time_limit / 60} daqiqa · {dailyQuiz.score_per_question} ball/savol
                </p>
                <button
                  onClick={() => router.push(`/quiz/${dailyQuiz.id}`)}
                  className="flex items-center gap-2 bg-white text-violet-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-50 transition"
                >
                  Boshlash <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-700 mb-1">Bugungi quiz</h3>
                <p className="text-gray-400 text-sm">Hozircha faol quiz yo'q</p>
              </>
            )}
          </div>

          {/* Haftalik */}
          <div className={`rounded-2xl p-6 border ${
            weeklyQuiz
              ? 'bg-gray-900 border-gray-900'
              : 'bg-white border-gray-100'
          }`}>
            <div className={`flex items-center gap-2 mb-3 ${weeklyQuiz ? 'text-gray-400' : 'text-gray-400'}`}>
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-semibold">Haftalik Musobaqa</span>
              {weeklyQuiz && (
                <span className="ml-auto bg-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-full">Faol</span>
              )}
            </div>
            {weeklyQuiz ? (
              <>
                <h3 className="text-xl font-black text-white mb-1">{weeklyQuiz.title}</h3>
                <p className="text-gray-400 text-sm mb-5">
                  {weeklyQuiz.time_limit / 60} daqiqa · {weeklyQuiz.score_per_question} ball/savol
                </p>
                <button
                  onClick={() => router.push(`/quiz/${weeklyQuiz.id}`)}
                  className="flex items-center gap-2 bg-violet-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-700 transition"
                >
                  Qatnashish <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-700 mb-1">Haftalik musobaqa</h3>
                <p className="text-gray-400 text-sm">Hozircha faol musobaqa yo'q</p>
              </>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-lg">Yutuqlar</h2>
            <span className="text-sm text-gray-400">0/6 ochilgan</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { icon: '🎯', title: 'Birinchi qadam' },
              { icon: '🔥', title: '3 kunlik streak' },
              { icon: '⚡', title: '7 kunlik streak' },
              { icon: '🏆', title: 'Top 10' },
              { icon: '👑', title: 'Hafta g\'olibi' },
              { icon: '🤝', title: 'Guruh fidoyisi' },
            ].map((a, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50 opacity-50">
                <span className="text-2xl">{a.icon}</span>
                <span className="text-xs text-center text-gray-500 leading-tight">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}