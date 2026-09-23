'use client'

import { useEffect, useMemo, useState, use } from 'react'
import { TransactionForm } from '@/components/forms/TransactionForm'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { isLocalDemoMode } from '@/lib/local-demo'
import { FormPageHeader } from '@/components/ui/FormPageHeader'

type Transaction = {
    id: string
    description: string
    amount: number
    category: string
    date: string
    type: 'income' | 'expense'
    card_id?: string | null
    purchase_date?: string | null
}

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [transaction, setTransaction] = useState<Transaction | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        async function fetchTransaction() {
            if (isLocalDemoMode) {
                router.push('/transactions')
                return
            }
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Error fetching transaction:', error)
                router.push('/transactions')
                return
            }

            setTransaction(data)
            setLoading(false)
        }
        fetchTransaction()
    }, [id, router, supabase])

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>

    return (
        <div className="mx-auto max-w-2xl py-1 sm:py-6">
            <FormPageHeader title="Editar transação" description="Atualize os dados deste lançamento." />

            {transaction && <TransactionForm initialData={transaction} />}
        </div>
    )
}
