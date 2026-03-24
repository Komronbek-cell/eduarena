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
      .insert({ title, description, type, time_limit: timeLimit, score_per_question: scorePerQuestion, status: 'draft' })
      .select().single()

    if (error || !quiz) { alert('Xatolik yuz berdi'); setLoading(false); return }

    await supabase.from('questions').insert(
      questions.map((q, i) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        order_num: i,
      }))
    )

    router.push('/admin/quizzes')
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition placeholder:text-gray-400"

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin/quizzes')} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-black text-lg">Yangi quiz yaratish</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm shadow-violet-200"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Saqlash
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="font-black text-lg">Quiz ma'lumotlari</h2>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nomi</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masalan: Kunlik iqtisodiyot quizi" className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tavsif (ixtiyoriy)</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Quiz haqida qisqacha" className={inputClass} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Turi</label>
              <select value={type} onChange={e => setType(e.target.value as 'daily' | 'weekly')} className={inputClass}>
                <option value="daily">Kunlik</option>
                <option value="weekly">Haftalik</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Vaqt (soniya)</label>
              <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ball/savol</label>
              <input type="number" value={scorePerQuestion} onChange={e => setScorePerQuestion(Number(e.target.value))} className={inputClass} />
            </div>
          </div>
        </div>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-700">{qIndex + 1}-savol</h3>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(qIndex)} className="text-gray-300 hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              value={q.question_text}
              onChange={e => updateQuestion(qIndex, 'question_text', e.target.value)}
              placeholder="Savol matni"
              className={inputClass}
            />
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Variantlar</label>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correct_answer === opt && opt !== ''}
                    onChange={() => updateQuestion(qIndex, 'correct_answer', opt)}
                    className="accent-violet-600"
                  />
                  <input
                    value={opt}
                    onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`${oIndex + 1}-variant`}
                    className={inputClass}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400">To'g'ri javob uchun radio tugmasini bosing</p>
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-gray-200 hover:border-violet-300 text-gray-400 hover:text-violet-500 rounded-2xl py-4 flex items-center justify-center gap-2 transition font-semibold"
        >
          <Plus className="w-4 h-4" />
          Savol qo'shish
        </button>
      </main>
    </div>
  )
}