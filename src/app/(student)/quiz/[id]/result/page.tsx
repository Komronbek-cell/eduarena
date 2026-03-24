'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Trophy, XCircle, Home } from 'lucide-react'

function ResultContent() {
  const router = useRouter()
  const params = useSearchParams()
  const score = Number(params.get('score') ?? 0)
  const correct = Number(params.get('correct') ?? 0)
  const total = Number(params.get('total') ?? 0)
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
          percentage >= 70 ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          {percentage >= 70
            ? <Trophy className="w-12 h-12 text-green-400" />
            : <XCircle className="w-12 h-12 text-red-400" />
          }
        </div>

        <h1 className="text-3xl font-bold mb-2">
          {percentage >= 70 ? 'Zo\'r natija!' : 'Keyingisida yaxshiroq!'}
        </h1>
        <p className="text-slate-400 mb-8">Quiz yakunlandi</p>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="text-5xl font-bold text-indigo-400 mb-2">+{score}</div>
          <div className="text-slate-400 text-sm">ball qo'shildi</div>

          <div className="border-t border-slate-800 mt-6 pt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{correct}</div>
              <div className="text-xs text-slate-500 mt-1">To'g'ri</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{total - correct}</div>
              <div className="text-xs text-slate-500 mt-1">Noto'g'ri</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{percentage}%</div>
              <div className="text-xs text-slate-500 mt-1">Natija</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-4 rounded-xl transition flex items-center justify-center gap-2"
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Yuklanmoqda...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}