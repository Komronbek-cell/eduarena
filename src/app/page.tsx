import Link from 'next/link'
import { Trophy, Zap, Users, Star, TrendingUp, Shield, ArrowRight, Medal } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">EduArena</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-slate-400 hover:text-white text-sm transition px-4 py-2"
            >
              Kirish
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              Boshlash
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm px-4 py-2 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Raqamli iqtisodiyot va innovatsiyalar fakulteti
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Bilim — eng kuchli
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"> qurol</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            EduArena — talabalar uchun intellektual musobaqa platformasi. 
            Kunlik quizlar, haftalik challengelar va real vaqtdagi reyting tizimi.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-4 rounded-2xl transition text-lg"
            >
              Hoziroq boshlash
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-8 py-4 rounded-2xl transition text-lg border border-slate-700"
            >
              Kirish
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-slate-800">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '500+', label: 'Faol talaba' },
            { value: '1000+', label: 'Quiz savollari' },
            { value: '50+', label: 'Haftalik musobaqa' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-slate-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Nima uchun EduArena?</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Oddiy o'qishdan farqli, bu yerda raqobat bor, yutuqlar bor va g'urur bor.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
                title: 'Kunlik quizlar',
                desc: 'Har kuni 5 ta yangi savol. Streak saqlang, ball to\'plang va oldinga boring.',
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
                title: 'Haftalik musobaqa',
                desc: 'Katta musobaqalarda qatnashing. G\'olib bo\'ling va maxsus badge oling.',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                color: 'text-green-400 bg-green-400/10 border-green-400/20',
                title: 'Real vaqt reytingi',
                desc: 'O\'z o\'rningizni ko\'ring. Guruhingiz bilan raqobatlashing.',
              },
              {
                icon: <Star className="w-6 h-6" />,
                color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
                title: 'Yutuqlar va badges',
                desc: 'Har bir muvaffaqiyat uchun maxsus badge. To\'plang, ko\'rsating.',
              },
              {
                icon: <Users className="w-6 h-6" />,
                color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                title: 'Guruh reytingi',
                desc: 'Guruhingizni yuqoriga olib chiqing. Jamoa g\'alabasi — eng katta g\'alaba.',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                color: 'text-red-400 bg-red-400/10 border-red-400/20',
                title: 'Xavfsiz muhit',
                desc: 'Faqat o\'z fakultetingiz talabalari. Yopiq, ishonchli platforma.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition"
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Reyting jadval</h2>
            <p className="text-slate-400">Eng yaxshilar shu yerda. Sen ham bo'lishing mumkin.</p>
          </div>

          {/* Podium */}
          <div className="flex items-end justify-center gap-4 mb-8">
            {[
              { place: 2, name: 'Sardor M.', score: 890, height: 'h-24', color: 'bg-slate-600' },
              { place: 1, name: 'Kamola R.', score: 1240, height: 'h-32', color: 'bg-indigo-600' },
              { place: 3, name: 'Jasur T.', score: 760, height: 'h-20', color: 'bg-amber-600' },
            ].map((p) => (
              <div key={p.place} className="flex flex-col items-center gap-2">
                <div className="text-2xl">
                  {p.place === 1 ? '👑' : p.place === 2 ? '🥈' : '🥉'}
                </div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-slate-400">{p.score} ball</p>
                <div className={`w-20 ${p.height} ${p.color} rounded-t-xl flex items-center justify-center`}>
                  <span className="text-white font-bold text-xl">#{p.place}</span>
                </div>
              </div>
            ))}
          </div>

          {/* List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {[
              { place: 4, name: 'Dilnoza A.', score: 710, group: 'DI-23' },
              { place: 5, name: 'Bobur X.', score: 680, group: 'DI-22' },
              { place: 6, name: 'Malika S.', score: 650, group: 'DI-24' },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-4 border-b border-slate-800 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 w-6 text-sm">#{s.place}</span>
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.group}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-indigo-400">
                  <Medal className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{s.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Tayyor bo'ldingmi?</h2>
          <p className="text-slate-400 mb-8">
            Minglab talabalar allaqachon raqobatlashmoqda. Sen nima kutayapsan?
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-10 py-4 rounded-2xl transition text-lg"
          >
            Hoziroq qo'shiling
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Trophy className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold">EduArena</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 EduArena · Raqamli iqtisodiyot va innovatsiyalar fakulteti
          </p>
        </div>
      </footer>
    </div>
  )
}