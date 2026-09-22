import { describe, it, expect } from 'vitest'
import { transactionSchema } from '../lib/schemas'

describe('Transaction Schema Validation', () => {
    it('should validate a correct transaction', () => {
        const validTransaction = {
            description: 'Supermercado',
            amount: 150.50,
            type: 'expense',
            category: 'Alimentação',
            date: new Date().toISOString(),
        }
        const result = transactionSchema.safeParse(validTransaction)
        expect(result.success).toBe(true)
    })

    it('should reject negative amounts', () => {
        const invalidTransaction = {
            description: 'Erro',
            amount: -100,
            type: 'expense',
            category: 'Outros',
            date: new Date().toISOString(),
        }
        const result = transactionSchema.safeParse(invalidTransaction)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('O valor deve ser positivo')
        }
    })

    it('should require a description', () => {
        const invalidTransaction = {
            description: '',
            amount: 100,
            type: 'income',
            category: 'Salário',
            date: new Date().toISOString(),
        }
        const result = transactionSchema.safeParse(invalidTransaction)
        expect(result.success).toBe(false)
    })
})
