import { useState, useEffect } from 'react'

/**
 * Hook para detectar se o dispositivo é mobile baseado na largura da tela.
 * Seguro para uso em ambientes Next.js (SSR).
 */
export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkSize = () => {
            setIsMobile(window.innerWidth < breakpoint)
        }

        // Executa a primeira checagem após a montagem do componente no cliente
        checkSize()

        window.addEventListener('resize', checkSize)
        return () => window.removeEventListener('resize', checkSize)
    }, [breakpoint])

    return isMobile
}
