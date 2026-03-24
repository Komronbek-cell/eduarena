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

      const { data: attempt } = await supabase
        .from('quiz_attempts').select('id')
        .eq('quiz_id', quizId).eq('user_id', user.id).maybeSingle()

      if (attempt) { router.push('/dashboard'); return }

      const [{ data: quizData }, { data: questionsData }] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', quizId).single(),
        supabase.from('questions').select('*').eq('quiz_id', quizId).order('order_num'),
      ])

      if (!quizData || quizData.status !== 'active') { router.push('/dashboard'); return }

      setQuiz(quizData)
      setQuestions(questionsData ?? [])
      setTimeLeft(quizData.time_limit)
      setLoading(false)
    }
    fetchQuiz()
  }, [quizId, router])

  useEffect(() => {
    if (loading || submitting) return
    if (timeLeft <= 0) { handleSubmit(answers); return }
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const currentQuestion = questions[currentIndex]
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLowTime = timeLeft < 30

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">{quiz?.title}</p>
            <p className="text-xs text-gray-400">{currentIndex + 1}/{questions.length} savol</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-black border ${
            isLowTime
              ? 'border-red-200 text-red-600 bg-red-50'
              : 'border-gray-200 text-gray-900 bg-white'
          }`}>
            <Clock className="w-4 h-4" />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-3">
          <div className="h-2 bg-gray-100 rounded-full">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-6 shadow-sm">
            <p className="text-lg font-bold leading-relaxed text-gray-900">{currentQuestion.question_text}</p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(currentQuestion.id, option)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition font-medium ${
                  answers[currentQuestion.id] === option
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-gray-400 mr-3 font-mono text-sm">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            ))}
          </div>

          <button
            onClick={nextQuestion}
            disabled={!answers[currentQuestion.id]}
            className="w-full mt-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
          >
            {currentIndex < questions.length - 1 ? 'Keyingi savol' : 'Yakunlash'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}