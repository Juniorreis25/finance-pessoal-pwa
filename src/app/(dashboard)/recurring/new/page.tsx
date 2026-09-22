'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, X, Calendar, DollarSign, Tag, FileText, ArrowDownCircle } from 'lucide-react'

export default function NewRecurringExpensePage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: '',
        day_of_month: '5'
    })

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
            const { data: { user } } = await supabase.auth.getUser()
            const userId = user?.id

            if (!userId) throw new Error('Usuário não autenticado')

            const amountValue = parseCurrency(formData.amount)
            const dayValue = parseInt(formData.day_of_month)

            if (dayValue < 1 || dayValue > 31) {
                throw new Error('Dia do mês inválido (1-31)')
            }

            const { error: insertError } = await supabase
                .from('recurring_expenses')
                .insert({
                    user_id: userId,
                    description: formData.description,
                    amount: amountValue,
                    category: formData.category,
                    day_of_month: dayValue,
                    active: true
                })

            if (insertError) throw insertError

            router.push('/recurring')
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const categories = ['Alimentação', 'Assinaturas', 'Educação', 'Empréstimo', 'Financiamento', 'Lazer', 'Moradia', 'Saúde', 'Transporte', 'Outros']

    return (
        <div className="max-w-2xl mx-auto py-2 sm:py-8">
            <div className="mb-10 px-4">
                <h1 className="text-3xl font-extrabold text-white tracking-tighter uppercase mb-2 sm:text-4xl">
                    Nova <span className="text-brand-accent">Recorrência</span>
                </h1>
                <p className="text-brand-gray text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Automação de Fluxo de Caixa</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-brand-deep-sea p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />

                {error && (
                    <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black border border-rose-500/20 uppercase tracking-widest text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-6 relative z-10 font-sans">
                    <div className="bg-brand-nav p-5 sm:p-8 rounded-[2rem] border border-white/5">
                        <label htmlFor="amount" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-3 opacity-60">
                            VALOR MENSAL (R$)
                        </label>
                        <input
                            id="amount"
                            name="amount"
                            type="text"
                            inputMode="numeric"
                            required
                            placeholder="R$ 0,00"
                            className="w-full min-h-12 bg-transparent border-0 p-0 focus:ring-0 transition-all font-bold text-4xl text-brand-accent placeholder:text-brand-accent/10 tracking-tighter sm:text-5xl"
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
                                placeholder="Ex: Netflix, Aluguel, Academia"
                                className="w-full px-5 py-4 bg-brand-nav border border-white/5 rounded-2xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white placeholder:text-brand-gray/30"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="category" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                                    CATEGORIA
                                </label>
                                <div className="relative">
                                    <select
                                        id="category"
                                        name="category"
                                        required
                                        className="w-full px-5 py-4 bg-brand-nav border border-white/5 rounded-2xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white appearance-none cursor-pointer"
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
                                <label htmlFor="day_of_month" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                                    DIA DO VENCIMENTO
                                </label>
                                <input
                                    id="day_of_month"
                                    name="day_of_month"
                                    type="number"
                                    inputMode="numeric"
                                    min="1"
                                    max="31"
                                    required
                                    placeholder="05"
                                    className="w-full px-5 py-4 bg-brand-nav border border-white/5 rounded-2xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white text-center"
                                    value={formData.day_of_month}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="min-h-12 w-full flex items-center justify-center gap-2 px-8 py-5 bg-brand-accent text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,240,255,0.3)] disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <>
                                <span>Criar Regra de Recorrência</span>
                                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                                    <Save className="w-3 h-3" strokeWidth={4} />
                                </div>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="min-h-11 w-full mt-4 flex items-center justify-center gap-2 px-8 py-3 bg-white/5 text-brand-gray/50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                    >
                        Cancelar Operação
                    </button>
                </div>
            </form>
        </div>
    )
}
