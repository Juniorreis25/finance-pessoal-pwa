import { addMonths, setDate, startOfDay, getDate } from 'date-fns'

export function isDateInCalendarMonth(dateValue: string, referenceDate: Date): boolean {
    const databaseMonth = dateValue.slice(0, 7)
    const referenceMonth = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`

    return databaseMonth === referenceMonth
}

export type CardStatus = {
    status: 'open' | 'closed-current' | 'overdue'
    bestPurchaseDate: Date
    isGoodDayToBuy: boolean
    currentInvoiceMonth: Date // The month the current "open" invoice refers to
}

export function calculateCardStatus(
    currentDate: Date,
    closingDay: number
): CardStatus {
    // Simple Mock Implementation
    const today = startOfDay(currentDate)
    const currentDayOfMonth = getDate(today)

    // Create Date object for closing day of current month
    const thisMonthClosingDate = setDate(today, closingDay)

    if (currentDayOfMonth >= closingDay) {
        // After closing date
        return {
            status: 'closed-current',
            bestPurchaseDate: thisMonthClosingDate, // It was the closing date
            isGoodDayToBuy: true,
            currentInvoiceMonth: addMonths(today, 1) // Invoice is for next month
        }
    } else {
        // Before closing date
        return {
            status: 'open',
            bestPurchaseDate: thisMonthClosingDate, // Wait for closing date
            isGoodDayToBuy: false,
            currentInvoiceMonth: today
        }
    }
}

export function isRecurringActiveForMonth(startDate: string | null | undefined, referenceDate: Date): boolean {
    if (!startDate) return true

    const referenceMonth = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`
    return startDate.slice(0, 7) <= referenceMonth
}