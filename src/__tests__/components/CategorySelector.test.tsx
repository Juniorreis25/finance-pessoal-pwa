import { render, screen, fireEvent } from '@testing-library/react'
import { CategorySelector } from '@/components/ui/CategorySelector'
import { describe, it, expect, vi } from 'vitest'

describe('CategorySelector', () => {
    it('renders all categories from the list', () => {
        const onCategoryChange = vi.fn()
        render(<CategorySelector selectedCategory="" onCategoryChange={onCategoryChange} />)

        expect(screen.getByText('Todas Categorias')).toBeDefined()
        // Check for some known categories
        expect(screen.getByText('Alimentação')).toBeDefined()
        expect(screen.getByText('Salário')).toBeDefined()
    })

    it('calls onCategoryChange when an option is selected', () => {
        const onCategoryChange = vi.fn()
        render(<CategorySelector selectedCategory="" onCategoryChange={onCategoryChange} />)

        const select = screen.getByLabelText('Selecionar Categoria')
        fireEvent.change(select, { target: { value: 'Salário' } })

        expect(onCategoryChange).toHaveBeenCalledWith('Salário')
    })

    it('shows the correct selected option', () => {
        const onCategoryChange = vi.fn()
        render(<CategorySelector selectedCategory="Lazer" onCategoryChange={onCategoryChange} />)

        const select = screen.getByLabelText('Selecionar Categoria') as HTMLSelectElement
        expect(select.value).toBe('Lazer')
    })
})
