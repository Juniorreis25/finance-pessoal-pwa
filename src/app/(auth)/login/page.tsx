'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAuthCallbackUrl } from '@/lib/supabase/redirect'
import { useRouter } from 'next/navigation'
import { LogoDiamond } from '@/components/ui/LogoDiamond'
import { Loader2, Lock, Mail, LogIn, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showResendConfirmation, setShowResendConfirmation] = useState(false)
    const [resendMessage, setResendMessage] = useState<string | null>(null)
    const [resendLoading, setResendLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('error') === 'auth_callback') {
            setError('O link de confirmação é inválido ou expirou. Solicite um novo email de confirmação.')
            setShowResendConfirmation(true)
        }
    }, [])

    const handleResendConfirmation = async () => {
        const confirmationEmail = email.trim()
        setResendMessage(null)

        if (!confirmationEmail) {
            setResendMessage('Informe seu email para solicitar um novo link.')
            return
        }

        setResendLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: confirmationEmail,
                options: { emailRedirectTo: getAuthCallbackUrl(location.origin) },
            })

            if (error) throw error
            setResendMessage('Se houver uma conta aguardando confirmação nesse email, enviaremos um novo link.')
        } catch {
            setResendMessage('Não foi possível solicitar um novo email agora. Tente novamente em instantes.')
        } finally {
            setResendLoading(false)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error
            router.push('/dashboard')
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error 
                ? err.message 
                : (typeof err === 'object' && err !== null && 'message' in err)
                    ? String((err as { message: unknown }).message)
                    : 'Falha na autenticação'

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

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Subtle ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-accent/8 rounded-full blur-[100px] pointer-events-none" />

            {/* Compact centered container */}
            <div className="w-full max-w-sm z-10">
                {/* Logo + Form Card */}
                <div className="bg-brand-deep-sea/40 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/5 relative">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent" />

                    <div className="space-y-6">
                        {/* Logo + Title - Compact */}
                        <div className="text-center space-y-4">
                            <LogoDiamond size="medium" showText={true} animated={true} />
                            <p className="text-xs text-brand-gray">Entre para gerenciar suas finanças</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-400 text-center border border-rose-500/20 animate-in fade-in">
                                {error}
                            </div>
                        )}

                        {/* Form - Compact */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-xs font-semibold text-white/90">
                                    Email
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray/50 group-focus-within:text-brand-accent transition-colors" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none 
                                        focus:border-brand-accent/50 focus:ring-2 focus:ring-brand-accent/20 
                                        transition-all placeholder:text-brand-gray/40 backdrop-blur-sm hover:border-white/20"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label htmlFor="password" className="text-xs font-semibold text-white/90">
                                    Senha
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray/50 group-focus-within:text-brand-accent transition-colors" />
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-slate-950/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none 
                                        focus:border-brand-accent/50 focus:ring-2 focus:ring-brand-accent/20 
                                        transition-all placeholder:text-brand-gray/40 backdrop-blur-sm hover:border-white/20"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit - Compact */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-brand-accent to-brand-accent/90 py-3 font-bold text-sm text-black
                                transition-all hover:shadow-lg hover:shadow-brand-accent/25 hover:scale-[1.01]
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                flex items-center justify-center gap-2 transform active:scale-95"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4" />
                                        <span>Entrar</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            {showResendConfirmation && (
                                <div className="space-y-2 text-center">
                                    {resendMessage && (
                                        <p role="status" className="text-xs text-brand-gray">
                                            {resendMessage}
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleResendConfirmation}
                                        disabled={resendLoading}
                                        className="text-xs font-semibold text-brand-accent hover:underline disabled:opacity-50"
                                    >
                                        {resendLoading ? 'Enviando...' : 'Reenviar email de confirmação'}
                                    </button>
                                </div>
                            )}
                        </form>

                        {/* Register Link - Minimal */}
                        <div className="pt-2 border-t border-white/5">
                            <p className="text-xs text-center text-brand-gray">
                                Não tem uma conta?{' '}
                                <Link
                                    href="/register"
                                    className="text-brand-accent font-semibold hover:underline transition-colors inline-flex items-center gap-0.5"
                                >
                                    Cadastre-se
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Minimal pulse indicator */}
                <div className="flex justify-center space-x-1.5 mt-4 opacity-20">
                    <div className="w-1 h-1 rounded-full bg-brand-accent animate-pulse" />
                    <div className="w-1 h-1 rounded-full bg-brand-accent animate-pulse [animation-delay:0.2s]" />
                    <div className="w-1 h-1 rounded-full bg-brand-accent animate-pulse [animation-delay:0.4s]" />
                </div>
            </div>
        </div>
    )
}
