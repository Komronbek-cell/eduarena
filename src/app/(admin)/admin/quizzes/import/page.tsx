'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Upload, CheckCircle, AlertCircle, Lightbulb, Copy } from 'lucide-react'
import Image from 'next/image'

interface ParsedQuestion {
  question_text: string
  options: string[]
  correct_answer: string
  points: number
}

const EXAMPLE_TEXT = `Savol: O'zbekiston mustaqillikni qaysi yilda qo'lga kiritdi?
A) 1990
B) 1991
C) 1992
D) 1993
To'g'ri: B
Ball: 10

Savol: GDP nima?
A) Yalpi ichki mahsulot
B) Yalpi tashqi mahsulot
C) Davlat byudjeti
D) Pul muomalasi
To'g'ri: A
Ball: 15

Savol: Inflyatsiya deb nimaga aytiladi?
A) Narxlarning pasayishi
B) Narxlarning barqarorligi
C) Narxlarning umumiy o'sishi
D) Valyuta kursining o'zgarishi
To'g'ri: C
Ball: 10`

function parseQuestions(text: string): { questions: ParsedQuestion[], errors: string[] } {
  const questions: ParsedQuestion[] = []
  const errors: string[] = []

  // Savollarni bo'lish — bo'sh qator yoki "Savol:" bilan
  const blocks = text.trim().split(/\n\s*\n/).filter(b => b.trim())

  blocks.forEach((block, blockIndex) => {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l)

    try {
      // Savol matni
      const questionLine = lines.find(l => l.toLowerCase().startsWith('savol:'))
      if (!questionLine) {
        errors.push(`${blockIndex + 1}-blok: "Savol:" topilmadi`)
        return
      }
      const question_text = questionLine.replace(/^savol:\s*/i, '').trim()

      // Variantlar
      const options: string[] = []
      const optionLetters = ['a)', 'b)', 'c)', 'd)']
      optionLetters.forEach(letter => {
        const line = lines.find(l => l.toLowerCase().startsWith(letter))
        if (line) {
          options.push(line.replace(/^[abcd]\)\s*/i, '').trim())
        }
      })

      if (options.length < 2) {
        errors.push(`${blockIndex + 1}-blok: Kamida 2 ta variant kerak`)
        return
      }

      // To'g'ri javob
      const correctLine = lines.find(l => l.toLowerCase().startsWith("to'g'ri:") || l.toLowerCase().startsWith("togri:") || l.toLowerCase().startsWith("javob:"))
      if (!correctLine) {
        errors.push(`${blockIndex + 1}-blok: "To'g'ri:" topilmadi`)
        return
      }

      const correctLetter = correctLine.replace(/^(to'g'ri|togri|javob):\s*/i, '').trim().toLowerCase()
      const letterIndex = ['a', 'b', 'c', 'd'].indexOf(correctLetter)
      if (letterIndex === -1 || letterIndex >= options.length) {
        errors.push(`${blockIndex + 1}-blok: To'g'ri javob noto'g'ri (A, B, C yoki D bo'lishi kerak)`)
        return
      }
      const correct_answer = options[letterIndex]

      // Ball
      const pointsLine = lines.find(l => l.toLowerCase().startsWith('ball:'))
      const points = pointsLine ? parseInt(pointsLine.replace(/^ball:\s*/i, '')) || 10 : 10

      questions.push({ question_text, options, correct_answer, points })
    } catch (e) {
      errors.push(`${blockIndex + 1}-blok: Xatolik yuz berdi`)
    }
  })

  return { questions, errors }
}

export default function ImportQuizPage() {
  const router = useRouter()
  const [step, setStep] = useState<'setup' | 'import' | 'preview' | 'saving' | 'done'>('setup')

  // Quiz ma'lumotlari
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'daily' | 'weekly'>('daily')
  const [timeLimit, setTimeLimit] = useState(300)
  const [deadline, setDeadline] = useState('')

  // Import
  const [importText, setImportText] = useState('')
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [savedQuizId, setSavedQuizId] = useState<string>('')

  const handleParse = () => {
    const { questions, errors } = parseQuestions(importText)
    setParsedQuestions(questions)
    setParseErrors(errors)
    if (questions.length > 0) setStep('preview')
  }

  const handleSave = async () => {
    if (!title) { alert('Quiz nomini kiriting'); return }
    setStep('saving')

    const supabase = createClient()

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        title,
        description,
        type,
        time_limit: timeLimit,
        score_per_question: 10,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status: 'draft',
      })
      .select().single()

    if (error || !quiz) {
      alert('Xatolik: ' + error?.message)
      setStep('preview')
      return
    }

    await supabase.from('questions').insert(
      parsedQuestions.map((q, i) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        order_num: i,
        points: q.points,
      }))
    )

    setSavedQuizId(quiz.id)
    setStep('done')
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition placeholder:text-gray-400"

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/admin/quizzes')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
          <span className="font-black text-base md:text-lg">Tezkor savol qo'shish</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-5">

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-2">
          {['Quiz ma\'lumotlari', 'Savollar', 'Tekshirish'].map((s, i) => {
            const stepIndex = ['setup', 'import', 'preview'].indexOf(step)
            const done = stepIndex > i
            const active = stepIndex === i
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  done ? 'bg-green-500 text-white' :
                  active ? 'bg-violet-600 text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-semibold hidden md:block ${active ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
                {i < 2 && <div className="w-8 h-px bg-gray-200" />}
              </div>
            )
          })}
        </div>

        {/* STEP 1: Quiz ma'lumotlari */}
        {(step === 'setup' || step === 'import' || step === 'preview') && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <h2 className="font-black text-base md:text-lg">1. Quiz ma'lumotlari</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Quiz nomi *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masalan: 12-hafta iqtisodiyot testi" className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tavsif</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ixtiyoriy" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Turi</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className={inputClass}>
                  <option value="daily">Kunlik</option>
                  <option value="weekly">Haftalik</option>
                  <option value="tournament">Turnir</option>
                  
                </select>
              </div>
              <div>

                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Vaqt (soniya)</label>
                <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Deadline (ixtiyoriy)</label>
                <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputClass} />
              </div>
            </div>

            {step === 'setup' && (
              <button
                onClick={() => { if (!title) { alert('Quiz nomini kiriting'); return } setStep('import') }}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-3 rounded-xl transition"
              >
                Keyingi →
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Savollarni import */}
        {(step === 'import' || step === 'preview') && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <h2 className="font-black text-base md:text-lg">2. Savollarni kiriting</h2>

            {/* Format ko'rsatma */}
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-violet-700">Format qoidasi:</p>
              </div>
              <pre className="text-xs text-violet-600 leading-relaxed font-mono whitespace-pre-wrap">{`Savol: Savol matni
A) Variant 1
B) Variant 2
C) Variant 3
D) Variant 4
To'g'ri: B
Ball: 10

(Savollar orasida bo'sh qator qoldiring)`}</pre>
              <button
                onClick={() => setImportText(EXAMPLE_TEXT)}
                className="mt-3 flex items-center gap-1.5 text-xs text-violet-600 font-bold hover:text-violet-800 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                Namuna yuklash
              </button>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Savollarni kiriting
              </label>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Savollarni yuqoridagi format bo'yicha kiriting..."
                rows={14}
                className={inputClass + ' resize-none font-mono text-xs leading-relaxed'}
              />
              <p className="text-xs text-gray-400 mt-1">
                Har bir savolni bo'sh qator bilan ajrating
              </p>
            </div>

            {parseErrors.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-1">
                <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Xatolar:
                </p>
                {parseErrors.map((e, i) => (
                  <p key={i} className="text-xs text-red-500">• {e}</p>
                ))}
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={!importText.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Savollarni tahlil qilish
            </button>
          </div>
        )}

        {/* STEP 3: Preview */}
        {step === 'preview' && parsedQuestions.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-base md:text-lg">3. Tekshirish</h2>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {parsedQuestions.length} ta savol
              </span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-violet-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-violet-600">{parsedQuestions.length}</p>
                <p className="text-xs text-gray-400">Savol</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-green-600">
                  {parsedQuestions.reduce((sum, q) => sum + q.points, 0)}
                </p>
                <p className="text-xs text-gray-400">Max ball</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-blue-600">{timeLimit / 60}</p>
                <p className="text-xs text-gray-400">Daqiqa</p>
              </div>
            </div>

            {/* Questions preview */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {parsedQuestions.map((q, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-bold text-sm text-gray-900">{i + 1}. {q.question_text}</p>
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                      {q.points} ball
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {q.options.map((opt, j) => (
                      <div key={j} className={`text-xs px-2.5 py-1.5 rounded-lg font-medium ${
                        opt === q.correct_answer
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-500'
                      }`}>
                        {String.fromCharCode(65 + j)}. {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-green-100"
            >
              <CheckCircle className="w-5 h-5" />
              Quizni saqlash ({parsedQuestions.length} ta savol)
            </button>
          </div>
        )}

        {/* Saving */}
        {step === 'saving' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
            <p className="font-black text-lg">Saqlanmoqda...</p>
            <p className="text-gray-400 text-sm mt-1">{parsedQuestions.length} ta savol yuklanmoqda</p>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="bg-white border border-green-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Muvaffaqiyatli!</h2>
            <p className="text-gray-500 text-sm mb-6">
              <span className="font-bold text-green-600">{parsedQuestions.length} ta savol</span> muvaffaqiyatli qo'shildi.
              Quiz hozir <span className="font-bold">qoralama</span> holatida — faollashtiring!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/quizzes')}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-black py-3 rounded-xl transition"
              >
                Quizlar ro'yxati
              </button>
              <button
                onClick={() => {
                  setStep('setup')
                  setTitle('')
                  setDescription('')
                  setImportText('')
                  setParsedQuestions([])
                  setParseErrors([])
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
              >
                Yangi quiz
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}