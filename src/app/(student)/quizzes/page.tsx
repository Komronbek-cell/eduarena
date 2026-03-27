'use client'

import BottomNav from '@/components/layout/BottomNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Quiz } from '@/types'
import {
  Zap, Trophy, ChevronRight, Loader2, Clock,
  CheckCircle, Lock, History, Star
} from 'lucide-react'
import Image from 'next/image'

type TabType = 'daily' | 'weekly'
type StatusFilter = 'active' | 'completed'

export default function StudentQuizzesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [tab, setTab] = useState<TabType>('daily')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: quizzesData }, { data: attemptsData }] = await Promise.all([
        supabase
          .from('quizzes')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('quiz_attempts')
          .select('quiz_id')
          .eq('user_id', user.id),
      ])

      setQuizzes((quizzesData as Quiz[]) ?? [])
      setCompletedIds(attemptsData?.map((a: { quiz_id: string }) => a.quiz_id) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const byType = quizzes.filter(q => q.type === tab)
  const activeQuizzes = byType.filter(q => {
    const isExpired = q.deadline ? new Date(q.deadline) < new Date() : false
    return !completedIds.includes(q.id) && !isExpired
  })
  const completedQuizzes = byType.filter(q => completedIds.includes(q.id))

  const displayed = statusFilter === 'active' ? activeQuizzes : completedQuizzes

  const dailyActive = quizzes.filter(q => {
    const isExpired = q.deadline ? new Date(q.deadline) < new Date() : false
    return q.type === 'daily' && !completedIds.includes(q.id) && !isExpired
  }).length

  const weeklyActive = quizzes.filter(q => {
    const isExpired = q.deadline ? new Date(q.deadline) < new Date() : false
    return q.type === 'weekly' && !completedIds.includes(q.id) && !isExpired
  }).length

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">

      {/* Header */}
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="EduArena" width={28} height={28} className="rounded-md object-cover" />
            <span className="font-black text-base md:text-lg">Quizlar</span>
          </div>
          <button
            onClick={() => router.push('/history')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-violet-600 bg-gray-100 hover:bg-violet-50 px-3 py-2 rounded-xl transition"
          >
            <History className="w-4 h-4" />
            <span>Tarix</span>
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* Tab switcher: Daily / Weekly */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => { setTab('daily'); setStatusFilter('active') }}
            className={`relative flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition font-bold ${
              tab === 'daily'
                ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm shadow-violet-100'
                : 'border-gray-100 bg-white text-gray-500 hover:border-violet-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              tab === 'daily' ? 'bg-violet-100' : 'bg-gray-100'
            }`}>
              <Zap className={`w-5 h-5 ${tab === 'daily' ? 'text-violet-600' : 'text-gray-400'}`} />
            </div>
            <span className="text-sm">Kunlik</span>
            {dailyActive > 0 && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-violet-600 text-white text-xs font-black rounded-full flex items-center justify-center">
                {dailyActive}
              </span>
            )}
          </button>

          <button
            onClick={() => { setTab('weekly'); setStatusFilter('active') }}
            className={`relative flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition font-bold ${
              tab === 'weekly'
                ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm shadow-purple-100'
                : 'border-gray-100 bg-white text-gray-500 hover:border-purple-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              tab === 'weekly' ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              <Trophy className={`w-5 h-5 ${tab === 'weekly' ? 'text-purple-600' : 'text-gray-400'}`} />
            </div>
            <span className="text-sm">Haftalik</span>
            {weeklyActive > 0 && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-purple-600 text-white text-xs font-black rounded-full flex items-center justify-center">
                {weeklyActive}
              </span>
            )}
          </button>
        </div>

        {/* Status filter: Active / Completed */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex flex-col items-center py-4 rounded-2xl border transition ${
              statusFilter === 'active'
                ? tab === 'daily'
                  ? 'border-violet-300 bg-violet-50'
                  : 'border-purple-300 bg-purple-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <p className={`text-2xl font-black ${
              statusFilter === 'active'
                ? tab === 'daily' ? 'text-violet-600' : 'text-purple-600'
                : 'text-green-500'
            }`}>
              {activeQuizzes.length}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Faol quizlar</p>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`flex flex-col items-center py-4 rounded-2xl border transition ${
              statusFilter === 'completed'
                ? tab === 'daily'
                  ? 'border-violet-300 bg-violet-50'
                  : 'border-purple-300 bg-purple-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <p className={`text-2xl font-black ${
              statusFilter === 'completed'
                ? tab === 'daily' ? 'text-violet-600' : 'text-purple-600'
                : 'text-gray-400'
            }`}>
              {completedQuizzes.length}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Yakunlangan</p>
          </button>
        </div>

        {/* Quiz list */}
        {displayed.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
            {statusFilter === 'active'
              ? <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              : <CheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            }
            <p className="text-gray-400 text-sm font-semibold">
              {statusFilter === 'active'
                ? `Faol ${tab === 'daily' ? 'kunlik' : 'haftalik'} quiz yo'q`
                : `Hali yakunlangan quiz yo'q`}
            </p>
            {statusFilter === 'completed' && (
              <button
                onClick={() => setStatusFilter('active')}
                className={`mt-4 text-xs font-bold px-4 py-2 rounded-xl transition text-white ${
                  tab === 'daily' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                Faol quizlarga o'tish
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(quiz => {
              const isCompleted = completedIds.includes(quiz.id)
              const isExpired = quiz.deadline ? new Date(quiz.deadline) < new Date() : false
              const accentViolet = tab === 'daily'

              return (
                <div
                  key={quiz.id}
                  onClick={() => {
                    if (isCompleted) {
                      router.push('/history')
                    } else if (!isExpired) {
                      router.push(`/quiz/${quiz.id}`)
                    }
                  }}
                  className={`bg-white border rounded-2xl p-4 md:p-5 shadow-sm transition ${
                    isCompleted
                      ? 'border-green-200 hover:shadow-md cursor-pointer'
                      : isExpired
                      ? 'border-gray-100 opacity-60 cursor-default'
                      : `border-gray-100 ${accentViolet ? 'hover:border-violet-200' : 'hover:border-purple-200'} hover:shadow-md cursor-pointer`
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">

                      {/* Title + badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-black text-sm md:text-base text-gray-900">{quiz.title}</h3>
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                            <CheckCircle className="w-3 h-3" /> Bajarildi
                          </span>
                        )}
                        {!isCompleted && !isExpired && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            accentViolet ? 'bg-violet-100 text-violet-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            Faol
                          </span>
                        )}
                        {isExpired && !isCompleted && (
                          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                            <Lock className="w-3 h-3" /> Tugagan
                          </span>
                        )}
                      </div>

                      {quiz.description && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-1">{quiz.description}</p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {quiz.time_limit / 60} daqiqa
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {quiz.score_per_question} ball/savol
                        </span>
                        {quiz.deadline && !isExpired && (
                          <span className="text-orange-500">
                            {new Date(quiz.deadline).toLocaleDateString('uz-UZ', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })} gacha
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right icon */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <span className="text-xs text-gray-400 font-semibold">Tarix</span>
                        </div>
                      ) : isExpired ? (
                        <Lock className="w-5 h-5 text-gray-300" />
                      ) : (
                        <ChevronRight className={`w-5 h-5 ${accentViolet ? 'text-violet-400' : 'text-purple-400'}`} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}