'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Repeat, CheckCircle, XCircle, Search, ArrowUpRight, ArrowRightLeft, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RecurringModal } from '@/components/modals/RecurringModal'
import { usePrivacy } from '@/providers/PrivacyProvider'
import { MaskedValue } from '@/components/ui/MaskedValue'
import { deleteLocalDemoRecurring, getLocalDemoRecurring, isLocalDemoMode, updateLocalDemoRecurring } from '@/lib/local-demo'

type RecurringExpense = {
    id: string
    description: string
    amount: number
    category: string
    day_of_month: number
    active: boolean
    type: 'income' | 'expense'
    last_processed_date?: string
    start_date: string
}

export default function RecurringExpensesPage() {
    const supabase = createClient()
    const router = useRouter()
    const [expenses, setExpenses] = useState<RecurringExpense[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { isValuesVisible, toggleVisibility } = usePrivacy()

    const fetchExpenses = useCallback(async () => {
        setLoading(true)

        if (isLocalDemoMode) {
            setExpenses(getLocalDemoRecurring().sort((a, b) => a.day_of_month - b.day_of_month))
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('recurring_expenses')
            .select('*')
            .order('day_of_month', { ascending: true })

        if (error) {
            console.error('Erro ao carregar recorrências:', error.message)
        } else {
            setExpenses(data || [])
        }
        setLoading(false)
    }, [supabase])
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchExpenses()
        }, 0)
        return () => clearTimeout(timeoutId)
    }, [fetchExpenses])

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta recorrência?')) return

        if (isLocalDemoMode) {
            deleteLocalDemoRecurring(id)
            fetchExpenses()
            return
        }

        const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
        if (error) {
            alert(`Erro ao excluir recorrência: ${error.message}`)
            return
        }

        fetchExpenses()
        router.refresh()
    }
    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (isLocalDemoMode) {
            updateLocalDemoRecurring(id, { active: !currentStatus })
            fetchExpenses()
            return
        }

        const { error } = await supabase
            .from('recurring_expenses')
            .update({ active: !currentStatus })
            .eq('id', id)

        if (error) {
            alert(`Erro ao atualizar recorrência: ${error.message}`)
            return
        }

        fetchExpenses()
        router.refresh()
    }
    // Filter expenses by search term
    const filteredExpenses = expenses.filter(expense => {
        return expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const totalRecurringExpense = filteredExpenses
        .filter(ex => ex.type === 'expense' && ex.active)
        .reduce((acc, ex) => acc + ex.amount, 0)

    const totalRecurringIncome = filteredExpenses
        .filter(ex => ex.type === 'income' && ex.active)
        .reduce((acc, ex) => acc + ex.amount, 0)

    const recurringBalance = totalRecurringIncome - totalRecurringExpense

    return (
        <div className="space-y-4 max-w-5xl mx-auto sm:space-y-8">
            {/* Header */}
            {/* Header with Title and Global Action */}
            <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">Transações Recorrentes</h1>
                    <p className="hidden text-slate-400 sm:block">Gerencie seus ganhos e pagamentos fixos mensais.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex min-h-11 min-w-11 shrink-0 items-center justify-center bg-gradient-to-br from-[#00F0FF] to-[#00A3FF] text-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(0,240,255,0.3)] cursor-pointer sm:min-h-[52px] sm:min-w-[52px]"
                    title="Nova Recorrência"
                >
                    <Plus className="w-6 h-6" strokeWidth={3} />
                </button>
            </div>

            {/* Toolbar: Search */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
                    <label htmlFor="search-recurring" className="sr-only">Buscar por descrição</label>
                    <input
                        id="search-recurring"
                        placeholder="Buscar por descrição..."
                        className="w-full pl-11 pr-4 py-3 bg-brand-deep-sea border border-white/5 rounded-2xl text-sm focus:border-brand-accent/50 outline-none transition-all text-white placeholder:text-brand-gray/50 h-[52px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <RecurringModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchExpenses()
                    router.refresh()
                }}
            />

            <div className="rounded-2xl border border-white/5 bg-brand-deep-sea px-4 py-3 sm:hidden">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs text-slate-400">Saldo mensal previsto</p>
                        <p className={`truncate text-xl font-bold ${recurringBalance >= 0 ? 'text-brand-accent' : 'text-rose-400'}`}>
                            <MaskedValue value={Math.abs(recurringBalance)} prefix={isValuesVisible ? (recurringBalance >= 0 ? 'R$ ' : '− R$ ') : ''} />
                        </p>
                    </div>
                    <button type="button" onClick={toggleVisibility} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-brand-accent" aria-label={isValuesVisible ? 'Ocultar valores' : 'Mostrar valores'}>
                        {isValuesVisible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                    </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">{filteredExpenses.length} recorrências · {filteredExpenses.filter(item => item.active).length} ativas</p>
            </div>

            {/* Master Summary Card - Standardized Minimal Layout */}
            <div className="relative hidden overflow-hidden bg-brand-deep-sea border border-white/5 rounded-[2rem] p-5 sm:block sm:rounded-[2.5rem] sm:p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-success/5 blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative flex flex-col items-start justify-between gap-6 sm:gap-8 md:flex-row md:items-center">
                    {/* Left Side: Balance (Sobra Mensal) */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                <ArrowRightLeft className="w-3.5 h-3.5 text-brand-accent" />
                                <span>Sobra Mensal Garantida</span>
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

                        <h2 className={`text-3xl font-black tracking-tighter transition-all duration-500 sm:text-4xl md:text-5xl ${recurringBalance >= 0 ? 'text-brand-accent drop-shadow-[0_0_15px_rgba(0,240,255,0.1)]' : 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.1)]'}`}>
                            <MaskedValue value={recurringBalance} prefix={isValuesVisible ? "R$ " : ""} />
                        </h2>
                    </div>

                    {/* Right Side: Specialized Totals */}
                    <div className="flex flex-col sm:flex-row gap-8">
                        {/* Income */}
                        <div className="flex items-center gap-3 group">
                            <div className="p-3 bg-brand-success/10 rounded-2xl text-brand-success border border-brand-success/10 group-hover:bg-brand-success/20 transition-all">
                                <ArrowUpRight className="w-5 h-5 font-bold" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ganhos Fixos</p>
                                <p className="text-lg font-bold text-brand-success leading-tight">
                                    <MaskedValue value={totalRecurringIncome} prefix={isValuesVisible ? "+ R$ " : ""} />
                                </p>
                            </div>
                        </div>

                        <div className="hidden sm:block w-px h-12 bg-white/5" />

                        {/* Regular Expenses */}
                        <div className="flex items-center gap-3 group">
                            <div className="p-3 bg-brand-accent/10 rounded-2xl text-brand-accent border border-brand-accent/10 group-hover:bg-brand-accent/20 transition-all">
                                <Repeat className="w-5 h-5 font-bold" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Contas Fixas</p>
                                <p className="text-lg font-bold text-slate-200 leading-tight">
                                    <MaskedValue value={totalRecurringExpense} prefix={isValuesVisible ? "- R$ " : ""} />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3 sm:space-y-4">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 flex justify-center">
                        <div className="animate-pulse flex flex-col gap-2">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                    </div>
                ) : filteredExpenses.length > 0 ? (
                    <div className="grid gap-3 sm:gap-4">
                        {filteredExpenses.map((expense) => (
                            <div
                                key={expense.id}
                                className={`relative group bg-brand-deep-sea p-3 sm:p-5 rounded-2xl flex flex-col items-start justify-between gap-2 sm:gap-4 border ${!expense.active ? 'border-dashed border-slate-700 opacity-70' : 'border-white/10'} shadow-sm hover:shadow-md transition-all sm:flex-row sm:items-center`}
                            >
                                <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:gap-5">
                                    <div className={`shrink-0 rounded-xl p-2 sm:p-3 ${expense.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-accent/10 text-brand-accent'} ${!expense.active ? 'grayscale opacity-50' : ''}`}>
                                        <Repeat className="h-4 w-4 sm:h-6 sm:w-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="break-words text-sm font-bold leading-snug text-white sm:text-lg">{expense.description}</h3>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-3">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${expense.type === 'income' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/10'}`}>
                                                {expense.type === 'income' ? 'Receita' : 'Despesa'}
                                            </span>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 sm:px-2.5">
                                                {expense.category}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium whitespace-nowrap sm:text-sm">
                                                Dia {expense.day_of_month}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex w-full items-center justify-between gap-1 border-t border-white/5 pt-1 sm:w-auto sm:gap-8 sm:border-0 sm:pt-0">
                                    <span className={`min-w-0 break-all text-base font-bold tracking-tight sm:text-xl ${expense.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
                                        <MaskedValue value={expense.amount} prefix={expense.type === 'income' ? '+ R$ ' : '− R$ '} />
                                    </span>

                                    <div className="flex shrink-0 gap-0.5 sm:gap-2">
                                        <button
                                            onClick={() => toggleStatus(expense.id, expense.active)}
                                            className={`flex min-h-11 min-w-11 items-center justify-center p-2 rounded-lg transition-colors ${expense.active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            title={expense.active ? "Desativar" : "Ativar"}
                                        >
                                            {expense.active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        </button>
                                        <Link href={`/recurring/${expense.id}/edit`} className="flex min-h-11 min-w-11 items-center justify-center p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors cursor-pointer" title="Editar Recorrência">
                                            <Edit2 className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleDelete(expense.id)} className="flex min-h-11 min-w-11 items-center justify-center p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer" title="Excluir Recorrência">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-brand-deep-sea p-6 text-center sm:rounded-3xl sm:p-16">
                        <div className="mb-4 rounded-full bg-white/5 p-3 sm:p-4">
                            <Repeat className="h-6 w-6 text-slate-400 sm:h-8 sm:w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sem transações recorrentes</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                            Cadastre seus ganhos ou contas fixas (aluguel, internet, streaming) para não esquecer.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="text-brand-500 font-bold hover:underline"
                        >
                            Criar primeira recorrente
                        </button>
                    </div>
                )}
            </div>
        </div >
    )
}
