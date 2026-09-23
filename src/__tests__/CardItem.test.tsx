import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CardItem } from '@/components/cards/CardItem'

vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ from: vi.fn() }) }))

describe('cartão compacto', () => {
    it('exibe limite cadastrado, vencimento e ações sem dados fictícios', () => {
        render(<CardItem card={{ id: 'card-1', name: 'Cartão da família com nome extenso', limit_amount: 4500, closing_day: 10, due_day: 18, active: true }} />)
        expect(screen.getByText('Cartão da família com nome extenso')).toBeInTheDocument()
        expect(screen.getByText('Limite cadastrado')).toBeInTheDocument()
        expect(screen.getByText('R$ 4.500,00')).toBeInTheDocument()
        expect(screen.getByText(/Fecha dia 10 · Vence dia 18/)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Editar Cartão da família com nome extenso' })).toHaveAttribute('href', '/cards/card-1/edit')
        expect(screen.queryByText('12/30')).not.toBeInTheDocument()
    })
})
