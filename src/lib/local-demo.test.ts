import { beforeEach, describe, expect, it } from 'vitest'
import {
    appendLocalDemoRecurring,
    deleteLocalDemoRecurring,
    getLocalDemoRecurring,
    updateLocalDemoRecurring,
} from './local-demo'

describe('local demo recurring persistence', () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    it('creates, updates and deletes a recurring entry', () => {
        appendLocalDemoRecurring({
            id: 'recurring-1',
            description: 'Internet',
            amount: 120,
            type: 'expense',
            category: 'Moradia',
            start_date: '2026-08-31',
            day_of_month: 31,
            active: true,
        })

        expect(getLocalDemoRecurring()).toHaveLength(1)

        updateLocalDemoRecurring('recurring-1', { active: false })
        expect(getLocalDemoRecurring()[0].active).toBe(false)

        deleteLocalDemoRecurring('recurring-1')
        expect(getLocalDemoRecurring()).toEqual([])
    })
})