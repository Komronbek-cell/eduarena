'use client'

import { useEffect, useState } from 'react'
import { Crown, Flame, Trophy } from 'lucide-react'
import MatchCard from './MatchCard'

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
  winner_group_id: string | null
  group1: { name: string; description?: string } | null
  group2: { name: string; description?: string } | null
}

interface BracketProps {
  matches: Match[]
  myGroupId: string | null
  currentRound: number
  totalGroups: number
  isFinished: boolean
  championName?: string
  isMyGroupChampion?: boolean
  onGroupClick?: (groupId: string, groupName: string) => void
}


export default function Bracket({
  matches,
  myGroupId,
  currentRound,
  totalGroups,
  isFinished,
  championName,
  isMyGroupChampion,
  onGroupClick,
}: BracketProps) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 200) }, [])

  const allRounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)
  const totalRounds = Math.ceil(Math.log2(totalGroups))

  const roundLabel = (round: number) => {
    const remaining = totalGroups / Math.pow(2, round - 1)
    if (remaining === 2) return { label: 'FINAL', emoji: '🏆', color: 'from-yellow-500 to-amber-500' }
    if (remaining === 4) return { label: 'YARIM FINAL', emoji: '⚔️', color: 'from-violet-500 to-purple-600' }
    if (remaining === 8) return { label: 'CHORAK FINAL', emoji: '🔥', color: 'from-orange-500 to-red-500' }
    return { label: `${round}-TUR`, emoji: '⚡', color: 'from-blue-500 to-indigo-500' }
  }

  return (
    <div className="w-full">
      {/* Mobile: vertical layout */}
      <div className="md:hidden space-y-8">
        {allRounds.map((round, ri) => {
          const roundMatches = matches.filter(m => m.round === round)
          const info = roundLabel(round)
          const isCurrent = round === currentRound

          return (
            <div key={round} className={`transition-all duration-700 ${
              animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: `${ri * 150}ms` }}>

              {/* Round header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`bg-gradient-to-r ${info.color} text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2`}>
                  <span>{info.emoji}</span>
                  <span>{info.label}</span>
                </div>
                {isCurrent && !isFinished && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-300 font-bold animate-pulse">
                    <Flame className="w-3.5 h-3.5" /> Davom etmoqda
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {roundMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    myGroupId={myGroupId}
                    isCurrent={isCurrent && !isFinished}
                    size="md"
                    onGroupClick={onGroupClick}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: horizontal bracket */}
      <div className="hidden md:block overflow-x-auto pb-6">
        <div className="flex items-start gap-0 min-w-max">
          {allRounds.map((round, ri) => {
            const roundMatches = matches.filter(m => m.round === round)
            const info = roundLabel(round)
            const isCurrent = round === currentRound
            const isLastRound = round === Math.max(...allRounds)

            // Spacing between matches increases each round
            const spacingClass = ri === 0 ? 'gap-3' :
              ri === 1 ? 'gap-16' :
              ri === 2 ? 'gap-40' : 'gap-72'

            return (
              <div key={round} className="flex items-start">
                {/* Round column */}
                <div className={`transition-all duration-700 ${
                  animated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`} style={{ transitionDelay: `${ri * 200}ms` }}>

                  {/* Round label */}
                  <div className="flex items-center justify-center mb-4">
                    <div className={`bg-gradient-to-r ${info.color} text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg`}>
                      <span>{info.emoji}</span>
                      <span>{info.label}</span>
                      {isCurrent && !isFinished && (
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse ml-1" />
                      )}
                    </div>
                  </div>

                  {/* Matches */}
                  <div className={`flex flex-col ${spacingClass}`}>
                    {roundMatches.map((match, mi) => (
                      <div key={match.id} className="relative" style={{ width: 200 }}>
                        <MatchCard
                          match={match}
                          myGroupId={myGroupId}
                          isCurrent={isCurrent && !isFinished}
                          size="sm"
                          onGroupClick={onGroupClick}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connector lines */}
                {!isLastRound && (
                  <div className="flex flex-col justify-around self-stretch" style={{ width: 40 }}>
                    {Array.from({ length: Math.ceil(roundMatches.length / 2) }).map((_, i) => (
                      <div key={i} className="flex items-center" style={{ height: `${100 / Math.ceil(roundMatches.length / 2)}%` }}>
                        <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-violet-500/40" />
                        <div className="w-2 h-2 rounded-full bg-violet-500/60 flex-shrink-0" />
                        <div className="flex-1 h-px bg-gradient-to-r from-violet-500/40 to-white/20" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Champion box */}
          {isFinished && championName && (
            <div className={`ml-6 transition-all duration-1000 ${
              animated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            }`} style={{ transitionDelay: `${allRounds.length * 200 + 300}ms` }}>
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-black px-4 py-2 rounded-xl">
                  <Crown className="w-3.5 h-3.5" /> CHEMPION
                </div>
              </div>
              <div className={`relative rounded-2xl p-5 border-2 text-center w-48 ${
                isMyGroupChampion
                  ? 'border-yellow-400 bg-gradient-to-b from-yellow-500/20 to-amber-500/10 shadow-2xl shadow-yellow-500/30'
                  : 'border-yellow-500/50 bg-yellow-500/10'
              }`}>
                <div className="text-4xl mb-3">{isMyGroupChampion ? '🎉' : '👑'}</div>
                <div className="w-12 h-12 rounded-2xl bg-yellow-500 text-white flex items-center justify-center font-black text-lg mx-auto mb-3">
                  {championName.split('-')[0]}
                </div>
                <p className="font-black text-yellow-300 text-sm">{championName}</p>
                {isMyGroupChampion && (
                  <p className="text-yellow-400/70 text-xs mt-1">Guruhingiz! 🏆</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}