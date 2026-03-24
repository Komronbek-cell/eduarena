'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal, ArrowLeft, Loader2, Crown, Flame } from 'lucide-react'

interface LeaderboardEntry {
  id: string
  full_name: string
  total_score: number
  streak: number
  groups: { name: string } | null
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [students, setStudents] = useState<LeaderboardEntry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, total_score, streak, groups(name)')
        .eq('role', 'student')
        .order('total_score', { ascending: false })
        .limit(50)

      setStudents((data as any) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const top3 = students.slice(0, 3)
  const rest = students.slice(3)
  const currentRank = students.findIndex(s => s.id === currentUserId) + 1

  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3
  const podiumConfig = [
    { height: 'h-28', bg: 'bg-gray-100', textColor: 'text-gray-600', rank: 2, medal: '🥈' },
    { height: 'h-36', bg: 'bg-violet-600', textColor: 'text-white', rank: 1, medal: '👑' },
    { height: 'h-24', bg: 'bg-amber-100', textColor: 'text-amber-700', rank: 3, medal: '🥉' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-violet-600" />
            <span className="font-black text-lg">Reyting jadvali</span>
          </div>
          {currentRank > 0 && (
            <div className="ml-auto flex items-center gap-1.5 bg-violet-50 text-violet-600 px-3 py-1.5 rounded-xl text-sm font-bold">
              <Medal className="w-3.5 h-3.5" />
              Sizning o'rningiz: #{currentRank}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Podium */}
        {top3.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-6 shadow-sm">
            <h2 className="text-center font-black text-lg mb-8 text-gray-900">🏆 Top 3</h2>
            <div className="flex items-end justify-center gap-6">
              {podiumOrder.map((student, i) => {
                const config = podiumConfig[i]
                const isFirst = config.rank === 1
                return (
                  <div key={student.id} className="flex flex-col items-center gap-2">
                    {isFirst && <Crown className="w-6 h-6 text-yellow-500" />}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg border-2 ${
                      isFirst
                        ? 'border-violet-300 bg-violet-100 text-violet-700'
                        : 'border-gray-200 bg-gray-100 text-gray-600'
                    }`}>
                      {student.full_name.charAt(0)}
                    </div>
                    <p className="font-bold text-sm text-center max-w-[80px] truncate">{student.full_name}</p>
                    <p className="text-xs text-gray-400">{student.total_score} ball</p>
                    <div className={`w-24 ${config.height} ${config.bg} rounded-t-2xl flex items-center justify-center`}>
                      <span className={`font-black text-xl ${config.textColor}`}>
                        {config.rank === 1 ? '🥇' : config.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Full list */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-black text-gray-900">Barcha talabalar</h2>
            <span className="text-sm text-gray-400">{students.length} ta</span>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400">Hali hech kim ro'yxatdan o'tmagan</p>
            </div>
          ) : (
            students.map((student, index) => {
              const isCurrentUser = student.id === currentUserId
              const rank = index + 1
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 transition ${
                    isCurrentUser ? 'bg-violet-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {rank === 1 ? <span className="text-lg">🥇</span>
                      : rank === 2 ? <span className="text-lg">🥈</span>
                      : rank === 3 ? <span className="text-lg">🥉</span>
                      : <span className="text-gray-400 text-sm font-mono">#{rank}</span>
                    }
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                    isCurrentUser
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {student.full_name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm truncate ${isCurrentUser ? 'text-violet-700' : 'text-gray-900'}`}>
                        {student.full_name}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full flex-shrink-0">Siz</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      {student.groups?.name ?? 'Guruhsiz'}
                      {student.streak > 0 && (
                        <span className="flex items-center gap-1 text-orange-500">
                          <Flame className="w-3 h-3" />
                          {student.streak}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Score */}
                  <div className={`flex items-center gap-1.5 font-black text-sm flex-shrink-0 ${
                    isCurrentUser ? 'text-violet-600' : 'text-gray-900'
                  }`}>
                    <Medal className="w-3.5 h-3.5" />
                    {student.total_score}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}