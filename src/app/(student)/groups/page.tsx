'use client'

import BottomNav from '@/components/layout/BottomNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trophy, Users, TrendingUp, Flame, Loader2, Star, Crown, ChevronRight } from 'lucide-react'

interface GroupStat {
  id: string
  name: string
  description: string
  totalScore: number
  avgScore: number
  studentCount: number
  topStreak: number
  topStudent: string
}

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<GroupStat[]>([])
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('profiles').select('group_id').eq('id', user.id).single()
      setCurrentGroupId(profileData?.group_id ?? null)

      const [{ data: groupsData }, { data: students }] = await Promise.all([
        supabase.from('groups').select('id, name, description'),
        supabase.from('profiles').select('group_id, total_score, streak, full_name').eq('role', 'student'),
      ])

      if (!groupsData || !students) { setLoading(false); return }

      const groupStats: GroupStat[] = groupsData
        .map(group => {
          const gs = students.filter(s => s.group_id === group.id)
          if (gs.length === 0) return null
          const totalScore = gs.reduce((sum, s) => sum + (s.total_score ?? 0), 0)
          const avgScore = Math.round(totalScore / gs.length)
          const topStreak = Math.max(...gs.map(s => s.streak ?? 0))
          const topStudent = [...gs].sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))[0]?.full_name ?? '—'
          return {
            id: group.id,
            name: group.name,
            description: group.description ?? '',
            totalScore,
            avgScore,
            studentCount: gs.length,
            topStreak,
            topStudent,
          }
        })
        .filter(Boolean)
        .sort((a, b) => b!.avgScore - a!.avgScore) as GroupStat[]

      setGroups(groupStats)
      setLoading(false)
    }
    fetchData()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const top3 = groups.slice(0, 3)
  const currentRank = groups.findIndex(g => g.id === currentGroupId) + 1

  const podiumConfig = [
    { index: 1, height: 'h-20 md:h-28', bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-600', medal: '🥈' },
    { index: 0, height: 'h-28 md:h-40', bg: 'bg-violet-600', border: 'border-violet-500', text: 'text-white', medal: '🥇', shadow: 'shadow-lg shadow-violet-200' },
    { index: 2, height: 'h-16 md:h-24', bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-700', medal: '🥉' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24 md:pb-0">
      <nav className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Users className="w-5 h-5 text-violet-600" />
          <span className="font-black text-base md:text-lg">Guruh reytingi</span>
          {currentRank > 0 && (
            <div className="ml-auto flex items-center gap-1.5 bg-violet-50 text-violet-600 px-2.5 py-1.5 rounded-xl text-xs md:text-sm font-bold border border-violet-100">
              <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
              #{currentRank}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {groups.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl text-center py-16 shadow-sm">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Hali guruh ma'lumotlari yo'q</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 2 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-8 mb-5 shadow-sm">
                <div className="text-center mb-5 md:mb-8">
                  <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1">Top guruhlar</p>
                  <h2 className="text-lg md:text-2xl font-black">🏆 Eng yaxshi guruhlar</h2>
                  <p className="text-gray-400 text-xs mt-1">O'rtacha ball bo'yicha · Guruhni bosib a'zolarni ko'ring</p>
                </div>

                <div className="flex items-end justify-center gap-2 md:gap-8">
                  {podiumConfig.map((config) => {
                    const group = top3[config.index]
                    if (!group) return null
                    const isFirst = config.index === 0
                    const isCurrentGroup = group.id === currentGroupId

                    return (
                      <div
                        key={group.id}
                        onClick={() => router.push(`/groups/${group.id}`)}
                        className="flex flex-col items-center gap-2 flex-1 max-w-[110px] md:max-w-[160px] cursor-pointer group"
                      >
                        {isFirst && <Crown className="w-5 h-5 md:w-7 md:h-7 text-yellow-500" />}

                        <div className={`w-full rounded-xl p-2 md:p-3 text-center border-2 transition group-hover:border-violet-400 group-hover:shadow-md ${
                          isCurrentGroup ? 'border-violet-500 bg-violet-50' : 'border-gray-100 bg-white'
                        }`}>
                          <div className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl mx-auto flex items-center justify-center font-black text-base md:text-lg mb-1.5 ${
                            isFirst ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {group.name.split('-')[0]}
                          </div>
                          <p className="font-black text-xs md:text-sm text-gray-900 truncate">{group.name}</p>
                          <p className="text-xs text-gray-400 truncate hidden md:block">{group.description}</p>
                          {isCurrentGroup && (
                            <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block">Sizniki</span>
                          )}
                        </div>

                        <div className="text-center">
                          <div className={`flex items-center justify-center gap-0.5 font-black text-sm md:text-lg ${
                            isFirst ? 'text-violet-600' : 'text-gray-700'
                          }`}>
                            <Star className="w-3 h-3 md:w-4 md:h-4" />
                            {group.avgScore}
                          </div>
                          <p className="text-xs text-gray-400 hidden md:block">o'rtacha</p>
                        </div>

                        <div className={`w-full ${config.height} ${config.bg} border-2 ${config.border} rounded-t-xl md:rounded-t-2xl flex flex-col items-center justify-center gap-0.5 ${(config as any).shadow ?? ''}`}>
                          <span className="text-lg md:text-2xl">{config.medal}</span>
                          <span className={`font-black text-xs md:text-sm ${config.text}`}>#{config.index + 1}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Full list */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 md:px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-black text-sm md:text-base">Barcha guruhlar</h2>
                <span className="text-xs md:text-sm text-gray-400">{groups.length} ta</span>
              </div>

              {groups.map((group, index) => {
                const isCurrentGroup = group.id === currentGroupId
                const rank = index + 1

                return (
                  <div
                    key={group.id}
                    onClick={() => router.push(`/groups/${group.id}`)}
                    className={`px-4 md:px-6 py-4 border-b border-gray-50 last:border-0 transition cursor-pointer ${
                      isCurrentGroup ? 'bg-violet-50 hover:bg-violet-100/70' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="w-6 md:w-8 text-center flex-shrink-0">
                        {rank === 1 ? <span className="text-base md:text-xl">🥇</span>
                          : rank === 2 ? <span className="text-base md:text-xl">🥈</span>
                          : rank === 3 ? <span className="text-base md:text-xl">🥉</span>
                          : <span className="text-gray-400 text-xs md:text-sm font-mono font-bold">#{rank}</span>}
                      </div>

                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                        isCurrentGroup ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {group.name.split('-')[0]}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`font-black text-sm ${isCurrentGroup ? 'text-violet-700' : 'text-gray-900'}`}>
                            {group.name}
                          </p>
                          {isCurrentGroup && (
                            <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">Sizniki</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3" />{group.studentCount}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Trophy className="w-3 h-3" />{group.totalScore}
                          </span>
                          {group.topStreak > 0 && (
                            <span className="flex items-center gap-0.5 text-orange-500">
                              <Flame className="w-3 h-3" />{group.topStreak}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          Lider: <span className="text-gray-600 font-medium">{group.topStudent}</span>
                        </p>
                      </div>

                      {/* Avg score + arrow */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className={`text-lg md:text-2xl font-black ${isCurrentGroup ? 'text-violet-600' : 'text-gray-900'}`}>
                            {group.avgScore}
                          </div>
                          <div className="text-xs text-gray-400">ball</div>
                          <div className="w-14 md:w-20 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isCurrentGroup ? 'bg-violet-500' : 'bg-gray-300'}`}
                              style={{ width: `${Math.min(100, (group.avgScore / (groups[0]?.avgScore || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Info */}
            <div className="mt-4 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-600 leading-relaxed">
                <span className="font-bold">Guruh reytingi</span> o'rtacha ball asosida hisoblanadi — adolatli raqobat uchun. Guruh ustiga bosib a'zolarni ko'ring.
              </p>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}