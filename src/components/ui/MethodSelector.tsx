'use client'

import { useState, useRef, useEffect } from 'react'
import { Filter, ChevronDown, Check } from 'lucide-react'

type Card = {
    id: string
    name: string
}

type MethodSelectorProps = {
    cards: Card[]
    selectedIds: string[]
    onChange: (ids: string[]) => void
}

export function MethodSelector({ cards, selectedIds, onChange }: MethodSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleId = (id: string) => {
        if (id === 'all') {
            onChange(['all'])
            return
        }

        let newIds = [...selectedIds]

        // If 'all' was selected and we click something else, remove 'all'
        if (newIds.includes('all')) {
            newIds = [id]
        } else {
            if (newIds.includes(id)) {
                newIds = newIds.filter(i => i !== id)
            } else {
                newIds.push(id)
            }
        }

        // If nothing is selected, revert to 'all'
        if (newIds.length === 0) {
            newIds = ['all']
        }

        onChange(newIds)
    }

    const getLabel = () => {
        if (selectedIds.includes('all')) return 'Todos os Métodos'

        const labels: string[] = []
        if (selectedIds.includes('cash')) labels.push('Dinheiro')

        selectedIds.forEach(id => {
            if (id !== 'all' && id !== 'cash') {
                const card = cards.find(c => c.id === id)
                if (card) labels.push(card.name)
            }
        })

        if (labels.length === 0) return 'Todos os Métodos'
        if (labels.length === 1) return labels[0]
        return `${labels[0]} + ${labels.length - 1}`
    }

    return (
        <div className="relative w-full md:w-72" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full pl-5 pr-12 py-3.5 bg-brand-deep-sea border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-brand-accent/50 transition-all cursor-pointer shadow-xl flex items-center justify-between text-left h-[52px]"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <Filter className="w-4 h-4 text-brand-accent shrink-0 opacity-50" />
                    <span className="truncate">{getLabel()}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-brand-accent transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-3 w-full bg-brand-deep-sea border border-white/10 rounded-3xl shadow-2xl p-2 py-4 backdrop-blur-xl animate-in fade-in zoom-in duration-200">
                    <div className="max-h-64 overflow-y-auto custom-scrollbar px-2 space-y-1">
                        <button
                            type="button"
                            onClick={() => toggleId('all')}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedIds.includes('all') ? 'text-brand-accent' : 'text-slate-400'}`}>Todos os Métodos</span>
                            {selectedIds.includes('all') && <Check className="w-4 h-4 text-brand-accent" />}
                        </button>

                        <div className="h-px bg-white/5 my-2 mx-2" />

                        <button
                            type="button"
                            onClick={() => toggleId('cash')}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedIds.includes('cash') ? 'text-brand-accent' : 'text-slate-400'}`}>Dinheiro/Débito</span>
                            {selectedIds.includes('cash') && <Check className="w-4 h-4 text-brand-accent" />}
                        </button>

                        {cards.map(card => (
                            <button
                                key={card.id}
                                type="button"
                                onClick={() => toggleId(card.id)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedIds.includes(card.id) ? 'text-brand-accent' : 'text-slate-400'}`}>{card.name}</span>
                                {selectedIds.includes(card.id) && <Check className="w-4 h-4 text-brand-accent" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
