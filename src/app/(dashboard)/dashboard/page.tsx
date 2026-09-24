'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowUpRight, Wallet, Loader2, Plus, CreditCard, BarChart3, ArrowRightLeft, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OverviewChart } from '@/components/charts/OverviewChart'
import { CategoryChart } from '@/components/charts/CategoryChart'
import { FixedVsCardChart } from '@/components/charts/FixedVsCardChart'
import { CardDistributionChart } from '@/components/charts/CardDistributionChart'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { CategorySelector } from '@/components/ui/CategorySelector'
import { isDateInCalendarMonth, isRecurringActiveForMonth } from '@/lib/date-logic'
import { getLocalDemoRecurring, getLocalDemoTransactions, isLocalDemoMode } from '@/lib/local-demo'
import Link from 'next/link'
import { isWithinInterval, startOfYear, endOfYear, endOfMonth, format, addMonths } from 'date-fns'
import { usePrivacy } from '@/providers/PrivacyProvider'
import { MaskedValue } from '@/components/ui/MaskedValue'
import { ptBR } from 'date-fns/locale'

type Transaction = {
    amount: number
    type: 'income' | 'expense'
    category: string
    date: string
    card_id?: string | null
    cards?: { name: string } | null
}

type OverviewData = { name: string, receita: number, despesa: number }
type CategoryData = { name: string, value: number, color: string }
type FixedVsCardData = { name: string, value: number }
type CardDistData = { name: string, valor: number }

export default function DashboardPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedCategory, setSelectedCategory] = useState('')
    const [stats, setStats] = useState({
        balance: 0,
        income: 0,
        expense: 0,
        recurringExpense: 0,
        cardExpense: 0,
        cashExpense: 0
    })
    const [nextMonthStats, setNextMonthStats] = useState({
        income: 0,
        expense: 0
    })
    const [overviewData, setOverviewData] = useState<OverviewData[]>([])
    const [categoryData, setCategoryData] = useState<CategoryData[]>([])
    const [fixedVsCardData, setFixedVsCardData] = useState<FixedVsCardData[]>([])
    const [cardDistributionData, setCardDistributionData] = useState<CardDistData[]>([])
    const [userProfile, setUserProfile] = useState<{ display_name: string | null, welcome_message: string | null }>({
        display_name: null,
        welcome_message: null
    })
    const { isValuesVisible, toggleVisibility } = usePrivacy()

    const fetchData = useCallback(async () => {
        setLoading(true)

        const yearStart = startOfYear(currentDate)
        const yearEnd = endOfYear(currentDate)
        const nextMonth = addMonths(currentDate, 1)
        const nextMonthEnd = endOfMonth(nextMonth)
        const dataEnd = nextMonthEnd > yearEnd ? nextMonthEnd : yearEnd

        let transactions: Transaction[] = []
        let recurringExpenses: Array<{
            amount: number
            type: 'income' | 'expense'
            category: string
            start_date: string
            day_of_month: number
            active: boolean
        }> = []

        if (isLocalDemoMode) {
            transactions = getLocalDemoTransactions().map(transaction => ({ ...transaction, cards: null }))
            recurringExpenses = getLocalDemoRecurring().filter(recurring => recurring.active)
        } else {
            const transactionRows: Transaction[] = []
            const transactionPageSize = 500
            let transactionOffset = 0
            let transactionError: string | null = null

            const recurringRequest = supabase
                .from('recurring_expenses')
                .select('amount, type, category, start_date, day_of_month, active')
                .eq('active', true)
                .lte('start_date', format(dataEnd, 'yyyy-MM-dd'))
            const recurringPromise = recurringRequest.then(result => result)

            while (true) {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('amount, type, category, date, card_id, cards(name)')
                    .gte('date', format(yearStart, 'yyyy-MM-dd'))
                    .lte('date', format(dataEnd, 'yyyy-MM-dd'))
                    .order('date', { ascending: true })
                    .order('id', { ascending: true })
                    .range(transactionOffset, transactionOffset + transactionPageSize - 1)

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
                if (page.length < transactionPageSize) break
                transactionOffset += transactionPageSize
            }

            const recurringResult = await recurringPromise

            if (transactionError) {
                console.error('Erro ao carregar transações:', transactionError)
            } else {
                transactions = transactionRows
            }

            if (recurringResult.error) {
                console.error('Erro ao carregar recorrências:', recurringResult.error.message)
            } else {
                recurringExpenses = recurringResult.data || []
            }
        }
        {
            // Filter for Current Month (Stats & Categories)

            // Apply Category Filter if Selected
            const filteredTransactions = selectedCategory
                ? transactions.filter(t => t.category === selectedCategory)
                : transactions

            const monthTransactions = filteredTransactions.filter(t =>
                isDateInCalendarMonth(t.date, currentDate)
            )

            // Calculate Totals for Selected Month
            let income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((acc, curr) => acc + curr.amount, 0)

            let expense = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((acc, curr) => acc + curr.amount, 0)

            // Add recurring items to current month
            const recurringItems = recurringExpenses
                .filter(re => isRecurringActiveForMonth(re.start_date, currentDate))
                .filter(re => !selectedCategory || re.category === selectedCategory)

            const recurringIncomeTotal = recurringItems
                .filter(re => re.type === 'income')
                .reduce((acc, curr) => acc + curr.amount, 0)

            const recurringExpenseTotal = recurringItems
                .filter(re => re.type !== 'income') // default to expense
                .reduce((acc, curr) => acc + curr.amount, 0)

            income += recurringIncomeTotal
            expense += recurringExpenseTotal

            const cashExpenseTotal = monthTransactions
                .filter(t => t.type === 'expense' && !t.card_id)
                .reduce((acc, curr) => acc + curr.amount, 0)

            const cardExpenseTotal = monthTransactions
                .filter(t => t.type === 'expense' && t.card_id)
                .reduce((acc, curr) => acc + curr.amount, 0)

            setStats({
                balance: income - expense,
                income,
                expense,
                recurringExpense: recurringExpenseTotal,
                cardExpense: cardExpenseTotal,
                cashExpense: cashExpenseTotal
            })

            // Group by Month (For Overview Chart - Whole Year of Selected Date)
            const yearTransactions = filteredTransactions.filter(t =>
                isWithinInterval(new Date(t.date), { start: yearStart, end: yearEnd })
            )

            const monthlyData: Record<string, { income: number, expense: number }> = {}

            // Initialize all months for the year
            for (let i = 0; i < 12; i++) {
                const d = new Date(yearStart.getFullYear(), i, 1)
                const monthName = d.toLocaleDateString('pt-BR', { month: 'short' })
                monthlyData[monthName] = { income: 0, expense: 0 }
            }

            yearTransactions.forEach(t => {
                const dateObj = new Date(t.date)
                const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000
                const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset)

                const monthName = adjustedDate.toLocaleDateString('pt-BR', { month: 'short' })

                if (monthlyData[monthName]) {
                    if (t.type === 'income') monthlyData[monthName].income += t.amount
                    else monthlyData[monthName].expense += t.amount
                }
            })

            // Project each recurrence only from its start month.
            Object.keys(monthlyData).forEach((monthName, monthIndex) => {
                const monthDate = new Date(yearStart.getFullYear(), monthIndex, 1)
                const recurringForMonth = recurringExpenses
                    .filter(re => re.active && isRecurringActiveForMonth(re.start_date, monthDate))
                    .filter(re => !selectedCategory || re.category === selectedCategory)

                monthlyData[monthName].income += recurringForMonth
                    .filter(re => re.type === 'income')
                    .reduce((acc, re) => acc + re.amount, 0)
                monthlyData[monthName].expense += recurringForMonth
                    .filter(re => re.type !== 'income')
                    .reduce((acc, re) => acc + re.amount, 0)
            })
            const chartData = Object.entries(monthlyData).map(([name, values]) => ({
                name,
                receita: values.income,
                despesa: values.expense
            }))
            setOverviewData(chartData)

            // Category Data (Selected Month) - Include recurring expenses
            const catMap: Record<string, number> = {}
            monthTransactions
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    catMap[t.category] = (catMap[t.category] || 0) + t.amount
                })

                // Add recurring items to category breakdown (expenses only for the pie chart)
                ; recurringItems
                    .filter(re => re.type !== 'income')
                    .filter(re => !selectedCategory || re.category === selectedCategory)
                    .forEach(re => {
                        catMap[re.category] = (catMap[re.category] || 0) + re.amount
                    })

            const pieData = Object.entries(catMap).map(([name, value]) => ({
                name,
                value,
                color: '' // Handled in component
            }))
            setCategoryData(pieData)

            // 1. Fixed vs Card Ratio (Selected Month)
            setFixedVsCardData([
                { name: 'Recorrentes', value: recurringExpenseTotal },
                { name: 'Cartões', value: cardExpenseTotal }
            ])

            // 2. Card Distribution (Selected Month)
            const cardMap: Record<string, number> = {}
            monthTransactions
                .filter(t => t.type === 'expense' && t.card_id)
                .forEach(t => {
                    const cardName = t.cards?.name || 'Cartão Indefinido'
                    cardMap[cardName] = (cardMap[cardName] || 0) + t.amount
                })

            const cardDistData = Object.entries(cardMap).map(([name, value]) => ({
                name,
                valor: value
            }))
            setCardDistributionData(cardDistData)

            // Calculate NEXT MONTH projected expenses
            const nextMonthTransactions = filteredTransactions.filter(t =>
                t.type === 'expense' && isDateInCalendarMonth(t.date, nextMonth)
            )

            let nextMonthExpense = nextMonthTransactions.reduce((acc, curr) => acc + curr.amount, 0)

            const nextRecurringItems = recurringExpenses
                .filter(re => isRecurringActiveForMonth(re.start_date, nextMonth))
                .filter(re => !selectedCategory || re.category === selectedCategory)
            const nextRecurringExpense = nextRecurringItems
                .filter(re => re.type !== 'income')
                .reduce((acc, re) => acc + re.amount, 0)
            const nextRecurringIncome = nextRecurringItems
                .filter(re => re.type === 'income')
                .reduce((acc, re) => acc + re.amount, 0)
            nextMonthExpense += nextRecurringExpense

            setNextMonthStats({
                income: nextRecurringIncome,
                expense: nextMonthExpense
            })
        }
        setLoading(false)
    }, [supabase, currentDate, selectedCategory])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData()
        }, 0)
        return () => clearTimeout(timeoutId)
    }, [fetchData])

    // Fetch user profile
    useEffect(() => {
        async function fetchProfile() {
            if (isLocalDemoMode) return

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('display_name, welcome_message')
                .eq('user_id', user.id)
                .single()

            if (profile) {
                setUserProfile({
                    display_name: profile.display_name,
                    welcome_message: profile.welcome_message
                })
            }
        }
        fetchProfile()
    }, [supabase])

    return (
        <div className="space-y-6 pb-10 sm:space-y-8">
            {/* Header with Asymmetry */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tighter text-white sm:text-4xl">
                        Visão <span className="text-brand-500">Geral</span>
                    </h1>
                    {userProfile.display_name || userProfile.welcome_message ? (
                        <p className="text-slate-400 font-medium mt-1">
                            {userProfile.display_name && `Olá, ${userProfile.display_name}! `}
                            {userProfile.welcome_message || 'Bem-vindo de volta!'}
                        </p>
                    ) : (
                        <p className="text-slate-400 font-medium mt-1">
                            Resumo financeiro em tempo real.
                        </p>
                    )}
                </div>

                <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-end md:gap-4">
                    <CategorySelector selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
                    <MonthSelector currentDate={currentDate} onDateChange={setCurrentDate} />

                    <div className="flex gap-2 self-end">
                        <Link href="/transactions" className="flex min-h-11 min-w-11 items-center justify-center p-3 bg-brand-deep-sea text-brand-gray rounded-2xl border border-white/5 hover:bg-white/5 transition-all cursor-pointer" aria-label="Ver transações" title="Ver Histórico de Transações">
                            <BarChart3 className="w-5 h-5" />
                        </Link>
                        <Link href="/cards" className="flex min-h-11 min-w-11 items-center justify-center p-3 bg-brand-deep-sea text-brand-gray rounded-2xl border border-white/5 hover:bg-white/5 transition-all cursor-pointer" aria-label="Ver cartões" title="Gerenciar Meus Cartões">
                            <CreditCard className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/transactions/new"
                            className="flex min-h-[52px] min-w-[52px] items-center justify-center bg-gradient-to-br from-[#00F0FF] to-[#00A3FF] text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(0,240,255,0.3)] cursor-pointer"
                            title="Nova Transação"
                        >
                            <Plus className="w-6 h-6" strokeWidth={3} />
                        </Link>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex h-[50vh] items-center justify-center w-full">
                    <Loader2 className="animate-spin w-10 h-10 text-brand-500" />
                </div>
            ) : (
                <>
                    {/* Master Card Layout - Asymmetric Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                        {/* Compact summary composition for mobile */}
                        <div className="md:col-span-12 overflow-hidden rounded-3xl border border-white/10 bg-brand-deep-sea p-5 sm:p-7 lg:hidden">
                            <div className="grid gap-5 sm:gap-6">
                                <section aria-labelledby="mobile-monthly-result-title" className="min-w-0">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 id="mobile-monthly-result-title" className="text-sm font-semibold text-slate-300">Resultado do mês</h2>
                                        <button
                                            type="button"
                                            onClick={toggleVisibility}
                                            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                                            aria-label={isValuesVisible ? "Ocultar valores" : "Mostrar valores"}
                                        >
                                            {isValuesVisible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                                        </button>
                                    </div>
                                    <p className={`mt-1 break-words text-3xl font-bold tracking-tight tabular-nums sm:text-4xl ${stats.balance >= 0 ? 'text-brand-accent' : 'text-rose-400'}`}>
                                        <MaskedValue value={stats.balance} prefix={isValuesVisible ? "R$ " : ""} />
                                    </p>
                                    <div className="mt-5 grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 pt-4">
                                        <div className="pr-3">
                                            <p className="text-xs text-slate-400">Ganhos</p>
                                            <p className="mt-1 truncate text-sm font-semibold tabular-nums text-brand-success sm:text-base">
                                                <MaskedValue value={stats.income} prefix={isValuesVisible ? "R$ " : ""} />
                                            </p>
                                        </div>
                                        <div className="pl-4">
                                            <p className="text-xs text-slate-400">Gastos</p>
                                            <p className="mt-1 truncate text-sm font-semibold tabular-nums text-rose-400 sm:text-base">
                                                <MaskedValue value={stats.expense} prefix={isValuesVisible ? "R$ " : ""} />
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section aria-labelledby="mobile-expense-breakdown-title" className="space-y-3 border-t border-white/10 pt-4">
                                    <h3 id="mobile-expense-breakdown-title" className="text-xs font-medium text-slate-400">Despesas por tipo</h3>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="text-slate-300">Recorrentes</span>
                                            <span className="font-medium tabular-nums text-slate-100"><MaskedValue value={stats.recurringExpense} prefix={isValuesVisible ? "− R$ " : ""} /></span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="text-slate-300">Cartões</span>
                                            <span className="font-medium tabular-nums text-slate-100"><MaskedValue value={stats.cardExpense} prefix={isValuesVisible ? "− R$ " : ""} /></span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="text-slate-300">Dinheiro e débito</span>
                                            <span className="font-medium tabular-nums text-slate-100"><MaskedValue value={stats.cashExpense} prefix={isValuesVisible ? "− R$ " : ""} /></span>
                                        </div>
                                    </div>
                                </section>

                                <section aria-label="Previsão para o próximo mês" className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-400">Previsão</p>
                                        <p className="mt-1 truncate text-sm font-medium capitalize text-slate-200">
                                            {format(addMonths(currentDate, 1), "MMMM 'de' yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-lg font-semibold tracking-tight tabular-nums text-white sm:text-xl">
                                        <MaskedValue value={stats.balance + nextMonthStats.income - nextMonthStats.expense} prefix={isValuesVisible ? "R$ " : ""} />
                                    </p>
                                </section>
                            </div>
                        </div>

                        {/* Master Summary Card - Analytical View (desktop) */}
                        <div className="hidden md:col-span-12 relative overflow-hidden bg-brand-deep-sea border border-white/5 rounded-[2rem] p-5 sm:rounded-[2.5rem] sm:p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] lg:block">
                            {/* Background decorative elements */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-success/5 blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                            <div className="relative flex flex-col gap-8 lg:flex-row lg:gap-12 items-stretch">
                                {/* Left Side: Balance & Income */}
                                <div className="flex-1 space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                            <Wallet className="w-3.5 h-3.5 text-brand-accent" />
                                            <span>Saldo Disponível</span>
                                        </div>
                                        <button
                                            onClick={toggleVisibility}
                                            className="flex min-h-11 min-w-11 items-center justify-center p-2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                                            aria-label={isValuesVisible ? "Ocultar valores" : "Mostrar valores"}
                                        >
                                            {isValuesVisible ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" /><circle cx="12" cy="12" r="3" /></svg>
                                            )}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter transition-all duration-500 ${stats.balance >= 0 ? 'text-brand-accent drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'text-rose-500'
                                            }`}>
                                            <MaskedValue value={stats.balance} prefix={isValuesVisible ? "R$ " : ""} />
                                        </h2>

                                        <div className="flex items-center gap-3 group">
                                            <div className="p-3 bg-brand-success/10 rounded-2xl text-brand-success border border-brand-success/10 group-hover:bg-brand-success/20 transition-all">
                                                <ArrowUpRight className="w-5 h-5 font-bold" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-brand-gray font-bold uppercase tracking-wider">Ganhos</p>
                                                <p className="text-xl font-bold text-brand-success leading-tight">
                                                    <MaskedValue value={stats.income} prefix={isValuesVisible ? "R$ " : ""} />
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Breakdown List */}
                                <div className="w-full lg:w-64 flex flex-col justify-center space-y-4 border-y border-white/5 py-5 px-4 sm:px-8 lg:border-y-0 lg:border-x">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-brand-accent transition-colors">Recorr.</span>
                                        <span className="text-sm font-bold text-white">
                                            <MaskedValue value={stats.recurringExpense} prefix="- R$ " />
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center group">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-brand-accent transition-colors">Cartões</span>
                                        <span className="text-sm font-bold text-white">
                                            <MaskedValue value={stats.cardExpense} prefix="- R$ " />
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center group">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-brand-accent transition-colors">Din/Débito</span>
                                        <span className="text-sm font-bold text-white">
                                            <MaskedValue value={stats.cashExpense} prefix="- R$ " />
                                        </span>
                                    </div>
                                    <div className="h-px bg-white/10 my-2" />
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="text-[11px] text-brand-accent font-black uppercase tracking-widest">Total</span>
                                        <span className="text-base font-black text-brand-accent">
                                            <MaskedValue value={stats.expense} prefix="- R$ " />
                                        </span>
                                    </div>
                                </div>

                                {/* Right Side: Prediction Card */}
                                <div className="w-full lg:w-72 flex items-center">
                                    <div className="w-full bg-white/5 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/10 shadow-2xl relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/20 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-accent/30 transition-all" />

                                        <div className="relative space-y-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Previsão • Próximo Mês</span>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[11px] text-brand-gray font-bold capitalize">
                                                    {format(addMonths(currentDate, 1), "MMMM 'de' yyyy", { locale: ptBR })}
                                                </p>
                                                <h3 className="text-3xl font-black text-white tracking-tighter">
                                                    <MaskedValue value={stats.balance + nextMonthStats.income - nextMonthStats.expense} prefix={isValuesVisible ? "R$ " : ""} />
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                <ArrowRightLeft className="w-3 h-3" />
                                                <span>Fluxo Estimado</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* Charts Section - Row 1 */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-8">
                        <section className="min-w-0 rounded-2xl border border-white/5 bg-brand-deep-sea p-4 shadow-none sm:rounded-[2.5rem] sm:p-8 sm:shadow-xl">
                            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-8">
                                <h3 className="text-lg font-semibold text-white">Análise Anual</h3>
                                <div className="hidden rounded bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-brand-gray sm:block">Fluxo de Caixa</div>
                            </div>
                            <OverviewChart data={overviewData} currentMonth={currentDate.getMonth()} />
                        </section>
                        <section className="min-w-0 rounded-2xl border border-white/5 bg-brand-deep-sea p-4 shadow-none sm:rounded-[2.5rem] sm:p-8 sm:shadow-xl">
                            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-8">
                                <h3 className="text-lg font-semibold text-white">Distribuição por Categoria</h3>
                                <div className="hidden rounded bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-brand-gray sm:block">Top Categorias</div>
                            </div>
                            <CategoryChart data={categoryData} />
                        </section>
                    </div>

                    {/* Charts Section - Row 2 */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-8">
                        <section className="min-w-0 rounded-2xl border border-white/5 bg-brand-deep-sea p-4 shadow-none sm:rounded-[2.5rem] sm:p-8 sm:shadow-xl">
                            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-8">
                                <h3 className="text-lg font-semibold text-white">Recorrentes vs Cartões</h3>
                                <div className="hidden rounded bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-brand-gray sm:block">Composição</div>
                            </div>
                            <FixedVsCardChart data={fixedVsCardData} />
                        </section>
                        <section className="min-w-0 rounded-2xl border border-white/5 bg-brand-deep-sea p-4 shadow-none sm:rounded-[2.5rem] sm:p-8 sm:shadow-xl">
                            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-8">
                                <h3 className="text-lg font-semibold text-white">Gasto por Cartão</h3>
                                <div className="hidden rounded bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-brand-gray sm:block">Faturas do Mês</div>
                            </div>
                            <CardDistributionChart data={cardDistributionData} />
                        </section>
                    </div>
                </>
            )}
        </div>
    )
}
