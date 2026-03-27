'use client'

import BottomNav from '@/components/layout/BottomNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Bell, Pin, Loader2, Crown, Star, Trophy } from 'lucide-react'

type GroupField = { name: string } | { name: string }[] | null | undefined

function getGroupName(g: GroupField): string {
  if (!g) return ''
  if (Array.isArray(g)) return g[0]?.name ?? ''
  return (g as { name: string }).name ?? ''
}

interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
}

interface WeeklyChampion {
  id: string
  user_id: string
  week_label: string
  score: number
  announced_at: string
  profiles?: {
    full_name: string
    avatar_url?: string
    groups?: GroupField
  }
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [latestChampion, setLatestChampion] = useState<WeeklyChampion | null>(null)
  const [allChampions, setAllChampions] = useState<WeeklyChampion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllChampions, setShowAllChampions] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      // E'lonlarni olish
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      // weekly_champions jadval bo'lmasa ham xato bermasin
      const { data: championsData } = await supabase
        .from('weekly_champions')
        .select('*, profiles(full_name, avatar_url, groups(name))')
        .order('announced_at', { ascending: false })
        .limit(10)

      // "Hafta qahramoni" e'lonlarini asosiy ro'yxatdan chiqaramiz
      const filteredAnnouncements = (announcementsData ?? []).filter(
        (a: Announcement) => !a.title.startsWith('🏆 Hafta qahramoni:')
      )

      setAnnouncements(filteredAnnouncements)
      setAllChampions(championsData ?? [])
      setLatestChampion(championsData?.[0] ?? null)
      setLoading(false)
    }
    fetchData()
  }, [router])

  const isCurrentUserChampion = latestChampion?.user_id === currentUserId

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const champProfile = latestChampion?.profiles as any

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Bell className="w-5 h-5 text-violet-600" />
          <span className="font-black text-lg">E'lonlar</span>
          {announcements.length > 0 && (
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
              {announcements.length} ta
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4 pb-24 md:pb-8">

        {/* ===== HAFTA QAHRAMONI kartasi ===== */}
        {latestChampion && (
          <div className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border ${
            isCurrentUserChampion
              ? 'bg-amber-500 border-amber-400'
              : 'bg-white border-amber-200'
          }`}>
            {/* Dekorativ fon */}
            <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 ${
              isCurrentUserChampion ? 'bg-white' : 'bg-amber-400'
            }`} />
            <div className={`absolute -bottom-6 -left-4 w-20 h-20 rounded-full opacity-10 ${
              isCurrentUserChampion ? 'bg-white' : 'bg-amber-300'
            }`} />

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Crown className={`w-5 h-5 ${isCurrentUserChampion ? 'text-white' : 'text-amber-600'}`} />
                <span className={`text-sm font-bold ${isCurrentUserChampion ? 'text-amber-100' : 'text-amber-700'}`}>
                  {latestChampion.week_label} — Hafta qahramoni
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {champProfile?.avatar_url ? (
                    <img
                      src={champProfile.avatar_url}
                      alt=""
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300"
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${
                      isCurrentUserChampion
                        ? 'bg-amber-400 border-amber-300'
                        : 'bg-amber-100 border-amber-200'
                    }`}>
                      <span className={`text-2xl font-black ${
                        isCurrentUserChampion ? 'text-white' : 'text-amber-700'
                      }`}>
                        {champProfile?.full_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xs">👑</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h2 className={`text-xl font-black ${isCurrentUserChampion ? 'text-white' : 'text-gray-900'}`}>
                    {isCurrentUserChampion ? 'Bu siz! 🎉' : champProfile?.full_name}
                  </h2>
                  {isCurrentUserChampion && (
                    <p className="text-amber-100 text-sm font-semibold">{champProfile?.full_name}</p>
                  )}
                  <p className={`text-sm mt-0.5 ${isCurrentUserChampion ? 'text-amber-100' : 'text-gray-500'}`}>
                    {getGroupName(champProfile?.groups) || "Guruh yo'q"}
                  </p>
                  <div className={`flex items-center gap-1 mt-2 font-black text-lg ${
                    isCurrentUserChampion ? 'text-white' : 'text-amber-600'
                  }`}>
                    <Star className="w-4 h-4" />
                    {latestChampion.score} ball
                  </div>
                </div>
              </div>

              {isCurrentUserChampion && (
                <div className="mt-4 bg-amber-400/40 rounded-xl p-3">
                  <p className="text-white text-sm font-semibold text-center">
                    🎊 Tabriklaymiz! Siz bu haftaning eng yaxshi talabasisiz!
                  </p>
                </div>
              )}

              {allChampions.length > 1 && (
                <button
                  onClick={() => setShowAllChampions(!showAllChampions)}
                  className={`mt-3 text-xs font-bold transition ${
                    isCurrentUserChampion
                      ? 'text-amber-100 hover:text-white'
                      : 'text-amber-600 hover:text-amber-700'
                  }`}
                >
                  {showAllChampions ? "Yig'ish ↑" : `Avvalgi qahramonlar (${allChampions.length - 1}) →`}
                </button>
              )}
            </div>

            {/* Avvalgi qahramonlar */}
            {showAllChampions && allChampions.length > 1 && (
              <div className="mt-4 space-y-2 relative">
                <div className="h-px bg-amber-300/30 mb-3" />
                {allChampions.slice(1).map((ch) => {
                  const p = ch.profiles as any
                  return (
                    <div key={ch.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                      isCurrentUserChampion ? 'bg-amber-400/20' : 'bg-amber-50'
                    }`}>
                      <Trophy className={`w-4 h-4 flex-shrink-0 ${
                        isCurrentUserChampion ? 'text-amber-200' : 'text-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${
                          isCurrentUserChampion ? 'text-amber-100' : 'text-gray-800'
                        }`}>{p?.full_name}</p>
                        <p className={`text-xs ${
                          isCurrentUserChampion ? 'text-amber-200' : 'text-amber-600'
                        }`}>{ch.week_label}</p>
                      </div>
                      <span className={`text-xs font-black ${
                        isCurrentUserChampion ? 'text-amber-100' : 'text-amber-700'
                      }`}>{ch.score} ball</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== E'LONLAR ===== */}
        {announcements.length === 0 && !latestChampion ? (
          <div className="bg-white border border-gray-100 rounded-2xl text-center py-20 shadow-sm">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">Hozircha e'lon yo'q</p>
            <p className="text-gray-400 text-sm mt-1">Yangi e'lonlar bu yerda ko'rinadi</p>
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className={`bg-white border rounded-2xl p-6 shadow-sm transition hover:shadow-md ${
              a.is_pinned ? 'border-violet-200' : 'border-gray-100'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  a.is_pinned ? 'bg-violet-100' : 'bg-gray-100'
                }`}>
                  {a.is_pinned
                    ? <Pin className="w-5 h-5 text-violet-600" />
                    : <Bell className="w-5 h-5 text-gray-400" />
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {a.is_pinned && (
                      <span className="flex items-center gap-1 text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                        <Pin className="w-3 h-3" /> Muhim
                      </span>
                    )}
                    <h3 className="font-black text-gray-900">{a.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-line">{a.content}</p>
                  <p className="text-xs text-gray-300 mt-3">
                    {new Date(a.created_at).toLocaleDateString('uz-UZ', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}