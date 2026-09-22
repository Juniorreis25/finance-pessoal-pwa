'use client'

import { TransactionForm } from '@/components/forms/TransactionForm'

export default function NewTransactionPage() {
    return (
        <div className="max-w-xl mx-auto py-4">
            <div className="mb-6 px-4">
                <h1 className="text-4xl font-extrabold text-white tracking-tighter uppercase mb-1">
                    Nova <span className="text-brand-accent">Transação</span>
                </h1>
                <p className="text-brand-gray text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Registro de Fluxo Financeiro</p>
            </div>

            <TransactionForm />
        </div>
    )
}
