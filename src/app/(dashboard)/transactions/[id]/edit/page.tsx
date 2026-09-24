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
    installment_id?: string | null
    installment_number?: number | null
    total_installments?: number | null
    installment_total_amount?: number
}

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [transaction, setTransaction] = useState<Transaction | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        async function fetchTransaction() {
            if (isLocalDemoMode) {
                router.push('/transactions')
                setLoading(false)
                return
            }
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                setError('Não foi possível carregar esta transação. Volte à lista e tente novamente.')
                setLoading(false)
                return
            }

            if (data.installment_id) {
                const { data: series, error: seriesError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('installment_id', data.installment_id)
                    .order('installment_number', { ascending: true })

                if (seriesError || !series?.length || series.length !== data.total_installments) {
                    setError('Não foi possível carregar todas as parcelas desta série. Nenhuma alteração foi feita.')
                    setLoading(false)
                    return
                }

                const firstInstallment = series[0]
                const description = firstInstallment.description.replace(/\s+\(\d+\/\d+\)$/, '')
                setTransaction({
                    ...firstInstallment,
                    description,
                    amount: series.reduce((total, installment) => total + Math.round(Number(installment.amount) * 100), 0) / 100,
                    installment_total_amount: series.reduce((total, installment) => total + Math.round(Number(installment.amount) * 100), 0) / 100,
                })
            } else {
                setTransaction(data)
            }
            setLoading(false)
        }
        fetchTransaction().catch(() => {
            setError('Não foi possível carregar esta transação. Volte à lista e tente novamente.')
            setLoading(false)
        })
    }, [id, router, supabase])

    if (loading) return <div role="status" className="flex min-h-48 items-center justify-center text-sm text-brand-gray">Carregando transação…</div>

    return (
        <div className="mx-auto max-w-xl py-1 sm:py-6">
            <FormPageHeader title="Editar transação" description="Atualize os dados deste lançamento." />

            {error && <div role="alert" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm leading-relaxed text-rose-200">{error}<button type="button" className="ml-2 min-h-11 font-semibold underline underline-offset-4" onClick={() => router.push('/transactions')}>Voltar às transações</button></div>}
            {transaction && <TransactionForm initialData={transaction} />}
        </div>
    )
}
