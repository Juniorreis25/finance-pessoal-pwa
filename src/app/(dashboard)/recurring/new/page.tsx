'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, ArrowDownCircle } from 'lucide-react'
import { FormPageHeader } from '@/components/ui/FormPageHeader'

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
        <div className="mx-auto max-w-2xl py-1 sm:py-6">
            <FormPageHeader title="Nova recorrência" description="Cadastre um ganho ou pagamento fixo mensal." />

            <form onSubmit={handleSubmit} className="relative space-y-5 overflow-hidden rounded-2xl border border-white/5 bg-brand-deep-sea p-4 sm:space-y-8 sm:rounded-3xl sm:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />

                {error && (
                    <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black border border-rose-500/20 uppercase tracking-widest text-center">
                        {error}
                    </div>
                )}

                <div className="relative z-10 space-y-5 font-sans sm:space-y-6">
                    <div className="rounded-xl border border-white/5 bg-brand-nav p-4 sm:rounded-2xl sm:p-6">
                        <label htmlFor="amount" className="mb-2 block text-xs font-semibold text-brand-gray">
                            VALOR MENSAL (R$)
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
                                placeholder="Ex: Netflix, Aluguel, Academia"
                                className="min-h-12 w-full rounded-xl border border-white/5 bg-brand-nav px-4 py-3 text-white outline-none transition-colors placeholder:text-brand-gray/50 focus:border-brand-accent/50 sm:rounded-2xl sm:px-5"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                            <label htmlFor="category" className="mb-2 ml-1 block text-xs font-semibold text-brand-gray">
                                    CATEGORIA
                                </label>
                                <div className="relative">
                                    <select
                                        id="category"
                                        name="category"
                                        required
                                        className="min-h-12 w-full appearance-none rounded-xl border border-white/5 bg-brand-nav px-4 py-3 text-white outline-none transition-colors focus:border-brand-accent/50 sm:rounded-2xl sm:px-5"
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
                            <label htmlFor="day_of_month" className="mb-2 ml-1 block text-xs font-semibold text-brand-gray">
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
                                    className="min-h-12 w-full rounded-xl border border-white/5 bg-brand-nav px-4 py-3 text-center text-white outline-none transition-colors focus:border-brand-accent/50 sm:rounded-2xl sm:px-5"
                                    value={formData.day_of_month}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="min-h-12 w-full flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-3 font-bold text-black transition-colors hover:bg-cyan-300 disabled:opacity-50 sm:flex-1 sm:rounded-2xl sm:uppercase sm:tracking-wide"
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
                        className="min-h-12 w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:text-white sm:flex-1 sm:rounded-2xl"
                    >
                        Cancelar Operação
                    </button>
                </div>
            </form>
        </div>
    )
}
