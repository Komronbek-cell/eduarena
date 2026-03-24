'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Bell, Plus, Trash2, Pin, Loader2 } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
}

export default function AdminAnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
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

  const handleCreate = async () => {
    if (!title || !content) { alert('Sarlavha va matnni kiriting'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('announcements')
      .insert({ title, content, is_pinned: isPinned, created_by: user?.id })
      .select().single()

    if (data) {
      setAnnouncements(prev => [data, ...prev])
      setTitle('')
      setContent('')
      setIsPinned(false)
      setShowForm(false)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('E\'lonni o\'chirishni tasdiqlaysizmi?')) return
    const supabase = createClient()
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const togglePin = async (announcement: Announcement) => {
    const supabase = createClient()
    await supabase.from('announcements').update({ is_pinned: !announcement.is_pinned }).eq('id', announcement.id)
    setAnnouncements(prev => prev.map(a =>
      a.id === announcement.id ? { ...a, is_pinned: !a.is_pinned } : a
    ))
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition placeholder:text-gray-400"

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Bell className="w-5 h-5 text-violet-600" />
            <span className="font-black text-lg">E'lonlar</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm shadow-violet-200"
          >
            <Plus className="w-4 h-4" />
            Yangi e'lon
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">

        {/* Create form */}
        {showForm && (
          <div className="bg-white border border-violet-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-black text-lg mb-4">Yangi e'lon</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sarlavha</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="E'lon sarlavhasi"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Matn</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="E'lon matni..."
                  rows={4}
                  className={inputClass + ' resize-none'}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsPinned(!isPinned)}
                  className={`w-10 h-6 rounded-full transition-colors ${isPinned ? 'bg-violet-600' : 'bg-gray-200'} relative`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isPinned ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Yuqoriga pin qilish</span>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Joylash
                </button>
                <button
                  onClick={() => { setShowForm(false); setTitle(''); setContent('') }}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-semibold text-sm transition"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcements list */}
        {announcements.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl text-center py-20 shadow-sm">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Hali e'lon yo'q</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
            >
              Birinchi e'lonni joylang
            </button>
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className={`bg-white border rounded-2xl p-6 shadow-sm ${
              a.is_pinned ? 'border-violet-200' : 'border-gray-100'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {a.is_pinned && (
                      <span className="flex items-center gap-1 text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                        <Pin className="w-3 h-3" /> Pinlangan
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePin(a)}
                    className={`p-2 rounded-lg transition ${
                      a.is_pinned
                        ? 'text-violet-600 bg-violet-50 hover:bg-violet-100'
                        : 'text-gray-400 hover:text-violet-500 hover:bg-gray-100'
                    }`}
                    title={a.is_pinned ? 'Pinni olib tashlash' : 'Pin qilish'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}