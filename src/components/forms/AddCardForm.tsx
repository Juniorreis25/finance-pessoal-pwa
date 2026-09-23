'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CreditCard, Save } from 'lucide-react'

type CardData = {
    id?: string
    name: string
    limit_amount: number | string
    closing_day: number | string
    due_day: number | string
    active?: boolean
}

interface CardFormProps {
    initialData?: CardData
}

export function CardForm({ initialData }: CardFormProps) {
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])
    const [loading, setLoading] = useState(false)

    // Helper to format currency on init
    const formatCurrency = (value: number | string) => {
        if (!value) return ''
        const num = typeof value === 'string' ? parseFloat(value) : value
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
    }

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        limit_amount: initialData?.limit_amount ? formatCurrency(initialData.limit_amount) : '',
        closing_day: initialData?.closing_day || '',
        due_day: initialData?.due_day || '',
        active: initialData?.active ?? true
    })
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                limit_amount: initialData.limit_amount ? formatCurrency(initialData.limit_amount) : '',
                closing_day: String(initialData.closing_day),
                due_day: String(initialData.due_day),
                active: initialData.active ?? true
            })
        }
    }, [initialData])

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value

        // Remove non-digits
        const numericValue = value.replace(/\D/g, '')

        if (!numericValue) {
            setFormData({ ...formData, limit_amount: '' })
            return
        }

        // Convert to float (divide by 100 for cents)
        const floatValue = parseFloat(numericValue) / 100

        // Format back to currency string
        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(floatValue)

        setFormData({ ...formData, limit_amount: formatted })
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
            if (!user) throw new Error('Sessão expirada. Entre novamente para salvar o cartão.')

            const limitValue = parseCurrency(String(formData.limit_amount))

            const payload = {
                user_id: user.id,
                name: formData.name,
                limit_amount: limitValue,
                closing_day: Number(formData.closing_day),
                due_day: Number(formData.due_day),
                active: formData.active
            }

            if (initialData?.id) {
                const { error: updateError } = await supabase
                    .from('cards')
                    .update(payload)
                    .eq('id', initialData.id)
                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from('cards')
                    .insert(payload)
                if (insertError) throw insertError
            }

            router.push('/cards')
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <form onSubmit={handleSubmit} className="relative mx-auto max-w-2xl space-y-5 overflow-hidden rounded-2xl border border-white/5 bg-brand-deep-sea p-4 sm:space-y-8 sm:rounded-3xl sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="mb-1 flex items-center gap-3">
                <div className="rounded-xl bg-brand-accent/10 p-2.5">
                    <CreditCard className="h-5 w-5 text-brand-accent" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-white">Dados do cartão</h2>
                    <p className="text-xs text-brand-gray">Limite e datas de fechamento</p>
                </div>
            </div>

            {error && (
                <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black border border-rose-500/20 uppercase tracking-widest text-center">
                    {error}
                </div>
            )}

            <div className="relative z-10 space-y-5 font-sans sm:space-y-6">
                <div>
                    <label htmlFor="name" className="mb-2 ml-1 block text-xs font-semibold text-brand-gray">
                        NOME DO CARTÃO
                    </label>
                    <input
                        id="name"
                        name="name"
                        required
                        placeholder="Ex: Nubank Black, Visa Infinite"
                        className="min-h-12 w-full rounded-xl border border-white/5 bg-brand-nav px-4 py-3 text-white outline-none transition-colors placeholder:text-brand-gray/50 focus:border-brand-accent/50 sm:rounded-2xl sm:px-5"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                    <div className="rounded-xl border border-white/5 bg-brand-nav p-4 sm:rounded-2xl sm:p-6">
                    <label htmlFor="limit_amount" className="mb-2 block text-xs font-semibold text-brand-gray">
                        LIMITE DE CRÉDITO (R$)
                    </label>
                    <input
                        id="limit_amount"
                        name="limit_amount"
                        data-display-value="large"
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="R$ 0,00"
                        className="min-h-12 w-full bg-transparent p-0 text-3xl font-bold tracking-tight text-brand-accent placeholder:text-brand-accent/20 focus:ring-0 sm:text-4xl"
                        value={formData.limit_amount}
                        onChange={handleAmountChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    <div>
                        <label htmlFor="closing_day" className="mb-2 ml-1 block text-xs font-semibold text-brand-gray">
                            DIA DO FECHAMENTO
                        </label>
                        <input
                            id="closing_day"
                            name="closing_day"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="31"
                            required
                            placeholder="10"
                            className="min-h-12 w-full rounded-xl border border-white/5 bg-brand-nav px-3 py-3 text-center text-white outline-none transition-colors focus:border-brand-accent/50 sm:rounded-2xl sm:px-5"
                            value={formData.closing_day}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="due_day" className="mb-2 ml-1 block text-xs font-semibold text-brand-gray">
                            DIA DO VENCIMENTO
                        </label>
                        <input
                            id="due_day"
                            name="due_day"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="31"
                            required
                            placeholder="17"
                            className="min-h-12 w-full rounded-xl border border-white/5 bg-brand-nav px-3 py-3 text-center text-white outline-none transition-colors focus:border-brand-accent/50 sm:rounded-2xl sm:px-5"
                            value={formData.due_day}
                            onChange={handleChange}
                        />
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
                            <span>{initialData ? 'Atualizar Cartão' : 'Conectar Cartão'}</span>
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
    )
}
