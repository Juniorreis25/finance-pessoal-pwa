'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, User, X, Camera, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { FormPageHeader } from '@/components/ui/FormPageHeader'

type UserProfile = {
    display_name: string | null
    welcome_message: string | null
    avatar_url: string | null
}

export default function ProfilePage() {
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    const [formData, setFormData] = useState<UserProfile>({
        display_name: null,
        welcome_message: 'Bem-vindo de volta!',
        avatar_url: null
    })

    useEffect(() => {
        async function loadProfile() {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('Não autenticado')

                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (profile) {
                    setFormData({
                        display_name: profile.display_name,
                        welcome_message: profile.welcome_message || 'Bem-vindo de volta!',
                        avatar_url: profile.avatar_url
                    })
                    if (profile.avatar_url) {
                        setAvatarPreview(profile.avatar_url)
                    }
                }
            } catch (err: unknown) {
                console.error('Erro ao carregar perfil:', err)
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [supabase])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Allow only image formats supported by the avatars bucket.
        const extensionByMimeType: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        }
        const fileExt = extensionByMimeType[file.type]
        if (!fileExt) {
            setError('Use uma imagem JPG, PNG ou WebP')
            return
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 2MB')
            return
        }

        setUploading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Não autenticado')

            // Store each avatar under the authenticated user's own folder.
            const filePath = `${user.id}/${Date.now()}.${fileExt}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    upsert: true,
                    cacheControl: '3600'
                })

            if (uploadError) {
                console.error('Upload error:', uploadError)
                throw new Error(`Erro no upload: ${uploadError.message}`)
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setFormData({ ...formData, avatar_url: publicUrl })
            setAvatarPreview(URL.createObjectURL(file))
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer upload da imagem')
        } finally {
            setUploading(false)
        }
    }

    const handleRemoveAvatar = () => {
        setFormData({ ...formData, avatar_url: null })
        setAvatarPreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Não autenticado')

            // Check if profile exists
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (existingProfile) {
                // Update existing profile
                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update({
                        display_name: formData.display_name,
                        welcome_message: formData.welcome_message,
                        avatar_url: formData.avatar_url,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id)

                if (updateError) throw updateError
            } else {
                // Create new profile
                const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id: user.id,
                        display_name: formData.display_name,
                        welcome_message: formData.welcome_message,
                        avatar_url: formData.avatar_url
                    })

                if (insertError) throw insertError
            }

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
                router.refresh()
            }, 1500)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar perfil')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-2xl py-1 sm:py-6">
            <FormPageHeader title="Meu perfil" description="Personalize como sua conta aparece no aplicativo." />

            <form onSubmit={handleSubmit} className="relative space-y-6 overflow-hidden rounded-2xl border border-white/5 bg-brand-deep-sea p-4 sm:space-y-8 sm:rounded-3xl sm:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />

                {error && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300 sm:rounded-2xl sm:p-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-xl border border-brand-success/20 bg-brand-success/10 p-3 text-sm text-brand-success sm:rounded-2xl sm:p-4">
                        ✓ Perfil atualizado com sucesso!
                    </div>
                )}

                <div className="relative z-10 space-y-6 font-sans sm:space-y-8">
                    <div className="space-y-6">
                        {/* Display Name */}
                        <div>
                            <label htmlFor="display_name" className="mb-2 ml-1 block text-xs font-semibold text-brand-gray">
                                NOME DE EXIBIÇÃO
                            </label>
                            <input
                                id="display_name"
                                name="display_name"
                                type="text"
                                placeholder="Seu nome ou apelido"
                                className="min-h-12 w-full rounded-xl border border-white/5 bg-brand-nav px-4 py-3 text-white outline-none transition-colors placeholder:text-brand-gray/50 focus:border-brand-accent/50 sm:rounded-2xl sm:px-5"
                                value={formData.display_name || ''}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Welcome Message */}
                        <div>
                            <label htmlFor="welcome_message" className="mb-2 ml-1 block text-xs font-semibold text-brand-gray">
                                MENSAGEM DE BOAS-VINDAS
                            </label>
                            <textarea
                                id="welcome_message"
                                name="welcome_message"
                                rows={3}
                                placeholder="Frase personalizada para o seu Dashboard"
                                className="w-full resize-y rounded-xl border border-white/5 bg-brand-nav px-4 py-3 text-white outline-none transition-colors placeholder:text-brand-gray/50 focus:border-brand-accent/50 sm:rounded-2xl sm:px-5"
                                value={formData.welcome_message || ''}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <details className="group rounded-xl border border-white/5 bg-brand-nav/40 p-3 sm:rounded-2xl sm:p-4">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-200 [&::-webkit-details-marker]:hidden">
                            <span>Foto do perfil <span className="ml-1 font-normal text-brand-gray">· opcional</span></span>
                            <ChevronDown className="h-4 w-4 shrink-0 text-brand-gray transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="flex flex-wrap items-center gap-4 pt-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-nav ring-1 ring-white/10 sm:h-20 sm:w-20">
                                {avatarPreview ? (
                                    <Image src={avatarPreview} alt="Foto do perfil" width={80} height={80} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-brand-gray">
                                        <User className="h-9 w-9 opacity-40" strokeWidth={1} />
                                    </div>
                                )}
                                {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Loader2 className="h-5 w-5 animate-spin text-brand-accent" /></div>}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                <label className="group cursor-pointer">
                                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="sr-only" disabled={uploading} />
                                    <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors group-hover:bg-white/5">
                                        <Camera className="h-4 w-4" />
                                        {uploading ? 'Enviando…' : 'Alterar foto'}
                                    </span>
                                </label>
                                {avatarPreview && (
                                    <button type="button" onClick={handleRemoveAvatar} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300">
                                        <X className="h-4 w-4" />
                                        Remover
                                    </button>
                                )}
                            </div>
                        </div>
                    </details>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-3 font-bold text-black transition-colors hover:bg-cyan-300 disabled:opacity-50 sm:rounded-2xl sm:px-8 sm:py-4 sm:uppercase sm:tracking-wide"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <>
                                <span>Salvar Perfil</span>
                                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                                    <Save className="w-3 h-3" strokeWidth={4} />
                                </div>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:text-white sm:mt-3 sm:rounded-2xl"
                    >
                        Voltar ao Dashboard
                    </button>
                </div>
            </form>
        </div>
    )
}
