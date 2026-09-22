'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type PrivacyContextType = {
    isValuesVisible: boolean
    toggleVisibility: () => void
}

const PrivacyContext = createContext<PrivacyContextType>({
    isValuesVisible: true,
    toggleVisibility: () => { }
})

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
    const [isValuesVisible, setIsValuesVisible] = useState(true)

    useEffect(() => {
        // Load preference from localStorage
        const stored = localStorage.getItem('privacy_mode')
        if (stored !== null) {
            // eslint-disable-next-line
            setIsValuesVisible(stored === 'true')
        }
    }, [])

    const toggleVisibility = () => {
        setIsValuesVisible(prev => {
            const newValue = !prev
            localStorage.setItem('privacy_mode', String(newValue))
            return newValue
        })
    }

    return (
        <PrivacyContext.Provider value={{ isValuesVisible, toggleVisibility }}>
            {children}
        </PrivacyContext.Provider>
    )
}

export const usePrivacy = () => useContext(PrivacyContext)
