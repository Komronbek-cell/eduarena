'use client'

import { useState } from 'react'
import { X, Flame, CheckCircle, AlertCircle, Swords, Loader2, Zap, BookOpen } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string
  studentCount?: number
}

interface Quiz {
  id: string
  title: string
}

interface TournamentCreateProps {
  groups: Group[]
  quizzes: Quiz[]
  onCancel: () => void
  onCreate: (data: {
    title: string
    selectedGroups: string[]
    roundQuizzes: Record<number, string>
    roundDays: number
    bonusChampion: number
    bonusFinalist: number
    bonusSemifinal: number
  }) => Promise<void>
}

const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition"

const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0

export default function TournamentCreate({ groups, quizzes, onCancel, onCreate }: TournamentCreateProps) {
  const [title, setTitle] = useState('')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [roundQuizzes, setRoundQuizzes] = useState<Record<number, string>>({})
  const [roundDays, setRoundDays] = useState(2)
  const [bonusChampion, setBonusChampion] = useState(200)
  const [bonusFinalist, setBonusFinalist] = useState(100)
  const [bonusSemifinal, setBonusSemifinal] = useState(50)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  const toggleGroup = (id: string) => {
    setSelectedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  const selectAll = () => setSelectedGroups(groups.map(g => g.id))
  const clearAll = () => setSelectedGroups([])

  const handleCreate = async () => {
    if (!title || selectedGroups.length < 2) return
    if (selectedGroups.length % 2 !== 0) {
      alert("Guruhlar soni juft bo'lishi kerak!")
      return
    }
    if (!isPowerOfTwo(selectedGroups.length)) {
      alert("Guruhlar soni 2 ning darajasi bo'lishi kerak: 2, 4, 8, 16, 32...")
      return
    }
    setCreating(true)
    await onCreate({ title, selectedGroups, roundQuizzes, roundDays, bonusChampion, bonusFinalist, bonusSemifinal })
    setCreating(false)
  }

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase())
  )

  const totalRounds = selectedGroups.length >= 2
    ? Math.ceil(Math.log2(selectedGroups.length))
    : 0

  const isValid = title.trim() &&
    selectedGroups.length >= 2 &&
    isPowerOfTwo(selectedGroups.length)

  const roundLabel = (round: number) => {
    const remaining = selectedGroups.length / Math.pow(2, round - 1)
    if (remaining === 2) return '🏆 Final'
    if (remaining === 4) return '⚔️ Yarim final'
    if (remaining === 8) return '🔥 Chorak final'
    return `${round}-tur`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-black text-xl">Yangi turnir yaratish</h2>
      </div>

      {/* Asosiy ma'lumotlar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
        <h3 className="font-black text-base mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Asosiy ma'lumotlar
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Turnir nomi *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Masalan: Bahor chempionati 2026"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">⏱ Tur davomiyligi (kun)</label>
              <input
                type="number" value={roundDays} min={1} max={14}
                onChange={e => setRoundDays(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">🥇 Chempion ball</label>
              <input type="number" value={bonusChampion}
                onChange={e => setBonusChampion(Number(e.target.value))}
                className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">🥈 Finalist ball</label>
              <input type="number" value={bonusFinalist}
                onChange={e => setBonusFinalist(Number(e.target.value))}
                className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">🥉 Yarim final ball</label>
              <input type="number" value={bonusSemifinal}
                onChange={e => setBonusSemifinal(Number(e.target.value))}
                className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* Guruhlar tanlash */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-black text-base flex items-center gap-2">
            <Swords className="w-4 h-4 text-violet-600" />
            Ishtirokchi guruhlar
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={selectAll}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition">
              Hammasini tanlash
            </button>
            <button onClick={clearAll}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
              Tozalash
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {selectedGroups.length > 0 && selectedGroups.length % 2 !== 0 && (
            <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl font-bold">
              <AlertCircle className="w-3.5 h-3.5" /> Juft son tanlang
            </span>
          )}
          {selectedGroups.length > 0 && selectedGroups.length % 2 === 0 && !isPowerOfTwo(selectedGroups.length) && (
            <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl font-bold">
              <AlertCircle className="w-3.5 h-3.5" /> 2, 4, 8, 16, 32 ta tanlang
            </span>
          )}
          {selectedGroups.length >= 2 && isPowerOfTwo(selectedGroups.length) && (
            <span className="flex items-center gap-2 text-xs text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-xl font-bold">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              {selectedGroups.length} guruh · {selectedGroups.length / 2} juftlik · {totalRounds} tur
            </span>
          )}
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${isValid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {selectedGroups.length} ta tanlandi
          </span>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Guruh qidirish..."
          className={inputClass + ' mb-3'}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
          {filtered.map(group => {
            const isSelected = selectedGroups.includes(group.id)
            return (
              <button
                key={group.id}
                onClick={() => toggleGroup(group.id)}
                className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition ${
                  isSelected
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-100 hover:border-violet-200 bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isSelected ? 'bg-violet-600' : 'bg-gray-200'
                }`}>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className={`font-black text-xs truncate ${isSelected ? 'text-violet-700' : 'text-gray-700'}`}>
                    {group.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{group.description}</p>
                  <p className="text-xs text-gray-300">{group.studentCount ?? 0} talaba</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Har tur uchun quiz tanlash */}
      {isValid && totalRounds > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
          <h3 className="font-black text-base mb-1 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-600" />
            Har tur uchun quiz
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Har turda 100 ta savoldan talabaga tasodifiy 15 ta beriladi
          </p>
          <div className="space-y-3">
            {Array.from({ length: totalRounds }, (_, i) => {
              const round = i + 1
              const label = roundLabel(round)
              const startDay = i * roundDays + 1
              const endDay = (i + 1) * roundDays
              return (
                <div key={round} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  roundQuizzes[round] ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className="flex-shrink-0 min-w-0">
                    <p className="text-xs font-black text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{startDay}-{endDay} kun</p>
                  </div>
                  <div className="flex-1 relative">
                    <select
                      value={roundQuizzes[round] ?? ''}
                      onChange={e => setRoundQuizzes(prev => ({ ...prev, [round]: e.target.value }))}
                      className={`w-full bg-white border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-400 transition appearance-none ${
                        roundQuizzes[round] ? 'border-violet-300 text-violet-700 font-bold' : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      <option value="">Quiz tanlanmagan</option>
                      {quizzes.map(q => (
                        <option key={q.id} value={q.id}>{q.title}</option>
                      ))}
                    </select>
                  </div>
                  {roundQuizzes[round] && (
                    <Zap className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Turnir rejasi preview */}
      {isValid && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5">
          <h3 className="font-black text-sm text-violet-800 mb-3">📅 Turnir rejasi:</h3>
          <div className="space-y-2">
            {Array.from({ length: totalRounds }, (_, i) => {
              const round = i + 1
              const groupCount = selectedGroups.length / Math.pow(2, i)
              const label = roundLabel(round)
              const startDay = i * roundDays + 1
              const endDay = (i + 1) * roundDays
              return (
                <div key={round} className="flex items-center gap-3">
                  <span className="text-sm">{label}</span>
                  <div className="flex-1 h-px bg-violet-200" />
                  <span className="text-xs text-violet-500 font-semibold">
                    {groupCount / 2} match · {startDay}-{endDay} kun
                    {roundQuizzes[round] ? ' · ✅ Quiz' : ' · ⚠️ Quiz yo\'q'}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-violet-500 mt-3">
            Jami davomiyligi: ~{totalRounds * roundDays} kun
          </p>
        </div>
      )}

      {/* Create button */}
      <button
        onClick={handleCreate}
        disabled={!isValid || creating}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-violet-200 text-base"
      >
        {creating
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Yaratilmoqda...</>
          : <><Flame className="w-5 h-5" /> Turnirni boshlash!</>
        }
      </button>
    </div>
  )
}