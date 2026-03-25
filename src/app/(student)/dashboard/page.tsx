'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, Quiz } from '@/types'
import Image from 'next/image'
import {
  Trophy, Flame, Star, Target, TrendingUp,
  LogOut, Loader2, ChevronRight, Medal, Zap,
  Bell, Users, CheckCircle, History, Calendar
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dailyQuiz, setDailyQuiz] = useState<Quiz | null>(null)
  const [weeklyQuiz, setWeeklyQuiz] = useState<Quiz | null>(null)
  const [rank, setRank] = useState<number>(0)
  const [quizCount, setQuizCount] = useState<number>(0)
  const [announcementCount, setAnnouncementCount] = useState<number>(0)
  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [
        { data: profileData },
        { data: quizzes },
        { data: attempts },
        { data: allStudents },
        { data: announcements },
        { data: achievementsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*, groups(name)').eq('id', user.id).single(),
        supabase.from('quizzes').select('*').eq('status', 'active'),
        supabase.from('quiz_attempts').select('id, quiz_id').eq('user_id', user.id),
        supabase.from('profiles').select('id, total_score').eq('role', 'student').order('total_score', { ascending: false }),
        supabase.from('announcements').select('id'),
        supabase.from('student_achievements').select('achievement_id, achievements(title, icon)').eq('user_id', user.id),
      ])

      setProfile(profileData)
      setQuizCount(attempts?.length ?? 0)
      setAnnouncementCount(announcements?.length ?? 0)
      setCompletedQuizIds(attempts?.map((a: any) => a.quiz_id) ?? [])
      setAchievements(achievementsData ?? [])

      if (allStudents) {
        const rankIndex = allStudents.findIndex(s => s.id === user.id)
        setRank(rankIndex + 1)
      }

      if (quizzes) {
        const activeQuizzes = quizzes.filter(q => {
          if (!q.deadline) return true
          return new Date(q.deadline) > new Date()
        })
        setDailyQuiz(activeQuizzes.find(q => q.type === 'daily') ?? null)
        setWeeklyQuiz(activeQuizzes.find(q => q.type === 'weekly') ?? null)
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
  const avatarUrl = (profile as any)?.avatar_url
  const isDailyCompleted = dailyQuiz ? completedQuizIds.includes(dailyQuiz.id) : false
  const isWeeklyCompleted = weeklyQuiz ? completedQuizIds.includes(weeklyQuiz.id) : false
  const earnedTitles = achievements.map((a: any) => a.achievements?.title)

  const allBadges = [
    { icon: '🎯', title: 'Birinchi qadam' },
    { icon: '🔥', title: '3 kunlik streak' },
    { icon: '⚡', title: '7 kunlik streak' },
    { icon: '🏆', title: 'Top 10' },
    { icon: '👑', title: "Hafta g'olibi" },
    { icon: '🤝', title: 'Guruh fidoyisi' },
  ]

  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString('uz-UZ', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="GULDU" width={32} height={32} className="rounded-lg object-cover" />
              <span className="font-black text-base md:text-lg tracking-tight">EduArena</span>
          </div>

          <div className="flex items-center gap-0.5 md:gap-1">
            <button
              onClick={() => router.push('/quizzes')}
              className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 hover:text-gray-900 px-2 md:px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden md:block">Quizlar</span>
            </button>

            <button
              onClick={() => router.push('/leaderboard')}
              className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 hover:text-gray-900 px-2 md:px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <Medal className="w-4 h-4" />
              <span className="hidden md:block">Reyting</span>
            </button>

            <button
              onClick={() => router.push('/groups')}
              className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 hover:text-gray-900 px-2 md:px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <Users className="w-4 h-4" />
              <span className="hidden md:block">Guruhlar</span>
            </button>

            <button
              onClick={() => router.push('/history')}
              className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 hover:text-gray-900 px-2 md:px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <History className="w-4 h-4" />
              <span className="hidden md:block">Tarix</span>
            </button>

            <button
              onClick={() => router.push('/announcements')}
              className="relative flex items-center gap-1.5 text-xs md:text-sm text-gray-500 hover:text-gray-900 px-2 md:px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden md:block">E'lonlar</span>
              {announcementCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 hover:text-gray-900 px-2 md:px-3 py-2 rounded-lg hover:bg-gray-50 transition ml-1"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                  <span className="text-xs font-black text-violet-600">{profile?.full_name?.charAt(0)}</span>
                </div>
              )}
              <span className="hidden md:block">Profil</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs md:text-sm text-gray-400 hover:text-red-500 px-2 md:px-3 py-2 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:block">Chiqish</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-8">

        {/* Welcome */}
        <div className="mb-5 md:mb-8 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900">
              Salom, {profile?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-400 mt-0.5 text-xs md:text-sm">
              {groupName ? `${groupName} guruhi` : 'Guruh belgilanmagan'} · Bugun ham g'alaba qozonish vaqti!
            </p>
          </div>
          {profile?.streak && profile.streak > 0 ? (
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1.5 rounded-xl flex-shrink-0">
              <Flame className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-bold text-xs md:text-sm">{profile.streak} kun</span>
            </div>
          ) : null}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-8">
          {[
            {
              icon: <Star className="w-4 h-4 md:w-5 md:h-5" />,
              color: 'text-violet-600 bg-violet-50',
              label: 'Umumiy ball',
              value: profile?.total_score ?? 0,
              suffix: '',
              onClick: () => router.push('/leaderboard'),
            },
            {
              icon: <Flame className="w-4 h-4 md:w-5 md:h-5" />,
              color: 'text-orange-500 bg-orange-50',
              label: 'Streak',
              value: profile?.streak ?? 0,
              suffix: ' kun',
              onClick: null,
            },
            {
              icon: <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />,
              color: 'text-green-600 bg-green-50',
              label: 'Reyting',
              value: rank > 0 ? `#${rank}` : '#—',
              suffix: '',
              onClick: () => router.push('/leaderboard'),
            },
            {
              icon: <Target className="w-4 h-4 md:w-5 md:h-5" />,
              color: 'text-blue-600 bg-blue-50',
              label: 'Quizlar',
              value: quizCount,
              suffix: ' ta',
              onClick: () => router.push('/history'),
            },
          ].map((s, i) => (
            <div
              key={i}
              onClick={s.onClick ?? undefined}
              className={`bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm ${
                s.onClick ? 'cursor-pointer hover:shadow-md hover:border-violet-200 transition' : ''
              }`}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2.5 md:mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-xl md:text-2xl font-black text-gray-900">{s.value}{s.suffix}</p>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quiz kartalar */}
        <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-8">
          {/* Kunlik quiz */}
          <div className={`rounded-2xl p-5 md:p-6 border ${
            isDailyCompleted ? 'bg-green-50 border-green-200' :
            dailyQuiz ? 'bg-violet-600 border-violet-600' :
            'bg-white border-gray-100'
          }`}>
            <div className={`flex items-center gap-2 mb-3 ${
              isDailyCompleted ? 'text-green-600' : dailyQuiz ? 'text-violet-200' : 'text-gray-400'
            }`}>
              <Zap className="w-4 h-4" />
              <span className="text-xs md:text-sm font-semibold">Kunlik Quiz</span>
              {isDailyCompleted && (
                <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Bajarildi
                </span>
              )}
              {!isDailyCompleted && dailyQuiz && (
                <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">Faol</span>
              )}
            </div>

            {isDailyCompleted ? (
              <>
                <h3 className="text-base md:text-lg font-black text-green-800 mb-1">{dailyQuiz?.title}</h3>
                <p className="text-green-600 text-xs md:text-sm">Bugungi quizni muvaffaqiyatli yakunladingiz! 🎉</p>
              </>
            ) : dailyQuiz ? (
              <>
                <h3 className="text-lg md:text-xl font-black text-white mb-1">{dailyQuiz.title}</h3>
                {dailyQuiz.deadline && (
                  <p className="text-violet-200 text-xs mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDeadline(dailyQuiz.deadline)} gacha
                  </p>
                )}
                <p className="text-violet-200 text-xs md:text-sm mb-4">
                  {dailyQuiz.time_limit / 60} daqiqa · Vaqt bonuslari bor!
                </p>
                <button
                  onClick={() => router.push(`/quiz/${dailyQuiz.id}`)}
                  className="flex items-center gap-2 bg-white text-violet-700 font-bold text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 rounded-xl hover:bg-violet-50 transition"
                >
                  Boshlash <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base md:text-lg font-bold text-gray-700 mb-1">Bugungi quiz</h3>
                <p className="text-gray-400 text-xs md:text-sm">Hozircha faol quiz yo'q</p>
                <button
                  onClick={() => router.push('/quizzes/daily')}
                  className="mt-3 text-xs text-violet-500 font-semibold hover:text-violet-700 transition"
                >
                  Barcha kunlik quizlarni ko'rish →
                </button>
              </>
            )}
          </div>

          {/* Haftalik */}
          <div className={`rounded-2xl p-5 md:p-6 border ${
            isWeeklyCompleted ? 'bg-green-50 border-green-200' :
            weeklyQuiz ? 'bg-gray-900 border-gray-900' :
            'bg-white border-gray-100'
          }`}>
            <div className={`flex items-center gap-2 mb-3 ${
              isWeeklyCompleted ? 'text-green-600' : weeklyQuiz ? 'text-gray-400' : 'text-gray-400'
            }`}>
              <Trophy className="w-4 h-4" />
              <span className="text-xs md:text-sm font-semibold">Haftalik Musobaqa</span>
              {isWeeklyCompleted && (
                <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Bajarildi
                </span>
              )}
              {!isWeeklyCompleted && weeklyQuiz && (
                <span className="ml-auto bg-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-full">Faol</span>
              )}
            </div>

            {isWeeklyCompleted ? (
              <>
                <h3 className="text-base md:text-lg font-black text-green-800 mb-1">{weeklyQuiz?.title}</h3>
                <p className="text-green-600 text-xs md:text-sm">Haftalik musobaqani yakunladingiz! 🏆</p>
              </>
            ) : weeklyQuiz ? (
              <>
                <h3 className="text-lg md:text-xl font-black text-white mb-1">{weeklyQuiz.title}</h3>
                {weeklyQuiz.deadline && (
                  <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDeadline(weeklyQuiz.deadline)} gacha
                  </p>
                )}
                <p className="text-gray-400 text-xs md:text-sm mb-4">
                  {weeklyQuiz.time_limit / 60} daqiqa · Vaqt bonuslari bor!
                </p>
                <button
                  onClick={() => router.push(`/quiz/${weeklyQuiz.id}`)}
                  className="flex items-center gap-2 bg-violet-600 text-white font-bold text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 rounded-xl hover:bg-violet-700 transition"
                >
                  Qatnashish <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base md:text-lg font-bold text-gray-700 mb-1">Haftalik musobaqa</h3>
                <p className="text-gray-400 text-xs md:text-sm">Hozircha faol musobaqa yo'q</p>
                <button
                  onClick={() => router.push('/quizzes/weekly')}
                  className="mt-3 text-xs text-violet-500 font-semibold hover:text-violet-700 transition"
                >
                  Barcha haftalik quizlarni ko'rish →
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid md:grid-cols-2 gap-3 md:gap-4">
          {/* E'lonlar */}
          <div
            onClick={() => router.push('/announcements')}
            className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm cursor-pointer hover:shadow-md hover:border-violet-200 transition"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="font-black text-base md:text-lg flex items-center gap-2">
                <Bell className="w-4 h-4 md:w-5 md:h-5 text-violet-600" />
                E'lonlar
              </h2>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-gray-400 text-xs md:text-sm">
              {announcementCount > 0 ? `${announcementCount} ta e'lon mavjud` : "Hozircha e'lon yo'q"}
            </p>
          </div>

          {/* Yutuqlar */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="font-black text-base md:text-lg">Yutuqlar</h2>
              <span className="text-xs md:text-sm text-gray-400">{achievements.length}/6</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5 md:gap-2">
              {allBadges.map((a, i) => {
                const earned = earnedTitles.includes(a.title)
                return (
                  <div
                    key={i}
                    title={a.title}
                    className={`flex flex-col items-center p-1.5 md:p-2 rounded-xl border transition ${
                      earned ? 'border-violet-200 bg-violet-50 shadow-sm' : 'border-gray-100 bg-gray-50 opacity-40'
                    }`}
                  >
                    <span className="text-lg md:text-xl">{a.icon}</span>
                  </div>
                )
              })}
            </div>
            {achievements.length > 0 && (
              <p className="text-xs text-violet-600 font-semibold mt-2 md:mt-3">
                🎉 {achievements.length} ta yutuq qo'lga kiritildi!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}