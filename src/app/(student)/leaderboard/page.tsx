'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal, ArrowLeft, Loader2, Crown } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  )

  const top3 = students.slice(0, 3)
  const rest = students.slice(3)
  const currentRank = students.findIndex(s => s.id === currentUserId) + 1

  const podiumOrder = top3.length === 3
    ? [top3[1], top3[0], top3[2]]
    : top3

  const medalColors = ['🥇', '🥈', '🥉']
  const podiumHeights = ['h-24', 'h-32', 'h-20']
  const podiumBg = ['bg-slate-700', 'bg-indigo-600', 'bg-amber-600']

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Trophy className="w-5 h-5 text-indigo-400" />
        <span className="font-bold">Reyting jadvali</span>
        {currentRank > 0 && (
          <span className="ml-auto text-sm text-slate-400">
            Sizning o'rningiz: <span className="text-indigo-400 font-bold">#{currentRank}</span>
          </span>
        )}
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Podium - Top 3 */}
        {top3.length > 0 && (
          <div className="mb-10">
            <div className="flex items-end justify-center gap-4 mb-2">
              {podiumOrder.map((student, i) => {
                const realIndex = top3.indexOf(student)
                const isFirst = realIndex === 0
                return (
                  <div key={student.id} className="flex flex-col items-center gap-2">
                    {isFirst && <Crown className="w-6 h-6 text-yellow-400" />}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2 ${
                      isFirst ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-600 bg-slate-800'
                    }`}>
                      {student.full_name.charAt(0)}
                    </div>
                    <p className="text-sm font-medium text-center max-w-20 truncate">{student.full_name}</p>
                    <p className="text-xs text-slate-400">{student.total_score} ball</p>
                    <div className={`w-20 ${podiumHeights[realIndex]} ${podiumBg[realIndex]} rounded-t-xl flex items-end justify-center pb-2`}>
                      <span className="text-white font-bold text-lg">{medalColors[realIndex]}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Qolgan o'rinlar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="font-semibold">Barcha talabalar</h2>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p>Hali hech kim ro'yxatdan o'tmagan</p>
            </div>
          ) : (
            <div>
              {students.map((student, index) => {
                const isCurrentUser = student.id === currentUserId
                const rank = index + 1
                return (
                  <div
                    key={student.id}
                    className={`flex items-center gap-4 px-6 py-4 border-b border-slate-800 last:border-0 transition ${
                      isCurrentUser ? 'bg-indigo-500/10' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center">
                      {rank <= 3 ? (
                        <span className="text-lg">{medalColors[rank - 1]}</span>
                      ) : (
                        <span className="text-slate-500 text-sm font-mono">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isCurrentUser ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}>
                      {student.full_name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm ${isCurrentUser ? 'text-indigo-300' : ''}`}>
                          {student.full_name}
                          {isCurrentUser && <span className="text-xs text-indigo-400 ml-1">(Siz)</span>}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {student.groups?.name ?? 'Guruhsiz'} · 🔥 {student.streak} kun
                      </p>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <Medal className="w-3.5 h-3.5" />
                      <span className="font-bold text-sm">{student.total_score}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}