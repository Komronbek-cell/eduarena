'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Quiz } from '@/types'
import { Plus, Trophy, Clock, CheckCircle, XCircle, Loader2, ArrowLeft, Upload, Calendar } from 'lucide-react'
import Image from 'next/image'

export default function QuizzesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'finished'>('all')

  useEffect(() => {
    const fetchQuizzes = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false })
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

  const filtered = quizzes.filter(q => filter === 'all' || q.status === filter)

  const counts = {
    all: quizzes.length,
    active: quizzes.filter(q => q.status === 'active').length,
    draft: quizzes.filter(q => q.status === 'draft').length,
    finished: quizzes.filter(q => q.status === 'finished').length,
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
            <span className="font-black text-base md:text-lg">Quizlar</span>
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
              {quizzes.length} ta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/admin/quizzes/import')}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs md:text-sm font-bold px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden md:block">Tezkor import</span>
            </button>
            <button
              onClick={() => router.push('/admin/quizzes/create')}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs md:text-sm font-bold px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition shadow-sm shadow-violet-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:block">Yangi quiz</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { key: 'all', label: 'Jami', color: 'text-gray-700', bg: 'bg-white' },
            { key: 'active', label: 'Faol', color: 'text-green-600', bg: 'bg-green-50' },
            { key: 'draft', label: 'Qoralama', color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { key: 'finished', label: 'Tugagan', color: 'text-gray-500', bg: 'bg-gray-50' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key as any)}
              className={`border rounded-2xl p-4 text-center transition shadow-sm ${
                filter === s.key
                  ? 'border-violet-300 bg-violet-50'
                  : `border-gray-100 ${s.bg} hover:border-gray-200`
              }`}
            >
              <p className={`text-xl md:text-2xl font-black ${filter === s.key ? 'text-violet-600' : s.color}`}>
                {counts[s.key as keyof typeof counts]}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl text-center py-16 shadow-sm">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              {filter === 'all' ? 'Hali quiz yaratilmagan' : `${filter} quizlar yo'q`}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => router.push('/admin/quizzes/import')}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold px-4 py-2.5 rounded-xl transition"
              >
                <Upload className="w-4 h-4" />
                Tezkor import
              </button>
              <button
                onClick={() => router.push('/admin/quizzes/create')}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                Yaratish
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(quiz => {
              const isExpired = quiz.deadline ? new Date(quiz.deadline) < new Date() : false

              return (
                <div key={quiz.id} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title + badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-black text-sm md:text-base text-gray-900">{quiz.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          quiz.status === 'active' && !isExpired
                            ? 'bg-green-100 text-green-700'
                            : quiz.status === 'active' && isExpired
                            ? 'bg-red-100 text-red-600'
                            : quiz.status === 'finished'
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {quiz.status === 'active' && !isExpired ? 'Faol' :
                           quiz.status === 'active' && isExpired ? 'Muddati o\'tgan' :
                           quiz.status === 'finished' ? 'Tugagan' : 'Qoralama'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          quiz.type === 'daily'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {quiz.type === 'daily' ? 'Kunlik' : 'Haftalik'}
                        </span>
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
                        <span>{quiz.score_per_question} ball/savol</span>
                        {quiz.deadline && (
                          <span className={`flex items-center gap-1 ${isExpired ? 'text-red-400' : 'text-orange-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(quiz.deadline).toLocaleDateString('uz-UZ', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        )}
                        <span className="text-gray-300">
                          {new Date(quiz.created_at).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleStatus(quiz)}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                          quiz.status === 'active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {quiz.status === 'active'
                          ? <><XCircle className="w-3.5 h-3.5" /><span className="hidden md:block">To'xtatish</span></>
                          : <><CheckCircle className="w-3.5 h-3.5" /><span className="hidden md:block">Faollashtirish</span></>
                        }
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
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}