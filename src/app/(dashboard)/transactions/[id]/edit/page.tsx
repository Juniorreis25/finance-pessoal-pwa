'use client'

import { useEffect, useState, use } from 'react'
import { TransactionForm } from '@/components/forms/TransactionForm'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { isLocalDemoMode } from '@/lib/local-demo'

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
    const supabase = createClient()

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
    }, [id, router])

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Editar Transação</h1>
                <p className="text-slate-500 dark:text-slate-400">Atualize os dados do lançamento para manter seus registros precisos.</p>
            </div>

            {transaction && <TransactionForm initialData={transaction} />}
        </div>
    )
}
