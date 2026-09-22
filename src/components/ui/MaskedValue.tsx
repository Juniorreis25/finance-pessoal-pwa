'use client'

import { usePrivacy } from '@/providers/PrivacyProvider'

interface MaskedValueProps {
    value: number
    className?: string
    prefix?: string
}

export function MaskedValue({ value, className = "", prefix = "R$ " }: MaskedValueProps) {
    const { isValuesVisible } = usePrivacy()

    if (!isValuesVisible) {
        return <span className={`font-mono tracking-widest blur-sm select-none ${className}`}>••••••</span>
    }

    return (
        <span className={className}>
            {prefix}{value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
    )
}
