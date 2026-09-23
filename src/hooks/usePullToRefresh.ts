import { useRef, useState, type TouchEvent } from 'react'

const REFRESH_THRESHOLD = 72

export function usePullToRefresh(onRefresh: () => void) {
    const startY = useRef<number | null>(null)
    const distance = useRef(0)
    const [pullDistance, setPullDistance] = useState(0)

    const reset = () => {
        startY.current = null
        distance.current = 0
        setPullDistance(0)
    }

    const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
        if (event.currentTarget.scrollTop > 0 || event.touches.length !== 1) return
        startY.current = event.touches[0].clientY
    }

    const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
        if (startY.current === null || event.touches.length !== 1) return
        if (event.currentTarget.scrollTop > 0) { reset(); return }
        const delta = event.touches[0].clientY - startY.current
        distance.current = Math.min(96, Math.max(0, delta * 0.55))
        setPullDistance(distance.current)
    }

    const onTouchEnd = () => {
        const shouldRefresh = distance.current >= REFRESH_THRESHOLD
        reset()
        if (shouldRefresh) onRefresh()
    }

    return { pullDistance, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: reset }
}
