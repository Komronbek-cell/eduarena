'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Users, Search, Trophy, Flame, Loader2, ChevronDown } from 'lucide-react'

interface Student {
  id: string
  full_name: string
  email: string
  total_score: number
  streak: number
  created_at: string
  group_id: string | null
  groups: { id: string; name: string; description: string } | null
}

interface Group {
  id: string
  name: string
  description: string
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: studentsData }, { data: groupsData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*, groups(id, name, description)')
          .eq('role', 'student')
          .order('total_score', { ascending: false }),
        supabase.from('groups').select('*').order('name'),
      ])

      setStudents((studentsData as any) ?? [])
      setGroups(groupsData ?? [])
      setLoading(false)
    }
    fetchData()
  }, [router])

  const updateGroup = async (studentId: string, groupId: string) => {
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ group_id: groupId || null })
      .eq('id', studentId)

    const group = groups.find(g => g.id === groupId) ?? null
    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, group_id: groupId, groups: group } : s
    ))
    setEditingId(null)
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.groups?.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Users className="w-5 h-5 text-violet-600" />
            <span className="font-black text-lg">Talabalar</span>
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
              {students.length} ta
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ism, email yoki guruh bo'yicha qidiring..."
            className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition shadow-sm"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-black text-violet-600">{students.length}</p>
            <p className="text-sm text-gray-400 mt-0.5">Jami talabalar</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-black text-green-600">
              {students.filter(s => s.total_score > 0).length}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">Faol talabalar</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-black text-orange-500">
              {students.filter(s => s.streak > 0).length}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">Streak bor</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Talaba</div>
            <div className="col-span-3">Guruh</div>
            <div className="col-span-2 text-center">Ball</div>
            <div className="col-span-2 text-center">Streak</div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400">Talaba topilmadi</p>
            </div>
          ) : (
            filtered.map((student, index) => (
              <div
                key={student.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition items-center"
              >
                {/* Rank */}
                <div className="col-span-1">
                  {index === 0 ? <span className="text-lg">🥇</span>
                    : index === 1 ? <span className="text-lg">🥈</span>
                    : index === 2 ? <span className="text-lg">🥉</span>
                    : <span className="text-gray-400 text-sm font-mono">#{index + 1}</span>}
                </div>

                {/* Talaba */}
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-sm flex-shrink-0">
                      {student.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{student.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{student.email}</p>
                    </div>
                  </div>
                </div>

                {/* Guruh */}
                <div className="col-span-3">
                  {editingId === student.id ? (
                    <div className="relative">
                      <select
                        defaultValue={student.group_id ?? ''}
                        onChange={e => updateGroup(student.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        autoFocus
                        className="w-full bg-white border border-violet-300 text-gray-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none appearance-none pr-7"
                      >
                        <option value="">Guruhsiz</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingId(student.id)}
                      className="flex items-center gap-1.5 text-xs hover:text-violet-600 transition group"
                    >
                      <span className={`px-2.5 py-1 rounded-lg font-semibold ${
                        student.groups
                          ? 'bg-violet-50 text-violet-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {student.groups?.name ?? 'Guruhsiz'}
                      </span>
                      <span className="text-gray-300 group-hover:text-violet-400 text-xs">✎</span>
                    </button>
                  )}
                </div>

                {/* Ball */}
                <div className="col-span-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-violet-600 font-black text-sm">
                    <Trophy className="w-3.5 h-3.5" />
                    {student.total_score}
                  </div>
                </div>

                {/* Streak */}
                <div className="col-span-2 text-center">
                  {student.streak > 0 ? (
                    <div className="flex items-center justify-center gap-1 text-orange-500 font-bold text-sm">
                      <Flame className="w-3.5 h-3.5" />
                      {student.streak}
                    </div>
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}