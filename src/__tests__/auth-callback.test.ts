import { NextRequest, type NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    createServerClient: vi.fn(),
    exchangeCodeForSession: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
    createServerClient: mocks.createServerClient,
}))

vi.mock('@/lib/supabase/config', () => ({
    getSupabaseConfig: () => ({
        url: 'https://project.example.supabase.co',
        anonKey: 'test-public-key',
    }),
}))

import { GET } from '../app/auth/callback/route'

type CookieAdapter = {
    getAll: () => Array<{ name: string; value: string }>
    setAll: (cookiesToSet: Array<{
        name: string
        value: string
        options?: Parameters<NextResponse['cookies']['set']>[2]
    }>) => void
}

describe('email confirmation callback', () => {
    let cookieAdapter: CookieAdapter | undefined

    beforeEach(() => {
        vi.clearAllMocks()
        cookieAdapter = undefined
        mocks.exchangeCodeForSession.mockResolvedValue({ error: null })
        mocks.createServerClient.mockImplementation((
            _url: unknown,
            _anonKey: unknown,
            options: unknown,
        ) => {
            cookieAdapter = (options as { cookies: CookieAdapter }).cookies
            return { auth: { exchangeCodeForSession: mocks.exchangeCodeForSession } }
        })
    })

    it('persists the exchanged session cookies and forwards request cookies', async () => {
        const request = new NextRequest(
            'https://app.example/auth/callback?code=confirmation-code',
            { headers: { cookie: 'flow=signup' } },
        )
        const response = await GET(request)

        expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith('confirmation-code')
        expect(cookieAdapter?.getAll()).toEqual([{ name: 'flow', value: 'signup' }])

        cookieAdapter?.setAll([{
            name: 'sb-project-auth-token',
            value: 'test-session-token',
            options: { path: '/', httpOnly: true, maxAge: 3600 },
        }])

        expect(response.headers.get('location')).toBe('https://app.example/dashboard')
        expect(response.headers.get('set-cookie')).toContain('sb-project-auth-token=test-session-token')
    })

    it('returns to login with a safe message when the confirmation code expired', async () => {
        const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
        mocks.exchangeCodeForSession.mockResolvedValue({
            error: new Error('sensitive provider error and confirmation code'),
        })

        const response = await GET(new NextRequest(
            'https://app.example/auth/callback?code=expired-code',
        ))

        expect(response.headers.get('location')).toBe(
            'https://app.example/login?error=auth_callback',
        )
        expect(errorLog).toHaveBeenCalledWith('auth_callback_exchange_failed')
        expect(errorLog).toHaveBeenCalledTimes(1)
        errorLog.mockRestore()
    })

    it('rejects callbacks without a code without contacting Supabase', async () => {
        const response = await GET(new NextRequest('https://app.example/auth/callback'))

        expect(response.headers.get('location')).toBe(
            'https://app.example/login?error=auth_callback',
        )
        expect(mocks.createServerClient).not.toHaveBeenCalled()
    })
})
