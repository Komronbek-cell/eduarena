'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trophy, Users, TrendingUp, Medal, Crown, Flame, Loader2, Star } from 'lucide-react'

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
        .from('profiles')
        .select('group_id')
        .eq('id', user.id)
        .single()

      setCurrentGroupId(profileData?.group_id ?? null)

      const { data: groupsData } = await supabase
        .from('groups')
        .select('id, name, description')

      const { data: students } = await supabase
        .from('profiles')
        .select('group_id, total_score, streak, full_name')
        .eq('role', 'student')

      if (!groupsData || !students) { setLoading(false); return }

      const groupStats: GroupStat[] = groupsData
        .map(group => {
          const groupStudents = students.filter(s => s.group_id === group.id)
          if (groupStudents.length === 0) return null

          const totalScore = groupStudents.reduce((sum, s) => sum + (s.total_score ?? 0), 0)
          const avgScore = Math.round(totalScore / groupStudents.length)
          const topStreak = Math.max(...groupStudents.map(s => s.streak ?? 0))
          const topStudent = groupStudents.sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))[0]?.full_name ?? '—'

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            totalScore,
            avgScore,
            studentCount: groupStudents.length,
            topStreak,
            topStudent,
          }
        })
        .filter(Boolean)
        .sort((a, b) => (b!.avgScore - a!.avgScore)) as GroupStat[]

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
  const rest = groups.slice(3)
  const currentRank = groups.findIndex(g => g.id === currentGroupId) + 1

  const podiumConfig = [
    { index: 1, height: 'h-28', bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-600', medal: '🥈', shadow: '' },
    { index: 0, height: 'h-40', bg: 'bg-violet-600', border: 'border-violet-500', text: 'text-white', medal: '🥇', shadow: 'shadow-xl shadow-violet-200' },
    { index: 2, height: 'h-24', bg: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-700', medal: '🥉', shadow: '' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Users className="w-5 h-5 text-violet-600" />
          <span className="font-black text-lg">Guruh reytingi</span>
          {currentRank > 0 && (
            <div className="ml-auto flex items-center gap-1.5 bg-violet-50 text-violet-600 px-3 py-1.5 rounded-xl text-sm font-bold border border-violet-100">
              <Users className="w-3.5 h-3.5" />
              Guruhingiz: #{currentRank}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {groups.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl text-center py-20 shadow-sm">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">Hali guruh ma'lumotlari yo'q</p>
          </div>
        ) : (
          <>
            {/* Hero podium */}
            {top3.length >= 2 && (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-6 shadow-sm overflow-hidden relative">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 to-transparent pointer-events-none" />
                
                <div className="relative">
                  <div className="text-center mb-8">
                    <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1">Top guruhlar</p>
                    <h2 className="text-2xl font-black">🏆 Eng yaxshi guruhlar</h2>
                    <p className="text-gray-400 text-sm mt-1">O'rtacha ball bo'yicha reyting</p>
                  </div>

                  <div className="flex items-end justify-center gap-4 md:gap-8">
                    {podiumConfig.map((config) => {
                      const group = top3[config.index]
                      if (!group) return null
                      const isFirst = config.index === 0
                      const isCurrentGroup = group.id === currentGroupId

                      return (
                        <div key={group.id} className="flex flex-col items-center gap-3 flex-1 max-w-[160px]">
                          {isFirst && (
                            <Crown className="w-7 h-7 text-yellow-500 animate-bounce" />
                          )}

                          {/* Group card */}
                          <div className={`w-full rounded-2xl p-3 text-center border-2 ${
                            isCurrentGroup
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-gray-100 bg-white'
                          }`}>
                            <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center font-black text-lg mb-2 ${
                              isFirst ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {group.name.split('-')[0]}
                            </div>
                            <p className="font-black text-sm text-gray-900 truncate">{group.name}</p>
                            <p className="text-xs text-gray-400 truncate">{group.description}</p>
                            {isCurrentGroup && (
                              <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">
                                Sizning guruhingiz
                              </span>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="text-center">
                            <div className={`flex items-center justify-center gap-1 font-black text-lg ${
                              isFirst ? 'text-violet-600' : 'text-gray-700'
                            }`}>
                              <Star className="w-4 h-4" />
                              {group.avgScore}
                            </div>
                            <p className="text-xs text-gray-400">o'rtacha ball</p>
                          </div>

                          {/* Podium */}
                          <div className={`w-full ${config.height} ${config.bg} border-2 ${config.border} rounded-t-2xl flex flex-col items-center justify-center gap-1 ${config.shadow}`}>
                            <span className="text-2xl">{config.medal}</span>
                            <span className={`font-black text-sm ${config.text}`}>
                              #{config.index + 1}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Full rankings */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-black">Barcha guruhlar</h2>
                <span className="text-sm text-gray-400">{groups.length} ta guruh</span>
              </div>

              {groups.map((group, index) => {
                const isCurrentGroup = group.id === currentGroupId
                const rank = index + 1

                return (
                  <div
                    key={group.id}
                    className={`px-6 py-5 border-b border-gray-50 last:border-0 transition ${
                      isCurrentGroup ? 'bg-violet-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-8 text-center flex-shrink-0">
                        {rank === 1 ? <span className="text-xl">🥇</span>
                          : rank === 2 ? <span className="text-xl">🥈</span>
                          : rank === 3 ? <span className="text-xl">🥉</span>
                          : <span className="text-gray-400 text-sm font-mono font-bold">#{rank}</span>}
                      </div>

                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                        isCurrentGroup ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {group.name.split('-')[0]}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-black text-base ${isCurrentGroup ? 'text-violet-700' : 'text-gray-900'}`}>
                            {group.name}
                          </p>
                          {isCurrentGroup && (
                            <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-bold">
                              Sizning guruhingiz
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {group.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {group.studentCount} talaba
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {group.totalScore} jami ball
                          </span>
                          {group.topStreak > 0 && (
                            <span className="flex items-center gap-1 text-orange-500">
                              <Flame className="w-3 h-3" />
                              {group.topStreak} streak
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Eng yaxshi: <span className="font-semibold text-gray-600">{group.topStudent}</span>
                        </p>
                      </div>

                      {/* Avg score */}
                      <div className="text-right flex-shrink-0">
                        <div className={`text-2xl font-black ${
                          isCurrentGroup ? 'text-violet-600' : 'text-gray-900'
                        }`}>
                          {group.avgScore}
                        </div>
                        <div className="text-xs text-gray-400">o'rtacha</div>

                        {/* Mini bar */}
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isCurrentGroup ? 'bg-violet-500' : 'bg-gray-300'}`}
                            style={{
                              width: `${Math.min(100, (group.avgScore / (groups[0]?.avgScore || 1)) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Info */}
            <div className="mt-4 bg-violet-50 border border-violet-100 rounded-2xl px-5 py-4 flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-violet-700">Guruh reytingi qanday hisoblanadi?</p>
                <p className="text-xs text-violet-500 mt-0.5 leading-relaxed">
                  Guruh reytingi o'rtacha ball asosida hisoblanadi — barcha a'zolar ballarining o'rtachasi. Bu guruh o'lchamidan qat'iy nazar adolatli raqobatni ta'minlaydi.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}