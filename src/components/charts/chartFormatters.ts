const brlFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function formatChartCurrency(value: number) {
    return brlFormatter.format(Number.isFinite(value) ? value : 0)
}
