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
                <div className="w-full max-w-sm space-y-6 rounded-2xl bg-slate-900 p-8 shadow-xl border border-slate-800 text-center">
                    <div className="mx-auto w-12 h-12 bg-emerald-900/30 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Verifique seu email</h2>
                    <p className="text-slate-400">
                        Enviamos um link de confirmação para <strong>{email}</strong>.
                    </p>
                    <div className="pt-4">
                        <Link href="/login" className="text-brand-600 hover:text-brand-500 font-medium flex items-center justify-center gap-2">
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
            <div className="w-full max-w-sm space-y-6 rounded-2xl bg-slate-900 p-8 shadow-xl border border-slate-800">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <Logo className="w-12 h-12" textSize="text-3xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Crie sua Conta</h1>
                    <p className="mt-2 text-sm text-slate-400">Comece a controlar suas finanças hoje</p>
                </div>

                {error && (
                    <div className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-500 text-center border border-rose-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-slate-300">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-base text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-slate-600 sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-slate-300">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-base text-slate-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white transition-all sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="min-h-12 w-full rounded-xl bg-brand-600 py-3 font-bold text-white transition-all hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-95"
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
                        <Link href="/login" className="text-brand-600 font-bold hover:underline">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
