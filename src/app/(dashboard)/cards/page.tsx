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
    const filteredCards = cards.filter(card => selectedStatus === 'all' || card.active === (selectedStatus === 'active'))

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
        <div className="space-y-4 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center justify-between gap-3 sm:block">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tighter uppercase sm:text-3xl">Meus <span className="text-brand-accent">Cartões</span></h1>
                    <p className="hidden text-brand-gray text-xs font-bold uppercase tracking-widest opacity-60 sm:block">Gerenciamento de Crédito</p>
                </div>
                    <Link href="/cards/new" className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-brand-accent text-black shadow-[0_4px_15px_rgba(0,240,255,0.3)] sm:hidden" aria-label="Novo cartão"><Plus className="h-5 w-5" /></Link>
                </div>
                <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-4">
                    <StatusSelector
                        selectedStatus={selectedStatus}
                        onChange={setSelectedStatus}
                    />
                    <Link
                        href="/cards/new"
                        className="hidden min-h-12 min-w-12 items-center justify-center bg-gradient-to-br from-[#00F0FF] to-[#00A3FF] text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_4px_15px_rgba(0,240,255,0.3)] sm:flex"
                    >
                        <Plus className="w-6 h-6" strokeWidth={3} />
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex h-60 items-center justify-center w-full">
                    <Loader2 className="animate-spin text-brand-accent w-10 h-10" />
                </div>
            ) : filteredCards.length > 0 ? (
                <div className="grid gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCards.map((card) => (
                            <CardItem key={card.id} card={card} onUpdate={fetchCards} />
                        ))}
                </div>
            ) : cards.length > 0 ? (
                <p className="rounded-2xl border border-white/10 bg-brand-deep-sea p-6 text-center text-sm text-slate-400">Nenhum cartão corresponde ao filtro selecionado.</p>
            ) : (
                <div className="relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/5 bg-brand-deep-sea p-6 text-center shadow-2xl sm:rounded-[2.5rem] sm:p-16">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />
                    <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3 sm:mb-6 sm:rounded-3xl sm:p-6">
                        <Plus className="h-6 w-6 text-brand-gray sm:h-10 sm:w-10" strokeWidth={1} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Vazio por aqui</h3>
                    <p className="mb-5 max-w-[240px] text-sm font-medium text-brand-gray sm:mb-8">Você ainda não cadastrou nenhum cartão de crédito.</p>
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
