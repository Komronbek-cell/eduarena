'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Pencil, Trash2, Plus, X, Check, Sparkles, Loader2, Save } from 'lucide-react'
import Image from 'next/image'
import BottomNav from '@/components/layout/BottomNav'

interface TeamMember {
  id: string
  name: string
  role: string
  image: string
  type: 'leader' | 'member'
  order: number
}

const EMPTY_FORM = { name: '', role: '', image: '', type: 'member' as 'leader' | 'member' }

export default function TeamPage() {
  const router = useRouter()
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('role, permissions').eq('id', user.id).single()
        const isSuperAdmin = profile?.role === 'super_admin'
        const hasPermission = isSuperAdmin || (profile?.permissions ?? []).includes('manage_team')
        setIsAdmin(hasPermission)
      }

      const { data } = await supabase
        .from('team_members')
        .select('*')
        .order('type', { ascending: false })
        .order('order', { ascending: true })

      setTeam((data as TeamMember[]) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const openAdd = (type: 'leader' | 'member' = 'member') => {
    setEditingMember(null)
    setForm({ ...EMPTY_FORM, type })
    setShowModal(true)
  }

  const openEdit = (member: TeamMember) => {
    setEditingMember(member)
    setForm({ name: member.name, role: member.role, image: member.image, type: member.type })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingMember(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.role.trim()) return
    setSaving(true)
    const supabase = createClient()

    if (editingMember) {
      const { data } = await supabase
        .from('team_members')
        .update({ name: form.name, role: form.role, image: form.image, type: form.type })
        .eq('id', editingMember.id)
        .select().single()

      if (data) setTeam(prev => prev.map(m => m.id === editingMember.id ? data as TeamMember : m))
    } else {
      const orderNum = team.filter(m => m.type === form.type).length
      const { data } = await supabase
        .from('team_members')
        .insert({ name: form.name, role: form.role, image: form.image, type: form.type, order: orderNum })
        .select().single()

      if (data) setTeam(prev => [...prev, data as TeamMember])
    }

    setSaving(false)
    closeModal()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('team_members').delete().eq('id', id)
    setTeam(prev => prev.filter(m => m.id !== id))
    setDeletingId(null)
  }

  const leaders = team.filter(m => m.type === 'leader').sort((a, b) => a.order - b.order)
  const members = team.filter(m => m.type === 'member').sort((a, b) => a.order - b.order)

  if (loading) return (
    <div className="min-h-screen bg-[#f7f6ff] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
          <Image src="/logo.png" alt="GULDU" width={64} height={64} className="object-cover" />
        </div>
        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f6ff] text-gray-900 pb-24 md:pb-0">

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-violet-100 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
            <span className="font-black text-base md:text-lg">Jamoa</span>
          </div>
          {isAdmin && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition ${
                editMode
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
              }`}
            >
              {editMode
                ? <><Check className="w-3.5 h-3.5" /> Tayyor</>
                : <><Pencil className="w-3.5 h-3.5" /> Tahrirlash</>
              }
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">

        {/* Page title */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            EduArena Team
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 mb-3">
            Asoschilar & Jamoa
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
            EduArena platformasini rivojlantiruvchi jamoamiz bilan tanishing
          </p>
        </div>

        {/* Leaders hero */}
        {leaders.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden mb-12 md:mb-16">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl" />
              {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute w-1 h-1 bg-white rounded-full opacity-20"
                  style={{ top: `${(i * 17 + 5) % 100}%`, left: `${(i * 23 + 10) % 100}%` }} />
              ))}
            </div>

            <div className="relative px-6 py-10 md:py-16">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                {leaders.map((leader, i) => (
                  <div key={leader.id} className="flex flex-col items-center gap-4 group">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-violet-400/40 blur-xl scale-110" />
                      <div className="relative">
                        {editMode && (
                          <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                            <button onClick={() => openEdit(leader)}
                              className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-violet-50 transition">
                              <Pencil className="w-3 h-3 text-violet-600" />
                            </button>
                            <button onClick={() => handleDelete(leader.id)}
                              className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition">
                              {deletingId === leader.id
                                ? <Loader2 className="w-3 h-3 text-red-500 animate-spin" />
                                : <Trash2 className="w-3 h-3 text-red-500" />
                              }
                            </button>
                          </div>
                        )}
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                          {leader.image ? (
                            <img src={leader.image} alt={leader.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center font-black text-white text-4xl">
                              {leader.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="inline-flex items-center gap-1.5 bg-white/10 text-white/70 text-xs font-semibold px-3 py-1 rounded-full mb-2 border border-white/10">
                        {i === 0 ? '✦ Bosh koordinator' : '◈ Loyihalar koordinatori'}
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-white">{leader.name}</h3>
                      <p className="text-violet-200 text-sm mt-0.5">{leader.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add leader button in edit mode */}
              {editMode && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => openAdd('leader')}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition border border-white/20"
                  >
                    <Plus className="w-4 h-4" /> Rahbar qo'shish
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty leaders state */}
        {leaders.length === 0 && editMode && (
          <div className="rounded-3xl border-2 border-dashed border-violet-200 p-12 text-center mb-12 bg-violet-50/50">
            <p className="text-violet-400 font-semibold mb-4">Hali rahbar qo'shilmagan</p>
            <button onClick={() => openAdd('leader')}
              className="flex items-center gap-2 bg-violet-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition mx-auto">
              <Plus className="w-4 h-4" /> Rahbar qo'shish
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
          <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Jamoamiz</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
        </div>

        {/* Team header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900">Jamoa a'zolari</h2>
            <p className="text-gray-400 text-sm mt-0.5">{members.length} ta a'zo</p>
          </div>
          {editMode && (
            <button
              onClick={() => openAdd('member')}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-violet-200"
            >
              <Plus className="w-4 h-4" /> Qo'shish
            </button>
          )}
        </div>

        {/* Members grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {members.map(member => (
            <div key={member.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-violet-200 hover:-translate-y-1 transition-all duration-200 group relative">
              {editMode && (
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(member)}
                    className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center hover:bg-violet-100 transition">
                    <Pencil className="w-3 h-3 text-violet-600" />
                  </button>
                  <button onClick={() => handleDelete(member.id)}
                    className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition">
                    {deletingId === member.id
                      ? <Loader2 className="w-3 h-3 text-red-500 animate-spin" />
                      : <Trash2 className="w-3 h-3 text-red-500" />
                    }
                  </button>
                </div>
              )}

              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-violet-100 group-hover:border-violet-300 transition-colors shadow-md">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center font-black text-violet-600 text-lg">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-black text-sm text-gray-900 leading-tight">{member.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{member.role}</p>
                </div>
              </div>
            </div>
          ))}

          {editMode && (
            <button
              onClick={() => openAdd('member')}
              className="bg-violet-50 border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all hover:bg-violet-100 min-h-[140px]"
            >
              <div className="w-10 h-10 bg-violet-200 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-xs font-bold text-violet-500">Qo'shish</span>
            </button>
          )}
        </div>

        {members.length === 0 && !editMode && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">Jamoa a'zolari hali qo'shilmagan</p>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg">
                {editingMember ? 'Tahrirlash' : "Yangi a'zo"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Ism Familiya *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Masalan: Dilshoda Karimova"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Lavozim *</label>
                <input
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  placeholder="Masalan: SMM Mutaxassisi"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Rasm URL (ixtiyoriy)</label>
                <input
                  value={form.image}
                  onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition"
                />
                {form.image && (
                  <div className="mt-2 flex justify-center">
                    <img src={form.image} alt="preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-violet-200"
                      onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Turi</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['leader', 'member'] as const).map(t => (
                    <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                      className={`py-2.5 rounded-xl text-xs font-bold border-2 transition ${
                        form.type === t
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-100 bg-gray-50 text-gray-500'
                      }`}
                    >
                      {t === 'leader' ? "👑 Rahbar" : "👤 A'zo"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition">
                  Bekor
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name.trim() || !form.role.trim() || saving}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-black text-sm transition flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</>
                    : <><Save className="w-4 h-4" /> {editingMember ? 'Saqlash' : "Qo'shish"}</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}