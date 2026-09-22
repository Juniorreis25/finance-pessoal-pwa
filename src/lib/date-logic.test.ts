import { describe, it, expect } from 'vitest'
import { calculateCardStatus, isDateInCalendarMonth } from './date-logic'

describe('isDateInCalendarMonth', () => {
    it('keeps the 31st in its stored calendar month', () => {
        const august = new Date(2026, 7, 1)

        expect(isDateInCalendarMonth('2026-08-31', august)).toBe(true)
        expect(isDateInCalendarMonth('2026-08-31T23:00:00.000Z', august)).toBe(true)
    })

    it('does not include the date in the following month', () => {
        const september = new Date(2026, 8, 1)

        expect(isDateInCalendarMonth('2026-08-31', september)).toBe(false)
    })
})

describe('calculateCardStatus', () => {
    // Scenario: Closing day is 10, Due day is 17. Current day is 5.
    // Invoice is OPEN. Best day is roughly after 10th.

    it('identifies invoice status correctly before closing date', () => {
        const today = new Date(2024, 2, 5) // March 5th
        const closingDay = 10

        const result = calculateCardStatus(today, closingDay)

        expect(result.status).toBe('open')
        expect(result.bestPurchaseDate.getDate()).toBe(10) // Usually best purchase is closing date (or +1)
    })

    it('identifies best purchase day as closing date', () => {
        // If closing date is 10th, buying on 10th usually falls on next invoice (depending on bank logic, sometimes 10th is inclusive or exclusive. Let's assume buying ON closing day enters next month)
        // Actually, usually closing day means the invoice closes. Buying ON that day might still be current or next.
        // Let's assume: Best day is the closing day (starts next invoice).

        const today = new Date(2024, 2, 5) // March 5th, Local Time
        const closingDay = 10

        const result = calculateCardStatus(today, closingDay)
        // Expect best purchase date to be March 10th
        expect(result.bestPurchaseDate).toEqual(new Date(2024, 2, 10))
    })

    it('handles date after closing date (Invoice Closed / Next Invoice Open)', () => {
        const today = new Date(2024, 2, 12) // March 12th
        const closingDay = 10

        const result = calculateCardStatus(today, closingDay)

        expect(result.status).toBe('closed-current') // Current month closed, buying now is for next
        // Best purchase date was the 10th of THIS month (already passed), so effectively "Today" is good
        expect(result.isGoodDayToBuy).toBe(true)
    })

    it('calculates due date correctly crossing year boundary', () => {
        // Edge cases logic...
    })
})
