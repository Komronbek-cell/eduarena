'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trophy, Flame, Star, Target, Users, Loader2, Crown, Medal, Calendar, CheckCircle, Clock, Settings, Lock, History } from 'lucide-react'
import Image from 'next/image'
import BottomNav from '@/components/layout/BottomNav'

interface StudentProfile {
  id: string
  full_name: string
  avatar_url: string | null
  total_score: number
  streak: number
  role: string
  created_at: string
  groups: { name: string; description: string } | null
}

interface QuizAttempt {
  id: string
  score: number
  correct_answers: number
  total_questions: number
  completed_at: string
  quizzes: { title: string; type: string } | null
}

const ALL_BADGES = [
  { icon: '🎯', title: 'Birinchi qadam' },
  { icon: '🔥', title: '3 kunlik streak' },
  { icon: '⚡', title: '7 kunlik streak' },
  { icon: '🏆', title: 'Top 10' },
  { icon: '👑', title: "Hafta g'olibi" },
  { icon: '🤝', title: 'Guruh fidoyisi' },
]

export default function StudentProfilePage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [earnedTitles, setEarnedTitles] = useState<string[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [rank, setRank] = useState(0)
  const [groupRank, setGroupRank] = useState(0)
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const [
        { data: profileData },
        { data: achievementsData },
        { data: attemptsData },
        { data: allStudents },
      ] = await Promise.all([
        supabase.from('profiles').select('*, groups(name, description)').eq('id', studentId).single(),
        supabase.from('student_achievements').select('achievements(title)').eq('user_id', studentId),
        supabase.from('quiz_attempts')
          .select('id, score, correct_answers, total_questions, completed_at, quizzes(title, type)')
          .eq('user_id', studentId)
          .order('completed_at', { ascending: false })
          .limit(5),
        supabase.from('profiles').select('id, total_score, group_id').eq('role', 'student').order('total_score', { ascending: false }),
      ])

      if (!profileData || profileData.role === 'admin') {
        router.push('/leaderboard')
        return
      }

      setProfile(profileData as any)
      setEarnedTitles(achievementsData?.map((a: any) => a.achievements?.title).filter(Boolean) ?? [])
      setAttempts((attemptsData as any) ?? [])

      if (allStudents) {
        setRank(allStudents.findIndex(s => s.id === studentId) + 1)
        if (profileData.group_id) {
          const groupStudents = allStudents.filter(s => s.group_id === profileData.group_id)
          setGroupRank(groupStudents.findIndex(s => s.id === studentId) + 1)
        }
      }

      setLoading(false)
    }
    fetchData()
  }, [studentId, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  if (!profile) return null

  const isOwnProfile = currentUserId === studentId
  const accuracy = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.correct_answers / a.total_questions) * 100, 0) / attempts.length)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24 md:pb-8">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
          <span className="font-black text-base md:text-lg truncate">{profile.full_name}</span>
          {isOwnProfile && (
            <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Siz</span>
          )}
          {isOwnProfile && (
            <button
              onClick={() => router.push('/profile')}
              className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 bg-gray-50 hover:bg-violet-50 px-3 py-1.5 rounded-xl transition font-bold"
            >
              <Settings className="w-3.5 h-3.5" /> Tahrirlash
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-4">

        {/* Hero */}
        <div className="bg-gradient-to-b from-violet-600 to-violet-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl" />
          </div>

          <div className="relative flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0 border-4 border-white/20 shadow-xl">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center font-black text-4xl text-white">
                  {profile.full_name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-black text-white truncate">{profile.full_name}</h1>
              {profile.groups && (
                <p className="text-violet-200 text-sm mt-0.5 truncate">
                  {profile.groups.name} · {profile.groups.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {rank > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-xl text-xs font-bold">
                    <Medal className="w-3.5 h-3.5" />#{rank} global
                  </div>
                )}
                {groupRank > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-xl text-xs font-bold">
                    <Users className="w-3.5 h-3.5" />#{groupRank} guruhda
                  </div>
                )}
                {rank === 1 && (
                  <div className="flex items-center gap-1 bg-yellow-400/20 text-yellow-300 px-3 py-1.5 rounded-xl text-xs font-bold">
                    <Crown className="w-3.5 h-3.5" /> Yetakchi
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <Star className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-violet-600 bg-violet-50', label: 'Ball', value: profile.total_score },
            { icon: <Flame className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-orange-500 bg-orange-50', label: 'Streak', value: `${profile.streak} kun` },
            { icon: <Target className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-blue-600 bg-blue-50', label: 'Quizlar', value: attempts.length },
            { icon: <Trophy className="w-4 h-4 md:w-5 md:h-5" />, color: 'text-green-600 bg-green-50', label: 'Aniqlik', value: `${accuracy}%` },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-lg md:text-2xl font-black">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Yutuqlar */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-base">Yutuqlar</h2>
            <span className="text-sm font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
              {earnedTitles.length}/6
            </span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {ALL_BADGES.map((badge, i) => {
              const earned = earnedTitles.includes(badge.title)
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                    earned ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{earned ? badge.icon : <Lock className="w-5 h-5 text-gray-300" />}</span>
                  <span className={`text-xs font-semibold text-center leading-tight ${earned ? 'text-violet-700' : 'text-gray-400'}`}>
                    {badge.title}
                  </span>
                </div>
              )
            })}
          </div>
          {earnedTitles.length === 0 ? (
            <p className="text-xs text-gray-400 mt-3">Hali yutuq qo'lga kiritilmagan</p>
          ) : earnedTitles.length < ALL_BADGES.length ? (
            <p className="text-xs text-violet-600 font-semibold mt-3">🎉 {earnedTitles.length} ta yutuq · Yana {ALL_BADGES.length - earnedTitles.length} ta qoldi!</p>
          ) : (
            <p className="text-xs text-violet-600 font-semibold mt-3">🏆 Barcha yutuqlar qo'lga kiritildi!</p>
          )}
        </div>

        {/* So'nggi quizlar */}
        {attempts.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-black text-base">So'nggi natijalar</h2>
              {isOwnProfile && (
                <button
                  onClick={() => router.push('/history')}
                  className="flex items-center gap-1 text-xs text-violet-600 font-bold hover:underline"
                >
                  <History className="w-3.5 h-3.5" /> Barchasi
                </button>
              )}
            </div>
            {attempts.map(attempt => {
              const acc = Math.round((attempt.correct_answers / attempt.total_questions) * 100)
              const isGood = acc >= 70
              return (
                <div key={attempt.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isGood ? 'bg-green-50' : 'bg-red-50'}`}>
                    {isGood
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <Trophy className="w-4 h-4 text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {(attempt.quizzes as any)?.title ?? 'Quiz'}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <span>{attempt.correct_answers}/{attempt.total_questions} to'g'ri</span>
                      <span>·</span>
                      <span>{acc}% aniqlik</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-black text-sm ${isGood ? 'text-violet-600' : 'text-gray-400'}`}>
                      +{attempt.score}
                    </div>
                    <div className="text-xs text-gray-300 flex items-center gap-1 mt-0.5 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(attempt.completed_at).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* A'zo bo'lgan sana */}
        <div className="flex items-center gap-2 text-xs text-gray-400 justify-center py-2">
          <Calendar className="w-3.5 h-3.5" />
          EduArena ga {new Date(profile.created_at).toLocaleDateString('uz-UZ', {
            year: 'numeric', month: 'long', day: 'numeric'
          })} da qo'shilgan
        </div>
      </main>

      <BottomNav />
    </div>
  )
}