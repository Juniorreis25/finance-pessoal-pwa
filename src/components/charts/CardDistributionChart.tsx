'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useIsMobile } from '@/hooks/useIsMobile'

type CardDistData = {
    name: string
    valor: number
}

export function CardDistributionChart({ data }: { data: CardDistData[] }) {
    const isMobile = useIsMobile(640)

    if (!data || data.length === 0 || data.every(d => d.valor === 0)) {
        return <div className="h-[300px] flex items-center justify-center text-slate-500 font-medium">Sem faturas para este mês</div>
    }

    const COLORS = ['#00F0FF', '#00FF94', '#FFFFFF', '#8E8E93']

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
