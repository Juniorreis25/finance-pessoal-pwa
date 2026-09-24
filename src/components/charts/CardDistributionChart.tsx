'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { formatChartCurrency } from './chartFormatters'

type CardDistData = {
    name: string
    valor: number
}

export function CardDistributionChart({ data }: { data: CardDistData[] }) {
    const isMobile = useIsMobile(640)
    const [showAll, setShowAll] = useState(false)

    if (!data || data.length === 0 || data.every(d => d.valor === 0)) {
        return <div className={`flex items-center justify-center text-center text-sm text-slate-400 ${isMobile ? 'min-h-20' : 'h-[300px] min-h-[300px]'}`}>Sem faturas para este mês</div>
    }

    const COLORS = ['#00F0FF', '#00FF94', '#FFFFFF', '#8E8E93']

    if (isMobile) {
        const sortedData = [...data].sort((a, b) => b.valor - a.valor)
        const maxValue = Math.max(...sortedData.map(item => item.valor), 1)
        const visibleData = showAll ? sortedData : sortedData.slice(0, 3)

        return (
            <div className="space-y-3">
                <p className="text-xs text-slate-400">Maiores gastos em cartões neste mês</p>
                <ul className="divide-y divide-white/5">
                    {visibleData.map((item, index) => (
                        <li key={`${item.name}-${index}`} className="py-3 first:pt-1 last:pb-1">
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <span className="min-w-0 flex-1 break-words text-sm font-medium text-white">{item.name}</span>
                                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-200">{formatChartCurrency(item.valor)}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(0, Math.min(100, item.valor / maxValue * 100))}%` }} />
                            </div>
                        </li>
                    ))}
                </ul>
                {sortedData.length > 3 && (
                    <button type="button" onClick={() => setShowAll(value => !value)} className="min-h-11 w-full rounded-lg text-sm font-semibold text-brand-accent hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
                        {showAll ? 'Mostrar menos' : `Ver todos (${sortedData.length})`}
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="h-[300px] min-h-[300px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} initialDimension={{ width: 1, height: 300 }}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 15, left: 10, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff" opacity={0.05} />
                    <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#8E8E93', fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(value) => `R$${value}`}
                    />
                    <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 9, fontWeight: 700 }}
                        width={isMobile ? 65 : 90}
                        tickFormatter={(value) => isMobile && value.length > 10 ? `${value.substring(0, 8)}..` : value}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
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
                    <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={20}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
