'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Pencil, Trash2, Plus, X, Check, Sparkles } from 'lucide-react'
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

const INITIAL_TEAM: TeamMember[] = [
  { id: '1', name: 'Komronbek Saparaliyev', role: 'Intellektual loyihalar koordinatori', image: '', type: 'leader', order: 0 },
  { id: '2', name: 'Bexruz Ravufov', role: 'Raqamli iqtisodiyot va innovatsiyalar fakultetiti bosh koordinatori', image: '', type: 'leader', order: 1 },
  { id: '3', name: 'Dilshoda Karimova', role: 'SMM Mutaxassisi', image: '', type: 'member', order: 0 },
  { id: '4', name: 'Azizbek Yusupov', role: 'Texnik mutaxassis', image: '', type: 'member', order: 1 },
  { id: '5', name: 'Farida Ismailova', role: 'Kontent menejer', image: '', type: 'member', order: 2 },
  { id: '6', name: 'Abdurahmon Malikov', role: 'Telegram Admin', image: '', type: 'member', order: 3 },
]

function Avatar({ name, image, size = 'md' }: { name: string; image: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-16 h-16 text-xl', md: 'w-20 h-20 text-2xl', lg: 'w-28 h-28 md:w-36 md:h-36 text-4xl md:text-5xl' }
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={`${sizes[size]} rounded-full flex-shrink-0 overflow-hidden`}>
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center font-black text-white">
          {initials}
        </div>
      )}
    </div>
  )
}

export default function TeamPage() {
  const router = useRouter()
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [form, setForm] = useState({ name: '', role: '', image: '', type: 'member' as 'leader' | 'member' })

  // Real admin tekshiruvi
  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsAdmin(data?.role === 'admin')
    }
    checkAdmin()
  }, [])

  const leaders = team.filter(m => m.type === 'leader').sort((a, b) => a.order - b.order)
  const members = team.filter(m => m.type === 'member').sort((a, b) => a.order - b.order)

  const handleDelete = (id: string) => {
    if (confirm("O'chirishni tasdiqlaysizmi?")) {
      setTeam(prev => prev.filter(m => m.id !== id))
    }
  }

  const handleSave = () => {
    if (!form.name || !form.role) return
    if (editingMember) {
      setTeam(prev => prev.map(m => m.id === editingMember.id ? { ...m, ...form } : m))
    } else {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        ...form,
        order: team.filter(m => m.type === form.type).length,
      }
      setTeam(prev => [...prev, newMember])
    }
    setShowAddModal(false)
    setEditingMember(null)
    setForm({ name: '', role: '', image: '', type: 'member' })
  }

  const openEdit = (member: TeamMember) => {
    setEditingMember(member)
    setForm({ name: member.name, role: member.role, image: member.image, type: member.type })
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingMember(null)
    setForm({ name: '', role: '', image: '', type: 'member' })
  }

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
              {editMode ? <><Check className="w-3.5 h-3.5" /> Tayyor</> : <><Pencil className="w-3.5 h-3.5" /> Tahrirlash</>}
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

        {/* Leaders hero section */}
        <div className="relative rounded-3xl overflow-hidden mb-12 md:mb-16">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800" />
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-30"
                style={{ top: `${(i * 17 + 5) % 100}%`, left: `${(i * 23 + 10) % 100}%` }}
              />
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
                          <button onClick={() => openEdit(leader)} className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-violet-50 transition">
                            <Pencil className="w-3 h-3 text-violet-600" />
                          </button>
                          <button onClick={() => handleDelete(leader.id)} className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition">
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      )}
                      <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                        {leader.image ? (
                          <img src={leader.image} alt={leader.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm flex items-center justify-center font-black text-white text-4xl">
                            {leader.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/70 text-xs font-semibold px-3 py-1 rounded-full mb-2 border border-white/10">
                      {i === 0 ? '✦ Bosh koordinator' : '◈ Loyihalar koordinatori'}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white">{leader.name}</h3>
                    <p className="text-violet-200 text-sm mt-0.5">{leader.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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
              onClick={() => { setForm({ name: '', role: '', image: '', type: 'member' }); setEditingMember(null); setShowAddModal(true) }}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-violet-200"
            >
              <Plus className="w-4 h-4" />
              Qo'shish
            </button>
          )}
        </div>

        {/* Members grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {members.map(member => (
            <div
              key={member.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-violet-200 hover:-translate-y-1 transition-all duration-200 group relative"
            >
              {editMode && (
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(member)} className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center hover:bg-violet-100 transition">
                    <Pencil className="w-3 h-3 text-violet-600" />
                  </button>
                  <button onClick={() => handleDelete(member.id)} className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition">
                    <Trash2 className="w-3 h-3 text-red-500" />
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

          {/* Add card in edit mode */}
          {editMode && (
            <button
              onClick={() => { setForm({ name: '', role: '', image: '', type: 'member' }); setEditingMember(null); setShowAddModal(true) }}
              className="bg-violet-50 border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all hover:bg-violet-100 min-h-[140px]"
            >
              <div className="w-10 h-10 bg-violet-200 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-xs font-bold text-violet-500">Qo'shish</span>
            </button>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg">
                {editingMember ? 'Tahrirlash' : "Yangi a'zo qo'shish"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Ism *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="To'liq ism"
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
                  placeholder="https://..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Turi</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['leader', 'member'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(p => ({ ...p, type: t }))}
                      className={`py-2 rounded-xl text-xs font-bold border-2 transition ${
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

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition"
                >
                  Bekor
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || !form.role}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-black text-sm transition"
                >
                  {editingMember ? 'Saqlash' : "Qo'shish"}
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