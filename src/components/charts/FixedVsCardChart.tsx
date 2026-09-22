'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useIsMobile } from '@/hooks/useIsMobile'

type FixedVsCardData = {
    name: string
    value: number
}

export function FixedVsCardChart({ data }: { data: FixedVsCardData[] }) {
    const isMobile = useIsMobile(640)

    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return <div className="h-[300px] flex items-center justify-center text-slate-500 font-medium">Sem dados para exibir</div>
    }

    const COLORS = [
        '#00FF94', // Emerald (Alternative for Fixed)
        '#00F0FF', // Cyan (Credit Card)
    ]

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
