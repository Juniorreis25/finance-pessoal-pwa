
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, ArrowDownRight, ArrowUpRight, ArrowRightLeft, Edit2, Trash2, Search, CreditCard, Wallet, CalendarRange, ListTree } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, addMonths, subMonths, parseISO, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { usePrivacy } from '@/providers/PrivacyProvider'
import { MaskedValue } from '@/components/ui/MaskedValue'
import { MethodSelector } from '@/components/ui/MethodSelector'
import { TypeSelector } from '@/components/ui/TypeSelector'
import { ExportMenu } from '@/components/ui/ExportMenu'
import { isDateInCalendarMonth, isRecurringActiveForMonth } from '@/lib/date-logic'
import { getLocalDemoRecurring, getLocalDemoTransactions, isLocalDemoMode } from '@/lib/local-demo'
import { getRecurringOccurrenceDate } from '@/lib/recurring-logic'

type Transaction = {
    id: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    date: string
    purchase_date: string | null
    card_id: string | null
    installment_id: string | null
    installment_number: number | null
    total_installments: number | null
    is_recurring?: boolean
    recurring_id?: string
    cards: {
        name: string
    } | null
}

type RecurringExpense = {
    id: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    start_date: string
    day_of_month: number
    active: boolean
}

type Card = {
    id: string
    name: string
}

const TRANSACTIONS_PER_PAGE = 20

export default function TransactionsPage() {
    const supabase = createClient()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
    const [cards, setCards] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>(['all'])
    const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const { isValuesVisible, toggleVisibility } = usePrivacy()

    const fetchData = useCallback(async () => {
        setLoading(true)

        if (isLocalDemoMode) {
            setTransactions(getLocalDemoTransactions().map(transaction => ({ ...transaction, cards: null })))
            setRecurringExpenses(getLocalDemoRecurring().filter(recurring => recurring.active))
            setCards([])
            setLoading(false)
            return
        }

        const monthStart = startOfMonth(currentDate)
        const nextMonthStart = addMonths(monthStart, 1)
        const firstDate = format(monthStart, 'yyyy-MM-dd')
        const nextMonthDate = format(nextMonthStart, 'yyyy-MM-dd')
        const pageSize = 500
        const transactionRows: Transaction[] = []
        let offset = 0
        let transactionError: string | null = null

        const cardsRequest = supabase
            .from('cards')
            .select('id, name')
            .eq('active', true)
            .order('name')
        const recurringRequest = supabase
            .from('recurring_expenses')
            .select('id, description, amount, type, category, start_date, day_of_month, active')
            .eq('active', true)
        const cardsPromise = cardsRequest.then(result => result)
        const recurringPromise = recurringRequest.then(result => result)

        while (true) {
            const { data, error } = await supabase
                .from('transactions')
                .select('id, description, amount, type, category, date, purchase_date, card_id, installment_id, installment_number, total_installments, cards(name)')
                .gte('date', firstDate)
                .lt('date', nextMonthDate)
                .order('date', { ascending: false })
                .order('id', { ascending: false })
                .range(offset, offset + pageSize - 1)

            if (error) {
                transactionError = error.message
                break
            }

            const page = (data || []).map(row => {
                const cardRelation = row.cards as unknown as { name: string } | { name: string }[] | null
                return {
                    ...row,
                    cards: Array.isArray(cardRelation) ? cardRelation[0] ?? null : cardRelation,
                }
            }) as Transaction[]
            transactionRows.push(...page)
            if (page.length < pageSize) break
            offset += pageSize
        }

        const [cardsResult, recurringResult] = await Promise.all([cardsPromise, recurringPromise])

        if (transactionError) {
            console.error('Erro ao carregar transações:', transactionError)
        } else {
            setTransactions(transactionRows)
        }
        if (cardsResult.error) {
            console.error('Erro ao carregar cartões:', cardsResult.error.message)
        } else {
            setCards(cardsResult.data || [])
        }
        if (recurringResult.error) {
            console.error('Erro ao carregar recorrências:', recurringResult.error.message)
        } else {
            setRecurringExpenses(recurringResult.data || [])
        }

        setLoading(false)
    }, [supabase, currentDate])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData()
        }, 0)
        return () => clearTimeout(timeoutId)
    }, [fetchData])

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
            const { error } = await supabase.from('transactions').delete().eq('id', id)
            if (error) {
                alert('Erro ao excluir transação')
                console.error(error)
            } else {
                fetchData()
            }
        }
    }

    // Filter transactions by selected month, search term and card
    const filteredTransactions = transactions.filter(tx => {
        const matchesDate = isDateInCalendarMonth(tx.date, currentDate)

        const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.category.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCard = selectedCardIds.includes('all') ||
            (selectedCardIds.includes('cash') && !tx.card_id) ||
            (tx.card_id && selectedCardIds.includes(tx.card_id))

        const matchesType = selectedType === 'all' || tx.type === selectedType

        return matchesDate && matchesSearch && matchesCard && matchesType
    })

    const recurringOccurrences: Transaction[] = recurringExpenses
        .filter(recurring => {
            const occurrenceDate = getRecurringOccurrenceDate(recurring, currentDate)
            const matchesSearch = recurring.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recurring.category.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesType = selectedType === 'all' || recurring.type === selectedType
            const matchesMethod = selectedCardIds.includes('all') || selectedCardIds.includes('cash')

            return Boolean(occurrenceDate) && matchesSearch && matchesType && matchesMethod
        })
        .map(recurring => ({
            id: `recurring-${recurring.id}-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
            recurring_id: recurring.id,
            is_recurring: true,
            description: recurring.description,
            amount: recurring.amount,
            type: recurring.type,
            category: recurring.category,
            date: getRecurringOccurrenceDate(recurring, currentDate)!,
            purchase_date: null,
            card_id: null,
            installment_id: null,
            installment_number: null,
            total_installments: null,
            cards: null,
        }))

    const displayedTransactions = [...filteredTransactions, ...recurringOccurrences]
        .sort((a, b) => b.date.localeCompare(a.date))
    const totalPages = Math.max(1, Math.ceil(displayedTransactions.length / TRANSACTIONS_PER_PAGE))
    const visiblePage = Math.min(currentPage, totalPages)
    const paginatedTransactions = displayedTransactions.slice(
        (visiblePage - 1) * TRANSACTIONS_PER_PAGE,
        visiblePage * TRANSACTIONS_PER_PAGE
    )

    // Calculate totals
    // Calculate totals including recurring items
    const totalRecurringIncome = recurringExpenses
        .filter(re => isRecurringActiveForMonth(re.start_date, currentDate))
        .filter(re => re.type === 'income')
        .reduce((acc, re) => acc + re.amount, 0)

    const totalRecurringExpense = recurringExpenses
        .filter(re => isRecurringActiveForMonth(re.start_date, currentDate))
        .filter(re => re.type === 'expense')
        .reduce((acc, re) => acc + re.amount, 0)

    const totalTxIncome = filteredTransactions
        .filter(tx => tx.type === 'income')
        .reduce((acc, tx) => acc + tx.amount, 0)

    // Ganho total do mês
    const totalIncome = totalTxIncome + totalRecurringIncome

    // Apenas Saídas em Dinheiro/Débito (pontuais sem cartão)
    const totalCashExpense = filteredTransactions
        .filter(tx => tx.type === 'expense' && !tx.card_id)
        .reduce((acc, tx) => acc + tx.amount, 0)

    // Apenas Gastos em Cartão (pontuais)
    const totalCardExpense = filteredTransactions
        .filter(tx => tx.type === 'expense' && tx.card_id)
        .reduce((acc, tx) => acc + tx.amount, 0)

    // Soma total das despesas explicadas (Recorr + Dinheiro + Cartão)
    const grandTotalExpense = totalRecurringExpense + totalCashExpense + totalCardExpense

    // Soma apenas lançamentos pontuais (Cartão + Dinheiro/Débito) solicitados pelo usuário
    const pointualTotal = totalCardExpense + totalCashExpense

    // Saldo projetado (Saldo Disponível)
    const projectedBalance = totalIncome - grandTotalExpense


    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {isLocalDemoMode && (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-xs font-bold text-amber-200">
                    Modo demonstracao local: os dados exibidos sao simulados e nenhuma alteracao sera enviada ao banco.
                </div>
            )}
            {/* Header with Title and Global Action */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Transações</h1>
                    <p className="text-slate-400">Gerencie suas entradas e saídas.</p>
                </div>

                <Link
                    href="/transactions/new"
                    className="flex items-center justify-center w-[52px] h-[52px] bg-gradient-to-br from-[#00F0FF] to-[#00A3FF] text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(0,240,255,0.3)] cursor-pointer"
                    title="Nova Transação"
                >
                    <Plus className="w-6 h-6" strokeWidth={3} />
                </Link>
            </div>

            {/* Unified Toolbar: Professional Distribution */}
            <div className="flex flex-col lg:flex-row gap-3 items-center w-full">
                {/* 1. Date Navigation */}
                <div className="w-full lg:w-auto">
                    <MonthSelector
                        currentDate={currentDate}
                        onDateChange={(date) => {
                            setCurrentDate(date)
                            setCurrentPage(1)
                        }}
                    />
                </div>

                {/* 2. Flexible Search Bar (Fills remaining center space) */}
                <div className="relative flex-1 w-full lg:min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
                    <label htmlFor="search-transactions" className="sr-only">Buscar transações</label>
                    <input
                        id="search-transactions"
                        placeholder="Buscar transações..."
                        className="w-full pl-11 pr-4 py-3 bg-brand-deep-sea border border-white/5 rounded-2xl text-sm focus:border-brand-accent/50 outline-none transition-all text-white placeholder:text-brand-gray/50 h-[52px] shadow-xl"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1)
                        }}
                    />
                </div>

                {/* 3. Dropdown Filters Group */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <TypeSelector
                        selectedType={selectedType}
                        onChange={(type) => {
                            setSelectedType(type)
                            setCurrentPage(1)
                        }}
                    />
                    <MethodSelector
                        cards={cards}
                        selectedIds={selectedCardIds}
                        onChange={(ids) => {
                            setSelectedCardIds(ids)
                            setCurrentPage(1)
                        }}
                    />
                    <ExportMenu
                        transactions={filteredTransactions}
                        currentDate={currentDate}
                    />
                </div>
            </div>

            {/* Master Summary Card - Expense Focus */}
            <div className="relative overflow-hidden bg-brand-deep-sea border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-success/5 blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        {/* Left Side: Total (Cartão + Dinheiro) */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-brand-accent" />
                                    <span>Total (Cartão + Dinheiro)</span>
                                </div>
                                <button
                                    onClick={toggleVisibility}
                                    className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                                    aria-label={isValuesVisible ? "Ocultar valores" : "Mostrar valores"}
                                >
                                    {isValuesVisible ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" /><circle cx="12" cy="12" r="3" /></svg>
                                    )}
                                </button>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                                <MaskedValue value={pointualTotal} prefix={isValuesVisible ? "- R$ " : ""} />
                            </h2>
                        </div>

                        {/* Right Side: Specific Totals */}
                        <div className="flex flex-col sm:flex-row gap-8">
                            <div className="flex items-center gap-3 group">
                                <div className="p-3 bg-brand-accent/10 rounded-2xl text-brand-accent border border-brand-accent/10 group-hover:bg-brand-accent/20 transition-all">
                                    <CreditCard className="w-5 h-5 font-bold" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cartão</p>
                                    <p className="text-lg font-bold text-slate-200 leading-tight">
                                        <MaskedValue value={totalCardExpense} prefix={isValuesVisible ? "- R$ " : ""} />
                                    </p>
                                </div>
                            </div>

                            <div className="hidden sm:block w-px h-12 bg-white/5" />

                            <div className="flex items-center gap-3 group">
                                <div className="p-3 bg-brand-success/10 rounded-2xl text-brand-success border border-brand-success/10 group-hover:bg-brand-success/20 transition-all">
                                    <Wallet className="w-5 h-5 font-bold" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dinheiro/Débito</p>
                                    <p className="text-lg font-bold text-slate-200 leading-tight">
                                        <MaskedValue value={totalCashExpense} prefix={isValuesVisible ? "- R$ " : ""} />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Summary Divider */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    {/* Cash Flow Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ArrowUpRight className="w-3 h-3 text-brand-success" />
                                Receita
                            </p>
                            <p className="text-xl font-bold text-brand-success">
                                <MaskedValue value={totalIncome} prefix={isValuesVisible ? "R$ " : ""} />
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ArrowDownRight className="w-3 h-3 text-rose-500" />
                                Despesas
                            </p>
                            <p className="text-xl font-bold text-rose-500">
                                <MaskedValue value={grandTotalExpense} prefix={isValuesVisible ? "- R$ " : ""} />
                            </p>
                        </div>

                        <div className="space-y-1 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Total (Saldo)
                            </p>
                            <p className={`text-xl font-black ${projectedBalance >= 0 ? 'text-brand-accent' : 'text-rose-500'}`}>
                                <MaskedValue value={Math.abs(projectedBalance)} prefix={isValuesVisible ? (projectedBalance >= 0 ? "R$ " : "- R$ ") : ""} />
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction List - Floating Blocks */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 flex justify-center">
                        <div className="animate-pulse flex flex-col gap-2">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                    </div>
                ) : displayedTransactions.length > 0 ? (
                    paginatedTransactions.map((tx) => {
                        const isInstallment = tx.installment_id && tx.total_installments && tx.total_installments > 1

                        // Calculate installment dates if applicable
                        let firstDate: Date | null = null
                        let lastDate: Date | null = null

                        if (isInstallment && tx.installment_number) {
                            const txDate = parseISO(tx.date)
                            firstDate = subMonths(txDate, tx.installment_number - 1)
                            lastDate = addMonths(firstDate, tx.total_installments! - 1)
                        }

                        return (
                            <div
                                key={tx.id}
                                className="relative group bg-brand-deep-sea/80 backdrop-blur-sm p-5 sm:p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/5 shadow-xl hover:bg-brand-deep-sea transition-all"
                            >
                                {/* Left: Icon & Info */}
                                <div className="flex items-start sm:items-center gap-4 sm:gap-5 w-full sm:w-auto">
                                    <div className={`p-3.5 sm:p-4 rounded-2xl border flex-shrink-0 ${tx.type === 'income'
                                        ? 'bg-brand-success/10 text-brand-success border-brand-success/10'
                                        : 'bg-white/5 text-white border-white/10'
                                        }`}>
                                        {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 font-bold" /> : <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6 font-bold" />}
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <h3 className="font-bold text-white text-base sm:text-lg tracking-tight leading-none truncate max-w-[180px] sm:max-w-none">{tx.description}</h3>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 flex-shrink-0">
                                                {tx.card_id ? (
                                                    <CreditCard className="w-3 h-3 text-brand-accent opacity-70" />
                                                ) : (
                                                    <Wallet className="w-3 h-3 text-brand-gray opacity-50" />
                                                )}
                                                <span className="text-[9px] font-bold text-brand-gray uppercase tracking-wider">
                                                    {tx.cards?.name || 'Dinheiro/Débito'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Installment Info */}
                                        {isInstallment && (
                                            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 py-0.5 sm:py-1">
                                                <div className="flex items-center gap-1.5 text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-md border border-brand-accent/10">
                                                    <ListTree className="w-3 h-3" />
                                                    <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase">
                                                        Parcela {tx.installment_number}/{tx.total_installments}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-brand-gray opacity-60">
                                                    <CalendarRange className="w-3 h-3" />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider">
                                                        {format(firstDate!, "MMM yy", { locale: ptBR })} ➜ {format(lastDate!, "MMM yy", { locale: ptBR })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 sm:py-1 rounded-full bg-white/5 text-brand-gray border border-white/5">
                                                {tx.category}
                                            </span>
                                            {!isInstallment && (
                                                <span className="text-[11px] sm:text-xs font-bold text-brand-gray uppercase tracking-widest opacity-60">
                                                    {format(parseISO(tx.date), "d 'de' MMM", { locale: ptBR })}
                                                </span>
                                            )}
                                            {tx.purchase_date && (
                                                <span className={`text-[9px] font-bold text-brand-accent/50 uppercase tracking-widest ${!isInstallment ? 'border-l border-white/10 pl-2 sm:pl-3' : ''}`}>
                                                    Dt Compra: {format(parseISO(tx.purchase_date), "dd/MM/yy")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Amount & Actions */}
                                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto pt-3 sm:pt-0 border-t border-white/5 sm:border-0">
                                    <span className={`text-lg sm:text-xl font-black tracking-tighter ${tx.type === 'income' ? 'text-brand-success' : 'text-white'
                                        }`}>
                                        {tx.type === 'expense' && '- '}
                                        R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>

                                    {/* Actions */}
                                    {tx.is_recurring ? (
                                        <Link
                                            href="/recurring"
                                            className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-brand-success bg-brand-success/10 border border-brand-success/10 rounded-xl"
                                            title="Gerenciar recorrência"
                                        >
                                            Recorrente
                                        </Link>
                                    ) : (
                                        <div className="flex gap-0.5 sm:gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all lg:translate-x-2 lg:group-hover:translate-x-0">
                                            <Link href={`/transactions/${tx.id}/edit`} className="p-2 text-brand-gray hover:text-brand-accent hover:bg-white/5 rounded-xl transition-all" title="Editar">
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button onClick={() => handleDelete(tx.id)} className="p-2 text-brand-gray hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer" title="Excluir">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                        )
                    })
                ) : (
                    <div className="p-16 text-center flex flex-col items-center bg-slate-900 rounded-3xl border border-slate-800 border-dashed">
                        <div className="p-4 bg-slate-800 rounded-full mb-4">
                            <ArrowRightLeft className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Sem transações para este filtro</h3>
                        <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                            Tente ajustar seus filtros ou mude o período selecionado.
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setSelectedCardIds(['all'])
                                setSelectedType('all')
                                setCurrentPage(1)
                            }}
                            className="text-brand-accent font-bold hover:underline uppercase text-[10px] tracking-widest"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                )}
                {!loading && displayedTransactions.length > 0 && (
                    <nav className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2" aria-label="Paginação de transações">
                        <p className="text-xs text-slate-400" aria-live="polite">
                            Exibindo {(visiblePage - 1) * TRANSACTIONS_PER_PAGE + 1}–{Math.min(visiblePage * TRANSACTIONS_PER_PAGE, displayedTransactions.length)} de {displayedTransactions.length}
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(Math.max(1, visiblePage - 1))}
                                disabled={visiblePage === 1}
                                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Anterior
                            </button>
                            <span className="min-w-24 text-center text-xs text-slate-400">
                                Página {visiblePage} de {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(Math.min(totalPages, visiblePage + 1))}
                                disabled={visiblePage === totalPages}
                                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Próxima
                            </button>
                        </div>
                    </nav>
                )}
            </div>
        </div >
    )
}
