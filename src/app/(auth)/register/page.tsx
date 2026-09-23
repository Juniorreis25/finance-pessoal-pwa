'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAuthCallbackUrl } from '@/lib/supabase/redirect'
import { Logo } from '@/components/ui/Logo'
import { Loader2, Lock, Mail, UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: getAuthCallbackUrl(location.origin),
                },
            })

            if (error) throw error
            if (data.session) {
                router.push('/dashboard')
                router.refresh()
                return
            }

            setSuccess(true)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Falha ao criar conta'

            if (message.includes('Missing required environment variable')) {
                setError(
                    'Configuração do Supabase ausente neste ambiente. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
                )
                return
            }

            if (message.toLowerCase().includes('failed to fetch')) {
                setError(
                    'Falha ao conectar com o Supabase. Verifique a URL do projeto, a anon key e se o deploy recebeu as variáveis de ambiente.'
                )
                return
            }

            setError(message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
                <div className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-brand-deep-sea p-5 text-center shadow-xl sm:p-8">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-success/10 text-brand-success">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white sm:text-2xl">Verifique seu email</h2>
                    <p className="text-slate-400">
                        Enviamos um link de confirmação para <strong>{email}</strong>.
                    </p>
                    <div className="pt-4">
                        <Link href="/login" className="inline-flex min-h-11 items-center justify-center gap-2 font-semibold text-brand-accent hover:text-white">
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-brand-deep-sea p-5 shadow-xl sm:p-8">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <Logo className="h-11 w-11" textSize="text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-white sm:text-3xl">Crie sua conta</h1>
                    <p className="mt-2 text-sm text-slate-400">Comece a controlar suas finanças hoje</p>
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center text-sm text-rose-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-slate-300">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray" />
                            <input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-10 pr-4 text-base text-white outline-none transition-colors placeholder:text-brand-gray/60 focus:border-brand-accent/60 sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-slate-300">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray" />
                            <input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-10 pr-4 text-base text-white outline-none transition-colors placeholder:text-brand-gray/60 focus:border-brand-accent/60 sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-accent py-3 font-bold text-black transition-colors hover:bg-cyan-300 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Criar Conta
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center pt-2">
                    <p className="text-sm text-slate-500">
                        Já tem uma conta?{' '}
                            <Link href="/login" className="font-semibold text-brand-accent hover:underline">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
