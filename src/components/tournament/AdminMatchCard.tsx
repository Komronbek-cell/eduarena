'use client'

import { useState } from 'react'
import { Swords, Clock, CheckCircle, Loader2, ChevronDown, Zap, Trophy, BarChart2 } from 'lucide-react'

interface Quiz {
  id: string
  title: string
}

interface Match {
  id: string
  round: number
  status: string
  ends_at: string | null
  group1_score: number
  group2_score: number
  group1_id: string
  group2_id: string
  group1_participants?: number
  group2_participants?: number
  group1_total_score?: number
  group2_total_score?: number
  winner_group_id: string | null
  quiz_id: string | null
  group1: { name: string; description?: string } | null
  group2: { name: string; description?: string } | null
}

interface AdminMatchCardProps {
  match: Match
  isCurrent: boolean
  quizzes: Quiz[]
  onFinish: (match: Match, quizId: string | null) => Promise<void>
  onQuizChange: (matchId: string, quizId: string) => Promise<void>
}

export default function AdminMatchCard({
  match,
  isCurrent,
  quizzes,
  onFinish,
  onQuizChange,
}: AdminMatchCardProps) {
  const [finishing, setFinishing] = useState(false)
  const [changingQuiz, setChangingQuiz] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const g1 = match.group1?.name ?? '—'
  const g2 = match.group2?.name ?? '—'
  const g1desc = match.group1?.description ?? ''
  const g2desc = match.group2?.description ?? ''
  const isFinished = match.status === 'finished'
  const g1Wins = match.group1_score >= match.group2_score

  const currentQuiz = quizzes.find(q => q.id === match.quiz_id)

  const handleFinish = async () => {
    setFinishing(true)
    await onFinish(match, match.quiz_id)
    setFinishing(false)
  }

  const handleQuizChange = async (quizId: string) => {
    setChangingQuiz(true)
    await onQuizChange(match.id, quizId)
    setChangingQuiz(false)
  }

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition ${
      isFinished ? 'border-gray-100 opacity-80' : 'border-violet-200 shadow-violet-50'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isFinished ? 'bg-gray-50' : 'bg-violet-50'
      }`}>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          isFinished ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'
        }`}>
          {isFinished ? '✅ Tugadi' : '🔥 Faol'}
        </span>

        <div className="flex items-center gap-2">
          {match.ends_at && !isFinished && (
            <span className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
              <Clock className="w-3 h-3" />
              {new Date(match.ends_at).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })} gacha
            </span>
          )}
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-xs text-gray-400 hover:text-violet-600 flex items-center gap-1 transition"
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scores */}
      <div className="p-4">
        <div className="flex items-stretch gap-3 mb-4">
          {/* Group 1 */}
          <div className={`flex-1 p-3 rounded-xl text-center ${
            isFinished && g1Wins
              ? 'bg-green-50 border border-green-200'
              : isFinished
              ? 'bg-gray-50 opacity-60'
              : 'bg-violet-50'
          }`}>
            <p className="font-black text-sm text-gray-900 truncate">{g1}</p>
            {g1desc && <p className="text-xs text-gray-400 truncate mt-0.5">{g1desc}</p>}
            <p className={`text-3xl font-black mt-2 ${
              isFinished && g1Wins ? 'text-green-600' : 'text-violet-600'
            }`}>
              {match.group1_score.toFixed(1)}
            </p>
            {showStats && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                <p className="text-xs text-gray-400">{match.group1_participants ?? 0} ishtirokchi</p>
                <p className="text-xs text-gray-400">Jami: {match.group1_total_score?.toFixed(0) ?? 0}</p>
              </div>
            )}
            {isFinished && g1Wins && <p className="text-xs text-green-600 font-black mt-1">🏆 G'olib</p>}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
            <Swords className={`w-5 h-5 ${!isFinished ? 'text-violet-400' : 'text-gray-300'}`} />
            <span className="text-xs font-black text-gray-400">VS</span>
          </div>

          {/* Group 2 */}
          <div className={`flex-1 p-3 rounded-xl text-center ${
            isFinished && !g1Wins
              ? 'bg-green-50 border border-green-200'
              : isFinished
              ? 'bg-gray-50 opacity-60'
              : 'bg-violet-50'
          }`}>
            <p className="font-black text-sm text-gray-900 truncate">{g2}</p>
            {g2desc && <p className="text-xs text-gray-400 truncate mt-0.5">{g2desc}</p>}
            <p className={`text-3xl font-black mt-2 ${
              isFinished && !g1Wins ? 'text-green-600' : 'text-violet-600'
            }`}>
              {match.group2_score.toFixed(1)}
            </p>
            {showStats && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                <p className="text-xs text-gray-400">{match.group2_participants ?? 0} ishtirokchi</p>
                <p className="text-xs text-gray-400">Jami: {match.group2_total_score?.toFixed(0) ?? 0}</p>
              </div>
            )}
            {isFinished && !g1Wins && <p className="text-xs text-green-600 font-black mt-1">🏆 G'olib</p>}
          </div>
        </div>

        {/* Quiz selector — faqat faol matchlar uchun */}
        {isCurrent && !isFinished && (
          <div className="mb-3">
            <label className="text-xs font-bold text-gray-500 mb-1.5 block flex items-center gap-1">
              <Zap className="w-3 h-3 text-violet-500" />
              Bu tur uchun quiz
            </label>
            <div className="relative">
              <select
                value={match.quiz_id ?? ''}
                onChange={e => handleQuizChange(e.target.value)}
                disabled={changingQuiz}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition appearance-none pr-8"
              >
                <option value="">Quiz tanlanmagan</option>
                {quizzes.map(q => (
                  <option key={q.id} value={q.id}>{q.title}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {changingQuiz
                  ? <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                  : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                }
              </div>
            </div>
            {currentQuiz && (
              <p className="text-xs text-violet-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> {currentQuiz.title}
              </p>
            )}
          </div>
        )}

        {/* Tugangan match uchun quiz info */}
        {isFinished && currentQuiz && (
          <div className="text-xs text-gray-400 flex items-center gap-1 mb-3">
            <Zap className="w-3 h-3" /> Quiz: {currentQuiz.title}
          </div>
        )}

        {/* Finish button */}
        {isCurrent && !isFinished && (
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-white font-black text-sm py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-violet-200"
          >
            {finishing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Yakunlanmoqda...</>
              : <><Trophy className="w-4 h-4" /> Turni yakunlash</>
            }
          </button>
        )}
      </div>
    </div>
  )
}