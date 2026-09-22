import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TransactionsPage from '../app/(dashboard)/transactions/page'

const state = vi.hoisted(() => ({
    demoMode: true,
    transactions: [] as Array<{
        id: string
        description: string
        amount: number
        type: 'income' | 'expense'
        category: string
        date: string
        purchase_date: string | null
        card_id: string | null
        installment_id: string | null
        installment_number: number | null
        total_installments: number | null
    }>,
    recurring: [] as Array<{
        id: string
        description: string
        amount: number
        type: 'income' | 'expense'
        category: string
        start_date: string
        day_of_month: number
        active: boolean
    }>,
    bounds: [] as Array<[string, string]>,
}))

vi.mock('@/lib/local-demo', () => ({
    get isLocalDemoMode() { return state.demoMode },
    getLocalDemoTransactions: () => state.transactions,
    getLocalDemoRecurring: () => state.recurring,
}))

vi.mock('@/components/ui/ExportMenu', () => ({ ExportMenu: () => null }))

vi.mock('@/lib/supabase/client', () => {
    const client = {
        from(table: string) {
            let lower = ''
            let upper = ''
            const query = {
                select() { return query },
                eq() { return query },
                gte(_column: string, value: string) { lower = value; return query },
                lt(_column: string, value: string) { upper = value; return query },
                order() { return query },
                range() {
                    state.bounds.push([lower, upper])
                    return Promise.resolve({
                        data: state.transactions.filter(tx => tx.date >= lower && tx.date < upper).map(tx => ({ ...tx, cards: null })),
                        error: null,
                    })
                },
                then(resolve: (result: { data: unknown[]; error: null }) => unknown) {
                    return Promise.resolve(resolve({ data: table === 'recurring_expenses' ? state.recurring : [], error: null }))
                },
            }
            return query
        },
    }
    return { createClient: () => client }
})

function transaction(id: string, date: string, amount = 50) {
    return {
        id,
        description: `Lançamento ${id}`,
        amount,
        type: 'expense' as const,
        category: 'Mercado',
        date,
        purchase_date: null,
        card_id: null,
        installment_id: null,
        installment_number: null,
        total_installments: null,
    }
}

describe('linha do tempo de transações', () => {
    const desktopWidth = window.innerWidth

    beforeEach(() => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: desktopWidth })
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(new Date(2026, 8, 22, 12))
        state.demoMode = true
        state.transactions = []
        state.recurring = []
        state.bounds = []
    })

    afterEach(() => vi.useRealTimers())

    it('separa mês em foco e anterior sem incluir o anterior no resumo', async () => {
        state.transactions = [transaction('atual', '2026-09-20'), transaction('anterior', '2026-08-30', 500)]
        render(<TransactionsPage />)

        expect(await screen.findByText('Lançamento anterior')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'setembro 2026', level: 3 })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'agosto 2026', level: 3 })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Resumo de setembro 2026' })).toBeInTheDocument()
        expect(screen.getAllByText('- R$ 50,00').length).toBeGreaterThan(0)
        expect(screen.queryByText('- R$ 550,00')).not.toBeInTheDocument()
    })

    it('consulta dezembro e janeiro corretamente na virada de ano', async () => {
        state.demoMode = false
        vi.setSystemTime(new Date(2027, 0, 10, 12))
        state.transactions = [transaction('janeiro', '2027-01-03'), transaction('dezembro', '2026-12-31')]
        render(<TransactionsPage />)

        expect(await screen.findByText('Lançamento dezembro')).toBeInTheDocument()
        expect(state.bounds).toContainEqual(['2026-12-01', '2027-02-01'])
        expect(screen.getByRole('heading', { name: 'janeiro 2027', level: 3 })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'dezembro 2026', level: 3 })).toBeInTheDocument()
    })

    it('repete o cabeçalho do mês ao começar uma nova página e aplica a busca nos dois meses', async () => {
        state.transactions = Array.from({ length: 21 }, (_, index) => transaction(`set-${index}`, '2026-09-20'))
        state.transactions.push(transaction('ago', '2026-08-20'))
        render(<TransactionsPage />)

        expect(await screen.findByText('Lançamento set-20')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
        expect(screen.getByRole('heading', { name: 'setembro 2026', level: 3 })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'agosto 2026', level: 3 })).toBeInTheDocument()
        fireEvent.change(screen.getByLabelText('Buscar transações'), { target: { value: 'Lançamento ago' } })
        expect(screen.getByText('Lançamento ago')).toBeInTheDocument()
        expect(screen.getByText('Nenhum lançamento neste mês para os filtros atuais.')).toBeInTheDocument()
    })

    it('mostra recorrências como previstas nos dois meses', async () => {
        state.recurring = [{
            id: 'aluguel', description: 'Aluguel', amount: 1000, type: 'expense',
            category: 'Moradia', start_date: '2026-08-01', day_of_month: 10, active: true,
        }]
        render(<TransactionsPage />)

        await waitFor(() => expect(screen.getAllByText('Aluguel')).toHaveLength(2))
        expect(screen.getAllByText('Recorrente · previsto')).toHaveLength(2)
    })

    it('acompanha o seletor de mês e usa a data do lançamento para agrupar parcelas', async () => {
        state.transactions = [
            { ...transaction('parcela', '2026-09-05'), purchase_date: '2026-08-12' },
            transaction('julho', '2026-07-10'),
        ]
        render(<TransactionsPage />)

        expect(await screen.findByText('Lançamento parcela')).toBeInTheDocument()
        expect(screen.queryByText('Lançamento julho')).not.toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'setembro 2026', level: 3 })).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
        expect(await screen.findByText('Lançamento julho')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Resumo de agosto 2026' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'julho 2026', level: 3 })).toBeInTheDocument()
    })

    it('explica quando os dois meses estão vazios sem sugerir limpar filtros inexistentes', async () => {
        render(<TransactionsPage />)

        expect(await screen.findByRole('heading', { name: 'Sem lançamentos nestes dois meses' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Limpar Filtros' })).not.toBeInTheDocument()
    })

    it('agrupa todas as transações do mesmo dia em um balão mobile com acesso ao detalhe', async () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
        state.transactions = [
            transaction('mercado', '2026-09-22'),
            transaction('farmacia', '2026-09-22'),
            transaction('anterior', '2026-08-30'),
        ]
        render(<TransactionsPage />)

        const timeline = await screen.findByTestId('mobile-transaction-timeline')
        const day = within(timeline).getByLabelText('Transações de 22 de setembro')
        expect(within(day).getByText('Lançamento mercado')).toBeInTheDocument()
        expect(within(day).getByText('Lançamento farmacia')).toBeInTheDocument()
        expect(within(day).getAllByRole('link')).toHaveLength(2)
        expect(within(day).getByRole('link', { name: /Lançamento mercado/ })).toHaveAttribute('href', '/transactions/mercado/edit')
        expect(within(timeline).getByRole('heading', { name: 'agosto 2026', level: 3 })).toBeInTheDocument()
    })

    it('pagina por dias no mobile sem dividir um balão', async () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
        state.transactions = Array.from({ length: 22 }, (_, index) => transaction(`mesmo-dia-${index}`, '2026-09-22'))
        state.transactions.push(...Array.from({ length: 10 }, (_, index) => transaction(`outro-dia-${index}`, `2026-09-${String(21 - index).padStart(2, '0')}`)))
        render(<TransactionsPage />)

        const timeline = await screen.findByTestId('mobile-transaction-timeline')
        expect(within(timeline).getByLabelText('Transações de 22 de setembro').querySelectorAll('a')).toHaveLength(22)
        expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
        expect(within(timeline).queryByLabelText('Transações de 22 de setembro')).not.toBeInTheDocument()
        expect(within(timeline).getByLabelText('Transações de 12 de setembro')).toBeInTheDocument()
    })
})
