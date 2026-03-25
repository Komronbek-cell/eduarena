import Link from 'next/link'
import Image from 'next/image'
import { Zap, Users, Star, TrendingUp, ArrowRight, Medal, Flame } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="GULDU" width={36} height={36} className="rounded-lg object-cover" />
            <div>
              <span className="font-black text-lg tracking-tight">EduArena</span>
              <p className="text-xs text-gray-400 leading-none hidden md:block">GULDU · Raqamli iqtisodiyot</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition">Imkoniyatlar</a>
            <a href="#ranking" className="hover:text-gray-900 transition">Reyting</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition px-4 py-2">
              Kirish
            </Link>
            <Link href="/register" className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
              Boshlash →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-violet-50 to-transparent rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5" />
            Raqamli iqtisodiyot va innovatsiyalar fakulteti · Pilot
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Bilim — eng{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-violet-600">kuchli qurol</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 8C50 4 100 2 150 2C200 2 250 4 298 8" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" opacity="0.3"/>
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Kunlik quizlar, haftalik musobaqalar va real vaqt reytingi.
            O'z bilimingizni sinang, guruhingizni yuqoriga olib chiqing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-4 rounded-2xl transition text-lg shadow-lg shadow-violet-200"
            >
              Hoziroq boshlash <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold px-8 py-4 rounded-2xl transition text-lg border border-gray-200"
            >
              Kirish
            </Link>
          </div>

          <div className="inline-flex items-center gap-6 md:gap-8 bg-gray-50 border border-gray-200 rounded-2xl px-6 md:px-8 py-4">
            {[
              { value: '500+', label: 'Talaba' },
              { value: '1000+', label: 'Savol' },
              { value: '50+', label: 'Musobaqa' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-xl md:text-2xl font-black text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Imkoniyatlar</p>
            <h2 className="text-3xl md:text-4xl font-black">Oddiy o'qishdan farqli</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              Bu yerda raqobat bor, yutuqlar bor, va eng muhimi — g'urur bor.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Zap className="w-6 h-6" />, color: 'bg-yellow-400/10 text-yellow-400', title: 'Kunlik quizlar', desc: 'Har kuni yangi savollar. Streak saqlang, ball to\'plang, oldinga boring.', tag: 'Har kuni' },
              { icon: <Star className="w-6 h-6" />, color: 'bg-violet-400/10 text-violet-400', title: 'Haftalik musobaqa', desc: 'Katta musobaqalarda qatnashing. G\'olib bo\'ling va maxsus badge oling.', tag: 'Haftalik' },
              { icon: <TrendingUp className="w-6 h-6" />, color: 'bg-green-400/10 text-green-400', title: 'Real vaqt reytingi', desc: 'O\'z o\'rningizni ko\'ring. Guruhingiz bilan raqobatlashing.', tag: 'Live' },
              { icon: <Star className="w-6 h-6" />, color: 'bg-orange-400/10 text-orange-400', title: 'Yutuqlar', desc: 'Har bir muvaffaqiyat uchun maxsus badge. To\'plang, ko\'rsating.', tag: 'Gamification' },
              { icon: <Users className="w-6 h-6" />, color: 'bg-blue-400/10 text-blue-400', title: 'Guruh reytingi', desc: 'Guruhingizni yuqoriga olib chiqing. Jamoa g\'alabasi — eng katta g\'alaba.', tag: 'Jamoaviy' },
              { icon: <Flame className="w-6 h-6" />, color: 'bg-red-400/10 text-red-400', title: 'Streak tizimi', desc: 'Har kuni qatnashing. Ketma-ket kunlar ko\'paygan sari mukofot ortadi.', tag: 'Motivatsiya' },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl p-6 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color}`}>{f.icon}</div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-full">{f.tag}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section id="ranking" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-3">Reyting</p>
            <h2 className="text-3xl md:text-4xl font-black">Eng yaxshilar shu yerda</h2>
            <p className="text-gray-500 mt-3">Sen ham bo'lishing mumkin.</p>
          </div>

          <div className="flex items-end justify-center gap-4 md:gap-6 mb-8">
            {[
              { place: 2, name: 'Sardor M.', score: 890, height: 'h-24 md:h-28', bg: 'bg-gray-100', text: 'text-gray-600', medal: '🥈' },
              { place: 1, name: 'Kamola R.', score: 1240, height: 'h-32 md:h-36', bg: 'bg-violet-600', text: 'text-white', medal: '👑' },
              { place: 3, name: 'Jasur T.', score: 760, height: 'h-20 md:h-24', bg: 'bg-amber-100', text: 'text-amber-700', medal: '🥉' },
            ].map((p) => (
              <div key={p.place} className="flex flex-col items-center gap-2 md:gap-3 flex-1 max-w-[120px] md:max-w-none">
                <span className="text-xl md:text-2xl">{p.medal}</span>
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center font-black text-gray-600 text-base md:text-lg">
                  {p.name.charAt(0)}
                </div>
                <div className="text-center">
                  <p className="font-bold text-xs md:text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.score}</p>
                </div>
                <div className={`w-full ${p.height} ${p.bg} rounded-t-2xl flex items-center justify-center`}>
                  <span className={`font-black text-lg md:text-2xl ${p.text}`}>#{p.place}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {[
              { place: 4, name: 'Dilnoza A.', score: 710, group: 'DI-23' },
              { place: 5, name: 'Bobur X.', score: 680, group: 'DI-22' },
              { place: 6, name: 'Malika S.', score: 650, group: 'DI-24' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                <span className="text-gray-400 text-sm font-mono w-6">#{s.place}</span>
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.group}</p>
                </div>
                <div className="flex items-center gap-1.5 text-violet-600 font-bold text-sm">
                  <Medal className="w-3.5 h-3.5" />{s.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24 px-6 bg-violet-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Tayyor bo'ldingmi?</h2>
          <p className="text-violet-200 text-base md:text-lg mb-10">
            Minglab talabalar allaqachon raqobatlashmoqda. Sen nima kutayapsan?
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-violet-700 font-black px-8 md:px-10 py-4 rounded-2xl text-base md:text-lg hover:bg-violet-50 transition shadow-xl"
          >
            Hoziroq qo'shiling <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="GULDU" width={28} height={28} className="rounded-md object-cover" />
            <span className="font-bold text-gray-900">EduArena</span>
          </div>
          <p className="text-gray-400 text-sm text-center">
            © 2026 EduArena · Guliston Davlat Universiteti · Raqamli iqtisodiyot va innovatsiyalar fakulteti
          </p>
        </div>
      </footer>
    </div>
  )
}