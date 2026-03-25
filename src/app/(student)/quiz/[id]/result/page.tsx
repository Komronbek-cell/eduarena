'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Trophy, XCircle, Home, CheckCircle, Clock, Zap } from 'lucide-react'

function ResultContent() {
  const router = useRouter()
  const params = useSearchParams()
  const score = Number(params.get('score') ?? 0)
  const correct = Number(params.get('correct') ?? 0)
  const total = Number(params.get('total') ?? 0)
  const timeSpent = Number(params.get('time') ?? 0)
  const maxScore = Number(params.get('maxScore') ?? total * 10)
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  const scorePercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const isGood = percentage >= 70

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // Vaqt bonusini hisoblash
  const baseEarned = correct > 0 ? Math.round(score / (0.5 + 0.5 * (1 - timeSpent / (timeSpent + 1)))) : 0
  const timeBonus = score - Math.round(score / 1.0)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md">

        {/* Icon */}
        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6 ${
          isGood ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isGood
            ? <Trophy className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
            : <XCircle className="w-10 h-10 md:w-12 md:h-12 text-red-500" />
          }
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-center mb-1">
          {percentage === 100 ? 'Mukammal! 🎯' : isGood ? 'Ajoyib natija! 🎉' : 'Keyingisida yaxshiroq!'}
        </h1>
        <p className="text-gray-400 text-center text-sm mb-6 md:mb-8">Quiz yakunlandi</p>

        {/* Main card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 mb-4 shadow-sm">

          {/* Score */}
          <div className="text-center mb-6">
            <div className={`text-5xl md:text-6xl font-black mb-1 ${isGood ? 'text-violet-600' : 'text-gray-400'}`}>
              +{score}
            </div>
            <div className="text-gray-400 text-sm">
              ball qo'shildi <span className="text-gray-300">/ {maxScore} max</span>
            </div>

            {/* Score progress */}
            <div className="mt-3 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isGood ? 'bg-violet-600' : 'bg-red-400'}`}
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{scorePercentage}% maksimal balldan</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 border-t border-gray-50 pt-5">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xl md:text-2xl font-black text-green-600">{correct}</span>
              </div>
              <div className="text-xs text-gray-400">To'g'ri</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xl md:text-2xl font-black text-red-500">{total - correct}</span>
              </div>
              <div className="text-xs text-gray-400">Noto'g'ri</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xl md:text-2xl font-black text-blue-500">{formatTime(timeSpent)}</span>
              </div>
              <div className="text-xs text-gray-400">Vaqt</div>
            </div>
          </div>

          {/* Aniqlik */}
          <div className="mt-5 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">Aniqlik</span>
              <span className="text-sm font-black text-gray-900">{percentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isGood ? 'bg-green-500' : 'bg-red-400'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Vaqt bonusi info */}
          <div className="mt-4 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-violet-700">Vaqt bonusi hisoblandi</p>
              <p className="text-xs text-violet-500 mt-0.5">
                Qancha tez yakunlasangiz, shuncha ko'p ball. Vaqt koeffitsienti: ×{(0.5 + 0.5 * (1 - timeSpent / Math.max(timeSpent + 1, 1))).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-3.5 md:py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-100 text-sm md:text-base"
        >
          <Home className="w-4 h-4" />
          Dashboardga qaytish
        </button>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}