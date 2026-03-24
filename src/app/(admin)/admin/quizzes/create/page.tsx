'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'

interface QuestionForm {
  question_text: string
  options: string[]
  correct_answer: string
}

export default function CreateQuizPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'daily' | 'weekly'>('daily')
  const [timeLimit, setTimeLimit] = useState(300)
  const [scorePerQuestion, setScorePerQuestion] = useState(10)
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { question_text: '', options: ['', '', '', ''], correct_answer: '' }
  ])

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_answer: '' }])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: keyof QuestionForm, value: string) => {
    const updated = [...questions]
    if (field === 'question_text' || field === 'correct_answer') {
      updated[index][field] = value
    }
    setQuestions(updated)
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions]
    updated[qIndex].options[oIndex] = value
    setQuestions(updated)
  }

  const handleSubmit = async () => {
    if (!title) { alert('Quiz nomini kiriting'); return }
    if (questions.some(q => !q.question_text || !q.correct_answer || q.options.some(o => !o))) {
      alert('Barcha savol va variantlarni to\'ldiring')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        title,
        description,
        type,
        time_limit: timeLimit,
        score_per_question: scorePerQuestion,
        status: 'draft',
      })
      .select()
      .single()

    if (error || !quiz) {
      alert('Xatolik yuz berdi')
      setLoading(false)
      return
    }

    const questionsToInsert = questions.map((q, i) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      order_num: i,
    }))

    await supabase.from('questions').insert(questionsToInsert)

    router.push('/admin/quizzes')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/quizzes')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold">Yangi quiz yaratish</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-xl transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Saqlash
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Quiz ma'lumotlari */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Quiz ma'lumotlari</h2>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Nomi</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Masalan: Kunlik iqtisodiyot quizi"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Tavsif (ixtiyoriy)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Quiz haqida qisqacha"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Turi</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'daily' | 'weekly')}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="daily">Kunlik</option>
                <option value="weekly">Haftalik</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Vaqt (soniya)</label>
              <input
                type="number"
                value={timeLimit}
                onChange={e => setTimeLimit(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Ball/savol</label>
              <input
                type="number"
                value={scorePerQuestion}
                onChange={e => setScorePerQuestion(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Savollar */}
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-300">{qIndex + 1}-savol</h3>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="text-slate-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              value={q.question_text}
              onChange={e => updateQuestion(qIndex, 'question_text', e.target.value)}
              placeholder="Savol matni"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
            />

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Variantlar</label>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correct_answer === opt && opt !== ''}
                    onChange={() => updateQuestion(qIndex, 'correct_answer', opt)}
                    className="accent-indigo-500"
                  />
                  <input
                    value={opt}
                    onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`${oIndex + 1}-variant`}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              ))}
              <p className="text-xs text-slate-500">To'g'ri javob uchun radio tugmasini bosing</p>
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full border border-dashed border-slate-700 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 rounded-2xl py-4 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Savol qo'shish
        </button>
      </main>
    </div>
  )
}