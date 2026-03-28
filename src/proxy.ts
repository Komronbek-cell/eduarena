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

  const path = request.nextUrl.pathname

  const isProtected =
    path.startsWith('/dashboard') ||
    path.startsWith('/admin') ||
    path.startsWith('/quiz') ||
    path.startsWith('/leaderboard') ||
    path.startsWith('/profile') ||
    path.startsWith('/history') ||
    path.startsWith('/groups') ||
    path.startsWith('/announcements') ||
    path.startsWith('/quizzes') ||
    path.startsWith('/team') ||
    path.startsWith('/tournament') 

  const isAuthPage =
    path.startsWith('/login') ||
    path.startsWith('/register')

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', user.id)
      .single()

    if (profile?.is_blocked && !isAuthPage) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?blocked=true', request.url))
    }

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    if (path.startsWith('/admin') && !isAdmin) {
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
    '/team/:path*',
    '/tournament/:path*',
    '/login',
    '/register',
  ],
}