import { z } from 'zod'

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nome da categoria é obrigatório'),
  type: z.enum(['income', 'expense']),
  user_id: z.string().uuid().optional(),
})

export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Categoria é obrigatória'), // In future this could be a UUID
  date: z.string().min(1, 'Data é obrigatória'),
  card_id: z.string().uuid().nullable().optional(),
})

export type Category = z.infer<typeof categorySchema>
export type Transaction = z.infer<typeof transactionSchema>
