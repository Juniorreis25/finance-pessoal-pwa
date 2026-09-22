export type RecurringEntry = {
    id: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    start_date: string
    day_of_month: number
    active: boolean
}

export function getCalendarMonthKey(referenceDate: Date): string {
    return `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`
}

export function isRecurringEntryActiveForMonth(
    recurring: Pick<RecurringEntry, 'active' | 'start_date'>,
    referenceDate: Date
): boolean {
    return recurring.active && recurring.start_date.slice(0, 7) <= getCalendarMonthKey(referenceDate)
}

export function getRecurringOccurrenceDate(
    recurring: Pick<RecurringEntry, 'active' | 'start_date' | 'day_of_month'>,
    referenceDate: Date
): string | null {
    if (!isRecurringEntryActiveForMonth(recurring, referenceDate)) return null

    const year = referenceDate.getFullYear()
    const monthIndex = referenceDate.getMonth()
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate()
    const day = Math.min(Math.max(recurring.day_of_month, 1), lastDayOfMonth)

    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}