import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TransactionForm } from '../components/forms/TransactionForm'

// Define mocks
const getUserMock = vi.fn()
const selectMock = vi.fn().mockResolvedValue({ data: [] })
const insertMock = vi.fn().mockResolvedValue({ error: null })
const updateMock = vi.fn().mockResolvedValue({ error: null })
const rpcMock = vi.fn().mockResolvedValue({ error: null })
const deleteMock = vi.fn().mockResolvedValue({ error: null })

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: getUserMock,
        },
        from: vi.fn((table) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const queryObj: Record<string, any> = {}
            queryObj.select = vi.fn().mockReturnValue(queryObj)
            queryObj.insert = vi.fn().mockResolvedValue({ error: null })
            queryObj.update = vi.fn().mockReturnValue(queryObj)
            queryObj.delete = vi.fn().mockReturnValue(queryObj)
            queryObj.eq = vi.fn().mockResolvedValue({ data: [], error: null })

            // Allow tracking specific calls
            if (table === 'transactions') {
                queryObj.insert = insertMock
                queryObj.update = updateMock
                queryObj.delete = deleteMock
                // For update/delete, we need eq to be awaitable
                updateMock.mockReturnValue(queryObj)
                deleteMock.mockReturnValue(queryObj)
            }

            return queryObj
        }),
        rpc: rpcMock
    }))
}))

const pushMock = vi.fn()
const refreshMock = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        refresh: refreshMock,
        back: vi.fn(),
    }),
}))

describe('TransactionForm - Business Rules for Dates', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getUserMock.mockResolvedValue({ data: { user: { id: 'user123' } }, error: null })
        selectMock.mockResolvedValue({ data: [] })
        insertMock.mockResolvedValue({ error: null })
        updateMock.mockResolvedValue({ error: null })
        rpcMock.mockResolvedValue({ error: null })
        deleteMock.mockResolvedValue({ error: null })
    })

    it('Scenario 1: Purchase on 12/02 and 1st Installment on 05/03', async () => {
        render(<TransactionForm />)

        // Fill basic info
        fireEvent.change(screen.getByPlaceholderText(/Ex: Supermercado/i), { target: { value: 'Compra Teste' } })
        fireEvent.change(screen.getByPlaceholderText(/0.00/i), { target: { value: '10000' } }) // 100.00

        // Activating installments
        const toggle = screen.getByText(/Transação Parcelada\?/i).closest('div')?.parentElement?.querySelector('button')
        fireEvent.click(toggle!)

        // Check if installment quantity input appeared
        expect(screen.getByLabelText(/QUANTIDADE DE PARCELAS/i)).toBeInTheDocument()

        // Set Purchase Date (id="date")
        const purchaseInput = screen.getByLabelText(/DATA DA COMPRA/i)
        fireEvent.change(purchaseInput, { target: { value: '2026-02-12' } })

        // Set 1st Installment Date (id="first_installment_date")
        const installmentInput = screen.getByLabelText(/DATA DA 1ª PARCELA/i)
        fireEvent.change(installmentInput, { target: { value: '2026-03-05' } })

        // Set Category
        fireEvent.change(screen.getByLabelText(/CATEGORIA/i), { target: { value: 'Alimentação' } })

        // Submit
        fireEvent.click(screen.getByText(/Salvar Transação/i))

        await waitFor(() => {
            expect(rpcMock).toHaveBeenCalledWith('create_installment_transaction', {
                p_user_id: 'user123',
                p_description: 'Compra Teste',
                p_amount: 100,
                p_category: 'Alimentação',
                p_date: '2026-03-05',
                p_total_installments: 2,
                p_card_id: null,
                p_purchase_date: '2026-02-12'
            })
        })
    })

    it('Scenario 2: Automatic Sync for simple expenses', async () => {
        render(<TransactionForm />)

        const purchaseInput = screen.getByLabelText(/DATA DA COMPRA/i)
        const installmentInput = screen.getByLabelText(/DATA DA 1ª PARCELA/i)

        // Change purchase date
        fireEvent.change(purchaseInput, { target: { value: '2026-02-14' } })

        // 1st installment date should follow automatically
        expect(installmentInput).toHaveValue('2026-02-14')
    })

    it('Scenario 3: Converting existing single transaction to installments', async () => {
        const initialData = {
            id: 'old-tx-id',
            description: 'Simple Tx',
            amount: 50,
            category: 'Lazer',
            date: '2026-04-01',
            type: 'expense' as const
        }

        render(<TransactionForm initialData={initialData} />)

        // Enable installments
        const toggle = screen.getByText(/Transação Parcelada\?/i).closest('div')?.parentElement?.querySelector('button')
        fireEvent.click(toggle!)

        expect(screen.getByLabelText(/QUANTIDADE DE PARCELAS/i)).toBeInTheDocument()

        // Submit
        fireEvent.click(screen.getByText(/Salvar Transação/i))

        await waitFor(() => {
            // Should delete existing single record
            expect(deleteMock).toHaveBeenCalled()
            // Should call RPC to create series
            expect(rpcMock).toHaveBeenCalled()
        })
    })

    it('Scenario 4: Recovering separate dates during edit', () => {
        const initialData = {
            id: 'edit-tx-id',
            description: 'Edit Test',
            amount: 100,
            category: 'Educação',
            date: '2026-03-05', // Payout
            purchase_date: '2026-02-12', // Purchase
            type: 'expense' as const,
            installment_id: 'inst-123'
        }

        render(<TransactionForm initialData={initialData} />)

        const purchaseInput = screen.getByLabelText(/DATA DA COMPRA/i)
        const installmentInput = screen.getByLabelText(/DATA DA 1ª PARCELA/i)

        expect(purchaseInput).toHaveValue('2026-02-12')
        expect(installmentInput).toHaveValue('2026-03-05')
    })
})
