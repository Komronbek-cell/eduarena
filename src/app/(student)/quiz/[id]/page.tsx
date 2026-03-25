'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChevronRight, Loader2, Zap } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  order_num: number
  points: number
}

interface Quiz {
  id: string
  title: string
  time_limit: number
  score_per_question: number
  deadline: string | null
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

    // Har bir savol uchun alohida ball hisoblash
    let totalBase = 0
    let earnedBase = 0

    questions.forEach(q => {
      const qPoints = q.points ?? 10
      totalBase += qPoints
      if (finalAnswers[q.id] === q.correct_answer) {
        earnedBase += qPoints
      }
    })

    // Vaqt koeffitsienti: 0.5 - 1.0
    const timeUsed = (quiz?.time_limit ?? 0) - timeLeft
    const timeRatio = timeLeft / (quiz?.time_limit ?? 1)
    const timeCoefficient = 0.5 + 0.5 * timeRatio

    // Final ball — butun son
    const score = Math.round(earnedBase * timeCoefficient)
    const correct = questions.filter(q => finalAnswers[q.id] === q.correct_answer).length

    await supabase.from('quiz_attempts').insert({
      quiz_id: quizId,
      user_id: userId,
      score,
      total_questions: questions.length,
      correct_answers: correct,
      time_spent: timeUsed,
    })

    await supabase.rpc('increment_score', { user_id: userId, amount: score })
    await supabase.rpc('update_streak', { user_id: userId })
    await supabase.rpc('check_and_award_achievements', { p_user_id: userId })

    router.push(
      `/quiz/${quizId}/result?score=${score}&correct=${correct}&total=${questions.length}&time=${timeUsed}&maxScore=${totalBase}`
    )
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

      // Deadline tekshirish
      if (quizData.deadline && new Date(quizData.deadline) < new Date()) {
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

  // Hozirgi vaqt koeffitsienti preview
  const timeRatio = timeLeft / (quiz?.time_limit ?? 1)
  const currentCoeff = 0.5 + 0.5 * timeRatio
  const currentQuestionMaxBall = currentQuestion?.points ?? 10
  const currentQuestionEarnBall = Math.round(currentQuestionMaxBall * currentCoeff)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-gray-900 truncate max-w-[160px] md:max-w-xs">{quiz?.title}</p>
            <p className="text-xs text-gray-400">{currentIndex + 1}/{questions.length} savol</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {/* Ball preview */}
            <div className="hidden md:flex items-center gap-1.5 bg-violet-50 border border-violet-100 px-3 py-2 rounded-xl">
              <Zap className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs font-bold text-violet-600">
                ~{currentQuestionEarnBall}/{currentQuestionMaxBall} ball
              </span>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-base md:text-lg font-black border ${
              isLowTime
                ? 'border-red-200 text-red-600 bg-red-50'
                : 'border-gray-200 text-gray-900 bg-white'
            }`}>
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="h-2 bg-gray-100 rounded-full">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start md:items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-2xl">

          {/* Ball preview mobile */}
          <div className="md:hidden flex items-center gap-1.5 bg-violet-50 border border-violet-100 px-3 py-2 rounded-xl mb-3 w-fit">
            <Zap className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-bold text-violet-600">
              Bu savol: ~{currentQuestionEarnBall} ball (max {currentQuestionMaxBall})
            </span>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-8 mb-4 shadow-sm">
            <p className="text-base md:text-lg font-bold leading-relaxed text-gray-900">
              {currentQuestion.question_text}
            </p>
          </div>

          <div className="space-y-2.5 md:space-y-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(currentQuestion.id, option)}
                className={`w-full text-left px-4 md:px-5 py-3.5 md:py-4 rounded-xl border-2 transition font-medium text-sm md:text-base ${
                  answers[currentQuestion.id] === option
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-gray-400 mr-2 md:mr-3 font-mono text-sm">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            ))}
          </div>

          <button
            onClick={nextQuestion}
            disabled={!answers[currentQuestion.id] || submitting}
            className="w-full mt-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3.5 md:py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-100 text-sm md:text-base"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...</>
            ) : (
              <>
                {currentIndex < questions.length - 1 ? 'Keyingi savol' : 'Yakunlash'}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}