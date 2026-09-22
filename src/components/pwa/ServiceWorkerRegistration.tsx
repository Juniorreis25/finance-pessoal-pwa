'use client'

import { useEffect, useState } from 'react'

export function ServiceWorkerRegistration() {
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
    const [updateAvailable, setUpdateAvailable] = useState(false)

    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return

        let active = true
        const controllerChangeListener = () => window.location.reload()

        const register = async () => {
            try {
                const currentRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
                if (!active) return

                setRegistration(currentRegistration)

                if (currentRegistration.waiting) {
                    window.requestAnimationFrame(() => setUpdateAvailable(true))
                }

                currentRegistration.addEventListener('updatefound', () => {
                    const installing = currentRegistration.installing
                    if (!installing) return

                    installing.addEventListener('statechange', () => {
                        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                            window.requestAnimationFrame(() => setUpdateAvailable(true))
                        }
                    })
                })
            } catch {
                // PWA enhancements must never block the application.
            }
        }

        navigator.serviceWorker.addEventListener('controllerchange', controllerChangeListener)
        void register()

        return () => {
            active = false
            if (controllerChangeListener) {
                navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeListener)
            }
        }
    }, [])

    const applyUpdate = () => {
        registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
    }

    if (!updateAvailable) return null

    return (
        <aside
            aria-label="Atualização disponível"
            className="fixed inset-x-4 bottom-4 z-[70] rounded-2xl border border-brand-accent/30 bg-brand-nav/95 p-4 text-white shadow-2xl backdrop-blur-xl"
        >
            <div className="flex items-center justify-between gap-4">
                <p className="text-xs leading-relaxed text-brand-gray">
                    Uma versão atualizada está disponível.
                </p>
                <button
                    type="button"
                    onClick={applyUpdate}
                    className="min-h-10 shrink-0 rounded-xl bg-brand-accent px-4 text-xs font-bold text-black"
                >
                    Atualizar
                </button>
            </div>
        </aside>
    )
}
