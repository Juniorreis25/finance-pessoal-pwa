'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useIsMobile } from '@/hooks/useIsMobile'
import { formatChartCurrency } from './chartFormatters'

type FixedVsCardData = {
    name: string
    value: number
}

export function FixedVsCardChart({ data }: { data: FixedVsCardData[] }) {
    const isMobile = useIsMobile(640)

    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return <div className={`flex items-center justify-center text-center text-sm text-slate-400 ${isMobile ? 'min-h-20' : 'h-[300px] min-h-[300px]'}`}>Sem dados para exibir</div>
    }

    const COLORS = [
        '#00FF94', // Emerald (Alternative for Fixed)
        '#00F0FF', // Cyan (Credit Card)
    ]

    if (isMobile) {
        const total = data.reduce((sum, item) => sum + item.value, 0)
        const recurringShare = total > 0 ? (data[0]?.value ?? 0) / total * 100 : 0

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {data.map((item, index) => (
                        <div key={item.name} className="min-w-0">
                            <p className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} aria-hidden="true" />
                                <span className="truncate">{item.name}</span>
                            </p>
                            <p className="truncate text-base font-semibold tabular-nums text-white">{formatChartCurrency(item.value)}</p>
                        </div>
                    ))}
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`Recorrentes ${Math.round(recurringShare)}%, cartões ${Math.round(100 - recurringShare)}%`}>
                    <div className="h-full bg-emerald-400" style={{ width: `${recurringShare}%` }} />
                    <div className="h-full bg-cyan-400" style={{ width: `${100 - recurringShare}%` }} />
                </div>
            </div>
        )
    }

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
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
