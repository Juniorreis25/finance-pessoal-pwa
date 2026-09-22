import { describe, expect, it } from 'vitest'
import { getAuthCallbackUrl } from './redirect'

describe('Supabase authentication redirect', () => {
    it('builds the callback on the current application origin', () => {
        expect(getAuthCallbackUrl('https://pwa.example.com')).toBe(
            'https://pwa.example.com/auth/callback',
        )
    })

    it('does not retain a path or query from the origin input', () => {
        expect(getAuthCallbackUrl('https://pwa.example.com/old?source=test')).toBe(
            'https://pwa.example.com/auth/callback',
        )
    })
})
