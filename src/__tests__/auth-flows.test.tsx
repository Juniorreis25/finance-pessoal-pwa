import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RegisterPage from '../app/(auth)/register/page'
import DashboardLayout from '../app/(dashboard)/layout'

const mocks = vi.hoisted(() => ({
    signUp: vi.fn(),
    signOut: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({ auth: { signUp: mocks.signUp, signOut: mocks.signOut } }),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mocks.push, refresh: mocks.refresh, back: vi.fn() }),
    usePathname: () => '/dashboard',
}))

describe('auth flows', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.signUp.mockResolvedValue({
            data: { user: { id: 'test-user' }, session: null },
            error: null,
        })
        mocks.signOut.mockResolvedValue({ error: null })
    })

    it('registers with an email-confirmation callback URL', async () => {
        render(<RegisterPage />)

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'user@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha'), {
            target: { value: 'test-password-123' },
        })
        fireEvent.click(screen.getByRole('button', { name: /Criar Conta/i }))

        await waitFor(() => {
            expect(mocks.signUp).toHaveBeenCalledWith({
                email: 'user@example.com',
                password: 'test-password-123',
                options: { emailRedirectTo: `${location.origin}/auth/callback` },
            })
            expect(screen.getByText('Verifique seu email')).toBeInTheDocument()
        })
    })

    it('opens the app immediately when signup returns an authenticated session', async () => {
        mocks.signUp.mockResolvedValue({
            data: {
                user: { id: 'test-user' },
                session: { access_token: 'test-token' },
            },
            error: null,
        })

        render(<RegisterPage />)

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'user@example.com' },
        })
        fireEvent.change(screen.getByLabelText('Senha'), {
            target: { value: 'test-password-123' },
        })
        fireEvent.click(screen.getByRole('button', { name: /Criar Conta/i }))

        await waitFor(() => {
            expect(mocks.push).toHaveBeenCalledWith('/dashboard')
            expect(mocks.refresh).toHaveBeenCalledOnce()
            expect(screen.queryByText('Verifique seu email')).not.toBeInTheDocument()
        })
    })

    it('signs out and returns the user to login', async () => {
        render(<DashboardLayout><div>Dashboard</div></DashboardLayout>)

        fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))

        await waitFor(() => {
            expect(mocks.signOut).toHaveBeenCalledOnce()
            expect(mocks.push).toHaveBeenCalledWith('/login')
        })
    })
})
