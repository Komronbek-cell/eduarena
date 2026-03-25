'use client'

import BottomNav from '@/components/layout/BottomNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Bell, Pin, Loader2 } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      setAnnouncements(data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Bell className="w-5 h-5 text-violet-600" />
          <span className="font-black text-lg">E'lonlar</span>
          {announcements.length > 0 && (
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
              {announcements.length} ta
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4 pb-24 md:pb-0">
        {announcements.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl text-center py-20 shadow-sm">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-no4" />
            <p className="text-gray-500 font-semibold">Hozircha e'lon yo'q</p>
            <p className="text-gray-400 text-sm mt-1">Yangi e'lonlar bu yerda ko'rinadi</p>
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className={`bg-white border rounded-2xl p-6 shadow-sm transition hover:shadow-md ${
              a.is_pinned ? 'border-violet-200' : 'border-gray-100'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  a.is_pinned ? 'bg-violet-100' : 'bg-gray-100'
                }`}>
                  <Bell className={`w-5 h-5 ${a.is_pinned ? 'text-violet-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {a.is_pinned && (
                      <span className="flex items-center gap-1 text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                        <Pin className="w-3 h-3" /> Muhim
                      </span>
                    )}
                    <h3 className="font-black text-gray-900">{a.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{a.content}</p>
                  <p className="text-xs text-gray-300 mt-3">
                    {new Date(a.created_at).toLocaleDateString('uz-UZ', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
         <BottomNav />
    </div>
    )
}