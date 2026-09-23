'use client'

import { TransactionForm } from '@/components/forms/TransactionForm'
import { FormPageHeader } from '@/components/ui/FormPageHeader'

export default function NewTransactionPage() {
    return (
        <div className="mx-auto max-w-xl py-1 sm:py-6">
            <FormPageHeader title="Nova transação" description="Registre uma receita ou despesa." />

            <TransactionForm />
        </div>
    )
}
