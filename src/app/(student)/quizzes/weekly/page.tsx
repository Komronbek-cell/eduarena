'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trophy, ChevronRight, Loader2, Clock, CheckCircle, Lock, Filter, Star } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  description: string
  status: string
  time_limit: number
  score_per_question: number
  deadline: string | null
  created_at: string
}

export default function WeeklyQuizzesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: quizzes }, { data: attempts }] = await Promise.all([
        supabase.from('quizzes').select('*').eq('type', 'weekly').order('created_at', { ascending: false }),
        supabase.from('quiz_attempts').select('quiz_id').eq('user_id', user.id),
      ])

      setQuizzes((quizzes as Quiz[]) ?? [])
      setCompletedIds(attempts?.map(a => a.quiz_id) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const filtered = quizzes.filter(quiz => {
    const isCompleted = completedIds.includes(quiz.id)
    const isActive = quiz.status === 'active'
    const isExpired = quiz.deadline ? new Date(quiz.deadline) < new Date() : false

    if (filter === 'all') return true
    if (filter === 'active') return isActive && !isExpired && !isCompleted
    if (filter === 'completed') return isCompleted
    if (filter === 'expired') return isExpired || quiz.status === 'finished'
    return true
  })

  const activeCount = quizzes.filter(q =>
    q.status === 'active' && !completedIds.includes(q.id) &&
    (!q.deadline || new Date(q.deadline) > new Date())
  ).length
  const completedCount = quizzes.filter(q => completedIds.includes(q.id)).length

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/quizzes')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="font-black text-base md:text-lg">Haftalik musobaqalar</span>
          <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full ml-auto">
            {quizzes.length} ta
          </span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-4 text-center shadow-sm">
            <p className="text-xl md:text-2xl font-black text-purple-600">{quizzes.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Jami</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-4 text-center shadow-sm">
            <p className="text-xl md:text-2xl font-black text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Bajarildi</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 md:p-4 text-center shadow-sm">
            <p className="text-xl md:text-2xl font-black text-orange-500">{activeCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Kutmoqda</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {[
            { key: 'all', label: 'Barchasi' },
            { key: 'active', label: 'Faol' },
            { key: 'completed', label: 'Bajarilgan' },
            { key: 'expired', label: 'Tugagan' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                filter === f.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-purple-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Bu bo'limda musobaqa yo'q</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(quiz => {
              const isCompleted = completedIds.includes(quiz.id)
              const isActive = quiz.status === 'active'
              const isExpired = quiz.deadline ? new Date(quiz.deadline) < new Date() : false
              const isLocked = !isActive || isExpired

              return (
                <div
                  key={quiz.id}
                  onClick={() => { if (!isLocked && !isCompleted) router.push(`/quiz/${quiz.id}`) }}
                  className={`bg-white border rounded-2xl p-4 md:p-5 shadow-sm transition ${
                    isCompleted ? 'border-green-200 bg-green-50' :
                    isLocked ? 'border-gray-100 opacity-60' :
                    'border-gray-100 hover:border-purple-200 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-black text-sm md:text-base text-gray-900">{quiz.title}</h3>
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                            <CheckCircle className="w-3 h-3" /> Bajarildi
                          </span>
                        )}
                        {!isCompleted && isActive && !isExpired && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Faol</span>
                        )}
                        {(isExpired || quiz.status === 'finished') && !isCompleted && (
                          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                            <Lock className="w-3 h-3" /> Tugagan
                          </span>
                        )}
                      </div>

                      {quiz.description && (
                        <p className="text-xs text-gray-400 mb-2">{quiz.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{quiz.time_limit / 60} daqiqa
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />{quiz.score_per_question} ball/savol
                        </span>
                        {quiz.deadline && !isExpired && (
                          <span className="text-orange-500">
                            {new Date(quiz.deadline).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })} gacha
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isCompleted
                        ? <CheckCircle className="w-6 h-6 text-green-500" />
                        : isLocked
                        ? <Lock className="w-5 h-5 text-gray-300" />
                        : <ChevronRight className="w-5 h-5 text-purple-400" />
                      }
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}