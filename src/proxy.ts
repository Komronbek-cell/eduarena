import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Himoyalangan sahifalar
  const isProtected =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/quiz') ||
    request.nextUrl.pathname.startsWith('/leaderboard') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/history') ||
    request.nextUrl.pathname.startsWith('/groups') ||
    request.nextUrl.pathname.startsWith('/announcements') ||
    request.nextUrl.pathname.startsWith('/quizzes')

  // Login sahifasida bloklash
  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    // Bloklangan foydalanuvchini tekshirish
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', user.id)
      .single()

    // Bloklangan bo'lsa — chiqarib yuborish
    if (profile?.is_blocked && !isAuthPage) {
      await supabase.auth.signOut()
      const response = NextResponse.redirect(new URL('/login?blocked=true', request.url))
      return response
    }

    // Admin sahifasiga oddiy talaba kira olmasin
    if (request.nextUrl.pathname.startsWith('/admin') && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/quiz/:path*',
    '/leaderboard/:path*',
    '/profile/:path*',
    '/history/:path*',
    '/groups/:path*',
    '/announcements/:path*',
    '/quizzes/:path*',
    '/login',
    '/register',
  ],
}