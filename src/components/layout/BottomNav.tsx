'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Zap, Medal, Users, MoreHorizontal, User, History, Bell, Users2, LogOut, MessageCircle, X, Swords } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const tabs = [
    { href: '/dashboard', icon: Home, label: 'Bosh' },
    { href: '/quizzes', icon: Zap, label: 'Quizlar' },
    { href: '/leaderboard', icon: Medal, label: 'Reyting' },
    { href: '/groups', icon: Users, label: 'Guruhlar' },
  ]

  const menuItems = [
    { icon: User, label: 'Profil', href: '/profile', color: 'text-violet-600', bg: 'bg-violet-50' },
    { icon: Users2, label: 'Jamoa', href: '/team', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: History, label: 'Tarix', href: '/history', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Bell, label: "E'lonlar", href: '/announcements', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Swords, label: 'Turnir', href: '/tournament', color: 'text-red-500', bg: 'bg-red-50' },
    { icon: MessageCircle, label: 'Telegram sahifa', href: 'https://t.me/iqtisodiyot_yoshlar_ittifoqi', color: 'text-sky-500', bg: 'bg-sky-50', external: true },
  ]

  const handleLogout = async () => {
    setMenuOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const navigate = (href: string, external?: boolean) => {
    setMenuOpen(false)
    if (external) {
      window.open(href, '_blank')
      return
    }
    router.push(href)
  }

  const isMenuActive = ['/profile', '/team', '/history', '/announcements', '/tournament'].some(
    p => pathname === p || pathname.startsWith(p + '/')
  )

  return (
    <>
      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Menu sheet */}
      <div
        className={`fixed left-0 right-0 z-50 md:hidden transition-all duration-300 ease-out ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ bottom: `calc(4rem + max(8px, env(safe-area-inset-bottom)))` }}
      >
        <div className={`mx-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-transform duration-300 ${
          menuOpen ? 'translate-y-0' : 'translate-y-4'
        }`}>
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="font-black text-sm text-gray-900">Menyu</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.href, item.external)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition text-left"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="font-bold text-sm text-gray-700 leading-tight">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="px-3 pb-3 border-t border-gray-50 pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 active:bg-red-100 transition text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <span className="font-bold text-sm text-red-500">Chiqish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex items-center justify-around md:hidden z-50"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        {tabs.map(tab => {
          const isActive = tab.href === '/dashboard'
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(tab.href + '/')
          const Icon = tab.icon
          return (
            <button
              key={tab.href}
              onClick={() => { setMenuOpen(false); router.push(tab.href) }}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
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

        {/* Menyu */}
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
        >
          <div className={`p-1.5 rounded-xl transition-all ${menuOpen || isMenuActive ? 'bg-violet-100' : ''}`}>
            <MoreHorizontal className={`w-5 h-5 ${menuOpen || isMenuActive ? 'text-violet-600' : 'text-gray-400'}`} />
          </div>
          <span className={`text-xs font-bold ${menuOpen || isMenuActive ? 'text-violet-600' : 'text-gray-400'}`}>
            Menyu
          </span>
        </button>
      </div>
    </>
  )
}
