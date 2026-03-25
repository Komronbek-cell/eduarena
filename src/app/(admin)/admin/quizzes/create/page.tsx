'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, Loader2, Calendar } from 'lucide-react'

interface QuestionForm {
  question_text: string
  options: string[]
  correct_answer: string
  points: number
}

export default function CreateQuizPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'daily' | 'weekly'>('daily')
  const [timeLimit, setTimeLimit] = useState(300)
  const [scorePerQuestion, setScorePerQuestion] = useState(10)
  const [deadline, setDeadline] = useState('')
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { question_text: '', options: ['', '', '', ''], correct_answer: '', points: 10 }
  ])

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_answer: '', points: 10 }])
  }

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: keyof QuestionForm, value: string | number) => {
    const updated = [...questions]
    if (field === 'points') {
      updated[index].points = Number(value)
    } else if (field === 'question_text' || field === 'correct_answer') {
      updated[index][field] = value as string
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
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status: 'draft',
      })
      .select().single()

    if (error || !quiz) { alert('Xatolik yuz berdi'); setLoading(false); return }

    await supabase.from('questions').insert(
      questions.map((q, i) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        order_num: i,
        points: q.points,
      }))
    )

    router.push('/admin/quizzes')
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition placeholder:text-gray-400"
  const totalMaxScore = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin/quizzes')} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-black text-base md:text-lg">Yangi quiz yaratish</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden md:block">
              Max ball: <span className="font-black text-violet-600">{totalMaxScore}</span>
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm shadow-violet-200"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Saqlash
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">

        {/* Quiz ma'lumotlari */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          <h2 className="font-black text-base md:text-lg">Quiz ma'lumotlari</h2>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nomi</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masalan: Kunlik iqtisodiyot quizi" className={inputClass} />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tavsif (ixtiyoriy)</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Quiz haqida qisqacha" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Default ball/savol</label>
              <input
                type="number"
                value={scorePerQuestion}
                onChange={e => {
                  const val = Number(e.target.value)
                  setScorePerQuestion(val)
                  setQuestions(prev => prev.map(q => ({ ...q, points: val })))
                }}
                className={inputClass}
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Tugash sanasi (deadline)
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Bo'sh qoldirsangiz — muddatsiz faol bo'ladi</p>
          </div>

          {/* Max ball ko'rsatish */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-violet-600 font-semibold">Maksimal ball:</span>
            <span className="text-lg font-black text-violet-700">{totalMaxScore} ball</span>
          </div>
        </div>

        {/* Savollar */}
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center font-black text-sm">
                  {qIndex + 1}
                </span>
                <h3 className="font-black text-gray-700 text-sm md:text-base">-savol</h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Ball input */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 font-semibold hidden md:block">Ball:</label>
                  <input
                    type="number"
                    value={q.points}
                    onChange={e => updateQuestion(qIndex, 'points', e.target.value)}
                    min={1}
                    max={100}
                    className="w-16 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-violet-400 transition font-bold"
                  />
                  <span className="text-xs text-gray-400">ball</span>
                </div>
                {questions.length > 1 && (
                  <button onClick={() => removeQuestion(qIndex)} className="text-gray-300 hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
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
                    className="accent-violet-600 w-4 h-4 flex-shrink-0"
                  />
                  <input
                    value={opt}
                    onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder={`${String.fromCharCode(65 + oIndex)}-variant`}
                    className={inputClass}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-400">To'g'ri javob uchun radio tugmasini bosing</p>
            </div>

            {/* Savol ball ko'rsatish */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
              <span>Bu savol uchun max ball:</span>
              <span className="font-black text-violet-600">{q.points} ball</span>
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-gray-200 hover:border-violet-300 text-gray-400 hover:text-violet-500 rounded-2xl py-4 flex items-center justify-center gap-2 transition font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Savol qo'shish
        </button>

        {/* Bottom save */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">{questions.length} ta savol</p>
            <p className="text-xs text-gray-400">Maksimal: {totalMaxScore} ball</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black px-6 py-3 rounded-xl transition shadow-lg shadow-violet-100"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Saqlash
          </button>
        </div>
      </main>
    </div>
  )
}