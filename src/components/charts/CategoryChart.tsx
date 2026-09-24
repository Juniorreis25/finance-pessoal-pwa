'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { formatChartCurrency } from './chartFormatters'

type CategoryData = {
    name: string
    value: number
    color: string
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
    const isMobile = useIsMobile(640)
    const [showAll, setShowAll] = useState(false)

    if (!data || data.length === 0) {
        return <div className="h-full flex items-center justify-center text-slate-500 font-medium">Sem dados para exibir</div>
    }

    if (isMobile) {
        const sortedData = [...data].sort((a, b) => b.value - a.value)
        const total = sortedData.reduce((sum, item) => sum + item.value, 0)
        const visibleData = showAll ? sortedData : sortedData.slice(0, 5)
        const colors = ['#00F0FF', '#00FF94', '#A5F3FC', '#86EFAC', '#FFFFFF']

        return (
            <div className="space-y-3">
                <p className="text-xs text-slate-400">Despesas por categoria neste mês</p>
                <ul className="divide-y divide-white/5">
                    {visibleData.map((item, index) => {
                        const percentage = total > 0 ? (item.value / total) * 100 : 0
                        return (
                            <li key={`${item.name}-${index}`} className="py-3 first:pt-1 last:pb-1">
                                <div className="mb-2 flex items-baseline justify-between gap-3">
                                    <span className="min-w-0 flex-1 break-words text-sm font-medium text-white">{item.name}</span>
                                    <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-200">{formatChartCurrency(item.value)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, percentage))}%`, backgroundColor: colors[index % colors.length] }} />
                                    </div>
                                    <span className="w-10 text-right text-xs tabular-nums text-slate-400">{Math.round(percentage)}%</span>
                                </div>
                            </li>
                        )
                    })}
                </ul>
                {sortedData.length > 5 && (
                    <button type="button" onClick={() => setShowAll(value => !value)} className="min-h-11 w-full rounded-lg text-sm font-semibold text-brand-accent hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
                        {showAll ? 'Mostrar menos' : `Ver todas (${sortedData.length})`}
                    </button>
                )}
            </div>
        )
    }

    // Neo-Dark Hybrid Banking Palette
    const NEO_PALETTE = [
        '#00F0FF', // Cyan
        '#00FF94', // Emerald
        '#FFFFFF', // White
        '#8E8E93', // Gray
        '#003D2B', // Dark Emerald
        '#141C24', // Deep Sea
    ]

    return (
        <div className="h-[300px] min-h-[300px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} initialDimension={{ width: 1, height: 300 }}>
                <PieChart>
                    <Pie
                        data={data}
                        cx={isMobile ? "50%" : "40%"}
                        cy="50%"
                        innerRadius={isMobile ? 55 : 65}
                        outerRadius={isMobile ? 75 : 85}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={NEO_PALETTE[index % NEO_PALETTE.length]} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number | string | undefined) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        contentStyle={{
                            backgroundColor: '#141C24',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '12px'
                        }}
                        itemStyle={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#FFFFFF', marginBottom: '4px', fontWeight: 'bold' }}
                    />
                    <Legend
                        verticalAlign={isMobile ? "bottom" : "middle"}
                        align={isMobile ? "center" : "right"}
                        layout={isMobile ? "horizontal" : "vertical"}
                        iconType="circle"
                        wrapperStyle={isMobile ? { fontSize: '9px', paddingTop: '10px' } : { fontSize: '10px' }}
                        formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-[#8E8E93] ml-2">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
