import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

function Fixture({ onRefresh }: { onRefresh: () => void }) {
    const pull = usePullToRefresh(onRefresh)
    return <div data-testid="scroll" onTouchStart={pull.onTouchStart} onTouchMove={pull.onTouchMove} onTouchEnd={pull.onTouchEnd} onTouchCancel={pull.onTouchCancel}><span>{pull.pullDistance}</span></div>
}

describe('atualizar ao puxar no topo', () => {
    it('atualiza somente quando o gesto passa do limite', () => {
        const onRefresh = vi.fn()
        render(<Fixture onRefresh={onRefresh} />)
        const scroll = screen.getByTestId('scroll')

        fireEvent.touchStart(scroll, { touches: [{ clientY: 0 }] })
        fireEvent.touchMove(scroll, { touches: [{ clientY: 100 }] })
        fireEvent.touchEnd(scroll)
        expect(onRefresh).not.toHaveBeenCalled()

        fireEvent.touchStart(scroll, { touches: [{ clientY: 0 }] })
        fireEvent.touchMove(scroll, { touches: [{ clientY: 150 }] })
        fireEvent.touchEnd(scroll)
        expect(onRefresh).toHaveBeenCalledOnce()
    })

    it('ignora o gesto quando a lista não está no topo', () => {
        const onRefresh = vi.fn()
        render(<Fixture onRefresh={onRefresh} />)
        const scroll = screen.getByTestId('scroll')
        Object.defineProperty(scroll, 'scrollTop', { configurable: true, value: 50 })
        fireEvent.touchStart(scroll, { touches: [{ clientY: 0 }] })
        fireEvent.touchMove(scroll, { touches: [{ clientY: 200 }] })
        fireEvent.touchEnd(scroll)
        expect(onRefresh).not.toHaveBeenCalled()
    })

    it('não atualiza ao voltar para cima quando o gesto começa no fim da lista', () => {
        const onRefresh = vi.fn()
        render(<Fixture onRefresh={onRefresh} />)
        const scroll = screen.getByTestId('scroll')
        Object.defineProperty(scroll, 'scrollTop', { configurable: true, value: 500 })

        fireEvent.touchStart(scroll, { touches: [{ identifier: 1, clientY: 200 }] })
        fireEvent.touchMove(scroll, { touches: [{ identifier: 1, clientY: 50 }] })
        fireEvent.touchEnd(scroll)

        expect(onRefresh).not.toHaveBeenCalled()
    })

    it('descarta distância residual quando um novo gesto começa fora do topo', () => {
        const onRefresh = vi.fn()
        render(<Fixture onRefresh={onRefresh} />)
        const scroll = screen.getByTestId('scroll')

        fireEvent.touchStart(scroll, { touches: [{ identifier: 1, clientY: 0 }] })
        fireEvent.touchMove(scroll, { touches: [{ identifier: 1, clientY: 150 }] })

        Object.defineProperty(scroll, 'scrollTop', { configurable: true, value: 500 })
        fireEvent.touchStart(scroll, { touches: [{ identifier: 2, clientY: 200 }] })
        fireEvent.touchEnd(scroll)

        expect(onRefresh).not.toHaveBeenCalled()
    })

    it('cancela a atualização se a lista sair do topo durante o gesto', () => {
        const onRefresh = vi.fn()
        render(<Fixture onRefresh={onRefresh} />)
        const scroll = screen.getByTestId('scroll')

        fireEvent.touchStart(scroll, { touches: [{ identifier: 1, clientY: 0 }] })
        fireEvent.touchMove(scroll, { touches: [{ identifier: 1, clientY: 150 }] })
        Object.defineProperty(scroll, 'scrollTop', { configurable: true, value: 1 })
        fireEvent.touchEnd(scroll)

        expect(onRefresh).not.toHaveBeenCalled()
    })
})
