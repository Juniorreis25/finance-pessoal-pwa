import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseConfig } from '@/lib/supabase/config'

function redirectToLogin(request: NextRequest) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'auth_callback')
    return NextResponse.redirect(loginUrl)
}

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code')

    if (!code) {
        return redirectToLogin(request)
    }

    try {
        const response = NextResponse.redirect(new URL('/dashboard', request.url))
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
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    }
                }
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            console.error('auth_callback_exchange_failed')
            return redirectToLogin(request)
        }

        return response
    } catch {
        console.error('auth_callback_exchange_failed')
        return redirectToLogin(request)
    }
}
