'use client'

import { useState, useRef, useEffect } from 'react'
import { Filter, ChevronDown, Check, Eye, EyeOff } from 'lucide-react'

export type CardStatusFilter = 'all' | 'active' | 'inactive'

type StatusSelectorProps = {
    selectedStatus: CardStatusFilter
    onChange: (status: CardStatusFilter) => void
}

export function StatusSelector({ selectedStatus, onChange }: StatusSelectorProps) {
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

    const getLabel = () => {
        if (selectedStatus === 'all') return 'Todos os Status'
        if (selectedStatus === 'active') return 'Ativos'
        if (selectedStatus === 'inactive') return 'Inativos'
        return 'Todos os Status'
    }

    const options = [
        { id: 'all', label: 'Todos os Status', icon: Filter },
        { id: 'active', label: 'Ativos', icon: Eye, color: 'text-brand-success' },
        { id: 'inactive', label: 'Inativos', icon: EyeOff, color: 'text-rose-500' },
    ]

    return (
        <div className="relative w-full md:w-56" ref={dropdownRef}>
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
                    <div className="px-2 space-y-1">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onChange(option.id as CardStatusFilter)
                                    setIsOpen(false)
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <option.icon className={`w-4 h-4 ${option.color || 'text-brand-accent'} opacity-70`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedStatus === option.id ? 'text-brand-accent' : 'text-slate-400'}`}>
                                        {option.label}
                                    </span>
                                </div>
                                {selectedStatus === option.id && <Check className="w-4 h-4 text-brand-accent" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
