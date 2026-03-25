'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Users, Trophy, Flame, Star, Loader2, Crown, Medal, TrendingUp } from 'lucide-react'
import Image from 'next/image'

interface Member {
  id: string
  full_name: string
  total_score: number
  streak: number
  avatar_url: string | null
}

interface GroupInfo {
  id: string
  name: string
  description: string
}

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const [{ data: groupData }, { data: membersData }] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        supabase.from('profiles')
          .select('id, full_name, total_score, streak, avatar_url')
          .eq('group_id', groupId)
          .eq('role', 'student')
          .order('total_score', { ascending: false }),
      ])

      setGroup(groupData)
      setMembers(membersData ?? [])
      setLoading(false)
    }
    fetchData()
  }, [groupId, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
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
  const topStreak = members.length > 0 ? Math.max(...members.map(m => m.streak)) : 0
  const currentUserRank = members.findIndex(m => m.id === currentUserId) + 1
  const medals = ['🥇', '🥈', '🥉']

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

        {/* Group hero */}
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
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-300 mb-1">
                  <Star className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-white">{avgScore}</p>
                <p className="text-xs text-violet-200">O'rtacha ball</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-300 mb-1">
                  <Flame className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-white">{topStreak}</p>
                <p className="text-xs text-violet-200">Eng yuqori streak</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-green-300 mb-1">
                  <Trophy className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-white">{totalScore}</p>
                <p className="text-xs text-violet-200">Jami ball</p>
              </div>
            </div>
          </div>
        </div>

        {/* Members list */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 md:px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-black text-sm md:text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-600" />
              Guruh a'zolari
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-semibold">
              {members.length} ta
            </span>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Guruhda hali talaba yo'q</p>
            </div>
          ) : (
            members.map((member, index) => {
              const isCurrentUser = member.id === currentUserId
              const rank = index + 1
              const isTop3 = rank <= 3

              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-gray-50 last:border-0 transition ${
                    isCurrentUser ? 'bg-violet-50' : isTop3 ? 'bg-amber-50/20' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-7 text-center flex-shrink-0">
                    {isTop3
                      ? <span className="text-base md:text-lg">{medals[rank - 1]}</span>
                      : <span className="text-gray-400 text-xs font-mono font-bold">#{rank}</span>
                    }
                  </div>

                  {/* Avatar */}
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 overflow-hidden ${
                    isCurrentUser
                      ? 'ring-2 ring-violet-400'
                      : ''
                  }`}>
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-black text-sm ${
                        isCurrentUser ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.full_name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`font-bold text-xs md:text-sm truncate ${
                        isCurrentUser ? 'text-violet-700' : 'text-gray-900'
                      }`}>
                        {member.full_name}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Siz</span>
                      )}
                      {rank === 1 && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> Guruh lideri
                        </span>
                      )}
                    </div>
                    {member.streak > 0 && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-orange-500">
                        <Flame className="w-2.5 h-2.5" />
                        {member.streak} kunlik streak
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className={`flex items-center gap-1 font-black text-sm md:text-base ${
                      isCurrentUser ? 'text-violet-600' : isTop3 ? 'text-amber-600' : 'text-gray-800'
                    }`}>
                      <Star className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      {member.total_score}
                    </div>
                    {index > 0 && members[index - 1].total_score > member.total_score && (
                      <div className="text-xs text-gray-300 mt-0.5">
                        -{members[index - 1].total_score - member.total_score}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Motivatsiya */}
        {currentUserRank > 0 && (
          <div className="mt-4 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-violet-500 flex-shrink-0" />
            <p className="text-xs md:text-sm text-violet-600 font-semibold">
              {currentUserRank === 1
                ? '🏆 Guruhingizda birinchi o\'rindaSIZ! Ustunlikni saqlang!'
                : `💪 Guruhingizda ${currentUserRank}-o\'rindaSIZ. 1-o\'ringa ${members[0]?.total_score - (members.find(m => m.id === currentUserId)?.total_score ?? 0)} ball qoldi!`
              }
            </p>
          </div>
        )}
      </main>
    </div>
  )
}