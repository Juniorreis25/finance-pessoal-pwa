import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { OverviewChart } from '@/components/charts/OverviewChart'
import { CategoryChart } from '@/components/charts/CategoryChart'
import { FixedVsCardChart } from '@/components/charts/FixedVsCardChart'
import { CardDistributionChart } from '@/components/charts/CardDistributionChart'

const originalWidth = window.innerWidth

beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
})

afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
})

describe('gráficos do dashboard em telas mobile', () => {
    it('alterna a série anual e permite consultar o valor de outro mês', async () => {
        render(<OverviewChart data={[
            { name: 'jan.', receita: 1200, despesa: 800 },
            { name: 'fev.', receita: 1500, despesa: 900 },
        ]} currentMonth={0} />)

        const seriesGroup = await screen.findByRole('group', { name: 'Série do gráfico anual' })
        const incomeButton = screen.getByRole('button', { name: 'Ganhos' })
        fireEvent.click(incomeButton)
        expect(incomeButton).toHaveAttribute('aria-pressed', 'true')

        fireEvent.change(screen.getByLabelText('Detalhe do mês'), { target: { value: '1' } })
        expect(screen.getByText(/1\.500,00/)).toBeInTheDocument()
        expect(seriesGroup).toBeInTheDocument()
    })

    it('mostra cinco categorias inicialmente e permite expandir a lista', async () => {
        render(<CategoryChart data={Array.from({ length: 6 }, (_, index) => ({
            name: `Categoria ${index + 1}`,
            value: 600 - index * 50,
            color: '',
        }))} />)

        await screen.findByText('Despesas por categoria neste mês')
        expect(screen.queryByText('Categoria 6')).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Ver todas (6)' }))
        expect(screen.getByText('Categoria 6')).toBeInTheDocument()
    })

    it('apresenta os valores e proporções sem pizza para recorrentes e cartões', async () => {
        render(<FixedVsCardChart data={[
            { name: 'Recorrentes', value: 750 },
            { name: 'Cartões', value: 1250 },
        ]} />)

        expect(await screen.findByRole('img', { name: 'Recorrentes 38%, cartões 63%' })).toBeInTheDocument()
        expect(screen.getByText(/750,00/)).toBeInTheDocument()
        expect(screen.getByText(/1\.250,00/)).toBeInTheDocument()
    })

    it('preserva o nome completo do cartão e oferece expansão quando há vários', async () => {
        render(<CardDistributionChart data={[
            { name: 'Cartão Azul Internacional', valor: 900 },
            { name: 'Cartão Verde', valor: 700 },
            { name: 'Cartão Família', valor: 500 },
            { name: 'Cartão Reserva', valor: 300 },
        ]} />)

        expect(await screen.findByText('Cartão Azul Internacional')).toBeInTheDocument()
        expect(screen.queryByText('Cartão Reserva')).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Ver todos (4)' }))
        expect(screen.getByText('Cartão Reserva')).toBeInTheDocument()
    })
})
