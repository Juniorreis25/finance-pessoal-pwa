'use client'

import { useState, useEffect } from 'react'
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
    const supabase = createClient()
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
        <form onSubmit={handleSubmit} className="space-y-8 bg-brand-deep-sea p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border border-white/5 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-brand-accent/10 rounded-2xl">
                    <CreditCard className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                        {initialData ? 'Editar Cartão' : 'Novo Cartão'}
                    </h2>
                    <p className="text-[10px] text-brand-gray font-bold uppercase tracking-widest opacity-60">
                        Gerencie seu limite e datas de fechamento
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black border border-rose-500/20 uppercase tracking-widest text-center">
                    {error}
                </div>
            )}

            <div className="space-y-6 relative z-10 font-sans">
                <div>
                    <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                        NOME DO CARTÃO
                    </label>
                    <input
                        name="name"
                        required
                        placeholder="Ex: Nubank Black, Visa Infinite"
                        className="w-full min-h-12 px-5 py-4 bg-brand-nav border border-white/5 rounded-2xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white placeholder:text-brand-gray/30"
                        value={formData.name}
                        onChange={handleChange}
                        autoFocus
                    />
                </div>

                    <div className="bg-brand-nav p-5 sm:p-8 rounded-[2rem] border border-white/5">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-3 opacity-60">
                        LIMITE DE CRÉDITO (R$)
                    </label>
                    <input
                        name="limit_amount"
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="R$ 0,00"
                        className="w-full min-h-12 bg-transparent border-0 p-0 focus:ring-0 transition-all font-bold text-4xl text-brand-accent placeholder:text-brand-accent/10 tracking-tighter sm:text-5xl"
                        value={formData.limit_amount}
                        onChange={handleAmountChange}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    <div>
                        <label htmlFor="closing_day" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                            DIA DO FECHAMENTO
                        </label>
                        <input
                            name="closing_day"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="31"
                            required
                            placeholder="10"
                            className="w-full min-h-12 px-5 py-4 bg-brand-nav border border-white/5 rounded-2xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white text-center"
                            value={formData.closing_day}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="due_day" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                            DIA DO VENCIMENTO
                        </label>
                        <input
                            name="due_day"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="31"
                            required
                            placeholder="17"
                            className="w-full min-h-12 px-5 py-4 bg-brand-nav border border-white/5 rounded-2xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white text-center"
                            value={formData.due_day}
                            onChange={handleChange}
                        />
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
                    className="min-h-11 w-full mt-4 flex items-center justify-center gap-2 px-8 py-3 bg-white/5 text-brand-gray/50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                >
                    Cancelar Operação
                </button>
            </div>
        </form>
    )
}
