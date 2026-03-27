'use client'

import BottomNav from '@/components/layout/BottomNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal, ArrowLeft, Loader2, Crown, Flame, Star, TrendingUp, Users } from 'lucide-react'
import Image from 'next/image'

interface LeaderboardEntry {
  id: string
  full_name: string
  total_score: number
  streak: number
  avatar_url: string | null
  groups: { name: string } | null
}

interface AttemptStat {
  user_id: string
  score: number
  completed_at: string
}

type Period = 'all' | 'daily' | 'weekly' | 'monthly'

const PERIOD_LABELS: Record<Period, string> = {
  all: 'Umumiy',
  daily: 'Bugun',
  weekly: 'Bu hafta',
  monthly: 'Bu oy',
}

function AvatarCircle({
  student,
  size = 'sm',
  isCurrentUser = false,
  isFirst = false,
  onClick,
}: {
  student: LeaderboardEntry
  size?: 'sm' | 'lg'
  isCurrentUser?: boolean
  isFirst?: boolean
  onClick?: () => void
}) {
  const dim = size === 'lg'
    ? 'w-12 h-12 md:w-16 md:h-16'
    : 'w-9 h-9 md:w-10 md:h-10'

  const border = isFirst
    ? 'border-4 border-yellow-300 shadow-lg shadow-yellow-300/30'
    : isCurrentUser
    ? 'border-2 border-white ring-2 ring-violet-300'
    : size === 'lg'
    ? 'border-4 border-white/30'
    : ''

  const bg = isFirst
    ? 'bg-yellow-100 text-yellow-700'
    : isCurrentUser
    ? 'bg-violet-600 text-white'
    : size === 'lg'
    ? 'bg-white/20 text-white'
    : 'bg-gray-100 text-gray-600'

  return (
    <div
      onClick={onClick}
      className={`${dim} ${border} ${bg} rounded-full overflow-hidden flex items-center justify-center font-black text-sm flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} relative`}
    >
      {student.avatar_url
        ? <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover rounded-full" />
        : <span>{student.full_name.charAt(0)}</span>
      }
      {isCurrentUser && size === 'lg' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
      )}
    </div>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [allStudents, setAllStudents] = useState<LeaderboardEntry[]>([])
  const [attempts, setAttempts] = useState<AttemptStat[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [period, setPeriod] = useState<Period>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const [{ data: students }, { data: attemptsData }] = await Promise.all([
        supabase.from('profiles')
          .select('id, full_name, total_score, streak, avatar_url, groups(name)')
          .eq('role', 'student'),
        supabase.from('quiz_attempts').select('user_id, score, completed_at'),
      ])

      setAllStudents((students as any) ?? [])
      setAttempts(attemptsData ?? [])
      setLoading(false)
    }
    fetchData()
  }, [router])

  const getStudents = (): LeaderboardEntry[] => {
    if (period === 'all') {
      return [...allStudents].sort((a, b) => b.total_score - a.total_score)
    }

    const now = new Date()
    let start: Date
    if (period === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'weekly') {
      const day = now.getDay()
      start = new Date(now)
      start.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      start.setHours(0, 0, 0, 0)
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const scoreMap: Record<string, number> = {}
    attempts.forEach(a => {
      if (new Date(a.completed_at) >= start) {
        scoreMap[a.user_id] = (scoreMap[a.user_id] ?? 0) + a.score
      }
    })

    return allStudents
      .map(s => ({ ...s, total_score: scoreMap[s.id] ?? 0 }))
      .filter(s => s.total_score > 0)
      .sort((a, b) => b.total_score - a.total_score)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const students = getStudents()
  const top3 = students.slice(0, 3)
  const currentRank = students.findIndex(s => s.id === currentUserId) + 1

  const podiumOrder = [
    { student: top3[1], rank: 2, heightClass: 'h-24 md:h-32', bg: 'bg-gradient-to-b from-slate-300 to-slate-500' },
    { student: top3[0], rank: 1, heightClass: 'h-32 md:h-44', bg: 'bg-gradient-to-b from-violet-400 to-violet-700' },
    { student: top3[2], rank: 3, heightClass: 'h-20 md:h-28', bg: 'bg-gradient-to-b from-amber-400 to-amber-600' },
  ]

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
          <span className="font-black text-base md:text-lg">Reyting jadvali</span>
          {currentRank > 0 && (
            <div className="ml-auto flex items-center gap-1.5 bg-violet-50 text-violet-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-violet-100">
              <Medal className="w-3.5 h-3.5" />#{currentRank}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">

        {/* Period tabs */}
        <div className="flex gap-1.5 mb-6 bg-gray-100 p-1 rounded-2xl">
          {(['all', 'daily', 'weekly', 'monthly'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-xl transition ${
                period === p ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {students.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl text-center py-20 shadow-sm">
            <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">
              {period === 'all' ? "Hali hech kim ro'yxatdan o'tmagan" : 'Bu davrda hali natija yo\'q'}
            </p>
            {period !== 'all' && (
              <p className="text-gray-400 text-sm mt-1">Quiz yechib birinchi bo'ling!</p>
            )}
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <div className="bg-gradient-to-b from-violet-600 to-violet-800 rounded-3xl p-6 md:p-8 mb-5 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-4 right-8 w-24 h-24 bg-yellow-300/10 rounded-full blur-2xl" />
                </div>

                <div className="relative">
                  <div className="text-center mb-6 md:mb-8">
                    <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-1">
                      {PERIOD_LABELS[period]} · Top talabalar
                    </p>
                    <h2 className="text-xl md:text-2xl font-black text-white">🏆 Yetakchilar</h2>
                  </div>

                  <div className="flex items-end justify-center gap-3 md:gap-6">
                    {podiumOrder.map(({ student, rank, heightClass, bg }) => {
                      if (!student) return null
                      const isFirst = rank === 1
                      const isCurrentUser = student.id === currentUserId

                      return (
                        <div
                          key={student.id}
                          className="flex flex-col items-center gap-2 flex-1 max-w-[110px] md:max-w-[150px]"
                        >
                          {isFirst && <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-300 animate-bounce" />}

                          <div
                            className="cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => router.push(`/profile/${student.id}`)}
                          >
                            <AvatarCircle
                              student={student}
                              size="lg"
                              isFirst={isFirst}
                              isCurrentUser={isCurrentUser}
                            />
                          </div>

                          <div className="text-center">
                            <p
                              className={`font-black text-xs md:text-sm truncate max-w-full px-1 cursor-pointer hover:underline ${
                                isFirst ? 'text-yellow-200' : 'text-white/90'
                              }`}
                              onClick={() => router.push(`/profile/${student.id}`)}
                            >
                              {student.full_name.split(' ')[0]}
                            </p>
                            <div className={`flex items-center justify-center gap-0.5 text-xs font-bold mt-0.5 ${
                              isFirst ? 'text-yellow-300' : 'text-white/70'
                            }`}>
                              <Star className="w-3 h-3" />{student.total_score}
                            </div>
                            {student.streak > 0 && (
                              <div className="flex items-center justify-center gap-0.5 text-xs text-orange-300 mt-0.5">
                                <Flame className="w-2.5 h-2.5" />{student.streak}
                              </div>
                            )}
                          </div>

                          <div className={`w-full ${heightClass} ${bg} rounded-t-2xl flex flex-col items-center justify-center gap-1 shadow-lg`}>
                            <span className="text-xl md:text-3xl">{medals[rank - 1]}</span>
                            <span className="text-white font-black text-sm md:text-base">#{rank}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Current user highlight */}
            {currentRank > 3 && (
              <div
                className="bg-violet-50 border-2 border-violet-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3 cursor-pointer hover:bg-violet-100 transition"
                onClick={() => router.push(`/profile/${currentUserId}`)}
              >
                <AvatarCircle
                  student={allStudents.find(s => s.id === currentUserId)!}
                  isCurrentUser={true}
                />
                <div className="flex-1">
                  <p className="font-black text-violet-700 text-sm">Sizning o'rningiz</p>
                  <p className="text-xs text-violet-400">
                    {students.find(s => s.id === currentUserId)?.groups?.name ?? 'Guruhsiz'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-violet-600">#{currentRank}</div>
                  <div className="flex items-center gap-0.5 text-xs text-violet-400 justify-end">
                    <Star className="w-3 h-3" />
                    {students.find(s => s.id === currentUserId)?.total_score ?? 0}
                  </div>
                </div>
              </div>
            )}

            {/* Full list */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 md:px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-black text-sm md:text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-600" />
                  Barcha talabalar
                </h2>
                <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-semibold">
                  {students.length} ta
                </span>
              </div>

              {students.map((student, index) => {
                const isCurrentUser = student.id === currentUserId
                const rank = index + 1
                const isTop3 = rank <= 3

                return (
                  <div
                    key={student.id}
                    onClick={() => router.push(`/profile/${student.id}`)}
                    className={`flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-gray-50 last:border-0 transition cursor-pointer ${
                      isCurrentUser ? 'bg-violet-50 hover:bg-violet-100/60' :
                      isTop3 ? 'bg-amber-50/30 hover:bg-amber-50' :
                      'hover:bg-gray-50'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-7 md:w-8 text-center flex-shrink-0">
                      {isTop3
                        ? <span className="text-base md:text-lg">{medals[rank - 1]}</span>
                        : <span className="text-gray-400 text-xs font-mono font-bold">#{rank}</span>
                      }
                    </div>

                    {/* Avatar */}
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      isCurrentUser ? 'ring-2 ring-violet-300' : ''
                    }`}>
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-black text-sm ${
                          isCurrentUser ? 'bg-violet-600 text-white' :
                          isTop3 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {student.full_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`font-bold text-xs md:text-sm truncate ${
                          isCurrentUser ? 'text-violet-700' : isTop3 ? 'text-gray-900' : 'text-gray-800'
                        }`}>
                          {student.full_name}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Siz</span>
                        )}
                        {rank === 1 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">👑 Yetakchi</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span>{student.groups?.name ?? 'Guruhsiz'}</span>
                        {student.streak > 0 && (
                          <span className="flex items-center gap-0.5 text-orange-500">
                            <Flame className="w-2.5 h-2.5" />{student.streak} kun
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className={`flex items-center gap-1 font-black text-sm md:text-base ${
                        isCurrentUser ? 'text-violet-600' : isTop3 ? 'text-amber-600' : 'text-gray-800'
                      }`}>
                        <Star className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        {student.total_score}
                      </div>
                      {index > 0 && students[index - 1].total_score > student.total_score && (
                        <div className="text-xs text-gray-300 mt-0.5">
                          -{students[index - 1].total_score - student.total_score}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Motivatsiya */}
            <div className="mt-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl px-4 py-4 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-violet-500 flex-shrink-0" />
              <p className="text-sm font-bold text-violet-700">
                {currentRank === 1
                  ? "🎉 Siz birinchi o'rindaSIZ! Ustunlikni saqlang!"
                  : currentRank <= 3
                  ? `💪 Top 3 dasiz! 1-o'ringa ${(students[0]?.total_score ?? 0) - (students.find(s => s.id === currentUserId)?.total_score ?? 0)} ball qoldi!`
                  : currentRank > 0
                  ? `🚀 ${currentRank}-o'rindaSIZ. Yuqoriga chiqish uchun har kuni quiz yeching!`
                  : '🎯 Birinchi quizni yeching va reytingga kiring!'}
              </p>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
