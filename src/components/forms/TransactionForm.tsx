'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, ArrowUpCircle, ArrowDownCircle, X, CalendarClock, Calculator, Repeat, Calendar } from 'lucide-react'
import { addMonths, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { appendLocalDemoRecurring, appendLocalDemoTransactions, isLocalDemoMode } from '@/lib/local-demo'

type Card = {
    id: string
    name: string
}

type TransactionData = {
    id?: string
    description: string
    amount: number | string
    category: string
    date: string
    type: 'income' | 'expense'
    card_id?: string | null
    installment_id?: string | null
    installment_number?: number | null
    total_installments?: number | null
    purchase_date?: string | null
}

interface TransactionFormProps {
    initialData?: TransactionData
}

export function TransactionForm({ initialData }: TransactionFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [cards, setCards] = useState<Card[]>([])

    const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense')
    const [isInstallment, setIsInstallment] = useState(!!initialData?.installment_id)
    const [isRecurring, setIsRecurring] = useState(false)
    const [installments, setInstallments] = useState(initialData?.total_installments || 2)

    // Helper to format currency on init
    const formatCurrency = (value: number | string) => {
        if (!value) return ''
        const num = typeof value === 'string' ? parseFloat(value) : value
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
    }

    const getLocalToday = () => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    const [formData, setFormData] = useState({
        description: initialData?.description || '',
        amount: initialData?.amount ? formatCurrency(initialData.amount) : '',
        category: initialData?.category || '',
        date: initialData?.purchase_date || initialData?.date || getLocalToday(), // Data da Compra
        card_id: initialData?.card_id || '',
        first_installment_date: initialData?.date || getLocalToday(), // Data da 1ª Parcela / Pagamento
    })
    const [error, setError] = useState<string | null>(null)

    // Derived state for installment summaries
    const [installmentSummary, setInstallmentSummary] = useState<{
        lastDate: string
        monthlyValue: string
    } | null>(null)

    useEffect(() => {
        async function fetchCards() {
            const { data } = await supabase
                .from('cards')
                .select('id, name')
                .eq('active', true)
            if (data) setCards(data)
        }
        fetchCards()
    }, [supabase])

    const parseCurrency = (value: string) => {
        if (!value) return 0
        const clean = value.replace(/[R$\s.]/g, '').replace(',', '.')
        return parseFloat(clean)
    }

    // Effect to calculate installment summary
    useEffect(() => {
        const referenceDate = formData.first_installment_date || formData.date
        if (!isInstallment || !referenceDate || !formData.amount || installments < 2) {
            setInstallmentSummary(null)
            return
        }

        try {
            // Fix timezone issue by using parseISO
            const startDate = parseISO(referenceDate)
            const totalAmount = parseCurrency(formData.amount)

            // Calculate last date
            const finalDate = addMonths(startDate, installments - 1)

            // Calculate monthly amount (approximate)
            const monthly = totalAmount / installments

            setInstallmentSummary({
                lastDate: format(finalDate, "MMMM 'de' yyyy", { locale: ptBR }),
                monthlyValue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthly)
            })
        } catch {
            setInstallmentSummary(null)
        }
    }, [isInstallment, formData.date, formData.first_installment_date, formData.amount, installments])

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const numericValue = value.replace(/\D/g, '')

        if (!numericValue) {
            setFormData({ ...formData, amount: '' })
            return
        }

        const floatValue = parseFloat(numericValue) / 100
        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(floatValue)

        setFormData({ ...formData, amount: formatted })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const amountValue = parseCurrency(formData.amount)
            const dayOfMonth = parseISO(formData.date).getDate()

            if (isLocalDemoMode) {
                if (isRecurring) {
                    appendLocalDemoRecurring({
                        id: `local-demo-recurring-${Date.now()}`,
                        description: formData.description,
                        amount: amountValue,
                        type,
                        category: formData.category,
                        start_date: formData.date,
                        day_of_month: dayOfMonth,
                        active: true,
                    })
                    router.push('/recurring')
                    router.refresh()
                    return
                }

                const total = isInstallment && type === 'expense' ? installments : 1
                const monthlyAmount = Math.floor((amountValue / total) * 100) / 100
                const firstAmount = amountValue - (monthlyAmount * (total - 1))
                const installmentId = total > 1 ? `local-demo-installment-${Date.now()}` : null
                const dueDate = parseISO(formData.first_installment_date)

                const demoTransactions = Array.from({ length: total }, (_, index) => ({
                    id: `local-demo-${Date.now()}-${index}`,
                    description: total > 1 ? `${formData.description} (${index + 1}/${total})` : formData.description,
                    amount: index === 0 ? firstAmount : monthlyAmount,
                    type,
                    category: formData.category,
                    date: format(addMonths(dueDate, index), 'yyyy-MM-dd'),
                    purchase_date: formData.date,
                    card_id: null,
                    installment_id: installmentId,
                    installment_number: total > 1 ? index + 1 : null,
                    total_installments: total > 1 ? total : null,
                }))

                appendLocalDemoTransactions(demoTransactions)
                router.push('/transactions')
                router.refresh()
                return
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Sessão expirada. Entre novamente para salvar a transação.')

            if (isRecurring) {
                const { error: insertError } = await supabase
                    .from('recurring_expenses')
                    .insert({
                        user_id: user.id,
                        description: formData.description,
                        amount: amountValue,
                        category: formData.category,
                        day_of_month: dayOfMonth,
                        start_date: formData.date,
                        type,
                        active: true,
                    })

                if (insertError) throw new Error(`Erro ao criar recorrência: ${insertError.message}`)
                router.push('/recurring')
                router.refresh()
                return
            }

            const basePayload = {
                user_id: user.id,
                type,
                category: formData.category,
                date: formData.first_installment_date,
                card_id: type === 'expense' && formData.card_id ? formData.card_id : null,
                purchase_date: formData.date,
                total_installments: isInstallment ? installments : null,
            }

            if (isInstallment && type === 'expense') {
                if (initialData?.id) {
                    const { error: delError } = await supabase.from('transactions').delete().eq('id', initialData.id)
                    if (delError) throw new Error(`Erro ao preparar parcelamento: ${delError.message}`)
                }

                const { error: rpcError } = await supabase.rpc('create_installment_transaction', {
                    p_user_id: user.id,
                    p_description: formData.description,
                    p_amount: amountValue,
                    p_category: formData.category,
                    p_date: formData.first_installment_date,
                    p_total_installments: installments,
                    p_card_id: formData.card_id || null,
                    p_purchase_date: formData.date,
                })

                if (rpcError) throw new Error(`Erro ao criar parcelas: ${rpcError.message}`)
                router.push('/transactions')
            } else {
                const payload = {
                    ...basePayload,
                    description: formData.description,
                    amount: amountValue,
                }

                if (initialData?.id) {
                    const { error: updateError } = await supabase.from('transactions').update(payload).eq('id', initialData.id)
                    if (updateError) throw updateError
                } else {
                    const { error: insertError } = await supabase.from('transactions').insert(payload)
                    if (insertError) throw insertError
                }
                router.push('/transactions')
            }
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado'
            setError(message)
        } finally {
            setLoading(false)
        }
    }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        // Only sync dates automatically for NEW expenses that are NOT installments
        if (name === 'date' && !isInstallment && !initialData?.id) {
            setFormData(prev => ({ ...prev, date: value, first_installment_date: value }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const expenseCategories = ['Alimentação', 'Educação', 'Empréstimo', 'Financiamento', 'Lazer', 'Moradia', 'Saúde', 'Transporte', 'Outros']
    const incomeCategories = ['Freelance', 'Investimentos', 'Salário', 'Outros']

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-brand-deep-sea p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-white/5 max-w-xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />

            {/* Type Toggle - Neo Style */}
            <div className="flex gap-2 p-1.5 bg-brand-nav rounded-2xl max-w-md mx-auto border border-white/5">
                <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'expense'
                        ? 'bg-[#FF3B6B] text-white shadow-lg shadow-[#FF3B6B]/20'
                        : 'text-brand-gray hover:text-white'
                        }`}
                >
                    <ArrowDownCircle className="w-4 h-4" />
                    Despesa
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setType('income')
                        setIsInstallment(false)
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'income'
                        ? 'bg-brand-success text-black shadow-lg shadow-brand-success/20'
                        : 'text-brand-gray hover:text-white'
                        }`}
                >
                    <ArrowUpCircle className="w-4 h-4" />
                    Receita
                </button>
            </div>

            {error && (
                <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black border border-rose-500/20 uppercase tracking-widest text-center">
                    {error}
                </div>
            )}

            <div className="space-y-6 relative z-10 font-sans">
                <div className="bg-brand-nav p-5 sm:p-6 rounded-[1.5rem] border border-white/5">
                    <label htmlFor="amount" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 opacity-60">
                        VALOR TOTAL (R$)
                    </label>
                    <input
                        id="amount"
                        name="amount"
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="R$ 0,00"
                        className="w-full min-h-12 bg-transparent border-0 p-0 focus:ring-0 transition-all font-bold text-4xl text-brand-accent placeholder:text-brand-accent/10 tracking-tighter"
                        value={formData.amount}
                        onChange={handleAmountChange}
                        autoFocus
                    />
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="description" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                            DESCRIÇÃO
                        </label>
                        <input
                            id="description"
                            name="description"
                            required
                            placeholder={type === 'expense' ? "Ex: Supermercado" : "Ex: Salário Mensal"}
                            className="w-full min-h-12 px-5 py-3.5 bg-brand-nav border border-white/5 rounded-xl focus:border-brand-accent/50 shadow-inner outline-none transition-all font-bold text-white placeholder:text-brand-gray/30"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                            CATEGORIA
                        </label>
                        <div className="relative">
                            <select
                                id="category"
                                name="category"
                                required
                                className="w-full min-h-12 px-5 py-3.5 bg-brand-nav border border-white/5 rounded-xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white appearance-none cursor-pointer"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="" className="bg-brand-deep-sea">Selecione...</option>
                                {(type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                                    <option key={cat} value={cat} className="bg-brand-deep-sea">{cat}</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-accent">
                                <ArrowDownCircle className="w-4 h-4 opacity-50" />
                            </div>
                        </div>
                    </div>

                    <div className={type === 'income' ? 'w-full' : 'grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'}>
                        <div>
                            <label htmlFor="date" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                                {type === 'income' ? 'DATA' : 'DATA DA COMPRA'}
                            </label>
                            <div className="relative group/date">
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    className="w-full min-h-12 px-5 py-3.5 bg-brand-nav border border-white/5 rounded-xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white [color-scheme:dark] pr-12 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-6"
                                    value={formData.date}
                                    onChange={handleChange}
                                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-accent/40 group-focus-within/date:text-brand-accent transition-colors">
                                    <Calendar className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        {type === 'expense' && (
                            <div>
                                <label htmlFor="first_installment_date" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                                    DATA DA 1ª PARCELA
                                </label>
                                <div className="relative group/date">
                                    <input
                                        id="first_installment_date"
                                        name="first_installment_date"
                                        type="date"
                                        className="w-full min-h-12 px-5 py-3.5 bg-brand-nav border border-white/5 rounded-xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white [color-scheme:dark] pr-12 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-6"
                                        value={formData.first_installment_date}
                                        onChange={handleChange}
                                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-accent/40 group-focus-within/date:text-brand-accent transition-colors">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {type === 'expense' && (
                        <div>
                            <label htmlFor="card_id" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                                MÉTODO DE COMPRA
                            </label>
                            <div className="relative">
                                <select
                                    id="card_id"
                                    name="card_id"
                                    className="w-full min-h-12 px-5 py-3.5 bg-brand-nav border border-white/5 rounded-xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white appearance-none cursor-pointer"
                                    value={formData.card_id || ''}
                                    onChange={handleChange}
                                >
                                    <option value="" className="bg-brand-deep-sea">Nenhum (Dinheiro/Débito)</option>
                                    {cards.map(card => (
                                        <option key={card.id} value={card.id} className="bg-brand-deep-sea">{card.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-accent">
                                    <ArrowDownCircle className="w-4 h-4 opacity-50" />
                                </div>
                            </div>
                        </div>
                    )}

                    {type === 'expense' ? (
                        <div className="bg-brand-nav p-5 rounded-[1.5rem] border border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-all ${isInstallment ? 'bg-brand-accent text-black' : 'bg-white/5 text-brand-gray'}`}>
                                        <CalendarClock className="w-4 h-4" />
                                    </div>
                                    <p className="font-black text-white text-[9px] uppercase tracking-[0.2em] opacity-80">Transação Parcelada?</p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Marcar despesa como parcelada"
                                    aria-pressed={isInstallment}
                                    onClick={() => { const next = !isInstallment; setIsInstallment(next); if (next) setIsRecurring(false) }}
                                    className={`w-12 h-7 rounded-full transition-all relative ${isInstallment ? 'bg-brand-accent' : 'bg-white/10'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-xl ${isInstallment ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>

                            {isInstallment && (
                                <div className="pt-4 mt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label htmlFor="installments" className="block text-[9px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 opacity-60">
                                        QUANTIDADE DE PARCELAS
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="installments"
                                            name="installments"
                                            type="number"
                                            min="2"
                                            max="48"
                                            required
                                            className="w-full min-h-12 px-4 py-3 bg-brand-deep-sea border border-white/5 rounded-xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white text-center"
                                            value={installments}
                                            onChange={(e) => setInstallments(parseInt(e.target.value))}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-accent">
                                            <Calculator className="w-4 h-4 opacity-30" />
                                        </div>
                                    </div>
                                    {installmentSummary && (
                                        <p className="mt-3 text-[9px] font-bold text-brand-accent/60 uppercase tracking-widest text-center">
                                            {installments}x de {installmentSummary.monthlyValue} • Final em {installmentSummary.lastDate}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-brand-nav p-5 rounded-[1.5rem] border border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-all ${isRecurring ? 'bg-brand-success text-black' : 'bg-white/5 text-brand-gray'}`}>
                                        <Repeat className="w-4 h-4" />
                                    </div>
                                    <p className="font-black text-white text-[9px] uppercase tracking-[0.2em] opacity-80">Receita Recorrente?</p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Marcar receita como recorrente"
                                    aria-pressed={isRecurring}
                                    onClick={() => { const next = !isRecurring; setIsRecurring(next); if (next) setIsInstallment(false) }}                                    className={`w-12 h-7 rounded-full transition-all relative ${isRecurring ? 'bg-brand-success' : 'bg-white/10'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-xl ${isRecurring ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {type === 'expense' && (
                <div className="bg-brand-nav p-5 rounded-[1.5rem] border border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-all ${isRecurring ? 'bg-brand-success text-black' : 'bg-white/5 text-brand-gray'}`}>
                                <Repeat className="w-4 h-4" />
                            </div>
                            <p className="font-black text-white text-[9px] uppercase tracking-[0.2em] opacity-80">Despesa Recorrente?</p>
                        </div>
                        <button
                            type="button"
                            aria-label="Marcar despesa como recorrente"
                            aria-pressed={isRecurring}
                            onClick={() => { const next = !isRecurring; setIsRecurring(next); if (next) setIsInstallment(false) }}
                            className={`w-12 h-7 rounded-full transition-all relative ${isRecurring ? 'bg-brand-success' : 'bg-white/10'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-xl ${isRecurring ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                </div>
            )}
            <div className="pt-8 flex flex-col sm:flex-row gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-5 bg-brand-accent text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,240,255,0.3)] disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                        <>
                            <span>Salvar Transação</span>
                            <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                                <Save className="w-3 h-3" strokeWidth={4} />
                            </div>
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => router.push('/transactions')}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-5 bg-white/5 text-brand-gray rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/10 hover:text-white transition-all border border-white/5"
                >
                    <X className="w-4 h-4 italic" />
                    <span>Cancelar</span>
                </button>
            </div>
        </form>
    )
}
