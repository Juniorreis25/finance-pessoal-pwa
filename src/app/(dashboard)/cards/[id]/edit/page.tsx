'use client'

import { useEffect, useMemo, useState, use } from 'react'
import { CardForm } from '@/components/forms/AddCardForm'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FormPageHeader } from '@/components/ui/FormPageHeader'

type Card = {
    id: string
    name: string
    limit_amount: number
    closing_day: number
    due_day: number
    active: boolean
}

export default function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [card, setCard] = useState<Card | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        async function fetchCard() {
            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !data) {
                setError('Não foi possível carregar este cartão. Volte à lista e tente novamente.')
                setLoading(false)
                return
            }

            setCard(data)
            setLoading(false)
        }
        fetchCard().catch(() => {
            setError('Não foi possível carregar este cartão. Volte à lista e tente novamente.')
            setLoading(false)
        })
    }, [id, router, supabase])

    if (loading) return <div role="status" className="flex min-h-48 items-center justify-center text-sm text-brand-gray">Carregando cartão…</div>

    return (
        <div className="mx-auto max-w-xl py-1 sm:py-6">
            <FormPageHeader title="Editar cartão" description="Atualize o limite e as datas do cartão." />

            {error && <div role="alert" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm leading-relaxed text-rose-200">{error}<button type="button" className="ml-2 min-h-11 font-semibold underline underline-offset-4" onClick={() => router.push('/cards')}>Voltar aos cartões</button></div>}
            {card && <CardForm initialData={card} />}
        </div>
    )
}
