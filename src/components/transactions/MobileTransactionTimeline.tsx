'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, ChevronRight, CreditCard, Repeat2, Wallet } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MaskedValue } from '@/components/ui/MaskedValue'

export type TimelineTransaction = {
    id: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    date: string
    card_id: string | null
    installment_number: number | null
    total_installments: number | null
    is_recurring?: boolean
    cards: { name: string } | null
}

export type TransactionDay = {
    date: string
    transactions: TimelineTransaction[]
}

export function groupTransactionsByDay(transactions: TimelineTransaction[]): TransactionDay[] {
    const days: TransactionDay[] = []
    for (const transaction of transactions) {
        const lastDay = days.at(-1)
        if (lastDay?.date === transaction.date) {
            lastDay.transactions.push(transaction)
        } else {
            days.push({ date: transaction.date, transactions: [transaction] })
        }
    }
    return days
}

function TransactionRow({ transaction: tx }: { transaction: TimelineTransaction }) {
    const href = tx.is_recurring ? '/recurring' : `/transactions/${tx.id}/edit`
    const method = tx.cards?.name || 'Dinheiro/Débito'
    const installment = tx.installment_number && tx.total_installments && tx.total_installments > 1
        ? ` · Parcela ${tx.installment_number}/${tx.total_installments}`
        : ''

    return (
        <Link
            href={href}
            className="flex min-h-[62px] items-center gap-2.5 border-b border-white/5 px-3 py-2.5 last:border-b-0 active:bg-white/5"
            aria-label={`${tx.description}, ${tx.type === 'income' ? 'entrada' : 'saída'} de R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${tx.is_recurring ? ', recorrente prevista' : ''}`}
        >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ${tx.type === 'income' ? 'text-brand-success' : 'text-brand-accent'}`} aria-hidden="true">
                {tx.is_recurring ? <Repeat2 className="h-4 w-4" /> : tx.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">{tx.description}</span>
                <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-400">
                    {tx.card_id ? <CreditCard className="h-3 w-3 shrink-0" aria-hidden="true" /> : <Wallet className="h-3 w-3 shrink-0" aria-hidden="true" />}
                    <span className="truncate">{tx.category} · {tx.is_recurring ? 'Recorrente · previsto' : method}{installment}</span>
                </span>
            </span>
            <span className={`shrink-0 whitespace-nowrap text-right text-[13px] font-bold tabular-nums ${tx.type === 'income' ? 'text-brand-success' : 'text-white'}`}>
                <MaskedValue value={tx.amount} prefix={tx.type === 'income' ? '+ R$ ' : '− R$ '} />
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        </Link>
    )
}

export function MobileTransactionTimeline({ days, previousMonthHasTransactions, isLastPage, previousMonthDate }: {
    days: TransactionDay[]
    previousMonthHasTransactions: boolean
    isLastPage: boolean
    previousMonthDate: Date
}) {
    return (
        <div className="space-y-4 sm:hidden" data-testid="mobile-transaction-timeline">
            {days.map((day, index) => {
                const monthKey = day.date.slice(0, 7)
                const startsMonth = index === 0 || days[index - 1].date.slice(0, 7) !== monthKey
                const date = parseISO(day.date)
                return (
                    <div key={day.date}>
                        {startsMonth && (
                            <h3 className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-accent">
                                <span>{format(date, 'MMMM yyyy', { locale: ptBR })}</span>
                                <span className="h-px flex-1 bg-white/15" aria-hidden="true" />
                            </h3>
                        )}
                        <h4 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {format(date, "dd 'de' MMMM · EEEE", { locale: ptBR })}
                        </h4>
                        <div className="overflow-hidden rounded-[20px] border border-white/10 bg-brand-deep-sea/90" aria-label={`Transações de ${format(date, "dd 'de' MMMM", { locale: ptBR })}`}>
                            {day.transactions.map(tx => <TransactionRow key={tx.id} transaction={tx} />)}
                        </div>
                    </div>
                )
            })}
            {isLastPage && !previousMonthHasTransactions && (
                <div>
                    <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-accent">
                        <span>{format(previousMonthDate, 'MMMM yyyy', { locale: ptBR })}</span>
                        <span className="h-px flex-1 bg-white/15" aria-hidden="true" />
                    </h3>
                    <p className="pt-3 text-sm text-slate-400">Nenhum lançamento neste mês para os filtros atuais.</p>
                </div>
            )}
        </div>
    )
}
