import { describe, expect, it } from 'vitest'
import {
    getRecurringOccurrenceDate,
    isRecurringEntryActiveForMonth,
    type RecurringEntry,
} from './recurring-logic'

const recurring: RecurringEntry = {
    id: 'recurring-1',
    description: 'Conta fixa',
    amount: 100,
    type: 'expense',
    category: 'Moradia',
    start_date: '2026-08-31',
    day_of_month: 31,
    active: true,
}

describe('recurring occurrence rules', () => {
    it('includes the recurrence in its start month', () => {
        expect(isRecurringEntryActiveForMonth(recurring, new Date(2026, 7, 1))).toBe(true)
        expect(getRecurringOccurrenceDate(recurring, new Date(2026, 7, 1))).toBe('2026-08-31')
    })

    it('does not include the recurrence before its start month', () => {
        expect(isRecurringEntryActiveForMonth(recurring, new Date(2026, 6, 1))).toBe(false)
        expect(getRecurringOccurrenceDate(recurring, new Date(2026, 6, 1))).toBeNull()
    })

    it('continues in following months and clamps day 31 to the last valid day', () => {
        expect(getRecurringOccurrenceDate(recurring, new Date(2026, 8, 1))).toBe('2026-09-30')
        expect(getRecurringOccurrenceDate(recurring, new Date(2027, 1, 1))).toBe('2027-02-28')
    })

    it('does not project an inactive recurrence', () => {
        expect(getRecurringOccurrenceDate({ ...recurring, active: false }, new Date(2026, 8, 1))).toBeNull()
    })
})