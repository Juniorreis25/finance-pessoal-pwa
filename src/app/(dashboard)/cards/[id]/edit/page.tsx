'use client'

import { useEffect, useState, use } from 'react'
import { CardForm } from '@/components/forms/AddCardForm'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
    const supabase = createClient()

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
    }, [id, router])

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Editar Cartão</h1>
                <p className="text-slate-500 dark:text-slate-400">Atualize as informações do seu cartão para manter sua gestão financeira atualizada.</p>
            </div>

            {card && <CardForm initialData={card} />}
        </div>
    )
}
