import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from '../app/(auth)/login/page'

// Define Mocks
const signInWithPasswordMock = vi.fn()
const resendConfirmationMock = vi.fn()

// Mock @/lib/supabase/client
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => ({
        auth: {
            signInWithPassword: signInWithPasswordMock,
            resend: resendConfirmationMock,
        },
    }))
}))

// Mock Next Navigation
const pushMock = vi.fn()
const refreshMock = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        refresh: refreshMock,
    }),
}))

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        window.history.replaceState({}, '', '/')
        resendConfirmationMock.mockResolvedValue({ error: null })
    })

    it('renders login form correctly', () => {
        render(<LoginPage />)
        expect(screen.getByText(/Entre para gerenciar/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument()
    })

    it('handles login submission successfully', async () => {
        // Setup Supabase mock success
        signInWithPasswordMock.mockResolvedValue({
            data: { user: { id: '1', email: 'test@test.com' } },
            error: null,
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } })
        fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'user-pass-123' } })
        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }))

        await waitFor(() => {
            expect(signInWithPasswordMock).toHaveBeenCalledWith({
                email: 'test@test.com',
                password: 'user-pass-123',
            })
            expect(pushMock).toHaveBeenCalledWith('/dashboard')
            expect(refreshMock).toHaveBeenCalled()
        })
    })

    it('displays error message on failure', async () => {
        // Setup Supabase mock error
        signInWithPasswordMock.mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid login credentials' },
        })

        render(<LoginPage />)

        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'wrong@test.com' } })
        fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'wrongpass' } })
        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }))

        await waitFor(() => {
            expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
        })
    })

    it('explains that an expired confirmation link must be requested again', async () => {
        window.history.replaceState({}, '', '/login?error=auth_callback')

        render(<LoginPage />)

        expect(await screen.findByText(/O link de confirmação é inválido ou expirou/i)).toBeInTheDocument()
    })

    it('resends an expired confirmation link without revealing account status', async () => {
        window.history.replaceState({}, '', '/login?error=auth_callback')
        render(<LoginPage />)

        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'user@example.com' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Reenviar email de confirmação' }))

        await waitFor(() => {
            expect(resendConfirmationMock).toHaveBeenCalledWith({
                type: 'signup',
                email: 'user@example.com',
                options: { emailRedirectTo: `${location.origin}/auth/callback` },
            })
            expect(screen.getByRole('status')).toHaveTextContent(
                'Se houver uma conta aguardando confirmação nesse email, enviaremos um novo link.',
            )
        })
    })
})
