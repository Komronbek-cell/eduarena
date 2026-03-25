'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Users, Search, Trophy, Flame, Loader2,
  ChevronDown, Shield, ShieldOff, Plus, Minus,
  UserX, UserCheck, Crown, MoreVertical, X
} from 'lucide-react'

interface Student {
  id: string
  full_name: string
  email: string
  total_score: number
  streak: number
  role: string
  is_blocked: boolean
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
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [scoreModal, setScoreModal] = useState<{ student: Student; type: 'add' | 'remove' } | null>(null)
  const [scoreAmount, setScoreAmount] = useState('')
  const [scoreReason, setScoreReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'admin'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [{ data: studentsData }, { data: groupsData }] = await Promise.all([
      supabase.from('profiles').select('*, groups(id, name, description)').order('total_score', { ascending: false }),
      supabase.from('groups').select('*').order('name'),
    ])

    setStudents((studentsData as any) ?? [])
    setGroups(groupsData ?? [])
    setLoading(false)
  }

  const updateGroup = async (studentId: string, groupId: string) => {
    const supabase = createClient()
    await supabase.from('profiles').update({ group_id: groupId || null }).eq('id', studentId)
    const group = groups.find(g => g.id === groupId) ?? null
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, group_id: groupId, groups: group } : s))
    setEditingId(null)
  }

  const toggleBlock = async (student: Student) => {
    const supabase = createClient()
    const newBlocked = !student.is_blocked
    await supabase.from('profiles').update({ is_blocked: newBlocked }).eq('id', student.id)
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_blocked: newBlocked } : s))
    setActionMenuId(null)
  }

  const toggleAdmin = async (student: Student) => {
    if (!confirm(student.role === 'admin'
      ? `${student.full_name}ni oddiy talabaga o'tkazishni tasdiqlaysizmi?`
      : `${student.full_name}ni admin qilishni tasdiqlaysizmi?`
    )) return

    const supabase = createClient()
    const newRole = student.role === 'admin' ? 'student' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', student.id)
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, role: newRole } : s))
    setActionMenuId(null)
  }

  const handleScoreChange = async () => {
    if (!scoreModal || !scoreAmount) return
    const amount = parseInt(scoreAmount)
    if (isNaN(amount) || amount <= 0) { alert('To\'g\'ri son kiriting'); return }

    setSaving(true)
    const supabase = createClient()
    const finalAmount = scoreModal.type === 'add' ? amount : -amount
    const newScore = Math.max(0, scoreModal.student.total_score + finalAmount)

    await supabase.from('profiles').update({ total_score: newScore }).eq('id', scoreModal.student.id)
    setStudents(prev => prev.map(s => s.id === scoreModal.student.id ? { ...s, total_score: newScore } : s))

    setScoreModal(null)
    setScoreAmount('')
    setScoreReason('')
    setSaving(false)
  }

  const filtered = students.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.groups?.name.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || s.role === filterRole
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'blocked' && s.is_blocked) ||
      (filterStatus === 'active' && !s.is_blocked)
    return matchSearch && matchRole && matchStatus
  })

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const adminCount = students.filter(s => s.role === 'admin').length
  const blockedCount = students.filter(s => s.is_blocked).length
  const studentCount = students.filter(s => s.role === 'student').length

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Users className="w-5 h-5 text-violet-600" />
            <span className="font-black text-base md:text-lg">Foydalanuvchilar</span>
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
              {students.length} ta
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xl md:text-2xl font-black text-violet-600">{studentCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Talabalar</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xl md:text-2xl font-black text-orange-500">{adminCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Adminlar</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xl md:text-2xl font-black text-red-500">{blockedCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Bloklangan</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ism, email yoki guruh bo'yicha qidiring..."
            className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="flex gap-1.5">
            {[
              { key: 'all', label: 'Barchasi' },
              { key: 'student', label: 'Talabalar' },
              { key: 'admin', label: 'Adminlar' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterRole(f.key as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                  filterRole === f.key ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 ml-auto">
            {[
              { key: 'all', label: 'Hammasi' },
              { key: 'active', label: 'Faol' },
              { key: 'blocked', label: 'Bloklangan' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                  filterStatus === f.key ? 'bg-red-500 text-white' : 'bg-white border border-gray-200 text-gray-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Foydalanuvchi</div>
            <div className="col-span-3">Guruh</div>
            <div className="col-span-2 text-center">Ball</div>
            <div className="col-span-2 text-right">Amallar</div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">Foydalanuvchi topilmadi</p>
            </div>
          ) : (
            filtered.map((student, index) => (
              <div
                key={student.id}
                className={`px-4 md:px-6 py-4 border-b border-gray-50 last:border-0 transition ${
                  student.is_blocked ? 'bg-red-50/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 md:grid md:grid-cols-12 md:gap-4">
                  {/* Rank */}
                  <div className="hidden md:flex col-span-1 items-center">
                    {index === 0 ? <span className="text-lg">🥇</span>
                      : index === 1 ? <span className="text-lg">🥈</span>
                      : index === 2 ? <span className="text-lg">🥉</span>
                      : <span className="text-gray-400 text-sm font-mono">#{index + 1}</span>}
                  </div>

                  {/* User info */}
                  <div className="col-span-4 flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm ${
                        student.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-violet-100 text-violet-700'
                      }`}>
                        {student.full_name.charAt(0)}
                      </div>
                      {student.is_blocked && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm text-gray-900 truncate">{student.full_name}</p>
                        {student.role === 'admin' && (
                          <span className="flex items-center gap-0.5 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                            <Crown className="w-2.5 h-2.5" /> Admin
                          </span>
                        )}
                        {student.is_blocked && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                            Bloklangan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{student.email}</p>
                    </div>
                  </div>

                  {/* Group */}
                  <div className="hidden md:flex col-span-3 items-center">
                    {editingId === student.id ? (
                      <div className="relative w-full">
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
                        <span className={`px-2 py-1 rounded-lg font-semibold ${
                          student.groups ? 'bg-violet-50 text-violet-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {student.groups?.name ?? 'Guruhsiz'}
                        </span>
                        <span className="text-gray-300 group-hover:text-violet-400 text-xs">✎</span>
                      </button>
                    )}
                  </div>

                  {/* Score */}
                  <div className="hidden md:flex col-span-2 items-center justify-center">
                    <div className="flex items-center gap-1 text-violet-600 font-black text-sm">
                      <Trophy className="w-3.5 h-3.5" />
                      {student.total_score}
                    </div>
                  </div>

                  {/* Mobile score */}
                  <div className="md:hidden flex items-center gap-1 text-violet-600 font-black text-sm ml-auto">
                    <Trophy className="w-3.5 h-3.5" />
                    {student.total_score}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2 relative">
                    {/* Quick score buttons */}
                    <button
                      onClick={() => { setScoreModal({ student, type: 'add' }); setScoreAmount(''); }}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-bold transition"
                      title="Ball qo'shish"
                    >
                      <Plus className="w-3 h-3" />
                      <span className="hidden md:block">Ball</span>
                    </button>
                    <button
                      onClick={() => { setScoreModal({ student, type: 'remove' }); setScoreAmount(''); }}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-bold transition"
                      title="Ball olish"
                    >
                      <Minus className="w-3 h-3" />
                      <span className="hidden md:block">Ball</span>
                    </button>

                    {/* More menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === student.id ? null : student.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {actionMenuId === student.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-20 min-w-[160px] overflow-hidden">
                          <button
                            onClick={() => toggleAdmin(student)}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-gray-50 transition text-left"
                          >
                            {student.role === 'admin' ? (
                              <><ShieldOff className="w-4 h-4 text-gray-400" /> Adminlikni olish</>
                            ) : (
                              <><Shield className="w-4 h-4 text-orange-500" /> Admin tayinlash</>
                            )}
                          </button>
                          <div className="border-t border-gray-50" />
                          <button
                            onClick={() => toggleBlock(student)}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-gray-50 transition text-left"
                          >
                            {student.is_blocked ? (
                              <><UserCheck className="w-4 h-4 text-green-500" /> Blokdan chiqarish</>
                            ) : (
                              <><UserX className="w-4 h-4 text-red-500" /> Bloklash</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Score modal */}
      {scoreModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setScoreModal(null) }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg">
                {scoreModal.type === 'add' ? '➕ Ball qo\'shish' : '➖ Ball olish'}
              </h3>
              <button onClick={() => setScoreModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-sm">
                {scoreModal.student.full_name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm">{scoreModal.student.full_name}</p>
                <p className="text-xs text-gray-400">Hozirgi ball: {scoreModal.student.total_score}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                  {scoreModal.type === 'add' ? 'Qo\'shiladi' : 'Olinadi'} (ball)
                </label>
                <input
                  type="number"
                  value={scoreAmount}
                  onChange={e => setScoreAmount(e.target.value)}
                  placeholder="Masalan: 50"
                  min={1}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 transition"
                  autoFocus
                />
              </div>

              {scoreAmount && (
                <div className={`text-sm font-semibold rounded-xl px-4 py-3 ${
                  scoreModal.type === 'add'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}>
                  Yangi ball: {Math.max(0, scoreModal.student.total_score + (scoreModal.type === 'add' ? parseInt(scoreAmount) || 0 : -(parseInt(scoreAmount) || 0)))}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setScoreModal(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition"
                >
                  Bekor
                </button>
                <button
                  onClick={handleScoreChange}
                  disabled={saving || !scoreAmount}
                  className={`flex-1 py-3 rounded-xl text-white font-black text-sm transition ${
                    scoreModal.type === 'add'
                      ? 'bg-green-500 hover:bg-green-600 disabled:opacity-50'
                      : 'bg-red-500 hover:bg-red-600 disabled:opacity-50'
                  }`}
                >
                  {saving ? 'Saqlanmoqda...' : scoreModal.type === 'add' ? 'Qo\'shish' : 'Olish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close action menu on outside click */}
      {actionMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
      )}
    </div>
  )
}