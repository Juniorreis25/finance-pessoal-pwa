import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/config', () => ({
    getSupabaseConfig: () => ({
        url: 'https://private-project.supabase.co',
        anonKey: 'private-test-key',
    }),
}))

import { GET } from '../app/api/health/route'

describe('health endpoint', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    beforeEach(() => {
        fetchMock.mockReset()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('reports a generic healthy status without returning Supabase details', async () => {
        fetchMock.mockResolvedValue(new Response('{"version":"private"}', { status: 200 }))

        const response = await GET()

        expect(fetchMock).toHaveBeenCalledWith(
            new URL('https://private-project.supabase.co/auth/v1/health'),
            expect.objectContaining({
                headers: { apikey: 'private-test-key' },
                cache: 'no-store',
            }),
        )
        expect(response.status).toBe(200)
        expect(response.headers.get('cache-control')).toBe('no-store')
        expect(await response.json()).toEqual({ status: 'ok' })
    })

    it('returns a generic unavailable status when Supabase Auth is unhealthy', async () => {
        const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
        fetchMock.mockResolvedValue(new Response('private failure details', { status: 503 }))

        const response = await GET()

        expect(response.status).toBe(503)
        expect(response.headers.get('cache-control')).toBe('no-store')
        expect(await response.json()).toEqual({ status: 'unavailable' })
        expect(errorLog).toHaveBeenCalledWith('supabase_health_check_failed')
    })

    it('handles network errors without returning exception details', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        fetchMock.mockRejectedValue(new Error('private network error'))

        const response = await GET()

        expect(response.status).toBe(503)
        expect(await response.json()).toEqual({ status: 'unavailable' })
    })
})
