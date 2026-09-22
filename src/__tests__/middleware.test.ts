import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    createServerClient: vi.fn(),
    getClaims: vi.fn(),
    cookieAdapter: undefined as unknown,
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

import { proxy } from '../proxy'

type CookieAdapter = {
    getAll: () => Array<{ name: string; value: string }>
    setAll: (cookiesToSet: Array<{
        name: string
        value: string
        options?: { path?: string; maxAge?: number }
    }>) => void
}

describe('Supabase session middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.cookieAdapter = undefined
        mocks.createServerClient.mockImplementation((
            _url: unknown,
            _anonKey: unknown,
            options: unknown,
        ) => {
            mocks.cookieAdapter = (options as { cookies: CookieAdapter }).cookies
            return { auth: { getClaims: mocks.getClaims } }
        })
    })

    it('passes refreshed session cookies through the middleware response', async () => {
        mocks.getClaims.mockImplementation(async () => {
            const cookies = mocks.cookieAdapter as CookieAdapter
            cookies.setAll([{
                name: 'sb-project-auth-token',
                value: 'refreshed-test-token',
                options: { path: '/', maxAge: 3600 },
            }])
            return { data: { claims: { sub: 'test-user' } }, error: null }
        })

        const response = await proxy(new NextRequest('https://app.example/dashboard'))

        expect(response.headers.get('x-middleware-next')).toBe('1')
        expect(response.headers.get('set-cookie')).toContain(
            'sb-project-auth-token=refreshed-test-token',
        )
    })

    it('redirects expired sessions away from protected routes', async () => {
        mocks.getClaims.mockResolvedValue({ data: { claims: null }, error: null })

        const response = await proxy(new NextRequest('https://app.example/dashboard'))

        expect(response.headers.get('location')).toBe('https://app.example/login')
    })

    it.each(['/dashboard', '/cards', '/transactions', '/recurring', '/profile'])(
        'requires a session for %s',
        async (path) => {
            mocks.getClaims.mockResolvedValue({ data: { claims: null }, error: null })

            const response = await proxy(new NextRequest(`https://app.example${path}`))

            expect(response.headers.get('location')).toBe('https://app.example/login')
        },
    )

    it('redirects an authenticated user away from registration', async () => {
        mocks.getClaims.mockResolvedValue({
            data: { claims: { sub: 'test-user' } },
            error: null,
        })

        const response = await proxy(new NextRequest('https://app.example/register'))

        expect(response.headers.get('location')).toBe('https://app.example/dashboard')
    })

    it('preserves refreshed session cookies on redirects', async () => {
        mocks.getClaims.mockImplementation(async () => {
            const cookies = mocks.cookieAdapter as CookieAdapter
            cookies.setAll([{
                name: 'sb-project-auth-token',
                value: 'refreshed-test-token',
                options: { path: '/', maxAge: 3600 },
            }])
            return { data: { claims: { sub: 'test-user' } }, error: null }
        })

        const response = await proxy(new NextRequest('https://app.example/login'))

        expect(response.headers.get('location')).toBe('https://app.example/dashboard')
        expect(response.headers.get('set-cookie')).toContain(
            'sb-project-auth-token=refreshed-test-token',
        )
    })

    it('keeps the health check available when Supabase is down', async () => {
        const response = await proxy(new NextRequest('https://app.example/api/health'))

        expect(response.headers.get('x-middleware-next')).toBe('1')
        expect(mocks.createServerClient).not.toHaveBeenCalled()
    })
})
