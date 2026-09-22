import { render, screen } from '@testing-library/react'
import { MaskedValue } from '@/components/ui/MaskedValue'
import { describe, it, expect, vi } from 'vitest'
import { usePrivacy } from '@/providers/PrivacyProvider'

// Mock usePrivacy hook
vi.mock('@/providers/PrivacyProvider', () => ({
    usePrivacy: vi.fn()
}))

describe('MaskedValue', () => {
    it('renders visible value when isValuesVisible is true', () => {
        vi.mocked(usePrivacy).mockReturnValue({
            isValuesVisible: true,
            toggleVisibility: vi.fn()
        })

        render(<MaskedValue value={1234.56} />)

        // Check if the formatted value appears (pt-BR used in component: R$ 1.234,56)
        expect(screen.getByText(/R\$\s1\.234,56/)).toBeDefined()
    })

    it('renders masked value when isValuesVisible is false', () => {
        vi.mocked(usePrivacy).mockReturnValue({
            isValuesVisible: false,
            toggleVisibility: vi.fn()
        })

        render(<MaskedValue value={1234.56} />)

        expect(screen.getByText('••••••')).toBeDefined()
    })

    it('applies custom prefix and className', () => {
        vi.mocked(usePrivacy).mockReturnValue({
            isValuesVisible: true,
            toggleVisibility: vi.fn()
        })

        const customClass = "test-class"
        const customPrefix = "$"
        render(<MaskedValue value={50} prefix={customPrefix} className={customClass} />)

        const valueSpan = screen.getByText(/\$50,00/)
        expect(valueSpan.className).toContain(customClass)
    })
})
