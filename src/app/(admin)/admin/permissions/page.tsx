'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Shield, Crown, Loader2, Check,
  Users, Save, ChevronDown, ChevronUp
} from 'lucide-react'
import Image from 'next/image'

interface Admin {
  id: string
  full_name: string
  email: string
  role: string
  permissions: string[]
}

const ALL_PERMISSIONS = [
  { key: 'manage_quizzes', label: 'Quizlar', desc: 'Quiz yaratish, tahrirlash va o\'chirish', icon: '🏆' },
  { key: 'manage_students', label: 'Talabalar', desc: 'Talabalarni boshqarish, guruh o\'zgartirish', icon: '👥' },
  { key: 'manage_announcements', label: "E'lonlar", desc: "E'lon qo'shish va o'chirish", icon: '📢' },
  { key: 'manage_scores', label: 'Ballar', desc: 'Talabaga ball berish va olish', icon: '⭐' },
  { key: 'manage_team', label: 'Jamoa', desc: 'Jamoa sahifasini tahrirlash', icon: '🤝' },
  { key: 'view_analytics', label: 'Analitika', desc: 'Statistika va grafiklarni ko\'rish', icon: '📊' },
]

export default function PermissionsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [localPerms, setLocalPerms] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (profile?.role !== 'super_admin') {
        router.push('/admin')
        return
      }

      const { data: adminsData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, permissions')
        .in('role', ['admin', 'super_admin'])
        .order('full_name')

      const list = (adminsData ?? []) as Admin[]
      setAdmins(list)

      const permsMap: Record<string, string[]> = {}
      list.forEach(a => { permsMap[a.id] = a.permissions ?? [] })
      setLocalPerms(permsMap)

      setLoading(false)
    }
    fetchData()
  }, [router])

  const togglePerm = (adminId: string, perm: string) => {
    setLocalPerms(prev => {
      const current = prev[adminId] ?? []
      return {
        ...prev,
        [adminId]: current.includes(perm)
          ? current.filter(p => p !== perm)
          : [...current, perm],
      }
    })
  }

  const savePermissions = async (adminId: string) => {
    setSaving(adminId)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ permissions: localPerms[adminId] ?? [] })
      .eq('id', adminId)

    setAdmins(prev => prev.map(a =>
      a.id === adminId ? { ...a, permissions: localPerms[adminId] ?? [] } : a
    ))
    setSaving(null)
  }

  const selectAll = (adminId: string) => {
    setLocalPerms(prev => ({
      ...prev,
      [adminId]: ALL_PERMISSIONS.map(p => p.key),
    }))
  }

  const clearAll = (adminId: string) => {
    setLocalPerms(prev => ({ ...prev, [adminId]: [] }))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const otherAdmins = admins.filter(a => a.id !== currentUserId)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
          <span className="font-black text-base md:text-lg">Vakolatlar boshqaruvi</span>
          <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-bold ml-auto">
            <Crown className="w-3 h-3" /> Faqat Super Admin
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">

        {/* Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-yellow-800 text-sm">Vakolatlar tizimi</p>
            <p className="text-yellow-700 text-xs mt-0.5">
              Har bir adminga qaysi bo'limga kirish mumkinligini belgilang.
              Super admin barcha vakolatlarga avtomatik ega.
            </p>
          </div>
        </div>

        {/* Admins list */}
        {otherAdmins.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">Boshqa admin yo'q</p>
            <p className="text-gray-400 text-sm mt-1">Talabani admin qilib, vakolat bering</p>
          </div>
        ) : (
          otherAdmins.map(admin => {
            const perms = localPerms[admin.id] ?? []
            const isSuperAdmin = admin.role === 'super_admin'
            const isExpanded = expanded === admin.id
            const hasChanges = JSON.stringify(perms.sort()) !== JSON.stringify((admin.permissions ?? []).sort())

            return (
              <div key={admin.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                {/* Admin header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isExpanded ? null : admin.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                    isSuperAdmin ? 'bg-yellow-100 text-yellow-700' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {admin.full_name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-sm text-gray-900">{admin.full_name}</p>
                      {isSuperAdmin && (
                        <span className="flex items-center gap-0.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">
                          <Crown className="w-2.5 h-2.5" /> Super Admin
                        </span>
                      )}
                      {hasChanges && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">
                          Saqllanmagan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{admin.email}</p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!isSuperAdmin && (
                      <span className="text-xs text-gray-400 hidden md:block">
                        {perms.length}/{ALL_PERMISSIONS.length} vakolat
                      </span>
                    )}
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </div>

                {/* Permissions panel */}
                {isExpanded && (
                  <div className="border-t border-gray-50 px-5 py-5">
                    {isSuperAdmin ? (
                      <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 rounded-xl px-4 py-3">
                        <Crown className="w-4 h-4" />
                        <p className="text-sm font-semibold">Super admin barcha vakolatlarga ega</p>
                      </div>
                    ) : (
                      <>
                        {/* Quick actions */}
                        <div className="flex items-center gap-2 mb-4">
                          <button
                            onClick={() => selectAll(admin.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition"
                          >
                            Hammasini tanlash
                          </button>
                          <button
                            onClick={() => clearAll(admin.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                          >
                            Tozalash
                          </button>
                        </div>

                        {/* Permissions grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-5">
                          {ALL_PERMISSIONS.map(perm => {
                            const isActive = perms.includes(perm.key)
                            return (
                              <button
                                key={perm.key}
                                onClick={() => togglePerm(admin.id, perm.key)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition ${
                                  isActive
                                    ? 'border-violet-400 bg-violet-50'
                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                }`}
                              >
                                <span className="text-xl flex-shrink-0">{perm.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm ${isActive ? 'text-violet-700' : 'text-gray-700'}`}>
                                    {perm.label}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">{perm.desc}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isActive ? 'bg-violet-600' : 'bg-gray-200'
                                }`}>
                                  {isActive && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </button>
                            )
                          })}
                        </div>

                        {/* Save button */}
                        <button
                          onClick={() => savePermissions(admin.id)}
                          disabled={saving === admin.id || !hasChanges}
                          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition"
                        >
                          {saving === admin.id ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</>
                          ) : (
                            <><Save className="w-4 h-4" /> Saqlash</>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}