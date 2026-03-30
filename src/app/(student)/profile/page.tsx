'use client'

import BottomNav from '@/components/layout/BottomNav'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Camera, Loader2, Save, User,
  Calendar, Users, Trophy, Flame, Target, ChevronDown,
  Star, Lock, AlertCircle, CheckCircle
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

const ALL_BADGES = [
  { icon: '🎯', title: 'Birinchi qadam' },
  { icon: '🔥', title: '3 kunlik streak' },
  { icon: '⚡', title: '7 kunlik streak' },
  { icon: '🏆', title: 'Top 10' },
  { icon: '👑', title: "Hafta g'olibi" },
  { icon: '🤝', title: 'Guruh fidoyisi' },
]

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetupMode = searchParams.get('setup') === '1'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [quizCount, setQuizCount] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [earnedTitles, setEarnedTitles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState(false)

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

      const [
        { data: profileData },
        { data: groupsData },
        { data: attemptsData },
        { data: achievementsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*, groups(id, name, description)').eq('id', user.id).single(),
        supabase.from('groups').select('*').order('name'),
        supabase.from('quiz_attempts').select('correct_answers, total_questions').eq('user_id', user.id),
        supabase.from('student_achievements').select('achievements(title)').eq('user_id', user.id),
      ])

      if (profileData) {
        setProfile(profileData as any)
        setFullName(profileData.full_name ?? '')
        setBirthDate(profileData.birth_date ?? '')
        setSelectedGroupId(profileData.group_id ?? '')

        if (profileData.group_id && groupsData) {
          const group = groupsData.find((g: Group) => g.id === profileData.group_id)
          if (group) {
            const year = group.name.split('-')[1]
            const course = Object.entries(COURSE_YEAR_MAP).find(([, y]) => y === year)?.[0] ?? ''
            setSelectedCourse(course)
          }
        }
      }

      if (attemptsData && attemptsData.length > 0) {
        setQuizCount(attemptsData.length)
        const avg = Math.round(
          attemptsData.reduce((s, a) => s + (a.correct_answers / a.total_questions) * 100, 0) / attemptsData.length
        )
        setAccuracy(avg)
      }

      setEarnedTitles(achievementsData?.map((a: any) => a.achievements?.title).filter(Boolean) ?? [])
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

    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setUploadingAvatar(true)
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars').upload(fileName, file, { upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
    }
    setUploadingAvatar(false)
  }

  const handleSave = async () => {
    if (!profile || !fullName) return
    if (isSetupMode && !selectedGroupId) return
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
      groups: updatedGroup as any,
    } : null)

    setSaving(false)

    if (isSetupMode) {
      router.push('/dashboard')
      return
    }

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
  const canSave = !!fullName && (!isSetupMode || !!selectedGroupId)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isSetupMode && (
              <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition">
                ←
              </button>
            )}
            <span className="font-black text-lg">
              {isSetupMode ? 'Profilni sozlash' : 'Profil'}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSetupMode ? 'Davom etish' : 'Saqlash'}
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-4 pb-24 md:pb-8">

        {/* Setup banner */}
        {isSetupMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-800 text-sm">Guruhingizni tanlang</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Platformadan foydalanish uchun guruhingizni ko'rsatish majburiy. Kurs va guruhingizni tanlab, "Davom etish" tugmasini bosing.
              </p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Ma'lumotlar muvaffaqiyatli saqlandi!
          </div>
        )}

        {/* Avatar + stats */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-5 mb-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-violet-100 flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-violet-600">{profile?.full_name?.charAt(0)}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center justify-center shadow-md transition"
              >
                {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 truncate">{profile?.full_name}</p>
              <p className="text-sm text-gray-400 mt-0.5 truncate">{profile?.email}</p>
              {profile?.groups && (
                <p className="text-xs text-violet-600 font-semibold mt-1 truncate">{profile.groups.name}</p>
              )}
              <button onClick={() => fileInputRef.current?.click()} className="text-xs text-violet-500 hover:text-violet-700 font-semibold mt-1">
                Rasmni o'zgartirish
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <Trophy className="w-3.5 h-3.5" />, color: 'text-violet-600 bg-violet-50', label: 'Ball', value: profile?.total_score ?? 0 },
              { icon: <Flame className="w-3.5 h-3.5" />, color: 'text-orange-500 bg-orange-50', label: 'Streak', value: `${profile?.streak ?? 0}🔥` },
              { icon: <Target className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50', label: 'Quizlar', value: quizCount },
              { icon: <Star className="w-3.5 h-3.5" />, color: 'text-green-600 bg-green-50', label: 'Aniqlik', value: `${accuracy}%` },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1 ${s.color}`}>{s.icon}</div>
                <p className="text-sm font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shaxsiy ma'lumotlar */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-black text-base">Shaxsiy ma'lumotlar</h2>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> To'liq ism
            </label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ism Familiya Sharif"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Tug'ilgan kun (ixtiyoriy)
            </label>
            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              value={profile?.email ?? ''}
              disabled
              className="w-full bg-gray-100 border border-gray-200 text-gray-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email o'zgartirib bo'lmaydi</p>
          </div>
        </div>

        {/* Guruh tanlash */}
        <div className={`bg-white rounded-2xl p-5 shadow-sm space-y-4 ${
          isSetupMode ? 'border-2 border-amber-300' : 'border border-gray-100'
        }`}>
          <h2 className="font-black text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" />
            Guruh ma'lumotlari
            {isSetupMode && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">Majburiy</span>}
          </h2>

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

          {profile?.groups && !isSetupMode && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm">
              <span className="text-gray-500">Hozirgi guruh: </span>
              <span className="font-bold text-violet-700">{profile.groups.name}</span>
              <span className="text-gray-400"> — {profile.groups.description}</span>
            </div>
          )}
        </div>

        {/* Yutuqlar — faqat setup rejimida emas */}
        {!isSetupMode && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Yutuqlar
              </h2>
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                {earnedTitles.length}/{ALL_BADGES.length}
              </span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {ALL_BADGES.map((badge, i) => {
                const earned = earnedTitles.includes(badge.title)
                return (
                  <div key={i} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                    earned ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50'
                  }`}>
                    <span className="text-2xl">{earned ? badge.icon : <Lock className="w-5 h-5 text-gray-300" />}</span>
                    <span className={`text-xs font-semibold text-center leading-tight ${earned ? 'text-violet-700' : 'text-gray-400'}`}>
                      {badge.title}
                    </span>
                  </div>
                )
              })}
            </div>
            {earnedTitles.length === 0 && (
              <p className="text-xs text-gray-400 mt-3">Birinchi quizni yakunlang — badge oling!</p>
            )}
          </div>
        )}

        {/* Saqlash tugmasi */}
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-black py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-100"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saqlanmoqda...' : isSetupMode ? 'Saqlash va davom etish' : "O'zgarishlarni saqlash"}
        </button>
      </main>

      {!isSetupMode && <BottomNav />}
    </div>
  )
}
