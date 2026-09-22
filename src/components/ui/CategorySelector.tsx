'use client'

import { Filter } from 'lucide-react'

type CategorySelectorProps = {
    selectedCategory: string
    onCategoryChange: (category: string) => void
}

export function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
    const expenseCategories = ['Alimentação', 'Educação', 'Empréstimo', 'Financiamento', 'Lazer', 'Moradia', 'Saúde', 'Transporte', 'Outros']
    const incomeCategories = ['Freelance', 'Investimentos', 'Salário', 'Outros']
    // Combine unique categories and sort
    const allCategories = Array.from(new Set([...expenseCategories, ...incomeCategories])).sort()

    return (
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
            </div>
            <select
                id="category-select"
                aria-label="Selecionar Categoria"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-brand-500/30 transition-all cursor-pointer appearance-none min-w-[140px] dark:[color-scheme:dark]"
            >
                <option value="">Todas Categorias</option>
                {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>
            {/* Custom Arrow */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
    )
}
