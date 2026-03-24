'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Quiz } from '@/types'
import { Plus, Trophy, Clock, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'

export default function QuizzesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuizzes = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('quizzes').select('*').order('created_at', { ascending: false })

      setQuizzes(data ?? [])
      setLoading(false)
    }
    fetchQuizzes()
  }, [router])

  const toggleStatus = async (quiz: Quiz) => {
    const supabase = createClient()
    const newStatus = quiz.status === 'active' ? 'finished' : 'active'
    await supabase.from('quizzes').update({ status: newStatus }).eq('id', quiz.id)
    setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, status: newStatus } : q))
  }

  const deleteQuiz = async (id: string) => {
    if (!confirm('Quizni o\'chirishni tasdiqlaysizmi?')) return
    const supabase = createClient()
    await supabase.from('quizzes').delete().eq('id', id)
    setQuizzes(prev => prev.filter(q => q.id !== id))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Trophy className="w-5 h-5 text-violet-600" />
            <span className="font-black text-lg">Quizlar</span>
          </div>
          <button
            onClick={() => router.push('/admin/quizzes/create')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm shadow-violet-200"
          >
            <Plus className="w-4 h-4" />
            Yangi quiz
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {quizzes.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl text-center py-20 shadow-sm">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Hali quiz yaratilmagan</p>
            <button
              onClick={() => router.push('/admin/quizzes/create')}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
            >
              Birinchi quizni yarating
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-black text-lg">{quiz.title}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        quiz.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : quiz.status === 'finished'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {quiz.status === 'active' ? 'Faol' : quiz.status === 'finished' ? 'Tugagan' : 'Qoralama'}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        quiz.type === 'daily'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {quiz.type === 'daily' ? 'Kunlik' : 'Haftalik'}
                      </span>
                    </div>
                    {quiz.description && (
                      <p className="text-gray-400 text-sm mb-3">{quiz.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {quiz.time_limit / 60} daqiqa
                      </span>
                      <span>{quiz.score_per_question} ball/savol</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleStatus(quiz)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                        quiz.status === 'active'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {quiz.status === 'active'
                        ? <><XCircle className="w-3.5 h-3.5" /> To'xtatish</>
                        : <><CheckCircle className="w-3.5 h-3.5" /> Faollashtirish</>}
                    </button>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 font-semibold transition"
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}