'use client'

import BottomNav from '@/components/layout/BottomNav'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Camera, Loader2, Save, User,
  Calendar, Users, Trophy, Flame, Target, ChevronDown
} from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  total_score: number
  streak: number
  group_id: string | null
  groups: { id: string; name: string; description: string } | null
  birth_date?: string | null
}

interface Group {
  id: string
  name: string
  description: string
}

const COURSES = ['1-kurs', '2-kurs', '3-kurs', '4-kurs']
const COURSE_YEAR_MAP: Record<string, string> = {
  '1-kurs': '25',
  '2-kurs': '24',
  '3-kurs': '23',
  '4-kurs': '22',
}

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState(false)

  // Edit fields
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: profileData }, { data: groupsData }] = await Promise.all([
        supabase.from('profiles').select('*, groups(id, name, description)').eq('id', user.id).single(),
        supabase.from('groups').select('*').order('name'),
      ])

      if (profileData) {
        setProfile(profileData as any)
        setFullName(profileData.full_name ?? '')
        setBirthDate(profileData.birth_date ?? '')
        setSelectedGroupId(profileData.group_id ?? '')

        // Kursni aniqlash
        if (profileData.group_id && groupsData) {
          const group = groupsData.find((g: Group) => g.id === profileData.group_id)
          if (group) {
            const year = group.name.split('-')[1]
            const course = Object.entries(COURSE_YEAR_MAP).find(([, y]) => y === year)?.[0] ?? ''
            setSelectedCourse(course)
          }
        }
      }

      setGroups(groupsData ?? [])
      setLoading(false)
    }
    fetchData()
  }, [router])

  useEffect(() => {
    if (!selectedCourse) { setFilteredGroups([]); return }
    const year = COURSE_YEAR_MAP[selectedCourse]
    setFilteredGroups(groups.filter(g => g.name.endsWith(`-${year}`)))
  }, [selectedCourse, groups])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setUploadingAvatar(true)
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
    }

    setUploadingAvatar(false)
  }

  const handleSave = async () => {
    if (!profile || !fullName) return
    setSaving(true)
    const supabase = createClient()

    await supabase.from('profiles').update({
      full_name: fullName,
      birth_date: birthDate || null,
      group_id: selectedGroupId || null,
    }).eq('id', profile.id)

    const updatedGroup = groups.find(g => g.id === selectedGroupId) ?? null
    setProfile(prev => prev ? {
      ...prev,
      full_name: fullName,
      birth_date: birthDate || null,
      group_id: selectedGroupId || null,
      groups: updatedGroup,
    } : null)

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition placeholder:text-gray-400"

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const avatarSrc = avatarPreview ?? profile?.avatar_url

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-black text-lg">Profil</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm shadow-violet-200 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6 pb-24 md:pb-0">

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Ma'lumotlar muvaffaqiyatli saqlandi!
          </div>
        )}

        {/* Avatar */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-black text-lg mb-5">Profil rasmi</h2>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-violet-100 flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-violet-600">
                    {profile?.full_name?.charAt(0)}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center justify-center shadow-md transition"
              >
                {uploadingAvatar
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Camera className="w-3.5 h-3.5" />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-bold text-gray-900">{profile?.full_name}</p>
              <p className="text-sm text-gray-400 mt-0.5">{profile?.email}</p>
              <p className="text-xs text-gray-400 mt-3">JPG, PNG yoki WebP · Max 2MB</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-violet-600 hover:text-violet-700 font-semibold mt-1"
              >
                Rasmni o'zgartirish
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <div className="flex items-center justify-center gap-1 text-violet-600 mb-1">
              <Trophy className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-violet-600">{profile?.total_score}</p>
            <p className="text-xs text-gray-400 mt-0.5">Umumiy ball</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-orange-500">{profile?.streak}</p>
            <p className="text-xs text-gray-400 mt-0.5">Streak</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <Target className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-green-600">
              {profile?.groups?.name ?? '—'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Guruh</p>
          </div>
        </div>

        {/* Ma'lumotlarni tahrirlash */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-black text-lg">Shaxsiy ma'lumotlar</h2>

          {/* To'liq ism */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> To'liq ism
            </label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ism Familiya Sharif"
              className={inputClass}
            />
          </div>

          {/* Tug'ilgan kun */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Tug'ilgan kun (ixtiyoriy)
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Email (o'qilmaydigan) */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
            <input
              value={profile?.email ?? ''}
              disabled
              className="w-full bg-gray-100 border border-gray-200 text-gray-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email o'zgartirib bo'lmaydi</p>
          </div>
        </div>

        {/* Guruh tanlash */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-black text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" />
            Guruh ma'lumotlari
          </h2>

          {/* Kurs */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Kurs</label>
            <div className="grid grid-cols-4 gap-2">
              {COURSES.map(course => (
                <button
                  key={course}
                  type="button"
                  onClick={() => { setSelectedCourse(course); setSelectedGroupId('') }}
                  className={`py-2.5 rounded-xl text-sm font-bold transition border-2 ${
                    selectedCourse === course
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {course}
                </button>
              ))}
            </div>
          </div>

          {/* Guruh */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Guruh</label>
            {!selectedCourse ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400">
                Avval kursni tanlang
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className={inputClass + ' appearance-none pr-10'}
                >
                  <option value="">Guruhni tanlang</option>
                  {filteredGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} — {group.description}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            )}
          </div>

          {profile?.groups && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm">
              <span className="text-gray-500">Hozirgi guruh: </span>
              <span className="font-bold text-violet-700">{profile.groups.name}</span>
              <span className="text-gray-400"> — {profile.groups.description}</span>
            </div>
          )}
        </div>

        {/* Save button bottom */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-100"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
        </button>
      </main>
       <BottomNav />
    </div>
  )
}