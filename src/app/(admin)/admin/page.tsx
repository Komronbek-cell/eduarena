'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Trophy, Users, BookOpen, TrendingUp, LogOut,
  Loader2, PlusCircle, BarChart2, Bell, Crown,
  Shield, Upload, Star
} from 'lucide-react'
import Image from 'next/image'

interface AdminProfile {
  id: string
  full_name: string
  email: string
  role: string
  permissions: string[]
}

export default function AdminPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGroups: 0,
    totalQuizzes: 0,
    totalAttempts: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, permissions')
        .eq('id', user.id)
        .single()

      const role = profileData?.role
      if (role !== 'admin' && role !== 'super_admin') {
        router.push('/dashboard')
        return
      }
    if (!profileData) { router.push('/dashboard'); return }
      setProfile({
  id: profileData.id ?? '',
  full_name: profileData.full_name ?? '',
  email: profileData.email ?? '',
  role: profileData.role ?? '',
  permissions: profileData.permissions ?? [],
})

      const [students, groups, quizzes, attempts] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('groups').select('id', { count: 'exact' }),
        supabase.from('quizzes').select('id', { count: 'exact' }),
        supabase.from('quiz_attempts').select('id', { count: 'exact' }),
      ])

      setStats({
        totalStudents: students.count ?? 0,
        totalGroups: groups.count ?? 0,
        totalQuizzes: quizzes.count ?? 0,
        totalAttempts: attempts.count ?? 0,
      })
      setLoading(false)
    }
    fetchData()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
          <Image src="/logo.png" alt="GULDU" width={64} height={64} className="object-cover" />
        </div>
        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
      </div>
    </div>
  )

  const isSuperAdmin = profile?.role === 'super_admin'
  const perms = profile?.permissions ?? []
  const can = (permission: string) => isSuperAdmin || perms.includes(permission)

  const actions = [
    {
      label: 'Quizlar',
      desc: 'Quiz va savollarni boshqarish',
      icon: <Trophy className="w-5 h-5 text-violet-600" />,
      bg: 'bg-violet-50 group-hover:bg-violet-100',
      href: '/admin/quizzes',
      permission: 'manage_quizzes',
    },
    {
      label: 'Talabalar',
      desc: "Talabalar ro'yxati va reytingi",
      icon: <Users className="w-5 h-5 text-green-600" />,
      bg: 'bg-green-50 group-hover:bg-green-100',
      href: '/admin/students',
      permission: 'manage_students',
    },
    {
      label: 'Guruhlar',
      desc: 'Guruhlarni boshqarish',
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50 group-hover:bg-blue-100',
      href: '/admin/groups',
      permission: 'manage_students',
    },
    {
      label: "E'lonlar",
      desc: "E'lonlarni boshqarish",
      icon: <Bell className="w-5 h-5 text-orange-500" />,
      bg: 'bg-orange-50 group-hover:bg-orange-100',
      href: '/admin/announcements',
      permission: 'manage_announcements',
    },
    {
      label: 'Analitika',
      desc: 'Statistika va grafiklar',
      icon: <BarChart2 className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50 group-hover:bg-purple-100',
      href: '/admin/analytics',
      permission: 'view_analytics',
    },
    ...(isSuperAdmin ? [{
      label: 'Vakolatlar',
      desc: "Adminlar vakolatlarini boshqarish",
      icon: <Shield className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50 group-hover:bg-rose-100',
      href: '/admin/permissions',
      permission: 'super_admin',
    }] : []),
  ]

  const allowedActions = actions.filter(a => can(a.permission))

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="GULDU" width={32} height={32} className="rounded-lg object-cover" />
            <span className="font-black text-lg tracking-tight">EduArena</span>
            {isSuperAdmin ? (
              <span className="flex items-center gap-1 ml-1 text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-bold">
                <Crown className="w-3 h-3" /> Super Admin
              </span>
            ) : (
              <span className="ml-1 text-xs bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 px-3 py-2 rounded-lg hover:bg-violet-50 transition"
            >
              <Star className="w-3.5 h-3.5" /> Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:block">Chiqish</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Welcome */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl md:text-2xl font-black">Boshqaruv paneli</h1>
              <p className="text-gray-400 mt-1 text-sm">
                Xush kelibsiz, {profile?.full_name?.split(' ')[0]}!
                {isSuperAdmin && (
                  <span className="ml-1.5 text-yellow-600 font-semibold">👑 Barcha vakolatlarga egasiz</span>
                )}
              </p>
            </div>

            {/* Vakolatlar badge — oddiy admin uchun */}
            {!isSuperAdmin && (
              <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
                <p className="text-xs font-bold text-violet-500 mb-1.5">Sizning vakolatlaringiz:</p>
                <div className="flex flex-wrap gap-1">
                  {perms.length === 0 ? (
                    <span className="text-xs text-gray-400">Hali vakolat berilmagan</span>
                  ) : perms.map(p => (
                    <span key={p} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
                      {p.replace('manage_', '').replace('view_', '👁 ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { icon: <Users className="w-5 h-5" />, color: 'text-violet-600 bg-violet-50', label: 'Talabalar', value: stats.totalStudents },
            { icon: <BookOpen className="w-5 h-5" />, color: 'text-green-600 bg-green-50', label: 'Guruhlar', value: stats.totalGroups },
            { icon: <Trophy className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-50', label: 'Quizlar', value: stats.totalQuizzes },
            { icon: <BarChart2 className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50', label: 'Urinishlar', value: stats.totalAttempts },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-xl md:text-2xl font-black">{s.value}</p>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions grid */}
        {allowedActions.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
            <Shield className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">Hali vakolat berilmagan</p>
            <p className="text-gray-400 text-sm mt-1">Super admin siz uchun vakolatlar belgilaydi</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-5">
            {allowedActions.map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.href)}
                className="bg-white border border-gray-100 hover:border-violet-200 hover:shadow-md rounded-2xl p-4 md:p-6 text-left transition group shadow-sm"
              >
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition ${action.bg}`}>
                  {action.icon}
                </div>
                <h3 className="font-black text-sm md:text-base mb-0.5">{action.label}</h3>
                <p className="text-gray-400 text-xs md:text-sm">{action.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* CTA — faqat quiz yarata oladiganlar uchun */}
        {can('manage_quizzes') && (
          <div className="bg-violet-600 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-base md:text-lg mb-1">Yangi quiz yarating</h3>
              <p className="text-violet-200 text-sm">Talabalar uchun kunlik yoki haftalik quiz qo'shing</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => router.push('/admin/quizzes/import')}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-xl transition text-sm flex-1 md:flex-none justify-center"
              >
                <Upload className="w-4 h-4" /> Import
              </button>
              <button
                onClick={() => router.push('/admin/quizzes/create')}
                className="flex items-center gap-2 bg-white text-violet-700 font-bold px-5 py-2.5 rounded-xl hover:bg-violet-50 transition text-sm flex-1 md:flex-none justify-center"
              >
                <PlusCircle className="w-4 h-4" /> Yaratish
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}