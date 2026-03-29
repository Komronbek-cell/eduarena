'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Flame, Trophy, Crown, Loader2,
  Zap, Clock, Swords, Star, Users
} from 'lucide-react'
import Image from 'next/image'
import BottomNav from '@/components/layout/BottomNav'
import Bracket from '@/components/tournament/Bracket'
import FireEffect from '@/components/tournament/FireEffect'

interface Tournament {
  id: string
  title: string
  status: string
  current_round: number
  bonus_champion: number
  bonus_finalist: number
  bonus_semifinal: number
}

interface TournamentMatch {
  id: string
  round: number
  status: string
  ends_at: string | null
  group1_score: number
  group2_score: number
  group1_id: string
  group2_id: string
  group1_participants?: number
  group2_participants?: number
  winner_group_id: string | null
  quiz_id: string | null
  group1: { name: string; description?: string } | null
  group2: { name: string; description?: string } | null
}

export default function TournamentPage() {
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<TournamentMatch[]>([])
  const [myGroupId, setMyGroupId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)
  const [view, setView] = useState<'bracket' | 'my'>('bracket')
  const [selectedGroup, setSelectedGroup] = useState<{
    id: string
    name: string
    members: { id: string; full_name: string; score: number; avatar_url?: string }[]
  } | null>(null)
  const [loadingGroup, setLoadingGroup] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('group_id').eq('id', user.id).single()
    setMyGroupId(profile?.group_id ?? null)

    const { data: tourData } = await supabase
      .from('tournaments').select('*')
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle()

    if (tourData) {
      setTournament(tourData)
      const { data: matchesData } = await supabase
        .from('tournament_matches')
        .select('*, group1:group1_id(name, description), group2:group2_id(name, description)')
        .eq('tournament_id', tourData.id)
        .order('round').order('created_at')
      setMatches((matchesData as any) ?? [])
    }

    setLoading(false)
    setTimeout(() => setAnimated(true), 100)
  }, [router])

   const handleGroupClick = async (groupId: string, groupName: string) => {
  setLoadingGroup(true)
  setSelectedGroup({ id: groupId, name: groupName, members: [] })

  const supabase = createClient()

  // Guruh a'zolari
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, total_score, avatar_url')
    .eq('group_id', groupId)
    .eq('role', 'student')
    .order('total_score', { ascending: false })

  if (!members) {
    setSelectedGroup({ id: groupId, name: groupName, members: [] })
    setLoadingGroup(false)
    return
  }

  // Turnir quizlaridan olingan ballar
  const tournamentQuizIds = matches
    .filter(m => m.quiz_id)
    .map(m => m.quiz_id as string)

  const memberIds = members.map(m => m.id)

  let attemptScores: Record<string, number> = {}

  if (tournamentQuizIds.length > 0) {
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('user_id, score')
      .in('user_id', memberIds)
      .in('quiz_id', tournamentQuizIds)

    attempts?.forEach(a => {
      attemptScores[a.user_id] = (attemptScores[a.user_id] ?? 0) + a.score
    })
  }

  setSelectedGroup({
    id: groupId,
    name: groupName,
    members: members.map(m => ({
      id: m.id,
      full_name: m.full_name,
      score: attemptScores[m.id] ?? 0,
      avatar_url: m.avatar_url,
    })),
  })
  setLoadingGroup(false)
}

  useEffect(() => {
    fetchData()

    const supabase = createClient()
    const channel = supabase
      .channel('tournament-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tournament_matches',
      }, () => { fetchData() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0614' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-violet-500/30">
          <Image src="/logo.png" alt="GULDU" width={64} height={64} className="object-cover" />
        </div>
        <div className="flex items-center gap-2 text-violet-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Yuklanmoqda...</span>
        </div>
      </div>
    </div>
  )

  if (!tournament) return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #0a0614 0%, #140a2e 100%)' }}>
      <nav className="border-b border-white/10 px-4 py-4 backdrop-blur-sm bg-black/20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-white/50 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
          <span className="font-black text-base text-white">Turnir</span>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="text-center px-4">
          <div className="text-7xl mb-6 animate-bounce">🏆</div>
          <h2 className="text-2xl font-black text-white mb-3">Hozircha turnir yo'q</h2>
          <p className="text-white/40 text-sm">Admin turnir e'lon qilgach shu yerda paydo bo'ladi</p>
        </div>
      </div>
      <BottomNav />
    </div>
  )

  const isFinished = tournament.status === 'finished'
  const totalGroups = matches.filter(m => m.round === 1).length * 2
  const allRounds = Array.from(new Set(matches.map(m => m.round)))
  const maxRound = Math.max(...allRounds)

  const myCurrentMatch = matches.find(m =>
    (m.group1_id === myGroupId || m.group2_id === myGroupId) &&
    m.round === tournament.current_round &&
    m.status === 'active'
  )
  const myMatches = matches.filter(m =>
    m.group1_id === myGroupId || m.group2_id === myGroupId
  )
  const myWins = myMatches.filter(m => m.winner_group_id === myGroupId).length
  const isEliminated = myMatches.some(m => m.status === 'finished' && m.winner_group_id !== myGroupId)

  const finalMatch = matches.find(m => m.round === maxRound && m.status === 'finished')
  const champGroupId = finalMatch?.winner_group_id
  const champName = champGroupId === finalMatch?.group1_id
    ? finalMatch?.group1?.name
    : finalMatch?.group2?.name
  const isMyGroupChampion = champGroupId === myGroupId

  return (
    <div className="min-h-screen pb-24 md:pb-0 relative" style={{ background: 'linear-gradient(135deg, #0a0614 0%, #140a2e 50%, #0a0614 100%)' }}>

      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(60)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2.5 + 0.5 + 'px',
              height: Math.random() * 2.5 + 0.5 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.05,
              animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out ${Math.random() * 3}s infinite`,
            }}
          />
        ))}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
      </div>

      {!isFinished && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 pointer-events-none z-0">
          <FireEffect intensity="low" className="h-16" />
        </div>
      )}

      <nav className="relative z-20 border-b border-white/10 px-4 py-4 backdrop-blur-md bg-black/30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-white/50 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
            <span className="font-black text-base text-white">Turnir</span>
          </div>
          <div className="flex items-center gap-2">
            {!isFinished ? (
              <span className="flex items-center gap-1.5 text-xs bg-red-500/20 text-orange-300 px-3 py-1.5 rounded-full font-bold border border-orange-500/30 animate-pulse">
                <Flame className="w-3.5 h-3.5" /> Jonli
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs bg-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded-full font-bold border border-yellow-500/30">
                <Crown className="w-3.5 h-3.5" /> Yakunlandi
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 md:py-8">

        <div className={`text-center mb-8 transition-all duration-700 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative inline-block mb-4">
            <div className="text-6xl md:text-8xl filter drop-shadow-lg">
              {isFinished ? '👑' : '🔥'}
            </div>
            {!isFinished && (
              <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
                style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-white mb-2 leading-tight">
            {tournament.title}
          </h1>
          <p className="text-white/40 text-sm mb-5">
            {isFinished
              ? 'Turnir yakunlandi'
              : `${tournament.current_round}-tur · ${totalGroups} guruh ishtirok etmoqda`
            }
          </p>
          <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
            {[
              { emoji: '🥇', label: 'Chempion', val: tournament.bonus_champion, glow: 'shadow-yellow-500/30', bg: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/40' },
              { emoji: '🥈', label: 'Finalist', val: tournament.bonus_finalist, glow: '', bg: 'from-slate-500/20 to-slate-600/10 border-slate-500/40' },
              { emoji: '🥉', label: 'Yarim final', val: tournament.bonus_semifinal, glow: '', bg: 'from-amber-600/20 to-orange-600/10 border-amber-600/40' },
            ].map((b, i) => (
              <div key={i} className={`bg-gradient-to-br ${b.bg} border rounded-2xl px-4 py-3 text-center shadow-lg ${b.glow}`}>
                <div className="text-2xl mb-1">{b.emoji}</div>
                <div className="text-white font-black text-lg">+{b.val}</div>
                <div className="text-white/40 text-xs">{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {myGroupId && (
          <div className={`mb-6 transition-all duration-700 delay-200 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {isEliminated && !isMyGroupChampion ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-4">
                <span className="text-3xl">😔</span>
                <div>
                  <p className="font-black text-red-300">Guruhingiz musobaqadan chiqdi</p>
                  <p className="text-red-400/50 text-xs mt-0.5">Keyingi turnirda qaytib keling! Davom etinglar 💪</p>
                </div>
              </div>
            ) : isMyGroupChampion ? (
              <div className="relative bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/50 rounded-2xl px-5 py-5 text-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-yellow-400/10 rounded-full blur-2xl" />
                </div>
                <div className="relative">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="font-black text-yellow-300 text-lg">Guruhingiz CHEMPION!</p>
                  <p className="text-yellow-400/60 text-sm mt-1">+{tournament.bonus_champion} ball har bir a'zoga berildi!</p>
                </div>
              </div>
            ) : myCurrentMatch ? (
              <div className="relative bg-gradient-to-r from-violet-500/15 to-purple-500/10 border border-violet-500/40 rounded-2xl p-5 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <p className="font-black text-white text-sm">Guruhingiz hozir o'yinda!</p>
                    <span className="ml-auto text-xs text-white/30 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Jonli
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`flex-1 text-center p-3 rounded-xl ${myCurrentMatch.group1_id === myGroupId ? 'bg-violet-500/20 border border-violet-500/40' : 'bg-white/5'}`}>
                      <p className="text-white/70 text-xs font-bold truncate mb-1">{myCurrentMatch.group1?.name}</p>
                      <p className="text-xs text-white/30 truncate mb-1 hidden md:block">{myCurrentMatch.group1?.description}</p>
                      <p className="text-3xl font-black text-violet-400">{myCurrentMatch.group1_score.toFixed(1)}</p>
                      {myCurrentMatch.group1_participants !== undefined && (
                        <p className="text-xs text-white/30 mt-1">{myCurrentMatch.group1_participants} ishtirok</p>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <Swords className="w-6 h-6 text-orange-400" />
                      <span className="text-white/30 text-xs font-black">VS</span>
                    </div>
                    <div className={`flex-1 text-center p-3 rounded-xl ${myCurrentMatch.group2_id === myGroupId ? 'bg-violet-500/20 border border-violet-500/40' : 'bg-white/5'}`}>
                      <p className="text-white/70 text-xs font-bold truncate mb-1">{myCurrentMatch.group2?.name}</p>
                      <p className="text-xs text-white/30 truncate mb-1 hidden md:block">{myCurrentMatch.group2?.description}</p>
                      <p className="text-3xl font-black text-violet-400">{myCurrentMatch.group2_score.toFixed(1)}</p>
                      {myCurrentMatch.group2_participants !== undefined && (
                        <p className="text-xs text-white/30 mt-1">{myCurrentMatch.group2_participants} ishtirok</p>
                      )}
                    </div>
                  </div>
                  {myCurrentMatch.ends_at && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-white/30 mb-3">
                      <Clock className="w-3 h-3" />
                      {new Date(myCurrentMatch.ends_at).toLocaleDateString('uz-UZ', {
                        month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })} gacha
                    </div>
                  )}
                  {myCurrentMatch.quiz_id && (
                    <button
                      onClick={() => router.push(`/quiz/${myCurrentMatch.quiz_id}`)}
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-black py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30"
                    >
                      <Zap className="w-4 h-4" />
                      Quizni yech — guruhingga hissa qo'sh!
                    </button>
                  )}
                </div>
              </div>
            ) : !isFinished ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-4 flex items-center gap-4">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="font-black text-green-300">Guruhingiz kuchli davom etmoqda!</p>
                  <p className="text-green-400/50 text-xs mt-0.5">{myWins} ta g'alaba · Keyingi turni kutmoqda</p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setView('bracket')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${view === 'bracket' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'text-white/50 hover:text-white'}`}
          >
            <Trophy className="w-4 h-4" /> Turnir jadvali
          </button>
          <button
            onClick={() => setView('my')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${view === 'my' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'text-white/50 hover:text-white'}`}
          >
            <Users className="w-4 h-4" /> Mening matchlarim
          </button>
        </div>

        {view === 'bracket' && (
          <div className={`transition-all duration-500 ${animated ? 'opacity-100' : 'opacity-0'}`}>
            <Bracket
              matches={matches}
              myGroupId={myGroupId}
              currentRound={tournament.current_round}
              totalGroups={totalGroups}
              isFinished={isFinished}
              championName={champName}
              isMyGroupChampion={isMyGroupChampion}
              onGroupClick={handleGroupClick}
            />
          </div>
        )}

        {view === 'my' && (
          <div className="space-y-4">
            {myMatches.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Guruhingiz hali match o'ynamagan</p>
              </div>
            ) : myMatches.map(match => {
              const isCurrent = match.round === tournament.current_round && !isFinished
              const isWin = match.status === 'finished' && match.winner_group_id === myGroupId
              const isLoss = match.status === 'finished' && match.winner_group_id !== myGroupId
              return (
                <div key={match.id} className={`rounded-2xl border p-5 ${
                  isCurrent ? 'border-violet-500/50 bg-violet-500/10' :
                  isWin ? 'border-green-500/40 bg-green-500/8' :
                  isLoss ? 'border-red-500/30 bg-red-500/5 opacity-70' :
                  'border-white/10 bg-white/5'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isCurrent ? 'bg-violet-500/30 text-violet-300' :
                      isWin ? 'bg-green-500/20 text-green-400' :
                      isLoss ? 'bg-red-500/20 text-red-400' :
                      'bg-white/10 text-white/40'
                    }`}>
                      {isCurrent ? '🔥 Hozir' : isWin ? '✅ G\'alaba' : isLoss ? '❌ Mag\'lubiyat' : 'Kutilmoqda'}
                    </span>
                    <span className="text-xs text-white/30 ml-auto">
                      {match.round === maxRound ? '🏆 Final' :
                       match.round === maxRound - 1 ? '⚔️ Yarim final' :
                       `${match.round}-tur`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex-1 text-center p-3 rounded-xl ${match.group1_id === myGroupId ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                      <p className="text-white/80 font-black text-xs">{match.group1?.name}</p>
                      <p className="text-xs text-white/30">{match.group1?.description}</p>
                      <p className="text-2xl font-black text-violet-400 mt-1">{match.group1_score.toFixed(1)}</p>
                    </div>
                    <Swords className="w-4 h-4 text-white/20 flex-shrink-0" />
                    <div className={`flex-1 text-center p-3 rounded-xl ${match.group2_id === myGroupId ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                      <p className="text-white/80 font-black text-xs">{match.group2?.name}</p>
                      <p className="text-xs text-white/30">{match.group2?.description}</p>
                      <p className="text-2xl font-black text-violet-400 mt-1">{match.group2_score.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Group Members Modal */}
      {selectedGroup && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedGroup(null)}
        >
          <div
            className="w-full md:max-w-md bg-gray-900 border border-white/10 rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-4 border-b border-white/10">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 md:hidden" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 font-semibold mb-0.5">Guruh a'zolari</p>
                  <h3 className="text-lg font-black text-white">{selectedGroup.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
              {loadingGroup ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              ) : selectedGroup.members.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">A'zolar topilmadi</p>
                </div>
              ) : selectedGroup.members.map((member, index) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                    index === 0 ? 'border-yellow-500/40 bg-yellow-500/10' :
                    index === 1 ? 'border-slate-400/30 bg-slate-400/5' :
                    index === 2 ? 'border-amber-600/30 bg-amber-600/5' :
                    'border-white/5 bg-white/5'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-slate-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center font-black text-sm text-white flex-shrink-0 overflow-hidden">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                    ) : (
                      member.full_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm truncate">{member.full_name}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="font-black text-white text-sm">{member.score.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-white/10">
              <p className="text-center text-xs text-white/30">
                {selectedGroup.members.length} ta a'zo · Ball bo'yicha tartiblangan
              </p>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.05; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}