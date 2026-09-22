'use client'

import { useState } from 'react'
import { CardStatus, calculateCardStatus } from '@/lib/date-logic'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreditCard, CalendarCheck, CalendarX, Edit2, Trash2, Wifi } from 'lucide-react'
import Link from 'next/link'
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

export function CardItem({ card, onUpdate }: { card: Card, onUpdate?: () => void }) {
    const router = useRouter()
    const supabase = createClient()
    const status = calculateCardStatus(new Date(), card.closing_day)

    const [isUpdating, setIsUpdating] = useState(false)

    const toggleStatus = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isUpdating) return

        console.log('Iniciando toggleStatus para o cartão:', card.id, 'Status atual:', card.active)
        setIsUpdating(true)
        const newStatus = !card.active

        try {
            const { data, error } = await supabase
                .from('cards')
                .update({ active: newStatus })
                .eq('id', card.id)
                .select()

            console.log('Resposta do Supabase:', { data, error })

            if (error) throw error

            console.log('Chamando onUpdate...')
            if (onUpdate) {
                onUpdate()
            }
        } catch (error) {
            console.error('Erro detalhado no toggleStatus:', error)
            alert('Erro ao atualizar status do cartão')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDelete = async () => {
        if (window.confirm('Tem certeza que deseja excluir este cartão? ATENÇÃO: Todas as transações vinculadas a ele também serão excluídas permanentemente.')) {
            // 1. Delete linked transactions first (Client-side Cascade)
            const { error: txError } = await supabase
                .from('transactions')
                .delete()
                .eq('card_id', card.id)

            if (txError) {
                console.error('Error deleting transactions:', txError)
                alert('Erro ao excluir transações vinculadas ao cartão.')
                return
            }

            // 2. Delete the card
            const { error } = await supabase.from('cards').delete().eq('id', card.id)
            if (error) {
                alert('Erro ao excluir cartão')
                console.error(error)
            } else {
                router.refresh()
            }
        }
    }

    // Gradient Selection based on name or random? Sticking to Neo-Fintech Dark for all for consistency
    // but maybe slight variations.
    const bgClass = "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
    const borderClass = "border-slate-800"

    return (
        <div className={`relative w-full max-w-[400px] mx-auto aspect-[1.586/1] rounded-[1.5rem] p-4 sm:p-6 text-white shadow-2xl overflow-hidden isolate transform-gpu group transition-all hover:scale-[1.02] hover:shadow-brand-500/10 ${bgClass} border ${borderClass} ${!card.active ? 'opacity-50 grayscale-[0.5]' : ''}`}>

            {/* Abstract Background Shapes */}
            <div className="absolute top-[-50%] right-[-20%] w-[100%] h-[150%] bg-gradient-to-b from-brand-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-400/5 blur-2xl rounded-full pointer-events-none" />

            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />

            <div className="relative z-10 flex flex-col justify-between h-full">

                {/* Header: Chip & Contactless */}
                <div className="flex justify-between items-start">
                    <div className="w-10 h-7 sm:w-12 sm:h-9 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-inner border border-yellow-600/30 flex items-center justify-center opacity-90">
                        <div className="w-6 sm:w-8 h-full border-l border-r border-black/10 mx-auto" />
                    </div>
                    <Wifi className="w-5 sm:w-6 h-5 sm:h-6 text-slate-500 rotate-90" />
                </div>

                {/* Card Number (Masked) & Name */}
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center group-hover:translate-x-1 transition-transform">
                        <span className="font-mono text-base sm:text-xl tracking-[0.2em] text-slate-300 drop-shadow-md">
                            •••• •••• •••• {card.id.slice(0, 4)}
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[9px] sm:text-[10px] uppercase text-slate-500 tracking-widest mb-0.5">Titular</p>
                            <h3 className="font-medium text-sm sm:text-lg text-slate-100 tracking-wider uppercase truncate max-w-[130px] sm:max-w-none">{card.name}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] sm:text-[10px] uppercase text-slate-500 tracking-widest mb-0.5">Validade</p>
                            <p className="font-mono text-sm sm:text-base text-slate-100">12/30</p>
                        </div>
                    </div>
                </div>

                {/* Footer: Limit & Status */}
                <div className="pt-2 sm:pt-4 border-t border-white/10 flex justify-between items-end">
                    <div>
                        <p className="text-[9px] sm:text-[10px] uppercase text-slate-400 tracking-widest mb-0.5 sm:mb-1">Limite Disponível</p>
                        <p className="text-lg sm:text-2xl font-bold text-brand-400 tracking-tight">
                            R$ {card.limit_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    {/* Status Indicator */}
                    <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${status.isGoodDayToBuy
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                        {status.isGoodDayToBuy ? <CalendarCheck className="w-2.5 sm:w-3 h-2.5 sm:h-3" /> : <CalendarX className="w-2.5 sm:w-3 h-2.5 sm:h-3" />}
                        {status.isGoodDayToBuy ? 'Melhor Dia' : 'Fechada'}
                    </div>
                </div>
            </div>

            {/* Actions Overlay (Always visible on mobile, hover on desktop) */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1.5 sm:gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 z-20">
                <button
                    onClick={toggleStatus}
                    disabled={isUpdating}
                    className={`p-1.5 sm:p-2 rounded-full transition-all backdrop-blur-sm shadow-lg border border-white/10 cursor-pointer ${isUpdating ? 'opacity-50 scale-90' : 'hover:scale-110'} ${card.active ? 'bg-slate-800/80 text-white hover:bg-amber-500' : 'bg-amber-500 text-white hover:bg-emerald-500'}`}
                    title={card.active ? 'Inativar Cartão' : 'Ativar Cartão'}
                >
                    {isUpdating ? (
                        <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        card.active ? <CalendarX className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> : <CalendarCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    )}
                </button>
                <Link href={`/cards/${card.id}/edit`} className="p-1.5 sm:p-2 bg-slate-800/80 text-white rounded-full hover:bg-brand-500 hover:text-slate-900 transition-colors backdrop-blur-sm shadow-lg border border-white/10 cursor-pointer flex items-center justify-center" title="Editar Cartão">
                    <Edit2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </Link>
                <button onClick={handleDelete} className="p-1.5 sm:p-2 bg-slate-800/80 text-white rounded-full hover:bg-rose-500 hover:text-white transition-colors backdrop-blur-sm shadow-lg border border-white/10 cursor-pointer flex items-center justify-center" title="Excluir Cartão">
                    <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
            </div>
        </div>
    )
}
