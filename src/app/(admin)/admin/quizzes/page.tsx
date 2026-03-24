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
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false })

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Trophy className="w-5 h-5 text-indigo-400" />
          <span className="font-bold">Quizlar boshqaruvi</span>
        </div>
        <button
          onClick={() => router.push('/admin/quizzes/create')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
        >
          <Plus className="w-4 h-4" />
          Yangi quiz
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {quizzes.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Hali quiz yaratilmagan</p>
            <button
              onClick={() => router.push('/admin/quizzes/create')}
              className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-5 py-2.5 rounded-xl transition"
            >
              Birinchi quizni yarating
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{quiz.title}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        quiz.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                          : quiz.status === 'finished'
                          ? 'bg-slate-700 text-slate-400'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {quiz.status === 'active' ? 'Faol' : quiz.status === 'finished' ? 'Tugagan' : 'Qoralama'}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${
                        quiz.type === 'daily'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      }`}>
                        {quiz.type === 'daily' ? 'Kunlik' : 'Haftalik'}
                      </span>
                    </div>
                    {quiz.description && (
                      <p className="text-slate-400 text-sm mb-3">{quiz.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {quiz.time_limit / 60} daqiqa
                      </span>
                      <span>{quiz.score_per_question} ball/savol</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleStatus(quiz)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition ${
                        quiz.status === 'active'
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                          : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      {quiz.status === 'active' ? (
                        <><XCircle className="w-3.5 h-3.5" /> To'xtatish</>
                      ) : (
                        <><CheckCircle className="w-3.5 h-3.5" /> Faollashtirish</>
                      )}
                    </button>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition"
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