'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Trophy, XCircle, Home, CheckCircle } from 'lucide-react'

function ResultContent() {
  const router = useRouter()
  const params = useSearchParams()
  const score = Number(params.get('score') ?? 0)
  const correct = Number(params.get('correct') ?? 0)
  const total = Number(params.get('total') ?? 0)
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  const isGood = percentage >= 70

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">

        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isGood ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isGood
            ? <Trophy className="w-12 h-12 text-green-600" />
            : <XCircle className="w-12 h-12 text-red-500" />
          }
        </div>

        <h1 className="text-3xl font-black mb-2">
          {isGood ? 'Ajoyib natija! 🎉' : 'Keyingisida yaxshiroq!'}
        </h1>
        <p className="text-gray-400 mb-8">Quiz yakunlandi</p>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-6 shadow-sm">
          <div className={`text-6xl font-black mb-1 ${isGood ? 'text-violet-600' : 'text-gray-400'}`}>
            +{score}
          </div>
          <div className="text-gray-400 text-sm mb-6">ball qo'shildi</div>

          <div className="grid grid-cols-3 gap-4 text-center border-t border-gray-50 pt-6">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-black text-green-600">{correct}</span>
              </div>
              <div className="text-xs text-gray-400">To'g'ri</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-2xl font-black text-red-500">{total - correct}</span>
              </div>
              <div className="text-xs text-gray-400">Noto'g'ri</div>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900 mb-1">{percentage}%</div>
              <div className="text-xs text-gray-400">Natija</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isGood ? 'bg-violet-600' : 'bg-red-400'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
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
        <div className="text-gray-400">Yuklanmoqda...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}