'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, X, ArrowDownCircle } from 'lucide-react'
import { appendLocalDemoRecurring, isLocalDemoMode } from '@/lib/local-demo'

interface RecurringModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function RecurringModal({ isOpen, onClose, onSuccess }: RecurringModalProps) {
    const supabase = useMemo(() => createClient(), [])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
    })

    if (!isOpen) return null

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

    const parseCurrency = (value: string) => {
        if (!value) return 0
        const clean = value.replace(/[R$\s.]/g, '').replace(',', '.')
        return parseFloat(clean)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const amountValue = parseCurrency(formData.amount)
            const dayValue = new Date(formData.date).getUTCDate()

            if (isLocalDemoMode) {
                appendLocalDemoRecurring({
                    id: `local-demo-recurring-${Date.now()}`,
                    description: formData.description,
                    amount: amountValue,
                    category: formData.category,
                    day_of_month: dayValue,
                    start_date: formData.date,
                    active: true,
                    type: 'expense',
                })
            } else {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('Usuário não autenticado')

                const { error: insertError } = await supabase
                    .from('recurring_expenses')
                    .insert({
                        user_id: user.id,
                        description: formData.description,
                        amount: amountValue,
                        category: formData.category,
                        day_of_month: dayValue,
                        start_date: formData.date,
                        active: true,
                        type: 'expense',
                    })

                if (insertError) throw insertError
            }

            onSuccess()
            onClose()
            setFormData({
                description: '',
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
            })
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado'
            setError(message)
        } finally {
            setLoading(false)
        }
    }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const categories = ['Alimentação', 'Assinaturas', 'Educação', 'Empréstimo', 'Financiamento', 'Lazer', 'Moradia', 'Saúde', 'Transporte', 'Outros']

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md animate-in fade-in duration-300 sm:items-center sm:p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="recurring-modal-title"
                className="relative max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-brand-deep-sea shadow-2xl animate-in zoom-in-95 duration-300 sm:rounded-3xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between gap-3 px-4 pb-2 pt-4 sm:px-7 sm:pt-7">
                    <div>
                        <h2 id="recurring-modal-title" className="text-xl font-bold tracking-tight text-white sm:text-2xl">Nova recorrência</h2>
                        <p className="mt-1 text-sm text-brand-gray">Cadastrar despesa fixa</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Fechar formulário"
                        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-2 text-brand-gray transition-colors hover:bg-white/5 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-5 px-4 pb-4 pt-2 font-sans sm:space-y-6 sm:px-7 sm:pb-7">
                    {error && (
                        <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black border border-rose-500/20 uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}

                    <div className="rounded-xl border border-white/5 bg-brand-nav p-4 sm:rounded-2xl sm:p-6">
                        <label htmlFor="amount" className="mb-2 block text-xs font-semibold text-brand-gray">
                            VALOR TOTAL (R$)
                        </label>
                        <input
                            id="amount"
                            name="amount"
                            data-display-value="large"
                            type="text"
                            inputMode="numeric"
                            required
                            placeholder="R$ 0,00"
                            className="min-h-12 w-full bg-transparent p-0 text-3xl font-bold tracking-tight text-brand-accent placeholder:text-brand-accent/20 focus:ring-0 sm:text-4xl"
                            value={formData.amount}
                            onChange={handleAmountChange}
                        />
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label htmlFor="description" className="mb-2 ml-1 block text-xs font-semibold text-brand-gray">
                                DESCRIÇÃO
                            </label>
                            <input
                                id="description"
                                name="description"
                                required
                                placeholder="Ex: Netflix, Internet, Aluguel"
                                className="min-h-12 w-full rounded-xl border border-white/5 bg-brand-nav px-4 py-3 text-white outline-none transition-colors placeholder:text-brand-gray/50 focus:border-brand-accent/50 sm:px-5"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="category" className="mb-2 ml-1 block text-xs font-semibold text-brand-gray">
                                CATEGORIA
                            </label>
                            <div className="relative">
                                <select
                                    id="category"
                                    name="category"
                                    required
                                    className="min-h-12 w-full appearance-none rounded-xl border border-white/5 bg-brand-nav px-4 py-3 text-white outline-none transition-colors focus:border-brand-accent/50 sm:px-5"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    <option value="" className="bg-brand-deep-sea">Selecione...</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat} className="bg-brand-deep-sea">{cat}</option>
                                    ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-accent">
                                    <ArrowDownCircle className="w-4 h-4 opacity-50" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="date" className="mb-2 ml-1 block text-xs font-semibold text-brand-gray">
                                DATA
                            </label>
                            <div className="relative">
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    inputMode="numeric"
                                    required
                                    className="min-h-12 w-full rounded-xl border border-white/5 bg-brand-nav px-4 py-3 text-white outline-none transition-colors focus:border-brand-accent/50 [color-scheme:dark] sm:px-5"
                                    value={formData.date}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:gap-4 sm:pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="min-h-12 flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-3 font-bold text-black transition-colors hover:bg-cyan-300 disabled:opacity-50 sm:rounded-2xl sm:uppercase sm:tracking-wide"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin w-5 h-5" />
                            ) : (
                                <>
                                    <span>Salvar</span>
                                    <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                                        <Save className="w-3 h-3" strokeWidth={4} />
                                    </div>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-12 flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:text-white sm:rounded-2xl"
                        >
                            <X className="w-4 h-4" />
                            <span>Cancelar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
