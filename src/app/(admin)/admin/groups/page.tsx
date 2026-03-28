'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Users, Search, Loader2, ChevronRight, Plus } from 'lucide-react'
import Image from 'next/image'

interface Group {
  id: string
  name: string
  description: string
  created_at: string
  studentCount?: number
}

export default function AdminGroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: groupsData }, { data: students }] = await Promise.all([
        supabase.from('groups').select('*').order('name'),
        supabase.from('profiles').select('group_id').eq('role', 'student'),
      ])

      const countMap: Record<string, number> = {}
      students?.forEach(s => {
        if (s.group_id) countMap[s.group_id] = (countMap[s.group_id] ?? 0) + 1
      })

      setGroups((groupsData ?? []).map(g => ({ ...g, studentCount: countMap[g.id] ?? 0 })))
      setLoading(false)
    }
    fetchData()
  }, [router])

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
            <span className="font-black text-base md:text-lg">Guruhlar</span>
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
              {groups.length} ta
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-black text-violet-600">{groups.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Jami guruhlar</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-black text-green-600">
              {groups.reduce((s, g) => s + (g.studentCount ?? 0), 0)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Jami talabalar</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center col-span-2 md:col-span-1">
            <p className="text-2xl font-black text-orange-500">
              {groups.filter(g => (g.studentCount ?? 0) === 0).length}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Bo'sh guruhlar</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Guruh nomi yoki yo'nalish bo'yicha qidiring..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition shadow-sm"
          />
        </div>

        {/* Groups list */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 md:px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-black text-sm md:text-base">Barcha guruhlar</h2>
            <span className="text-xs text-gray-400">{filtered.length} ta</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Guruh topilmadi</p>
            </div>
          ) : (
            filtered.map((group, index) => (
              <div
                key={group.id}
                onClick={() => router.push(`/admin/students?group=${group.id}`)}
                className="flex items-center gap-4 px-4 md:px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="w-10 h-10 bg-violet-100 text-violet-700 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">
                  {group.name.split('-')[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-gray-900">{group.name}</p>
                  <p className="text-xs text-gray-400 truncate">{group.description}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    {group.studentCount ?? 0}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}