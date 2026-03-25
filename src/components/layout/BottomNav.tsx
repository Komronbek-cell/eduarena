'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Zap, Medal, Users, User } from 'lucide-react'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    { href: '/dashboard', icon: Home, label: 'Bosh' },
    { href: '/quizzes', icon: Zap, label: 'Quizlar' },
    { href: '/leaderboard', icon: Medal, label: 'Reyting' },
    { href: '/groups', icon: Users, label: 'Guruhlar' },
    { href: '/profile', icon: User, label: 'Profil' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex items-center justify-around md:hidden z-50 safe-area-pb">
      {tabs.map(tab => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        const Icon = tab.icon
        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              isActive
                ? 'text-violet-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-violet-100' : ''}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
            </div>
            <span className={`text-xs font-bold ${isActive ? 'text-violet-600' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}