'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useIsMobile } from '@/hooks/useIsMobile'

type CategoryData = {
    name: string
    value: number
    color: string
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
    const isMobile = useIsMobile(640)

    if (!data || data.length === 0) {
        return <div className="h-full flex items-center justify-center text-slate-500 font-medium">Sem dados para exibir</div>
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
