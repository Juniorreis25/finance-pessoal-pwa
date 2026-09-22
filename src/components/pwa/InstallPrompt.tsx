'use client'

import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'finance-pessoal-pwa-install-prompt-dismissed-v1'

function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
        || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
}

function isIosSafari() {
    const userAgent = window.navigator.userAgent
    const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)
    return isAppleMobile && isSafari
}

export function InstallPrompt() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (isStandalone() || !isIosSafari()) return

        try {
            if (window.localStorage.getItem(DISMISSED_KEY) === 'true') return
        } catch {
            // A blocked localStorage must not prevent normal application use.
        }

        const frame = window.requestAnimationFrame(() => setVisible(true))
        return () => window.cancelAnimationFrame(frame)
    }, [])

    const dismiss = () => {
        try {
            window.localStorage.setItem(DISMISSED_KEY, 'true')
        } catch {
            // Dismissal remains local to the current render when storage is unavailable.
        }
        setVisible(false)
    }

    if (!visible) return null

    return (
        <aside
            aria-label="Instalar Finance Pessoal"
            className="fixed inset-x-4 bottom-4 z-[70] rounded-2xl border border-brand-accent/30 bg-brand-nav/95 p-4 text-white shadow-2xl backdrop-blur-xl"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-brand-accent">Instale no iPhone</p>
                    <p className="mt-1 text-xs leading-relaxed text-brand-gray">
                        No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dispensar instrução de instalação"
                    className="rounded-lg px-2 py-1 text-lg leading-none text-brand-gray hover:bg-white/10 hover:text-white"
                >
                    ×
                </button>
            </div>
        </aside>
    )
}
