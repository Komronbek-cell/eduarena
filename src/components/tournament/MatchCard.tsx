'use client'

import { Swords, Clock, Flame, Trophy } from 'lucide-react'

interface MatchCardProps {
  match: {
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
  myGroupId: string | null
  isCurrent: boolean
  size?: 'sm' | 'md' | 'lg'
onGroupClick?: (groupId: string, groupName: string) => void
}

export default function MatchCard({ match, myGroupId, isCurrent, size = 'md', onGroupClick }: MatchCardProps) {
  const g1 = match.group1?.name ?? '—'
  const g2 = match.group2?.name ?? '—'
  const g1desc = match.group1?.description ?? ''
  const g2desc = match.group2?.description ?? ''
  const isFinished = match.status === 'finished'
  const g1wins = match.group1_score >= match.group2_score
  const isMyMatch = match.group1_id === myGroupId || match.group2_id === myGroupId
  const iAmG1 = match.group1_id === myGroupId
  const iAmG2 = match.group2_id === myGroupId
  const iWon = isFinished && match.winner_group_id === myGroupId

  const cardSize = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }[size]

  const scoreSize = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size]

  const nameSize = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  }[size]

  return (
    <div className={`relative rounded-2xl border transition-all duration-300 ${cardSize} ${
      isMyMatch && isCurrent && !isFinished
        ? 'border-orange-500/60 bg-gradient-to-b from-orange-500/10 to-red-500/5 shadow-lg shadow-orange-500/20'
        : isMyMatch && isFinished
        ? iWon
          ? 'border-green-500/40 bg-green-500/5'
          : 'border-red-500/30 bg-red-500/5 opacity-70'
        : isFinished
        ? 'border-white/10 bg-white/5 opacity-80'
        : 'border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/8'
    }`}>

      {/* My match badge */}
      {isMyMatch && isCurrent && !isFinished && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap shadow-lg">
          <Flame className="w-3 h-3" /> Sizning guruhingiz!
        </div>
      )}

      {iWon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap shadow-lg">
          <Trophy className="w-3 h-3" /> G'olib!
        </div>
      )}

      {/* Group 1 */}
      <div className={`flex items-center gap-2 p-2.5 rounded-xl mb-2 transition-all ${
        isFinished && g1wins
          ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30'
          : isFinished && !g1wins
          ? 'opacity-40'
          : iAmG1
          ? 'bg-violet-500/15 border border-violet-500/30'
          : 'bg-white/5'
      }`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
          iAmG1 ? 'bg-violet-500 text-white' :
          isFinished && g1wins ? 'bg-yellow-500 text-white' :
          'bg-white/10 text-white/70'
        }`}>
          {g1.split('-')[0]}
        </div>

        <div className="flex-1 min-w-0">
          <p
            onClick={() => onGroupClick?.(match.group1_id, g1)}
            className={`font-black truncate ${nameSize} cursor-pointer hover:underline ${
            iAmG1 ? 'text-violet-300' :
            isFinished && g1wins ? 'text-yellow-300' :
          'text-white/80'
          }`}
         >{g1}</p>
          {g1desc && <p className="text-xs text-white/30 truncate hidden md:block">{g1desc}</p>}
          {match.group1_participants !== undefined && match.group1_participants > 0 && (
            <p className="text-xs text-white/30">{match.group1_participants} ishtirok</p>
          )}
        </div>

        <div className={`${scoreSize} font-black flex-shrink-0 ${
          isFinished && g1wins ? 'text-yellow-400' :
          isCurrent && !isFinished ? 'text-violet-400' :
          'text-white/40'
        }`}>
          {match.group1_score.toFixed(1)}
        </div>

        {isFinished && g1wins && <span className="text-base flex-shrink-0">🏆</span>}
      </div>

      {/* VS divider */}
      <div className="flex items-center gap-2 px-2 my-1">
        <div className="flex-1 h-px bg-white/10" />
        <div className="flex items-center gap-1">
          <Swords className={`w-3.5 h-3.5 ${isCurrent && !isFinished ? 'text-orange-400' : 'text-white/20'}`} />
          <span className={`text-xs font-bold ${isCurrent && !isFinished ? 'text-orange-300' : 'text-white/20'}`}>VS</span>
        </div>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Group 2 */}
      <div className={`flex items-center gap-2 p-2.5 rounded-xl mt-2 transition-all ${
        isFinished && !g1wins
          ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30'
          : isFinished && g1wins
          ? 'opacity-40'
          : iAmG2
          ? 'bg-violet-500/15 border border-violet-500/30'
          : 'bg-white/5'
      }`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
          iAmG2 ? 'bg-violet-500 text-white' :
          isFinished && !g1wins ? 'bg-yellow-500 text-white' :
          'bg-white/10 text-white/70'
        }`}>
          {g2.split('-')[0]}
        </div>

        <div className="flex-1 min-w-0">
          <p
         onClick={() => onGroupClick?.(match.group2_id, g2)}
         className={`font-black truncate ${nameSize} cursor-pointer hover:underline ${
         iAmG2 ? 'text-violet-300' :
         isFinished && !g1wins ? 'text-yellow-300' :
        'text-white/80'
      }`}
   >{g2}</p>
          {g2desc && <p className="text-xs text-white/30 truncate hidden md:block">{g2desc}</p>}
          {match.group2_participants !== undefined && match.group2_participants > 0 && (
            <p className="text-xs text-white/30">{match.group2_participants} ishtirok</p>
          )}
        </div>

        <div className={`${scoreSize} font-black flex-shrink-0 ${
          isFinished && !g1wins ? 'text-yellow-400' :
          isCurrent && !isFinished ? 'text-violet-400' :
          'text-white/40'
        }`}>
          {match.group2_score.toFixed(1)}
        </div>

        {isFinished && !g1wins && <span className="text-base flex-shrink-0">🏆</span>}
      </div>

      {/* Footer */}
      {match.ends_at && !isFinished && (
        <div className="flex items-center justify-center gap-1 mt-3 text-xs text-white/30">
          <Clock className="w-3 h-3" />
          {new Date(match.ends_at).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })} gacha
        </div>
      )}
    </div>
  )
}