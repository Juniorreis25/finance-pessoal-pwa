'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CardItem } from '@/components/cards/CardItem'
import { StatusSelector, CardStatusFilter } from '@/components/ui/StatusSelector'

type Card = {
    id: string
    name: string
    limit_amount: number
    closing_day: number
    due_day: number
    user_id: string
    active: boolean
}

export default function CardsPage() {
    const supabase = useMemo(() => createClient(), [])
    const [cards, setCards] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStatus, setSelectedStatus] = useState<CardStatusFilter>('all')

    const fetchCards = useCallback(async () => {
        const { data } = await supabase
            .from('cards')
            .select('*')
            .order('active', { ascending: false })
            .order('name')
        if (data) setCards(data)
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        // The updates happen after the asynchronous Supabase request resolves.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchCards()
    }, [fetchCards])

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tighter uppercase">Meus <span className="text-brand-accent">Cartões</span></h1>
                    <p className="text-brand-gray text-xs font-bold uppercase tracking-widest opacity-60">Gerenciamento de Crédito</p>
                </div>
                <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                    <StatusSelector
                        selectedStatus={selectedStatus}
                        onChange={setSelectedStatus}
                    />
                    <Link
                        href="/cards/new"
                        className="flex min-h-12 min-w-12 items-center justify-center self-end bg-gradient-to-br from-[#00F0FF] to-[#00A3FF] text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_4px_15px_rgba(0,240,255,0.3)] sm:self-auto"
                    >
                        <Plus className="w-6 h-6" strokeWidth={3} />
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex h-60 items-center justify-center w-full">
                    <Loader2 className="animate-spin text-brand-accent w-10 h-10" />
                </div>
            ) : cards.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {cards
                        .filter(card => {
                            if (selectedStatus === 'all') return true
                            if (selectedStatus === 'active') return card.active
                            if (selectedStatus === 'inactive') return !card.active
                            return true
                        })
                        .map((card) => (
                            <CardItem key={card.id} card={card} onUpdate={fetchCards} />
                        ))}
                </div>
            ) : (
                <div className="p-16 bg-brand-deep-sea rounded-[2.5rem] border border-white/5 text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />
                    <div className="p-6 bg-white/5 rounded-3xl mb-6 border border-white/10">
                        <Plus className="w-10 h-10 text-brand-gray" strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Vazio por aqui</h3>
                    <p className="text-brand-gray text-sm mb-8 max-w-[240px] font-medium">Você ainda não conectou nenhum cartão de crédito ao seu dashboard.</p>
                    <Link
                        href="/cards/new"
                        className="bg-white text-black px-8 py-3 rounded-2xl hover:bg-brand-accent transition-all font-black uppercase tracking-tighter text-xs"
                    >
                        Conectar Cartão
                    </Link>
                </div>
            )}
        </div>
    )
}
