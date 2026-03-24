'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChevronRight, Loader2 } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  order_num: number
}

interface Quiz {
  id: string
  title: string
  time_limit: number
  score_per_question: number
}

export default function QuizPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string>('')

  const handleSubmit = useCallback(async (finalAnswers: Record<string, string>) => {
    if (submitting) return
    setSubmitting(true)

    const supabase = createClient()
    let correct = 0
    questions.forEach(q => {
      if (finalAnswers[q.id] === q.correct_answer) correct++
    })

    const score = correct * (quiz?.score_per_question ?? 10)

    await supabase.from('quiz_attempts').insert({
      quiz_id: quizId,
      user_id: userId,
      score,
      total_questions: questions.length,
      correct_answers: correct,
      time_spent: (quiz?.time_limit ?? 0) - timeLeft,
    })

    await supabase.rpc('increment_score', { user_id: userId, amount: score })

    router.push(`/quiz/${quizId}/result?score=${score}&correct=${correct}&total=${questions.length}`)
  }, [submitting, questions, quiz, quizId, userId, timeLeft, router])

  useEffect(() => {
    const fetchQuiz = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // Avval uringan-urinmaganini tekshiramiz
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (attempt) {
        router.push('/dashboard')
        return
      }

      const [{ data: quizData }, { data: questionsData }] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', quizId).single(),
        supabase.from('questions').select('*').eq('quiz_id', quizId).order('order_num'),
      ])

      if (!quizData || quizData.status !== 'active') {
        router.push('/dashboard')
        return
      }

      setQuiz(quizData)
      setQuestions(questionsData ?? [])
      setTimeLeft(quizData.time_limit)
      setLoading(false)
    }

    fetchQuiz()
  }, [quizId, router])

  useEffect(() => {
    if (loading || submitting) return
    if (timeLeft <= 0) {
      handleSubmit(answers)
      return
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, loading, submitting, answers, handleSubmit])

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      handleSubmit(answers)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  )

  const currentQuestion = questions[currentIndex]
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLowTime = timeLeft < 30

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{quiz?.title}</p>
            <p className="text-xs text-slate-500">{currentIndex + 1}/{questions.length} savol</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-lg font-bold ${
            isLowTime
              ? 'border-red-500/50 text-red-400 bg-red-500/10'
              : 'border-slate-700 text-white'
          }`}>
            <Clock className="w-4 h-4" />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="h-1.5 bg-slate-800 rounded-full">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-6">
            <p className="text-lg font-medium leading-relaxed">{currentQuestion.question_text}</p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(currentQuestion.id, option)}
                className={`w-full text-left px-5 py-4 rounded-xl border transition ${
                  answers[currentQuestion.id] === option
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-slate-500 mr-3">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            ))}
          </div>

          <button
            onClick={nextQuestion}
            disabled={!answers[currentQuestion.id]}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl transition flex items-center justify-center gap-2"
          >
            {currentIndex < questions.length - 1 ? 'Keyingi savol' : 'Yakunlash'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}