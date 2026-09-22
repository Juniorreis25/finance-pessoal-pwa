'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, X, ArrowDownCircle } from 'lucide-react'
import { appendLocalDemoRecurring, isLocalDemoMode } from '@/lib/local-demo'

interface RecurringModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function RecurringModal({ isOpen, onClose, onSuccess }: RecurringModalProps) {
    const supabase = createClient()
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="bg-brand-deep-sea w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 shadow-2xl relative animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="p-5 sm:p-8 pb-4 flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Nova <span className="text-brand-accent">Recorrência</span></h2>
                        <p className="text-brand-gray text-[9px] font-black uppercase tracking-widest opacity-60">Cadastrar Despesa Fixa</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex min-h-11 min-w-11 items-center justify-center p-2 hover:bg-white/5 rounded-full transition-colors text-brand-gray hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-8 pt-4 space-y-6 relative z-10 font-sans">
                    {error && (
                        <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black border border-rose-500/20 uppercase tracking-widest text-center">
                            {error}
                        </div>
                    )}

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
                            className="w-full min-h-12 bg-transparent border-0 p-0 focus:ring-0 transition-all font-bold text-3xl text-brand-accent placeholder:text-brand-accent/10 tracking-tighter sm:text-4xl"
                            value={formData.amount}
                            onChange={handleAmountChange}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label htmlFor="description" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                                DESCRIÇÃO
                            </label>
                            <input
                                id="description"
                                name="description"
                                required
                                placeholder="Ex: Netflix, Internet, Aluguel"
                                className="w-full min-h-12 px-5 py-3.5 bg-brand-nav border border-white/5 rounded-xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white placeholder:text-brand-gray/30"
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
                            <label htmlFor="date" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                                DATA
                            </label>
                            <div className="relative">
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    inputMode="numeric"
                                    required
                                    className="w-full min-h-12 px-5 py-3.5 bg-brand-nav border border-white/5 rounded-xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white [color-scheme:dark]"
                                    value={formData.date}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="min-h-12 flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-brand-accent text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,240,255,0.3)] disabled:opacity-50"
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
                            className="min-h-12 flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-brand-gray rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all border border-white/5"
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
