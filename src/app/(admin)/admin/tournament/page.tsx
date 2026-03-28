'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Trophy, Flame, Plus, Loader2,
  Crown, Swords, Trash2, RefreshCw, Eye,
  AlertTriangle, ChevronDown, ChevronUp, Bell
} from 'lucide-react'
import Image from 'next/image'
import TournamentCreate from '@/components/tournament/TournamentCreate'
import AdminMatchCard from '@/components/tournament/AdminMatchCard'

interface Group {
  id: string
  name: string
  description: string
  studentCount?: number
}

interface Quiz {
  id: string
  title: string
  type: string
}

interface Tournament {
  id: string
  title: string
  status: string
  current_round: number
  bonus_champion: number
  bonus_finalist: number
  bonus_semifinal: number
  created_at: string
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
  group1_total_score?: number
  group2_total_score?: number
  winner_group_id: string | null
  quiz_id: string | null
  group1: { name: string; description?: string } | null
  group2: { name: string; description?: string } | null
}

export default function AdminTournamentPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<TournamentMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'list' | 'create'>('list')
  const [deletingTournament, setDeletingTournament] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [collapsedRounds, setCollapsedRounds] = useState<number[]>([])
  const [roundDays, setRoundDays] = useState(2)
  const [announcing, setAnnouncing] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    const [
      { data: groupsData },
      { data: quizzesActive },
      { data: quizzesAll },
      { data: tourData },
      { data: students },
    ] = await Promise.all([
      supabase.from('groups').select('*').order('name'),
      supabase.from('quizzes').select('id, title, type').eq('status', 'active'),
      supabase.from('quizzes').select('id, title, type').eq('type', 'tournament').order('created_at', { ascending: false }),
      supabase.from('tournaments').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('profiles').select('group_id').eq('role', 'student'),
    ])

    const countMap: Record<string, number> = {}
    students?.forEach(s => {
      if (s.group_id) countMap[s.group_id] = (countMap[s.group_id] ?? 0) + 1
    })

    setGroups((groupsData ?? []).map(g => ({ ...g, studentCount: countMap[g.id] ?? 0 })))
    setQuizzes(quizzesActive ?? [])
    setAllQuizzes(quizzesAll ?? [])

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
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const handleCreate = async (data: {
    title: string
    selectedGroups: string[]
    selectedQuiz: string
    roundDays: number
    bonusChampion: number
    bonusFinalist: number
    bonusSemifinal: number
  }) => {
    const supabase = createClient()
    setRoundDays(data.roundDays)

    const { data: tour } = await supabase
      .from('tournaments')
      .insert({
        title: data.title,
        status: 'active',
        current_round: 1,
        bonus_champion: data.bonusChampion,
        bonus_finalist: data.bonusFinalist,
        bonus_semifinal: data.bonusSemifinal,
      })
      .select().single()

    if (!tour) return

    await supabase.from('tournament_groups').insert(
      data.selectedGroups.map(gid => ({ tournament_id: tour.id, group_id: gid }))
    )

    const shuffled = shuffleArray(data.selectedGroups)
    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + data.roundDays)

    const matchInserts = []
    for (let i = 0; i < shuffled.length; i += 2) {
      matchInserts.push({
        tournament_id: tour.id,
        round: 1,
        group1_id: shuffled[i],
        group2_id: shuffled[i + 1],
        quiz_id: data.selectedQuiz || null,
        status: 'active',
        ends_at: endsAt.toISOString(),
        group1_score: 0,
        group2_score: 0,
      })
    }

    await supabase.from('tournament_matches').insert(matchInserts)
    setStep('list')
    await fetchData()
  }

  const handleFinishMatch = async (match: TournamentMatch, quizId: string | null) => {
    if (!tournament) return
    const supabase = createClient()

    const winnerId = match.group1_score >= match.group2_score
      ? match.group1_id : match.group2_id

    await supabase.from('tournament_matches')
      .update({ status: 'finished', winner_group_id: winnerId })
      .eq('id', match.id)

    const roundMatches = matches.filter(m => m.round === tournament.current_round)
    const updatedMatches = roundMatches.map(m =>
      m.id === match.id ? { ...m, status: 'finished', winner_group_id: winnerId } : m
    )
    const allFinished = updatedMatches.every(m => m.status === 'finished')

    if (allFinished) {
      const winners = updatedMatches.map(m =>
        m.winner_group_id ?? (m.group1_score >= m.group2_score ? m.group1_id : m.group2_id)
      )

      if (winners.length === 1) {
        // 🏆 CHEMPION!
        await supabase.from('tournaments').update({ status: 'finished' }).eq('id', tournament.id)

        const { data: champStudents } = await supabase
          .from('profiles').select('id').eq('group_id', winners[0])
        for (const s of champStudents ?? []) {
          await supabase.rpc('increment_score', { user_id: s.id, amount: tournament.bonus_champion })
        }

        // Finalist ballari
        const finalistGroupId = updatedMatches[0].group1_id === winners[0]
          ? updatedMatches[0].group2_id
          : updatedMatches[0].group1_id
        const { data: finalistStudents } = await supabase
          .from('profiles').select('id').eq('group_id', finalistGroupId)
        for (const s of finalistStudents ?? []) {
          await supabase.rpc('increment_score', { user_id: s.id, amount: tournament.bonus_finalist })
        }

      } else if (winners.length === 2) {
        // Yarim final ballari
        const loserIds = updatedMatches.map(m =>
          m.group1_id === m.winner_group_id ? m.group2_id : m.group1_id
        )
        for (const loserId of loserIds) {
          const { data: semiStudents } = await supabase
            .from('profiles').select('id').eq('group_id', loserId)
          for (const s of semiStudents ?? []) {
            await supabase.rpc('increment_score', { user_id: s.id, amount: tournament.bonus_semifinal })
          }
        }

        // Keyingi round
        const nextRound = tournament.current_round + 1
        const endsAt = new Date()
        endsAt.setDate(endsAt.getDate() + roundDays)

        const shuffledWinners = shuffleArray(winners)
        const nextMatches = []
        for (let i = 0; i < shuffledWinners.length; i += 2) {
          nextMatches.push({
            tournament_id: tournament.id,
            round: nextRound,
            group1_id: shuffledWinners[i],
            group2_id: shuffledWinners[i + 1],
            quiz_id: quizId,
            status: 'active',
            ends_at: endsAt.toISOString(),
            group1_score: 0,
            group2_score: 0,
          })
        }
        await supabase.from('tournament_matches').insert(nextMatches)
        await supabase.from('tournaments').update({ current_round: nextRound }).eq('id', tournament.id)
      } else {
        // Oddiy keyingi round
        const nextRound = tournament.current_round + 1
        const endsAt = new Date()
        endsAt.setDate(endsAt.getDate() + roundDays)

        const shuffledWinners = shuffleArray(winners)
        const nextMatches = []
        for (let i = 0; i < shuffledWinners.length; i += 2) {
          nextMatches.push({
            tournament_id: tournament.id,
            round: nextRound,
            group1_id: shuffledWinners[i],
            group2_id: shuffledWinners[i + 1],
            quiz_id: quizId,
            status: 'active',
            ends_at: endsAt.toISOString(),
            group1_score: 0,
            group2_score: 0,
          })
        }
        await supabase.from('tournament_matches').insert(nextMatches)
        await supabase.from('tournaments').update({ current_round: nextRound }).eq('id', tournament.id)
      }
    }

    await fetchData()
  }

  const handleQuizChange = async (matchId: string, quizId: string) => {
    const supabase = createClient()
    await supabase.from('tournament_matches')
      .update({ quiz_id: quizId || null })
      .eq('id', matchId)
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, quiz_id: quizId || null } : m))
  }

  const handleDeleteTournament = async () => {
    if (!tournament) return
    setDeletingTournament(true)
    const supabase = createClient()
    await supabase.from('tournament_matches').delete().eq('tournament_id', tournament.id)
    await supabase.from('tournament_groups').delete().eq('tournament_id', tournament.id)
    await supabase.from('tournaments').delete().eq('id', tournament.id)
    setTournament(null)
    setMatches([])
    setShowDeleteConfirm(false)
    setDeletingTournament(false)
  }

  // 🎉 Syurpriz: Turnir natijasini e'lon qilish
  const handleAnnounce = async () => {
    if (!tournament) return
    setAnnouncing(true)
    const supabase = createClient()

    const finalMatch = matches.find(m => m.round === Math.max(...matches.map(x => x.round)) && m.status === 'finished')
    if (!finalMatch) { setAnnouncing(false); return }

    const champGroupId = finalMatch.winner_group_id
    const champName = champGroupId === finalMatch.group1_id
      ? finalMatch.group1?.name : finalMatch.group2?.name

    await supabase.from('announcements').insert({
      title: `🏆 ${tournament.title} — Chempion aniqlandi!`,
      content: `${tournament.title} turniri yakunlandi! Tabriklaymiz — chempion: ${champName} guruhi! Barcha ishtirokchilarga rahmat. 🎉`,
      is_pinned: true,
    })

    setAnnouncing(false)
    alert("E'lon muvaffaqiyatli yaratildi! Talabalar ko'rishi mumkin.")
  }

  const toggleRound = (round: number) => {
    setCollapsedRounds(prev =>
      prev.includes(round) ? prev.filter(r => r !== round) : [...prev, round]
    )
  }

  const roundLabel = (round: number, totalGroups: number) => {
    const remaining = totalGroups / Math.pow(2, round - 1)
    if (remaining === 2) return { label: '🏆 Final', color: 'bg-yellow-500 text-white' }
    if (remaining === 4) return { label: '⚔️ Yarim final', color: 'bg-violet-600 text-white' }
    if (remaining === 8) return { label: '🔥 Chorak final', color: 'bg-orange-500 text-white' }
    return { label: `${round}-tur`, color: 'bg-gray-600 text-white' }
  }

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

  const allRounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)
  const totalGroups = matches.filter(m => m.round === 1).length * 2
  const isFinished = tournament?.status === 'finished'
  const activeMatches = matches.filter(m => m.status === 'active').length
  const finishedMatches = matches.filter(m => m.status === 'finished').length

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
            <span className="font-black text-base md:text-lg">Turnir boshqaruvi</span>
          </div>

          <div className="flex items-center gap-2">
            {tournament && (
              <button
                onClick={fetchData}
                className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition"
                title="Yangilash"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {tournament && (
              <button
                onClick={() => router.push('/tournament')}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition"
              >
                <Eye className="w-3.5 h-3.5" /> Ko'rish
              </button>
            )}
            {!tournament && step === 'list' && (
              <button
                onClick={() => setStep('create')}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-violet-200"
              >
                <Plus className="w-4 h-4" /> Yangi turnir
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Create form */}
        {step === 'create' && (
          <TournamentCreate
            groups={groups}
            quizzes={allQuizzes}
            onCancel={() => setStep('list')}
            onCreate={handleCreate}
          />
        )}

        {/* Active tournament */}
        {step === 'list' && tournament && (
          <div className="space-y-5">

            {/* Tournament header */}
            <div className={`rounded-3xl p-6 md:p-8 relative overflow-hidden ${
              isFinished
                ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
                : 'bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800'
            }`}>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              </div>

              <div className="relative">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {isFinished
                        ? <Crown className="w-5 h-5 text-yellow-200" />
                        : <Flame className="w-5 h-5 text-orange-300" />
                      }
                      <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">
                        {isFinished ? '✅ Yakunlandi' : '🔥 Faol'}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-1">{tournament.title}</h2>
                    <p className="text-white/60 text-sm">
                      {isFinished
                        ? 'Turnir muvaffaqiyatli yakunlandi'
                        : `${tournament.current_round}-tur · ${activeMatches} faol match · ${finishedMatches} yakunlangan`
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {[
                      { emoji: '🥇', val: tournament.bonus_champion, label: 'Chempion' },
                      { emoji: '🥈', val: tournament.bonus_finalist, label: 'Finalist' },
                      { emoji: '🥉', val: tournament.bonus_semifinal, label: 'Yarim final' },
                    ].map((b, i) => (
                      <div key={i} className="bg-white/15 rounded-xl px-3 py-2 text-center">
                        <p className="text-lg">{b.emoji}</p>
                        <p className="text-white font-black text-sm">+{b.val}</p>
                        <p className="text-white/50 text-xs">{b.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-5 flex-wrap">
                  {isFinished && (
                    <button
                      onClick={handleAnnounce}
                      disabled={announcing}
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition"
                    >
                      {announcing
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Bell className="w-4 h-4" />
                      }
                      E'lon qilish
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm font-bold px-4 py-2.5 rounded-xl transition border border-red-400/30"
                  >
                    <Trash2 className="w-4 h-4" /> Turnirni o'chirish
                  </button>
                </div>
              </div>
            </div>

            {/* Delete confirm */}
            {showDeleteConfirm && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-red-800">Turnirni o'chirishni tasdiqlaysizmi?</p>
                    <p className="text-red-600 text-sm mt-0.5">Barcha matchlar va natijalar o'chib ketadi. Bu amalni qaytarib bo'lmaydi!</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteTournament}
                    disabled={deletingTournament}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black px-5 py-2.5 rounded-xl transition"
                  >
                    {deletingTournament ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Ha, o'chirish
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                  >
                    Bekor
                  </button>
                </div>
              </div>
            )}

            {/* Rounds */}
            {allRounds.map(round => {
              const roundMatches = matches.filter(m => m.round === round)
              const isCurrent = round === tournament.current_round && !isFinished
              const isCollapsed = collapsedRounds.includes(round)
              const info = roundLabel(round, totalGroups)
              const roundFinished = roundMatches.every(m => m.status === 'finished')

              return (
                <div key={round} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  {/* Round header */}
                  <div
                    className={`flex items-center justify-between px-5 py-4 cursor-pointer ${
                      isCurrent ? 'bg-violet-50' : 'bg-white'
                    }`}
                    onClick={() => toggleRound(round)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${info.color}`}>
                        {info.label}
                      </span>
                      {isCurrent && (
                        <span className="flex items-center gap-1.5 text-xs text-orange-500 font-bold">
                          <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                          Hozir davom etmoqda
                        </span>
                      )}
                      {roundFinished && (
                        <span className="text-xs text-gray-400 font-semibold">✅ Yakunlandi</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{roundMatches.length} match</span>
                      {isCollapsed
                        ? <ChevronDown className="w-4 h-4 text-gray-400" />
                        : <ChevronUp className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  </div>

                  {/* Matches */}
                  {!isCollapsed && (
                    <div className="p-4 md:p-5 grid md:grid-cols-2 gap-4 border-t border-gray-50">
                      {roundMatches.map(match => (
                        <AdminMatchCard
                          key={match.id}
                          match={match}
                          isCurrent={isCurrent}
                          quizzes={allQuizzes}
                          onFinish={handleFinishMatch}
                          onQuizChange={handleQuizChange}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* No tournament */}
        {step === 'list' && !tournament && (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Trophy className="w-12 h-12 text-violet-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Hali turnir yo'q</h2>
            <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
              Guruhlar o'rtasida playoff turnir boshlang — talabalarni raqobatga jalb qiling!
            </p>
            <button
              onClick={() => setStep('create')}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-black px-8 py-4 rounded-2xl transition mx-auto shadow-lg shadow-violet-200"
            >
              <Flame className="w-5 h-5" /> Turnir yaratish
            </button>
          </div>
        )}
      </main>
    </div>
  )
}