import { useRef, useState, type TouchEvent } from 'react'

const REFRESH_THRESHOLD = 72

export function usePullToRefresh(onRefresh: () => void) {
    const startY = useRef<number | null>(null)
    const distance = useRef(0)
    const touchIdentifier = useRef<number | null>(null)
    const isArmed = useRef(false)
    const [pullDistance, setPullDistance] = useState(0)

    const reset = () => {
        startY.current = null
        distance.current = 0
        touchIdentifier.current = null
        isArmed.current = false
        setPullDistance(0)
    }

    const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
        // Every new gesture starts clean, including gestures that cannot refresh.
        reset()
        if (event.currentTarget.scrollTop > 0 || event.touches.length !== 1) return

        startY.current = event.touches[0].clientY
        touchIdentifier.current = event.touches[0].identifier
        isArmed.current = true
    }

    const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
        if (!isArmed.current || startY.current === null) return
        if (
            event.currentTarget.scrollTop > 0 ||
            event.touches.length !== 1 ||
            event.touches[0].identifier !== touchIdentifier.current
        ) {
            reset()
            return
        }

        const delta = event.touches[0].clientY - startY.current
        if (delta <= 0) {
            reset()
            return
        }

        distance.current = Math.min(96, Math.max(0, delta * 0.55))
        setPullDistance(distance.current)
    }

    const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
        const shouldRefresh =
            isArmed.current &&
            event.currentTarget.scrollTop <= 0 &&
            distance.current >= REFRESH_THRESHOLD
        reset()
        if (shouldRefresh) onRefresh()
    }

    return { pullDistance, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: reset }
}
