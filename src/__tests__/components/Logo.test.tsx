import { render, screen } from '@testing-library/react'
import { Logo } from '@/components/ui/Logo'
import { describe, it, expect, vi } from 'vitest'

describe('Logo', () => {
    it('renders the logo correctly', () => {
        render(<Logo />)
        // Check for the segments exactly to avoid ambiguity
        expect(screen.getByText('Finance')).toBeInTheDocument()
        expect(screen.getByText(/Pessoal/)).toBeInTheDocument()
        expect(screen.getByText(/Sua Vida Financeira/i)).toBeInTheDocument()
    })

    it('applies custom className to the container', () => {
        const customClass = 'w-10 h-10'
        const { container } = render(<Logo className={customClass} />)

        const logoContainer = container.querySelector(`.${customClass}`)
        expect(logoContainer).toBeDefined()
    })
})
