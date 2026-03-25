'use client'

import BottomNav from '@/components/layout/BottomNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trophy, CheckCircle, XCircle, Clock, Loader2, Target } from 'lucide-react'

interface AttemptWithQuiz {
  id: string
  score: number
  total_questions: number
  correct_answers: number
  time_spent: number
  completed_at: string
  quizzes: {
    title: string
    type: string
    score_per_question: number
  } | null
}

export default function HistoryPage() {
  const router = useRouter()
  const [attempts, setAttempts] = useState<AttemptWithQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [totalScore, setTotalScore] = useState(0)
  const [avgAccuracy, setAvgAccuracy] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('quiz_attempts')
        .select('*, quizzes(title, type, score_per_question)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })

      const list = (data as any) ?? []
      setAttempts(list)

      if (list.length > 0) {
        const total = list.reduce((sum: number, a: AttemptWithQuiz) => sum + a.score, 0)
        const avg = Math.round(
          list.reduce((sum: number, a: AttemptWithQuiz) =>
            sum + (a.correct_answers / a.total_questions) * 100, 0
          ) / list.length
        )
        setTotalScore(total)
        setAvgAccuracy(avg)
      }

      setLoading(false)
    }
    fetchData()
  }, [router])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Trophy className="w-5 h-5 text-violet-600" />
          <span className="font-black text-lg">Quiz tarixi</span>
          <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
            {attempts.length} ta
          </span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 pb-24 md:pb-0">

        {attempts.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl text-center py-20 shadow-sm">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">Hali quiz yakunlanmagan</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Birinchi quizni yakunlang va natijangizni ko'ring</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm"
            >
              Dashboardga qaytish
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-black text-violet-600">{attempts.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Jami quizlar</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-black text-green-600">{totalScore}</p>
                <p className="text-xs text-gray-400 mt-0.5">Jami ball</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-black text-blue-600">{avgAccuracy}%</p>
                <p className="text-xs text-gray-400 mt-0.5">O'rtacha aniqlik</p>
              </div>
            </div>

            {/* Attempts list */}
            <div className="space-y-3">
              {attempts.map((attempt, index) => {
                const accuracy = Math.round((attempt.correct_answers / attempt.total_questions) * 100)
                const isGood = accuracy >= 70
                const maxScore = attempt.total_questions * (attempt.quizzes?.score_per_question ?? 10)

                return (
                  <div key={attempt.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isGood ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isGood
                            ? <CheckCircle className="w-6 h-6 text-green-600" />
                            : <XCircle className="w-6 h-6 text-red-500" />
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-black text-gray-900">
                              {attempt.quizzes?.title ?? 'Quiz'}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              attempt.quizzes?.type === 'daily'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {attempt.quizzes?.type === 'daily' ? 'Kunlik' : 'Haftalik'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {attempt.correct_answers}/{attempt.total_questions} to'g'ri
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(attempt.time_spent)}
                            </span>
                            <span>{formatDate(attempt.completed_at)}</span>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                            <div
                              className={`h-full rounded-full ${isGood ? 'bg-green-500' : 'bg-red-400'}`}
                              style={{ width: `${accuracy}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <div className={`text-2xl font-black ${isGood ? 'text-violet-600' : 'text-gray-400'}`}>
                          +{attempt.score}
                        </div>
                        <div className="text-xs text-gray-400">/ {maxScore} ball</div>
                        <div className={`text-sm font-bold mt-1 ${isGood ? 'text-green-600' : 'text-red-500'}`}>
                          {accuracy}%
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
       <BottomNav />
    </div>
  )
}