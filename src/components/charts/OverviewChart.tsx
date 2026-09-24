'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useIsMobile } from '@/hooks/useIsMobile'
import { formatChartCurrency } from './chartFormatters'

type OverviewData = {
    name: string
    receita: number
    despesa: number
}

type Metric = 'receita' | 'despesa'

export function OverviewChart({ data, currentMonth }: { data: OverviewData[]; currentMonth: number }) {
    const isMobile = useIsMobile(640)
    const [metric, setMetric] = useState<Metric>('despesa')
    const [selectedMonth, setSelectedMonth] = useState(currentMonth)

    useEffect(() => {
        setSelectedMonth(currentMonth)
    }, [currentMonth])

    const selectedData = data[selectedMonth] ?? data[0]
    const maxValue = Math.max(1, ...data.map(item => Math.max(0, Number(item[metric]) || 0)))

    if (!data || data.length === 0) {
        return <div className="h-full flex items-center justify-center text-slate-500 font-medium">Sem dados para exibir</div>
    }

    if (isMobile) {
        return (
            <div className="space-y-4">
                <div className="flex rounded-xl bg-white/5 p-1" role="group" aria-label="Série do gráfico anual">
                    {(['despesa', 'receita'] as const).map(series => (
                        <button
                            key={series}
                            type="button"
                            aria-pressed={metric === series}
                            onClick={() => setMetric(series)}
                            className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors ${metric === series ? 'bg-white/10 text-white' : 'text-slate-400'}`}
                        >
                            {series === 'despesa' ? 'Gastos' : 'Ganhos'}
                        </button>
                    ))}
                </div>

                <div className="rounded-xl bg-white/[0.03] px-3 py-4">
                    <div className="flex h-28 items-end gap-1.5" role="img" aria-label={`${metric === 'despesa' ? 'Gastos' : 'Ganhos'} por mês no ano`}>
                        {data.map((item, index) => {
                            const value = item[metric]
                            const height = value > 0 ? Math.max(5, (value / maxValue) * 100) : 2
                            return (
                                <div key={`${item.name}-${index}`} className={`flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-sm ${index === selectedMonth ? 'ring-1 ring-inset ring-brand-accent/60' : ''}`} title={`${item.name}: ${formatChartCurrency(value)}`}>
                                    <div className="flex h-full w-full items-end">
                                        <div
                                            className={`w-full rounded-t-sm ${metric === 'despesa' ? 'bg-rose-400' : 'bg-emerald-400'}`}
                                            style={{ height: `${height}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] lowercase leading-none ${index === selectedMonth ? 'font-bold text-brand-accent' : 'font-medium text-slate-400'}`}>{item.name.replace('.', '')}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {selectedData && (
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <label htmlFor="overview-selected-month" className="block text-xs text-slate-400">Detalhe do mês</label>
                            <span className="block truncate text-sm font-semibold tabular-nums text-white" aria-live="polite">
                                {formatChartCurrency(selectedData[metric])}
                            </span>
                        </div>
                        <div className="flex min-w-0 items-center gap-3">
                            <select
                                id="overview-selected-month"
                                value={selectedMonth}
                                onChange={event => setSelectedMonth(Number(event.target.value))}
                                className="min-h-11 max-w-32 rounded-lg border border-white/10 bg-brand-deep-sea px-3 text-sm capitalize text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                            >
                                {data.map((item, index) => <option key={`${item.name}-${index}`} value={index}>{item.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="h-[300px] min-h-[300px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} initialDimension={{ width: 1, height: 300 }}>
                <BarChart
                    data={data}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.05} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#8E8E93', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#8E8E93', fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(value) => `R$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
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
                    <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ paddingBottom: '30px' }}
                        formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-[#8E8E93] mr-2">{value}</span>}
                    />
                    <Bar dataKey="receita" name="Ganhos" fill="#00FF94" radius={[6, 6, 0, 0]} barSize={12} />
                    <Bar dataKey="despesa" name="Gastos" fill="#FFFFFF" radius={[6, 6, 0, 0]} barSize={12} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
