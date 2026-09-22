'use client'

import { CardForm } from '@/components/forms/AddCardForm'

export default function NewCardPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Novo Cartão</h1>
                <p className="text-slate-500 dark:text-slate-400">Cadastre seu cartão de crédito para gerenciar suas faturas e limites.</p>
            </div>

            <CardForm />
        </div>
    )
}
