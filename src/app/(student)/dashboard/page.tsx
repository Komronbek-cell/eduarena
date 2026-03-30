'use client'

import BottomNav from '@/components/layout/BottomNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, Quiz } from '@/types'
import Image from 'next/image'
import {
  Trophy, Flame, Star, Target, TrendingUp,
  LogOut, Loader2, ChevronRight, Medal, Zap,
  Bell, Users, CheckCircle, History, Calendar, Lock
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dailyQuiz, setDailyQuiz] = useState<Quiz | null>(null)
  const [weeklyQuiz, setWeeklyQuiz] = useState<Quiz | null>(null)
  const [rank, setRank] = useState<number>(0)
  const [groupRank, setGroupRank] = useState<number>(0)
  const [groupMemberCount, setGroupMemberCount] = useState<number>(0)
  const [quizCount, setQuizCount] = useState<number>(0)
  const [announcementCount, setAnnouncementCount] = useState<number>(0)
  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)

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
        supabase.from('profiles').select('id, total_score, group_id').eq('role', 'student').order('total_score', { ascending: false }),
        supabase.from('announcements').select('id'),
        supabase.from('student_achievements').select('achievement_id, achievements(title, icon)').eq('user_id', user.id),
      ])

      // Guruh tanlanmagan bo'lsa setup sahifasiga yo'naltirish
      if (profileData && !profileData.group_id) {
        router.push('/profile?setup=1')
        return
      }

      setProfile(profileData)
      setQuizCount(attempts?.length ?? 0)
      setAnnouncementCount(announcements?.length ?? 0)
      setCompletedQuizIds(attempts?.map((a: any) => a.quiz_id) ?? [])
      setAchievements(achievementsData ?? [])

      if (allStudents) {
        const rankIndex = allStudents.findIndex(s => s.id === user.id)
        setRank(rankIndex + 1)

        if (profileData?.group_id) {
          const groupMembers = allStudents.filter(s => s.group_id === profileData.group_id)
          const groupRankIdx = groupMembers.findIndex(s => s.id === user.id)
          setGroupRank(groupRankIdx + 1)
          setGroupMemberCount(groupMembers.length)
        }
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
      setTimeout(() => setAnimated(true), 100)
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
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
          <Image src="/logo.png" alt="GULDU" width={64} height={64} className="object-cover" />
        </div>
        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
      </div>
    </div>
  )

  const groupName = (profile as any)?.groups?.name
  const groupId = (profile as any)?.group_id
  const avatarUrl = (profile as any)?.avatar_url
  const isDailyCompleted = dailyQuiz ? completedQuizIds.includes(dailyQuiz.id) : false
  const isWeeklyCompleted = weeklyQuiz ? completedQuizIds.includes(weeklyQuiz.id) : false
  const earnedTitles = achievements.map((a: any) => a.achievements?.title)
  const showStreakWarning = (profile?.streak ?? 0) > 1 && dailyQuiz && !isDailyCompleted

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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return "Kechasi ham o'qiyapsiz"
    if (hour < 12) return "Xayrli tong"
    if (hour < 17) return "Xayrli kun"
    if (hour < 21) return "Xayrli kech"
    return "Xayrli tun"
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

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: '/quizzes', icon: Zap, label: 'Quizlar' },
              { href: '/leaderboard', icon: Medal, label: 'Reyting' },
              { href: '/groups', icon: Users, label: 'Guruhlar' },
              { href: '/history', icon: History, label: 'Tarix' },
              { href: '/announcements', icon: Bell, label: "E'lonlar" },
            ].map(item => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
            <button onClick={() => router.push('/profile')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition ml-1">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                  <span className="text-xs font-black text-violet-600">{profile?.full_name?.charAt(0)}</span>
                </div>
              )}
              Profil
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg transition">
              <LogOut className="w-4 h-4" /> Chiqish
            </button>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-1">
            <button onClick={() => router.push('/profile')} className="flex items-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover border-2 border-violet-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <span className="text-sm font-black text-violet-600">{profile?.full_name?.charAt(0)}</span>
                </div>
              )}
            </button>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-8 pb-24 md:pb-8">

        {/* Welcome */}
        <div className={`mb-4 transition-all duration-700 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{getGreeting()},</p>
              <h1 className="text-xl md:text-2xl font-black text-gray-900">
                {profile?.full_name?.split(' ')[0]} 👋
              </h1>
              <p className="text-gray-400 mt-0.5 text-xs md:text-sm">
                {groupName ? `${groupName} guruhi` : 'Guruh belgilanmagan'} · Bugun ham g'alaba qozonish vaqti!
              </p>
            </div>
            {(profile?.streak ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1.5 rounded-xl flex-shrink-0">
                <Flame className="w-3.5 h-3.5" />
                <span className="font-bold text-xs md:text-sm">{profile!.streak} kun 🔥</span>
              </div>
            )}
          </div>

          {rank > 0 && rank <= 3 && (
            <div className={`mt-3 bg-gradient-to-r ${
              rank === 1 ? 'from-yellow-400 to-amber-500' :
              rank === 2 ? 'from-slate-400 to-slate-500' :
              'from-amber-500 to-orange-500'
            } rounded-2xl px-4 py-3 flex items-center gap-3`}>
              <span className="text-2xl">{rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉'}</span>
              <div>
                <p className="font-black text-white text-sm">
                  {rank === 1 ? 'Siz reytingda BIRINCHISIZ!' : `Siz reytingda #${rank} o'rindaSIZ!`}
                </p>
                <p className="text-white/70 text-xs">Ustunlikni saqlang!</p>
              </div>
            </div>
          )}
        </div>

        {/* Streak xavfi banneri */}
        {showStreakWarning && (
          <div className={`mb-4 transition-all duration-700 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-orange-700">
                  {profile!.streak} kunlik streakingiz xavfda!
                </p>
                <p className="text-xs text-orange-500">Bugun quiz yeching — streakni saqlang</p>
              </div>
              <button
                onClick={() => router.push(`/quiz/${dailyQuiz!.id}`)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex-shrink-0"
              >
                Yechish
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 transition-all duration-700 delay-100 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { icon: <Star className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-violet-600 bg-violet-50', label: 'Umumiy ball', value: profile?.total_score ?? 0, suffix: '', onClick: () => router.push('/leaderboard') },
            { icon: <Flame className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-orange-500 bg-orange-50', label: 'Streak', value: profile?.streak ?? 0, suffix: ' kun', onClick: null },
            { icon: <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-green-600 bg-green-50', label: 'Reyting', value: rank > 0 ? `#${rank}` : '#—', suffix: '', onClick: () => router.push('/leaderboard') },
            { icon: <Target className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-blue-600 bg-blue-50', label: 'Quizlar', value: quizCount, suffix: ' ta', onClick: () => router.push('/history') },
          ].map((s, i) => (
            <div
              key={i}
              onClick={s.onClick ?? undefined}
              className={`bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm ${
                s.onClick ? 'cursor-pointer hover:shadow-md hover:border-violet-200 transition' : ''
              }`}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2.5 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-xl md:text-2xl font-black text-gray-900">{s.value}{s.suffix}</p>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quiz kartalar */}
        <div className={`grid md:grid-cols-2 gap-3 md:gap-4 mb-5 transition-all duration-700 delay-200 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Kunlik quiz */}
          <div className={`rounded-2xl p-5 md:p-6 border transition-all ${
            isDailyCompleted ? 'bg-green-50 border-green-200' :
            dailyQuiz ? 'bg-violet-600 border-violet-600 shadow-lg shadow-violet-200' :
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
                <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">● Faol</span>
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
                {(dailyQuiz as any).deadline && (
                  <p className="text-violet-200 text-xs mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{formatDeadline((dailyQuiz as any).deadline)} gacha
                  </p>
                )}
                <p className="text-violet-200 text-xs md:text-sm mb-4">{dailyQuiz.time_limit / 60} daqiqa · Vaqt bonuslari bor!</p>
                <button
                  onClick={() => router.push(`/quiz/${dailyQuiz.id}`)}
                  className="flex items-center gap-2 bg-white text-violet-700 font-bold text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 rounded-xl hover:bg-violet-50 transition shadow-md"
                >
                  Boshlash <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base md:text-lg font-bold text-gray-700 mb-1">Bugungi quiz</h3>
                <p className="text-gray-400 text-xs md:text-sm">Hozircha faol quiz yo'q</p>
                <button onClick={() => router.push('/quizzes/daily')} className="mt-3 text-xs text-violet-500 font-semibold hover:text-violet-700 transition">
                  Barcha kunlik quizlarni ko'rish →
                </button>
              </>
            )}
          </div>

          {/* Haftalik */}
          <div className={`rounded-2xl p-5 md:p-6 border transition-all ${
            isWeeklyCompleted ? 'bg-green-50 border-green-200' :
            weeklyQuiz ? 'bg-gray-900 border-gray-900 shadow-lg shadow-gray-300' :
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
                <span className="ml-auto bg-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-full animate-pulse">● Faol</span>
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
                {(weeklyQuiz as any).deadline && (
                  <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{formatDeadline((weeklyQuiz as any).deadline)} gacha
                  </p>
                )}
                <p className="text-gray-400 text-xs md:text-sm mb-4">{weeklyQuiz.time_limit / 60} daqiqa · Vaqt bonuslari bor!</p>
                <button
                  onClick={() => router.push(`/quiz/${weeklyQuiz.id}`)}
                  className="flex items-center gap-2 bg-violet-600 text-white font-bold text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 rounded-xl hover:bg-violet-700 transition"
                >
                  Qatnashish <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base md:text-lg font-bold text-gray-700 mb-1">Haftalik musobaqa</h3>
                <p className="text-gray-400 text-xs md:text-sm">Hozircha faol musobaqa yo'q</p>
                <button onClick={() => router.push('/quizzes/weekly')} className="mt-3 text-xs text-violet-500 font-semibold hover:text-violet-700 transition">
                  Barcha haftalik quizlarni ko'rish →
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quyi qator: 3 karta */}
        <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-3 transition-all duration-700 delay-300 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          {/* E'lonlar */}
          <div
            onClick={() => router.push('/announcements')}
            className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-violet-200 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <Bell className="w-4 h-4 text-orange-500" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="font-black text-sm text-gray-900 mb-0.5">
              E'lonlar
              {announcementCount > 0 && (
                <span className="ml-1.5 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{announcementCount}</span>
              )}
            </p>
            <p className="text-xs text-gray-400">
              {announcementCount > 0 ? `${announcementCount} ta yangi` : 'Yangi e\'lon yo\'q'}
            </p>
          </div>

          {/* Guruh */}
          <div
            onClick={() => groupId ? router.push(`/groups/${groupId}`) : router.push('/groups')}
            className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-violet-200 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="font-black text-sm text-gray-900 mb-0.5 truncate">{groupName ?? 'Guruh'}</p>
            <p className="text-xs text-gray-400">
              {groupRank > 0 ? `Guruhda #${groupRank} · ${groupMemberCount} a'zo` : 'Guruh reytingi'}
            </p>
          </div>

          {/* Turnir — col-span-2 on mobile */}
          <div
            onClick={() => router.push('/tournament')}
            className="col-span-2 md:col-span-1 bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-orange-200 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-red-500" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="font-black text-sm text-gray-900 mb-0.5">Turnir</p>
            <p className="text-xs text-gray-400">Guruhlar o'rtasida musobaqa</p>
          </div>
        </div>

        {/* Yutuqlar — full width, yaxshilangan */}
        <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-all duration-700 delay-[400ms] ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Yutuqlar
            </h2>
            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
              {achievements.length}/{allBadges.length}
            </span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {allBadges.map((a, i) => {
              const earned = earnedTitles.includes(a.title)
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                    earned
                      ? 'border-violet-200 bg-violet-50 shadow-sm'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{earned ? a.icon : <Lock className="w-5 h-5 text-gray-300" />}</span>
                  <span className={`text-xs font-semibold text-center leading-tight ${
                    earned ? 'text-violet-700' : 'text-gray-400'
                  }`}>
                    {a.title}
                  </span>
                </div>
              )
            })}
          </div>
          {achievements.length === 0 ? (
            <p className="text-xs text-gray-400 mt-3">Birinchi quizni yakunlang — badge oling!</p>
          ) : achievements.length < allBadges.length ? (
            <p className="text-xs text-violet-600 font-semibold mt-3">
              🎉 {achievements.length} ta yutuq · Yana {allBadges.length - achievements.length} ta qoldi!
            </p>
          ) : (
            <p className="text-xs text-violet-600 font-semibold mt-3">🏆 Barcha yutuqlar qo'lga kiritildi!</p>
          )}
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
