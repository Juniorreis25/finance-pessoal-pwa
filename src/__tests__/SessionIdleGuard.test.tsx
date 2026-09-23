import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionIdleGuard } from '@/components/pwa/SessionIdleGuard'

const mocks = vi.hoisted(() => ({
    signOut: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
}))

vi.mock('@/lib/local-demo', () => ({ isLocalDemoMode: false }))
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ auth: { signOut: mocks.signOut } }) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }) }))

describe('encerramento por inatividade', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-09-22T12:00:00Z'))
        localStorage.clear()
        mocks.signOut.mockReset().mockResolvedValue({ error: null })
        mocks.replace.mockReset()
        mocks.refresh.mockReset()
    })

    afterEach(() => vi.useRealTimers())

    it('encerra apenas a sessão local após 30 segundos', async () => {
        render(<SessionIdleGuard />)
        await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
        expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' })
        expect(mocks.replace).toHaveBeenCalledWith('/login?reason=inactive')
    })

    it('reinicia a contagem com uma interação', async () => {
        render(<SessionIdleGuard />)
        await act(async () => { await vi.advanceTimersByTimeAsync(20_000) })
        fireEvent.pointerDown(document)
        await act(async () => { await vi.advanceTimersByTimeAsync(20_000) })
        expect(mocks.signOut).not.toHaveBeenCalled()
        await act(async () => { await vi.advanceTimersByTimeAsync(10_000) })
        expect(mocks.signOut).toHaveBeenCalledTimes(1)
    })

    it('não reinicia o prazo ao reabrir a página após inatividade', async () => {
        localStorage.setItem('finance-pessoal-last-activity', String(Date.now() - 31_000))
        await act(async () => { render(<SessionIdleGuard />) })
        expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' })
        expect(mocks.replace).toHaveBeenCalledWith('/login?reason=inactive')
    })
})
