'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Bell, Plus, Trash2, Pin, Loader2,
  Crown, Trophy, Search, Star, CheckCircle
} from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
}

type GroupField = { name: string } | { name: string }[] | null | undefined

function getGroupName(g: GroupField): string {
  if (!g) return ''
  if (Array.isArray(g)) return g[0]?.name ?? ''
  return (g as { name: string }).name ?? ''
}

interface Student {
  id: string
  full_name: string
  total_score: number
  avatar_url?: string
  groups?: GroupField
}

interface WeeklyChampion {
  id: string
  user_id: string
  week_label: string
  score: number
  announced_at: string
  profiles?: { full_name: string; avatar_url?: string; groups?: GroupField }
}

export default function AdminAnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [champions, setChampions] = useState<WeeklyChampion[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'announcements' | 'champions'>('champions')

  // Announcement form
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  // Champion form
  const [showChampionForm, setShowChampionForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [weekLabel, setWeekLabel] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-hafta-${getWeekNumber(now)}`
  })
  const [savingChampion, setSavingChampion] = useState(false)

  function getWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const dayNum = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [
      { data: announcementsData },
      { data: championsData },
      { data: studentsData },
    ] = await Promise.all([
      supabase.from('announcements').select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('weekly_champions').select('*, profiles(full_name, avatar_url, groups(name))')
        .order('announced_at', { ascending: false })
        .limit(10),
      supabase.from('profiles').select('id, full_name, total_score, avatar_url, groups(name)')
        .eq('role', 'student')
        .order('total_score', { ascending: false })
        .limit(50),
    ])

    setAnnouncements(announcementsData ?? [])
    setChampions(championsData ?? [])
    setStudents(studentsData ?? [])
    setLoading(false)
  }

  // --- Announcements ---
  const handleCreate = async () => {
    if (!title || !content) { alert('Sarlavha va matnni kiriting'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('announcements')
      .insert({ title, content, is_pinned: isPinned, created_by: user?.id })
      .select().single()
    if (data) {
      setAnnouncements(prev => [data, ...prev])
      setTitle(''); setContent(''); setIsPinned(false); setShowForm(false)
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

  // --- Champions ---
  const handleAnnounceChampion = async () => {
    if (!selectedStudent || !weekLabel.trim()) {
      alert('Talabani tanlang va hafta nomini kiriting'); return
    }
    setSavingChampion(true)
    const supabase = createClient()

    // weekly_champions jadvaliga qo'shish
    const { data: championData } = await supabase.from('weekly_champions').insert({
      user_id: selectedStudent.id,
      week_label: weekLabel.trim(),
      score: selectedStudent.total_score,
    }).select().single()

    if (championData) {
      // Avtomatik e'lon ham yaratish
      const fullName = selectedStudent.full_name
      const groupName = getGroupName(selectedStudent.groups)
      await supabase.from('announcements').insert({
        title: `🏆 Hafta qahramoni: ${fullName}`,
        content: `${weekLabel} hafatasining eng yaxshi talabasi — ${fullName}${groupName ? ` (${groupName})` : ''}! Jami ball: ${selectedStudent.total_score}. Tabriklaymiz! 🎉`,
        is_pinned: true,
      })

      await fetchAll()
      setShowChampionForm(false)
      setSelectedStudent(null)
      setSearchQuery('')
    }
    setSavingChampion(false)
  }

  const handleDeleteChampion = async (id: string) => {
    if (!confirm('Qahramon yozuvini o\'chirishni tasdiqlaysizmi?')) return
    const supabase = createClient()
    await supabase.from('weekly_champions').delete().eq('id', id)
    setChampions(prev => prev.filter(c => c.id !== id))
  }

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <span className="font-black text-lg">E'lonlar & Qahramon</span>
          </div>
          <button
            onClick={() => tab === 'champions' ? setShowChampionForm(!showChampionForm) : setShowForm(!showForm)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm shadow-violet-200"
          >
            <Plus className="w-4 h-4" />
            {tab === 'champions' ? 'Qahramon tanlash' : "Yangi e'lon"}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-6">

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setTab('champions')}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition ${
              tab === 'champions' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Crown className="w-4 h-4" /> Hafta qahramonlari
          </button>
          <button
            onClick={() => setTab('announcements')}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition ${
              tab === 'announcements' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell className="w-4 h-4" /> E'lonlar
          </button>
        </div>

        {/* ====== CHAMPIONS TAB ====== */}
        {tab === 'champions' && (
          <div className="space-y-4">

            {/* Champion selection form */}
            {showChampionForm && (
              <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg">Hafta qahramonini tanlash</h2>
                    <p className="text-gray-400 text-xs">Talabani tanlang — avtomatik e'lon ham yaratiladi</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Hafta nomi */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Hafta nomi</label>
                    <input
                      value={weekLabel}
                      onChange={e => setWeekLabel(e.target.value)}
                      placeholder="masalan: 2025-hafta-12"
                      className={inputClass}
                    />
                  </div>

                  {/* Talaba qidirish */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Talaba tanlang</label>
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Ism bo'yicha qidirish..."
                        className={inputClass + ' pl-9'}
                      />
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {filteredStudents.slice(0, 15).map((student, index) => (
                        <div
                          key={student.id}
                          onClick={() => setSelectedStudent(student)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            selectedStudent?.id === student.id
                              ? 'border-violet-300 bg-violet-50'
                              : 'border-gray-100 hover:border-violet-200 hover:bg-gray-50'
                          }`}
                        >
                          {/* Rank badge */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                            index === 0 ? 'bg-amber-100 text-amber-700' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                            index === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-50 text-gray-400'
                          }`}>
                            {index < 3 ? ['👑', '🥈', '🥉'][index] : `${index + 1}`}
                          </div>

                          {/* Avatar */}
                          {student.avatar_url ? (
                            <img src={student.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-black text-violet-600">{student.full_name.charAt(0)}</span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{student.full_name}</p>
                            <p className="text-xs text-gray-400">
                              {getGroupName(student.groups) || 'Guruhsiz'}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 text-violet-600 font-black text-sm">
                            <Star className="w-3.5 h-3.5" />
                            {student.total_score}
                          </div>

                          {selectedStudent?.id === student.id && (
                            <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected preview */}
                  {selectedStudent && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                      <Crown className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="font-black text-amber-800 text-sm">{selectedStudent.full_name}</p>
                        <p className="text-amber-600 text-xs">
                          {weekLabel} hafatasining qahramoni — {selectedStudent.total_score} ball
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleAnnounceChampion}
                      disabled={savingChampion || !selectedStudent}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition"
                    >
                      {savingChampion && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Crown className="w-4 h-4" />
                      E'lon qilish
                    </button>
                    <button
                      onClick={() => { setShowChampionForm(false); setSelectedStudent(null); setSearchQuery('') }}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-semibold text-sm transition"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Champions list */}
            {champions.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl text-center py-20 shadow-sm">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold">Hali qahramon e'lon qilinmagan</p>
                <p className="text-gray-400 text-sm mt-1 mb-4">Hafta qahramonini tanlang va e'lon qiling</p>
                <button
                  onClick={() => setShowChampionForm(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
                >
                  Birinchi qahramonni tanlash
                </button>
              </div>
            ) : (
              champions.map((champion, index) => {
                const profile = champion.profiles as any
                return (
                  <div key={champion.id} className={`bg-white border rounded-2xl p-5 shadow-sm flex items-center gap-4 ${
                    index === 0 ? 'border-amber-200' : 'border-gray-100'
                  }`}>
                    {index === 0 && (
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Crown className="w-6 h-6 text-amber-600" />
                      </div>
                    )}
                    {index > 0 && (
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-black text-violet-600">
                          {profile?.full_name?.charAt(0)}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-gray-900">{profile?.full_name}</p>
                        {index === 0 && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                            So'nggi qahramon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {champion.week_label} · {getGroupName((profile as any)?.groups) || 'Guruhsiz'} · {champion.score} ball
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {new Date(champion.announced_at).toLocaleDateString('uz-UZ', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteChampion(champion.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ====== ANNOUNCEMENTS TAB ====== */}
        {tab === 'announcements' && (
          <div className="space-y-4">
            {showForm && (
              <div className="bg-white border border-violet-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-black text-lg mb-4">Yangi e'lon</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sarlavha</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="E'lon sarlavhasi" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Matn</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="E'lon matni..." rows={4} className={inputClass + ' resize-none'} />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => setIsPinned(!isPinned)} className={`w-10 h-6 rounded-full transition-colors ${isPinned ? 'bg-violet-600' : 'bg-gray-200'} relative`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isPinned ? 'left-5' : 'left-1'}`} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Yuqoriga pin qilish</span>
                  </label>
                  <div className="flex gap-3">
                    <button onClick={handleCreate} disabled={saving} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />} Joylash
                    </button>
                    <button onClick={() => { setShowForm(false); setTitle(''); setContent('') }} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-semibold text-sm transition">
                      Bekor qilish
                    </button>
                  </div>
                </div>
              </div>
            )}

            {announcements.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl text-center py-20 shadow-sm">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Hali e'lon yo'q</p>
                <button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">
                  Birinchi e'lonni joylang
                </button>
              </div>
            ) : (
              announcements.map(a => (
                <div key={a.id} className={`bg-white border rounded-2xl p-6 shadow-sm ${a.is_pinned ? 'border-violet-200' : 'border-gray-100'}`}>
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
                        {new Date(a.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => togglePin(a)} className={`p-2 rounded-lg transition ${a.is_pinned ? 'text-violet-600 bg-violet-50 hover:bg-violet-100' : 'text-gray-400 hover:text-violet-500 hover:bg-gray-100'}`}>
                        <Pin className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}