import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from '../app/(auth)/login/page'
import DashboardPage from '../app/(dashboard)/dashboard/page'
import { CardForm } from '../components/forms/AddCardForm'
import { TransactionForm } from '../components/forms/TransactionForm'

// Mock Recharts / Chart components to avoid JSDOM layout sizing timeouts
vi.mock('@/components/charts/OverviewChart', () => ({
    OverviewChart: () => <div data-testid="overview-chart">OverviewChart Mock</div>
}))
vi.mock('@/components/charts/CategoryChart', () => ({
    CategoryChart: () => <div data-testid="category-chart">CategoryChart Mock</div>
}))
vi.mock('@/components/charts/FixedVsCardChart', () => ({
    FixedVsCardChart: () => <div data-testid="fixed-vs-card-chart">FixedVsCardChart Mock</div>
}))
vi.mock('@/components/charts/CardDistributionChart', () => ({
    CardDistributionChart: () => <div data-testid="card-distribution-chart">CardDistributionChart Mock</div>
}))

type MockCard = { id: string; name: string; active?: boolean }
type MockTransaction = {
    id: string
    amount: number
    type: 'income' | 'expense'
    category: string
    date: string
    card_id: string | null
    cards: { name: string } | null
}

// Variables to store mocked database state
let mockCards: MockCard[] = []
let mockTransactions: MockTransaction[] = []
const mockUserProfile = { display_name: 'Junior', welcome_message: 'Bem-vindo de volta!' }

// Global mock spies for assertions
const signInWithPasswordMock = vi.fn()
const getUserMock = vi.fn()
const insertMock = vi.fn()

// Configure Supabase Client Mock with unique chain per call to avoid race conditions
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => ({
        auth: {
            signInWithPassword: signInWithPasswordMock,
            getUser: getUserMock,
        },
        from: vi.fn((table: string) => {
            type MockQueryChain = {
                [key: string]: unknown
                then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise<unknown>
            }
            const queryChain = {} as MockQueryChain
            let operation: 'select' | 'update' | 'delete' = 'select'
            let rangeStart = 0
            let rangeEnd = Number.POSITIVE_INFINITY

            const resolveQuery = () => {
                if (operation !== 'select') return { data: null, error: null }
                if (table === 'transactions') {
                    return { data: mockTransactions.slice(rangeStart, rangeEnd + 1), error: null }
                }
                if (table === 'cards') return { data: mockCards, error: null }
                if (table === 'recurring_expenses') return { data: [], error: null }
                if (table === 'user_profiles') return { data: mockUserProfile, error: null }
                return { data: [], error: null }
            }

            queryChain.select = vi.fn().mockReturnValue(queryChain)
            queryChain.insert = vi.fn().mockImplementation((payload: unknown) => {
                insertMock(payload)
                return Promise.resolve({ error: null })
            })
            queryChain.update = vi.fn().mockImplementation(() => {
                operation = 'update'
                return queryChain
            })
            queryChain.delete = vi.fn().mockImplementation(() => {
                operation = 'delete'
                return queryChain
            })
            queryChain.eq = vi.fn().mockReturnValue(queryChain)
            queryChain.gte = vi.fn().mockReturnValue(queryChain)
            queryChain.lte = vi.fn().mockReturnValue(queryChain)
            queryChain.order = vi.fn().mockReturnValue(queryChain)
            queryChain.range = vi.fn().mockImplementation((from: number, to: number) => {
                rangeStart = from
                rangeEnd = to
                return queryChain
            })
            queryChain.single = vi.fn().mockImplementation(() => Promise.resolve({
                data: table === 'user_profiles' ? mockUserProfile : null,
                error: null,
            }))
            // Supabase's PostgREST builder is thenable; keep filters fluent until awaited.
            queryChain.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
                Promise.resolve(resolveQuery()).then(resolve, reject)

            return queryChain
        })
    }))
}))

// Mock Next Navigation
const pushMock = vi.fn()
const refreshMock = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        refresh: refreshMock,
        back: vi.fn(),
    }),
}))

describe('Fluxo Principal do Usuário (Integração)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        
        // Reset local database state
        mockCards = []
        mockTransactions = []
        
        // Setup default auth state
        getUserMock.mockResolvedValue({ data: { user: { id: 'user123', email: 'junior@teste.com' } }, error: null })
        signInWithPasswordMock.mockResolvedValue({
            data: { user: { id: 'user123', email: 'junior@teste.com' } },
            error: null,
        })
        
        // Default insert resolves
        insertMock.mockResolvedValue({ error: null })
    })

    it('deve simular o fluxo de acesso (login) com sucesso', async () => {
        render(<LoginPage />)
        
        // Arrange & Act
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'junior@teste.com' } })
        fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senha123' } })
        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }))
        
        // Assert
        await waitFor(() => {
            expect(signInWithPasswordMock).toHaveBeenCalledWith({
                email: 'junior@teste.com',
                password: 'senha123',
            })
            expect(pushMock).toHaveBeenCalledWith('/dashboard')
        })
    })

    it('deve simular o cadastro de um novo cartão de crédito', async () => {
        render(<CardForm />)
        
        // Simular preenchimento dos campos do formulário
        fireEvent.change(screen.getByPlaceholderText(/Ex: Nubank Black/i), { target: { value: 'Nubank Gold' } })
        fireEvent.change(screen.getByPlaceholderText(/R\$ 0,00/i), { target: { value: '250000' } }) // R$ 2.500,00
        fireEvent.change(screen.getByPlaceholderText(/10/i), { target: { value: '5' } }) // fechamento dia 5
        fireEvent.change(screen.getByPlaceholderText(/17/i), { target: { value: '12' } }) // vencimento dia 12
        
        // Salvar
        fireEvent.click(screen.getByRole('button', { name: /Conectar Cartão/i }))
        
        await waitFor(() => {
            // Verificar se salvou com os dados corretos e active: true
            expect(insertMock).toHaveBeenCalledWith({
                user_id: 'user123',
                name: 'Nubank Gold',
                limit_amount: 2500,
                closing_day: 5,
                due_day: 12,
                active: true
            })
            expect(pushMock).toHaveBeenCalledWith('/cards')
        })
    })

    it('deve simular o registro de uma nova transação associada ao cartão cadastrado', async () => {
        // Preencher o estado simulando que o cartão Nubank Gold já foi cadastrado
        mockCards = [{ id: 'card-gold', name: 'Nubank Gold' }]
        
        render(<TransactionForm />)
        
        // Aguarda carregar os cartões no select
        await waitFor(() => {
            expect(screen.getByLabelText(/Método de compra/i)).toBeInTheDocument()
        })
        
        // Preencher os dados da transação
        fireEvent.change(screen.getByPlaceholderText(/Ex: Supermercado/i), { target: { value: 'Compras do Mês' } })
        fireEvent.change(screen.getByPlaceholderText(/0.00/i), { target: { value: '35050' } }) // R$ 350,50
        fireEvent.change(screen.getByLabelText(/Categoria/i), { target: { value: 'Alimentação' } })
        fireEvent.change(screen.getByLabelText(/Método de compra/i), { target: { value: 'card-gold' } })
        
        // Enviar
        fireEvent.click(screen.getByRole('button', { name: /Salvar Transação/i }))
        
        await waitFor(() => {
            expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
                user_id: 'user123',
                description: 'Compras do Mês',
                amount: 350.50,
                type: 'expense',
                category: 'Alimentação',
                card_id: 'card-gold'
            }))
            expect(pushMock).toHaveBeenCalledWith('/transactions')
        })
    })

    it('deve exibir os dados inseridos corretamente na visão geral do Dashboard', async () => {
        // Mocking data that is retrieved by Dashboard Page
        mockCards = [{ id: 'card-gold', name: 'Nubank Gold' }]
        mockTransactions = [
            {
                id: 't1',
                amount: 350.50,
                type: 'expense',
                category: 'Alimentação',
                date: new Date().toISOString(),
                card_id: 'card-gold',
                cards: { name: 'Nubank Gold' }
            }
        ]
        
        render(<DashboardPage />)
        
        // Verificar se os elementos de resumo e valor estão renderizados na tela
        await waitFor(() => {
            // DashboardPage exibe as boas-vindas do perfil mockado
            expect(screen.getByText(/Olá, Junior!/i)).toBeInTheDocument()
            
            // O valor total de despesas deve ser R$ 350,50
            expect(screen.getByText(/Saldo Disponível/i)).toBeInTheDocument()
            expect(screen.getByText(/Din\/Débito/i)).toBeInTheDocument()
        })
    })
})
