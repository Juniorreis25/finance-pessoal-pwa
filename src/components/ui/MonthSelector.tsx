'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MonthSelectorProps {
    currentDate: Date
    onDateChange: (date: Date) => void
}

export function MonthSelector({ currentDate, onDateChange }: MonthSelectorProps) {
    const handlePrevious = () => {
        onDateChange(subMonths(currentDate, 1))
    }

    const handleNext = () => {
        onDateChange(addMonths(currentDate, 1))
    }

    return (
        <div className="flex w-full items-center bg-brand-deep-sea border border-white/5 rounded-2xl p-1 shadow-xl h-[52px] sm:w-auto">
            <button
                onClick={handlePrevious}
                className="flex min-h-11 min-w-11 items-center justify-center p-2 text-brand-accent hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                aria-label="Mês anterior"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2 px-3 border-x border-white/5 mx-1 justify-center sm:min-w-[150px] sm:flex-none sm:px-4">
                <Calendar className="w-4 h-4 text-brand-accent opacity-50" />
                <span className="font-black text-white capitalize text-[10px] tracking-widest uppercase">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </span>
            </div>

            <button
                onClick={handleNext}
                className="flex min-h-11 min-w-11 items-center justify-center p-2 text-brand-accent hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                aria-label="Próximo mês"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    )
}
