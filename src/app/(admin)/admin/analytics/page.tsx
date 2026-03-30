'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { ArrowLeft, Users, Trophy, Target, TrendingUp, Loader2, BarChart2 } from 'lucide-react'

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalQuizzes: 0,
    totalAttempts: 0,
    avgScore: 0,
    avgAccuracy: 0,
  })
  const [topStudents, setTopStudents] = useState<any[]>([])
  const [topGroups, setTopGroups] = useState<any[]>([])
  const [quizStats, setQuizStats] = useState<any[]>([])
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin' && profile?.role !== 'super_admin') { router.push('/dashboard'); return }

      const [
        { data: students },
        { data: attempts },
        { data: quizzes },
        { data: groups },
      ] = await Promise.all([
        supabase.from('profiles').select('id, full_name, total_score, streak, group_id, groups(name)').eq('role', 'student'),
        supabase.from('quiz_attempts').select('*'),
        supabase.from('quizzes').select('id, title, type'),
        supabase.from('groups').select('id, name'),
      ])

      const studentList = (students as any[]) ?? []
      const attemptList = (attempts as any[]) ?? []
      const quizList = (quizzes as any[]) ?? []
      const groupList = (groups as any[]) ?? []

      // Asosiy statistika
      const activeStudents = studentList.filter(s => s.total_score > 0).length
      const avgScore = studentList.length > 0
        ? Math.round(studentList.reduce((sum, s) => sum + s.total_score, 0) / studentList.length)
        : 0
      const avgAccuracy = attemptList.length > 0
        ? Math.round(attemptList.reduce((sum, a) => sum + (a.correct_answers / a.total_questions) * 100, 0) / attemptList.length)
        : 0

      setStats({
        totalStudents: studentList.length,
        activeStudents,
        totalQuizzes: quizList.length,
        totalAttempts: attemptList.length,
        avgScore,
        avgAccuracy,
      })

      // Top 5 talaba
      const top5 = [...studentList]
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 5)
        .map(s => ({ name: s.full_name.split(' ')[0], ball: s.total_score }))
      setTopStudents(top5)

      // Top guruhlar
      const groupStats = groupList.map(g => {
        const gs = studentList.filter(s => s.group_id === g.id)
        if (gs.length === 0) return null
        const avg = Math.round(gs.reduce((sum, s) => sum + s.total_score, 0) / gs.length)
        return { name: g.name, ball: avg, talaba: gs.length }
      }).filter(Boolean).sort((a: any, b: any) => b.ball - a.ball).slice(0, 5)
      setTopGroups(groupStats)

      // Quiz bo'yicha urinishlar
      const qStats = quizList.map(q => {
        const qAttempts = attemptList.filter(a => a.quiz_id === q.id)
        const avgAcc = qAttempts.length > 0
          ? Math.round(qAttempts.reduce((sum, a) => sum + (a.correct_answers / a.total_questions) * 100, 0) / qAttempts.length)
          : 0
        return {
          name: q.title.length > 12 ? q.title.slice(0, 12) + '...' : q.title,
          urinish: qAttempts.length,
          aniqlik: avgAcc,
        }
      })
      setQuizStats(qStats)

      // Ball taqsimoti
      const ranges = [
        { name: '0-50', min: 0, max: 50 },
        { name: '51-100', min: 51, max: 100 },
        { name: '101-200', min: 101, max: 200 },
        { name: '201-500', min: 201, max: 500 },
        { name: '500+', min: 501, max: Infinity },
      ]
      const dist = ranges.map(r => ({
        name: r.name,
        talaba: studentList.filter(s => s.total_score >= r.min && s.total_score <= r.max).length,
      }))
      setScoreDistribution(dist)

      setLoading(false)
    }
    fetchData()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
    </div>
  )

  const COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <BarChart2 className="w-5 h-5 text-violet-600" />
          <span className="font-black text-lg">Analitika</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">

        {/* Asosiy statistika */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { icon: <Users className="w-5 h-5" />, color: 'text-violet-600 bg-violet-50', label: 'Jami talabalar', value: stats.totalStudents },
            { icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-600 bg-green-50', label: 'Faol talabalar', value: stats.activeStudents },
            { icon: <Trophy className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-50', label: 'Jami quizlar', value: stats.totalQuizzes },
            { icon: <Target className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50', label: 'Jami urinishlar', value: stats.totalAttempts },
            { icon: <BarChart2 className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50', label: "O'rtacha ball", value: stats.avgScore },
            { icon: <TrendingUp className="w-5 h-5" />, color: 'text-orange-600 bg-orange-50', label: "O'rtacha aniqlik", value: `${stats.avgAccuracy}%` },
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

        {/* Top talabalar + Top guruhlar */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Top 5 talaba */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
            <h2 className="font-black text-lg mb-5">🏆 Top 5 talaba</h2>
            {topStudents.length === 0 ? (
              <p className="text-gray-400 text-sm">Hali ma'lumot yo'q</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topStudents} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip
                    contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                    formatter={(val) => [`${val} ball`, '']}
                  />
                  <Bar dataKey="ball" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top guruhlar */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
            <h2 className="font-black text-lg mb-5">👥 Top guruhlar</h2>
            {topGroups.length === 0 ? (
              <p className="text-gray-400 text-sm">Hali ma'lumot yo'q</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topGroups} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                    formatter={(val) => [`${val} o'rtacha ball`, '']}
                  />
                  <Bar dataKey="ball" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quiz statistikasi */}
        {quizStats.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
            <h2 className="font-black text-lg mb-5">📊 Quiz bo'yicha statistika</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={quizStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                />
                <Bar dataKey="urinish" name="Urinishlar" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                <Bar dataKey="aniqlik" name="Aniqlik %" fill="#c4b5fd" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Ball taqsimoti */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
            <h2 className="font-black text-lg mb-5">📈 Ball taqsimoti</h2>
            {scoreDistribution.every(d => d.talaba === 0) ? (
              <p className="text-gray-400 text-sm">Hali ma'lumot yo'q</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                    formatter={(val) => [`${val} talaba`, '']}
                  />
                  <Bar dataKey="talaba" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Faollik */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
            <h2 className="font-black text-lg mb-5">🎯 Faollik ko'rsatkichi</h2>
            <div className="space-y-4">
              {[
                {
                  label: 'Faol talabalar',
                  value: stats.activeStudents,
                  total: stats.totalStudents,
                  color: 'bg-violet-500',
                },
                {
                  label: 'Quiz yakunlaganlar',
                  value: stats.totalAttempts,
                  total: stats.totalStudents * stats.totalQuizzes || 1,
                  color: 'bg-green-500',
                },
                {
                  label: "O'rtacha aniqlik",
                  value: stats.avgAccuracy,
                  total: 100,
                  color: 'bg-blue-500',
                },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                    <span className="text-sm font-black text-gray-900">
                      {i === 2 ? `${item.value}%` : `${item.value}/${item.total}`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${Math.min(100, (item.value / item.total) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}