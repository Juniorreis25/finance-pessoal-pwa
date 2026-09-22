import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig } from './lib/supabase/config'

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname
    const protectedRoutes = ['/dashboard', '/cards', '/transactions', '/recurring', '/profile']
    const isProtectedRoute = protectedRoutes.some(
        (route) => path === route || path.startsWith(`${route}/`),
    )

    if (path === '/api/health') {
        return NextResponse.next({ request })
    }

    const isLocalDemoMode =
        process.env.NODE_ENV === 'development' &&
        process.env.LOCAL_DEMO_MODE === 'true'

    if (isLocalDemoMode && protectedRoutes.slice(0, 3).some(
        (route) => path === route || path.startsWith(`${route}/`),
    )) {
        return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({
        request,
    })
    const { url, anonKey } = getSupabaseConfig()

    const supabase = createServerClient(
        url,
        anonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data, error } = await supabase.auth.getClaims()
    const hasSession = !error && Boolean(data?.claims?.sub)
    const redirectWithSessionCookies = (pathname: string) => {
        const response = NextResponse.redirect(new URL(pathname, request.url))
        supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
            response.cookies.set(name, value, options)
        })
        return response
    }

    if (hasSession && (path === '/login' || path === '/register' || path === '/')) {
        return redirectWithSessionCookies('/dashboard')
    }

    if (!hasSession && isProtectedRoute) {
        return redirectWithSessionCookies('/login')
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
