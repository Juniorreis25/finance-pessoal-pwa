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
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        async function fetchCard() {
            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Error fetching card:', error)
                router.push('/cards')
                return
            }

            setCard(data)
            setLoading(false)
        }
        fetchCard()
    }, [id, router, supabase])

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>

    return (
        <div className="mx-auto max-w-2xl py-1 sm:py-6">
            <FormPageHeader title="Editar cartão" description="Atualize o limite e as datas do cartão." />

            {card && <CardForm initialData={card} />}
        </div>
    )
}
