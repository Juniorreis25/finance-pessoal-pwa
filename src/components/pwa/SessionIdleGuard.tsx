'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isLocalDemoMode } from '@/lib/local-demo'

export const IDLE_TIMEOUT_MS = 30_000
export const ACTIVITY_KEY = 'finance-pessoal-last-activity'

export function SessionIdleGuard() {
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        if (isLocalDemoMode) return

        const storedActivity = Number(localStorage.getItem(ACTIVITY_KEY))
        let lastActivity = Number.isFinite(storedActivity) && storedActivity > 0 ? storedActivity : Date.now()
        let loggingOut = false
        let lastWrite = 0
        if (!storedActivity) localStorage.setItem(ACTIVITY_KEY, String(lastActivity))

        const recordActivity = () => {
            if (loggingOut || document.visibilityState === 'hidden') return
            const now = Date.now()
            // A late event must not revive an already expired session.
            if (now - lastActivity >= IDLE_TIMEOUT_MS) {
                void checkIdle()
                return
            }
            lastActivity = now
            if (now - lastWrite >= 1000) {
                localStorage.setItem(ACTIVITY_KEY, String(now))
                lastWrite = now
            }
        }

        const checkIdle = async () => {
            if (loggingOut) return
            const sharedActivity = Number(localStorage.getItem(ACTIVITY_KEY)) || lastActivity
            lastActivity = Math.max(lastActivity, sharedActivity)
            if (Date.now() - lastActivity < IDLE_TIMEOUT_MS) return

            loggingOut = true
            const { error } = await supabase.auth.signOut({ scope: 'local' })
            if (error) console.error('Erro ao encerrar sessão inativa:', error.message)
            localStorage.removeItem(ACTIVITY_KEY)
            router.replace('/login?reason=inactive')
            router.refresh()
        }

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') void checkIdle()
        }
        const onStorage = (event: StorageEvent) => {
            if (event.key === ACTIVITY_KEY && event.newValue) {
                lastActivity = Math.max(lastActivity, Number(event.newValue) || 0)
            }
        }

        const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'touchmove', 'wheel', 'scroll'] as const
        activityEvents.forEach(event => document.addEventListener(event, recordActivity, true))
        document.addEventListener('visibilitychange', onVisibilityChange)
        window.addEventListener('focus', onVisibilityChange)
        window.addEventListener('storage', onStorage)
        const interval = window.setInterval(() => { void checkIdle() }, 1000)
        void checkIdle()

        return () => {
            activityEvents.forEach(event => document.removeEventListener(event, recordActivity, true))
            document.removeEventListener('visibilitychange', onVisibilityChange)
            window.removeEventListener('focus', onVisibilityChange)
            window.removeEventListener('storage', onStorage)
            window.clearInterval(interval)
        }
    }, [router, supabase])

    return null
}
