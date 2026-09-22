import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TransactionForm } from '../components/forms/TransactionForm'

// Define mocks
const getUserMock = vi.fn()
const cardsEqMock = vi.fn().mockResolvedValue({ data: [] })
const selectMock = vi.fn().mockReturnValue({ eq: cardsEqMock })
const insertMock = vi.fn().mockResolvedValue({ error: null })
const recurringInsertMock = vi.fn().mockResolvedValue({ error: null })
const updateMock = vi.fn().mockResolvedValue({ error: null })

// Mock @/lib/supabase/client
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: getUserMock,
        },
        from: vi.fn((table) => {
            if (table === 'cards') return { select: selectMock }
            if (table === 'recurring_expenses') return { insert: recurringInsertMock }
            if (table === 'transactions') return {
                insert: insertMock,
                update: updateMock,
                // mock eq for update chains if needed, though TransactionForm uses update(payload).eq()
                // so update() usually returns an object that has eq()
            }
            return {}
        })
    }))
}))

// Fix chain for update: .update().eq()
// Actually TransactionForm does: .update(payload).eq('id', id)
// So updateMock should return an object with eq
updateMock.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null })
})

const pushMock = vi.fn()
const refreshMock = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        refresh: refreshMock,
        back: vi.fn(),
    }),
}))

describe('TransactionForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getUserMock.mockResolvedValue({ data: { user: { id: 'user123' } }, error: null })
        cardsEqMock.mockResolvedValue({ data: [] })
        selectMock.mockReturnValue({ eq: cardsEqMock })
        insertMock.mockResolvedValue({ error: null })
        recurringInsertMock.mockResolvedValue({ error: null })
        // Re-setup update mock return
        updateMock.mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
        })
    })

    it('renders form and toggles type', () => {
        render(<TransactionForm />)
        expect(screen.getByRole('button', { name: /^Despesa$/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /^Receita$/i })).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/Ex: Supermercado/i)).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: /^Receita$/i }))
        expect(screen.getByPlaceholderText(/Mensal/i)).toBeInTheDocument()
    })

    it('submits transaction successfully', async () => {
        render(<TransactionForm />)

        fireEvent.change(screen.getByPlaceholderText(/Ex: Supermercado/i), { target: { value: 'Lunch' } })
        fireEvent.change(screen.getByPlaceholderText(/0.00/i), { target: { value: '5000' } })
        fireEvent.change(screen.getByLabelText(/Categoria/i), { target: { value: 'Moradia' } })

        fireEvent.click(screen.getByRole('button', { name: /Salvar/i }))

        await waitFor(() => {
            expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
                user_id: 'user123',
                description: 'Lunch',
                amount: 50,
                type: 'expense', // default
                category: 'Moradia'
            }))
            expect(pushMock).toHaveBeenCalledWith('/transactions')
        })
    })

    it('saves an expense recurrence in recurring_expenses', async () => {
        render(<TransactionForm />)

        fireEvent.change(screen.getByPlaceholderText(/Ex: Supermercado/i), { target: { value: 'Internet' } })
        fireEvent.change(screen.getByPlaceholderText(/0.00/i), { target: { value: '12000' } })
        fireEvent.change(screen.getByLabelText(/Categoria/i), { target: { value: 'Moradia' } })

        const recurringLabel = screen.getByText(/Despesa Recorrente/i)
        const recurringButton = recurringLabel.parentElement?.parentElement?.querySelector('button')
        expect(recurringButton).not.toBeNull()
        fireEvent.click(recurringButton!)

        fireEvent.click(screen.getByRole('button', { name: /Salvar/i }))

        await waitFor(() => {
            expect(recurringInsertMock).toHaveBeenCalledWith(expect.objectContaining({
                user_id: 'user123',
                description: 'Internet',
                amount: 120,
                type: 'expense',
                category: 'Moradia',
                active: true,
            }))
            expect(insertMock).not.toHaveBeenCalled()
            expect(pushMock).toHaveBeenCalledWith('/recurring')
        })
    })
})
