'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, User, MessageSquare, Upload, X, Camera } from 'lucide-react'
import Image from 'next/image'

type UserProfile = {
    display_name: string | null
    welcome_message: string | null
    avatar_url: string | null
}

export default function ProfilePage() {
    const router = useRouter()
    const supabase = createClient()
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
    }, [])

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
        <div className="max-w-2xl mx-auto py-8">
            <div className="mb-10 px-4">
                <h1 className="text-4xl font-extrabold text-white tracking-tighter uppercase mb-2">
                    Meu <span className="text-brand-accent">Perfil</span>
                </h1>
                <p className="text-brand-gray text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Personalização de Experiência</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 bg-brand-deep-sea p-10 rounded-[2.5rem] shadow-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[80px] rounded-full pointer-events-none" />

                {error && (
                    <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black border border-rose-500/20 uppercase tracking-widest text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-brand-success/10 text-brand-success p-4 rounded-2xl text-[10px] font-black border border-brand-success/20 uppercase tracking-widest text-center">
                        ✓ Perfil atualizado com sucesso!
                    </div>
                )}

                <div className="space-y-8 relative z-10 font-sans">
                    {/* Avatar Upload - Premium Style */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative group">
                            <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-tr from-brand-accent/50 via-white/5 to-white/5 shadow-2xl">
                                <div className="w-full h-full rounded-full overflow-hidden bg-brand-nav relative">
                                    {avatarPreview ? (
                                        <Image
                                            src={avatarPreview}
                                            alt="Avatar"
                                            width={160}
                                            height={160}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-brand-gray">
                                            <User className="w-20 h-20 opacity-20" strokeWidth={1} />
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {avatarPreview && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    className="absolute top-2 right-2 p-3 bg-white text-black rounded-full hover:scale-110 transition-all shadow-xl z-20"
                                    title="Remover Foto"
                                >
                                    <X className="w-4 h-4" strokeWidth={3} />
                                </button>
                            )}
                        </div>

                        <label className="cursor-pointer group">
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleAvatarUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                            <div className="flex items-center gap-3 px-8 py-4 bg-brand-nav border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] group-hover:bg-white group-hover:text-black transition-all">
                                <Camera className="w-4 h-4" />
                                {uploading ? 'Enviando...' : 'Alterar Avatar'}
                            </div>
                        </label>
                    </div>

                    <div className="space-y-6">
                        {/* Display Name */}
                        <div>
                            <label htmlFor="display_name" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                                NOME DE EXIBIÇÃO
                            </label>
                            <input
                                id="display_name"
                                name="display_name"
                                type="text"
                                placeholder="Seu nome ou apelido"
                                className="w-full px-5 py-4 bg-brand-nav border border-white/5 rounded-2xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white placeholder:text-brand-gray/30"
                                value={formData.display_name || ''}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Welcome Message */}
                        <div>
                            <label htmlFor="welcome_message" className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-2 ml-1 opacity-60">
                                MENSAGEM DE BOAS-VINDAS
                            </label>
                            <textarea
                                id="welcome_message"
                                name="welcome_message"
                                rows={3}
                                placeholder="Frase personalizada para o seu Dashboard"
                                className="w-full px-5 py-4 bg-brand-nav border border-white/5 rounded-2xl focus:border-brand-accent/50 outline-none transition-all font-bold text-white placeholder:text-brand-gray/30 resize-none"
                                value={formData.welcome_message || ''}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-8 py-5 bg-brand-accent text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,240,255,0.3)] disabled:opacity-50"
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
                        className="w-full mt-4 flex items-center justify-center gap-2 px-8 py-3 bg-white/5 text-brand-gray/50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                    >
                        Voltar ao Dashboard
                    </button>
                </div>
            </form>
        </div>
    )
}
