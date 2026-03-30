'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Users, Trophy, Flame, Star, Loader2,
  Crown, Medal, TrendingUp, Zap, Target, BarChart2, Swords
} from 'lucide-react'
import Image from 'next/image'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

interface Member {
  id: string
  full_name: string
  total_score: number
  streak: number
  avatar_url: string | null
  quizCount?: number
  tournamentScore?: number
  activityRate?: number
  groupRating?: number
}

interface GroupInfo {
  id: string
  name: string
  description: string
}

interface WeeklyData {
  day: string
  ball: number
}

interface TournamentMatch {
  id: string
  round: number
  status: string
  group1_score: number
  group2_score: number
  group1_id: string
  group2_id: string
  winner_group_id: string | null
  group1: { name: string } | null
  group2: { name: string } | null
}

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>([])
  const [totalQuizzes, setTotalQuizzes] = useState(0)
  const [activeTab, setActiveTab] = useState<'members' | 'stats' | 'tournament'>('members')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      // Asosiy ma'lumotlar
      const [
        { data: groupData },
        { data: membersData },
        { data: allQuizzes },
      ] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        supabase.from('profiles')
          .select('id, full_name, total_score, streak, avatar_url')
          .eq('group_id', groupId)
          .eq('role', 'student')
          .order('total_score', { ascending: false }),
        supabase.from('quizzes').select('id').neq('status', 'draft'),
      ])

      const totalQuizCount = allQuizzes?.length ?? 0
      setGroup(groupData)
      setTotalQuizzes(totalQuizCount)

      const memberIds = (membersData ?? []).map(m => m.id)

      // Quiz attempts — faollik
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('user_id, score, completed_at')
        .in('user_id', memberIds)

      // Haftalik o'sish — oxirgi 7 kun
      const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Ya']
      const today = new Date()
      const weekly: WeeklyData[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (6 - i))
        const dayLabel = days[d.getDay() === 0 ? 6 : d.getDay() - 1]
        const dayStr = d.toISOString().split('T')[0]
        const dayScore = attempts
          ?.filter(a => a.completed_at?.startsWith(dayStr) && memberIds.includes(a.user_id))
          .reduce((sum, a) => sum + (a.score ?? 0), 0) ?? 0
        return { day: dayLabel, ball: dayScore }
      })
      setWeeklyData(weekly)

      // Har bir a'zo uchun quiz soni
      const quizCountMap: Record<string, number> = {}
      attempts?.forEach(a => {
        quizCountMap[a.user_id] = (quizCountMap[a.user_id] ?? 0) + 1
      })

      // Turnir ma'lumotlari
      const { data: tourData } = await supabase
        .from('tournaments')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let tourMatches: TournamentMatch[] = []
      if (tourData) {
        const { data: matchesData } = await supabase
          .from('tournament_matches')
          .select('*, group1:group1_id(name), group2:group2_id(name)')
          .eq('tournament_id', tourData.id)
          .or(`group1_id.eq.${groupId},group2_id.eq.${groupId}`)
          .order('round')
        tourMatches = (matchesData as any) ?? []
        setTournamentMatches(tourMatches)
      }

      const tourWins = tourMatches.filter(m => m.winner_group_id === groupId).length
      const tourPlayed = tourMatches.filter(m => m.status === 'finished').length

      // Guruh reytingi hisoblash
      const maxScore = Math.max(...(membersData ?? []).map(m => m.total_score), 1)
      const maxQuiz = Math.max(...Object.values(quizCountMap), 1)

      const enriched = (membersData ?? []).map(m => {
        const quizCount = quizCountMap[m.id] ?? 0
        const activityRate = totalQuizCount > 0 ? Math.round((quizCount / totalQuizCount) * 100) : 0

        // Reyting formula: ball 40% + faollik 35% + turnir 25%
        const scoreRating = (m.total_score / maxScore) * 40
        const activityRating = (quizCount / maxQuiz) * 35
        const tourRating = tourPlayed > 0 ? (tourWins / tourPlayed) * 25 : 0
        const groupRating = Math.round(scoreRating + activityRating + tourRating)

        return {
          ...m,
          quizCount,
          activityRate,
          groupRating,
        }
      }).sort((a, b) => (b.groupRating ?? 0) - (a.groupRating ?? 0))

      setMembers(enriched)
      setLoading(false)
    }
    fetchData()
  }, [groupId, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg">
          <Image src="/logo.png" alt="GULDU" width={56} height={56} className="object-cover" />
        </div>
        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
      </div>
    </div>
  )

  if (!group) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400">Guruh topilmadi</p>
        <button onClick={() => router.push('/groups')} className="mt-4 text-violet-600 font-semibold text-sm">
          Orqaga qaytish
        </button>
      </div>
    </div>
  )

  const totalScore = members.reduce((sum, m) => sum + m.total_score, 0)
  const avgScore = members.length > 0 ? Math.round(totalScore / members.length) : 0
  const totalQuizAttempts = members.reduce((sum, m) => sum + (m.quizCount ?? 0), 0)
  const avgActivity = members.length > 0 ? Math.round((totalQuizAttempts / (members.length * Math.max(totalQuizzes, 1))) * 100) : 0
  const topMember = members[0]
  const currentUserRank = members.findIndex(m => m.id === currentUserId) + 1
  const tourWins = tournamentMatches.filter(m => m.winner_group_id === groupId).length
  const tourLosses = tournamentMatches.filter(m => m.status === 'finished' && m.winner_group_id !== groupId).length
  const medals = ['🥇', '🥈', '🥉']

  // Guruhning umumiy reytingi: o'rt.ball 40% + faollik 30% + a'zolar soni 15% + turnir 15%
  const scoreComponent = Math.min((avgScore / 300) * 40, 40)
  const activityComponent = (avgActivity / 100) * 30
  const memberComponent = Math.min((members.length / 30) * 15, 15)
  const tourComponent = (tourWins + tourLosses) > 0 ? (tourWins / (tourWins + tourLosses)) * 15 : 0
  const groupOverallRating = Math.round(scoreComponent + activityComponent + memberComponent + tourComponent)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/groups')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
          <div>
            <span className="font-black text-base md:text-lg">{group.name}</span>
            <p className="text-xs text-gray-400 leading-none">{group.description}</p>
          </div>
          {currentUserRank > 0 && (
            <div className="ml-auto flex items-center gap-1.5 bg-violet-50 text-violet-600 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-violet-100">
              <Medal className="w-3 h-3" />
              #{currentUserRank}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">

        {/* Hero */}
        <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-3xl p-6 mb-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 w-32 h-32 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center font-black text-white text-2xl">
                {group.name.split('-')[0]}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">{group.name}</h1>
                <p className="text-violet-200 text-sm">{group.description} · {members.length} talaba</p>
              </div>
              {/* Guruh umumiy reytingi */}
              <div className="ml-auto bg-white/20 rounded-2xl px-3 py-2 text-center">
                <p className="text-2xl font-black text-white">{groupOverallRating}</p>
                <p className="text-xs text-violet-200">Reyting</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <Star className="w-4 h-4 text-yellow-300 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{avgScore}</p>
                <p className="text-xs text-violet-200">O'rt. ball</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <Zap className="w-4 h-4 text-green-300 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{avgActivity}%</p>
                <p className="text-xs text-violet-200">Faollik</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <Trophy className="w-4 h-4 text-orange-300 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{tourWins}W</p>
                <p className="text-xs text-violet-200">Turnir</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <Target className="w-4 h-4 text-blue-300 mx-auto mb-1" />
                <p className="text-lg font-black text-white">{totalQuizAttempts}</p>
                <p className="text-xs text-violet-200">Quiz</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-white border border-gray-100 p-1 rounded-2xl shadow-sm">
          {[
            { key: 'members', label: "A'zolar", icon: Users },
            { key: 'stats', label: 'Statistika', icon: BarChart2 },
            { key: 'tournament', label: 'Turnir', icon: Swords },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                  : 'text-gray-500 hover:text-violet-600'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="space-y-3">
            {/* Eng faol a'zo */}
            {topMember && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="text-3xl">👑</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-600 font-bold mb-0.5">Guruh lideri</p>
                  <p className="font-black text-gray-900 truncate">{topMember.full_name}</p>
                  <p className="text-xs text-amber-600">{topMember.total_score} ball · {topMember.quizCount} quiz · {topMember.activityRate}% faollik</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-black text-amber-600">{topMember.groupRating}</p>
                  <p className="text-xs text-amber-400">reyting</p>
                </div>
              </div>
            )}

            {/* Members list */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-black text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-600" />
                  A'zolar reytingi
                </h2>
                <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-semibold">
                  {members.length} ta
                </span>
              </div>

              {members.map((member, index) => {
                const isCurrentUser = member.id === currentUserId
                const rank = index + 1
                const isTop3 = rank <= 3

                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition ${
                      isCurrentUser ? 'bg-violet-50' : isTop3 ? 'bg-amber-50/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-7 text-center flex-shrink-0">
                      {isTop3
                        ? <span className="text-base">{medals[rank - 1]}</span>
                        : <span className="text-gray-400 text-xs font-mono font-bold">#{rank}</span>
                      }
                    </div>

                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 overflow-hidden ${isCurrentUser ? 'ring-2 ring-violet-400' : ''}`}>
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-black text-sm ${isCurrentUser ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {member.full_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`font-bold text-xs truncate ${isCurrentUser ? 'text-violet-700' : 'text-gray-900'}`}>
                          {member.full_name}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Siz</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{member.quizCount} quiz</span>
                        <span className="text-xs text-green-600 font-semibold">{member.activityRate}% faol</span>
                        {member.streak > 0 && (
                          <span className="text-xs text-orange-500 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" />{member.streak}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score + Rating */}
                    <div className="text-right flex-shrink-0">
                      <div className={`flex items-center gap-1 font-black text-sm ${isCurrentUser ? 'text-violet-600' : isTop3 ? 'text-amber-600' : 'text-gray-800'}`}>
                        <Star className="w-3 h-3" />
                        {member.total_score}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {member.groupRating} reyting
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Motivatsiya */}
            {currentUserRank > 0 && (
              <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-violet-500 flex-shrink-0" />
                <p className="text-xs md:text-sm text-violet-600 font-semibold">
                  {currentUserRank === 1
                    ? "🏆 Guruhingizda birinchi o'rindaSIZ! Ustunlikni saqlang!"
                    : `💪 Guruhingizda ${currentUserRank}-o'rindaSIZ. 1-o'ringa ${(members[0]?.groupRating ?? 0) - (members.find(m => m.id === currentUserId)?.groupRating ?? 0)} reyting qoldi!`
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-4">

            {/* Reyting tarkibi */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-600" />
                Guruh reytingi tarkibi
              </h3>
              <div className="space-y-3">
                {[
                  { label: "O'rtacha ball", value: `${avgScore}`, weight: '40%', color: 'bg-violet-500', fill: Math.min((avgScore / 300) * 100, 100) },
                  { label: 'Faollik foizi', value: `${avgActivity}%`, weight: '30%', color: 'bg-green-500', fill: avgActivity },
                  { label: "A'zolar soni", value: `${members.length} talaba`, weight: '15%', color: 'bg-blue-500', fill: Math.min((members.length / 30) * 100, 100) },
                  { label: 'Turnir natijalari', value: `${tourWins}W / ${tourLosses}L`, weight: '15%', color: 'bg-orange-500', fill: (tourWins + tourLosses) > 0 ? (tourWins / (tourWins + tourLosses)) * 100 : 0 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">{item.label}</span>
                        <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">{item.weight}</span>
                      </div>
                      <span className="text-xs font-black text-gray-900">{item.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                        style={{ width: `${item.fill}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Umumiy reyting</span>
                <span className="text-2xl font-black text-violet-600">{groupOverallRating}</span>
              </div>
            </div>

            {/* Haftalik o'sish grafigi */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-600" />
                Haftalik faollik
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }}
                    formatter={(val: any) => [`${val} ball`, 'Guruh']}
                  />
                  <Line
                    type="monotone"
                    dataKey="ball"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={{ fill: '#7c3aed', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* A'zolar faolligi */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                A'zolar faolligi
              </h3>
              <div className="space-y-2.5">
                {[...members]
                  .sort((a, b) => (b.quizCount ?? 0) - (a.quizCount ?? 0))
                  .slice(0, 5)
                  .map((member, i) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-400 w-4">#{i + 1}</span>
                      <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-gray-600 flex-shrink-0 overflow-hidden">
                        {member.avatar_url
                          ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                          : member.full_name.charAt(0)
                        }
                      </div>
                      <span className="text-xs font-bold text-gray-700 truncate flex-1">{member.full_name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${member.activityRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-green-600 w-8 text-right">{member.activityRate}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TOURNAMENT TAB */}
        {activeTab === 'tournament' && (
          <div className="space-y-3">
            {tournamentMatches.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
                <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-semibold">Turnirda hali ishtirok etilmagan</p>
              </div>
            ) : (
              <>
                {/* Turnir xulosa */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "O'yinlar", value: tournamentMatches.length, color: 'text-gray-700', bg: 'bg-white' },
                    { label: "G'alaba", value: tourWins, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: "Mag'lubiyat", value: tourLosses, color: 'text-red-500', bg: 'bg-red-50' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} border border-gray-100 rounded-2xl p-4 text-center shadow-sm`}>
                      <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Match tarixi */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <h3 className="font-black text-sm flex items-center gap-2">
                      <Swords className="w-4 h-4 text-violet-600" />
                      Match tarixi
                    </h3>
                  </div>
                  {tournamentMatches.map((match) => {
                    const isGroup1 = match.group1_id === groupId
                    const myScore = isGroup1 ? match.group1_score : match.group2_score
                    const oppScore = isGroup1 ? match.group2_score : match.group1_score
                    const oppName = isGroup1 ? match.group1?.name : match.group2?.name
                    const isWin = match.winner_group_id === groupId
                    const isFinished = match.status === 'finished'

                    const roundLabel = (r: number) => {
                      const total = tournamentMatches.length
                      if (r === Math.max(...tournamentMatches.map(m => m.round))) return '🏆 Final'
                      if (r === Math.max(...tournamentMatches.map(m => m.round)) - 1) return '⚔️ Yarim final'
                      return `${r}-tur`
                    }

                    return (
                      <div key={match.id} className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${
                        isWin ? 'bg-green-50/50' : isFinished ? 'bg-red-50/30' : 'bg-gray-50/50'
                      }`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                          isWin ? 'bg-green-100' : isFinished ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {!isFinished ? '⏳' : isWin ? '✅' : '❌'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-gray-900 truncate">
                            {isGroup1 ? match.group2?.name : match.group1?.name}
                          </p>
                          <p className="text-xs text-gray-400">{roundLabel(match.round)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-black text-sm ${isWin ? 'text-green-600' : isFinished ? 'text-red-500' : 'text-gray-400'}`}>
                            {myScore.toFixed(1)} — {oppScore.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {!isFinished ? 'Davom etmoqda' : isWin ? "G'alaba" : "Mag'lubiyat"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}