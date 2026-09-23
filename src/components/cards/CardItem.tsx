'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { CalendarCheck, CalendarX, CreditCard, Edit2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MaskedValue } from '@/components/ui/MaskedValue'

type Card = {
    id: string
    name: string
    limit_amount: number
    closing_day: number
    due_day: number
    active: boolean
}

export function CardItem({ card, onUpdate }: { card: Card; onUpdate?: () => void }) {
    const supabase = useMemo(() => createClient(), [])
    const [isUpdating, setIsUpdating] = useState(false)

    const toggleStatus = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        if (isUpdating) return
        setIsUpdating(true)

        const { error } = await supabase.from('cards').update({ active: !card.active }).eq('id', card.id)
        setIsUpdating(false)
        if (error) {
            console.error('Erro ao atualizar cartão:', error.message)
            alert('Erro ao atualizar status do cartão')
            return
        }
        onUpdate?.()
    }

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este cartão? ATENÇÃO: Todas as transações vinculadas a ele também serão excluídas permanentemente.')) return

        const { error: txError } = await supabase.from('transactions').delete().eq('card_id', card.id)
        if (txError) {
            console.error('Erro ao excluir transações vinculadas:', txError.message)
            alert('Erro ao excluir transações vinculadas ao cartão.')
            return
        }

        const { error } = await supabase.from('cards').delete().eq('id', card.id)
        if (error) {
            console.error('Erro ao excluir cartão:', error.message)
            alert('Erro ao excluir cartão')
            return
        }
        onUpdate?.()
    }

    return (
        <article className={`min-w-0 rounded-2xl border border-white/10 bg-brand-deep-sea p-4 text-white sm:p-5 ${card.active ? '' : 'opacity-70'}`}>
            <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent" aria-hidden="true">
                    <CreditCard className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="break-words text-base font-bold leading-snug sm:text-lg">{card.name}</h2>
                    <p className="mt-0.5 text-xs text-slate-400">{card.active ? 'Ativo' : 'Inativo'} · Fecha dia {card.closing_day} · Vence dia {card.due_day}</p>
                </div>
            </div>

            <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-xs text-slate-400">Limite cadastrado</p>
                <p className="mt-0.5 break-all text-xl font-bold text-white sm:text-2xl">
                    <MaskedValue value={card.limit_amount} />
                </p>
            </div>

            <div className="mt-3 flex items-center justify-end gap-1 border-t border-white/10 pt-2">
                <button type="button" onClick={toggleStatus} disabled={isUpdating} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-white/5 disabled:opacity-40" aria-label={card.active ? `Inativar ${card.name}` : `Ativar ${card.name}`} title={card.active ? 'Inativar Cartão' : 'Ativar Cartão'}>
                    {card.active ? <CalendarX className="h-4 w-4" /> : <CalendarCheck className="h-4 w-4" />}
                </button>
                <Link href={`/cards/${card.id}/edit`} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-white/5" aria-label={`Editar ${card.name}`} title="Editar Cartão">
                    <Edit2 className="h-4 w-4" />
                </Link>
                <button type="button" onClick={handleDelete} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-rose-500/10 hover:text-rose-400" aria-label={`Excluir ${card.name}`} title="Excluir Cartão">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </article>
    )
}
