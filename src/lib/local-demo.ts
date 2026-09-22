export type LocalDemoTransaction = {
    id: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    date: string
    purchase_date: string | null
    card_id: string | null
    installment_id: string | null
    installment_number: number | null
    total_installments: number | null
}

export type LocalDemoRecurring = {
    id: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    start_date: string
    day_of_month: number
    active: boolean
}

const transactionStorageKey = 'finance-pessoal-local-demo-transactions-v3'
const recurringStorageKey = 'finance-pessoal-local-demo-recurring-v1'

export const isLocalDemoMode =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_LOCAL_DEMO_MODE === 'true'

const initialTransactions: LocalDemoTransaction[] = []

export function getLocalDemoTransactions(): LocalDemoTransaction[] {
    if (typeof window === 'undefined') return initialTransactions

    try {
        const stored = window.localStorage.getItem(transactionStorageKey)
        const transactions = stored ? JSON.parse(stored) : []
        return [...initialTransactions, ...transactions]
    } catch {
        return initialTransactions
    }
}

export function appendLocalDemoTransactions(transactions: LocalDemoTransaction[]) {
    if (typeof window === 'undefined') return

    const existing = getLocalDemoTransactions().filter(transaction => !transaction.id.startsWith('demo-'))
    window.localStorage.setItem(transactionStorageKey, JSON.stringify([...existing, ...transactions]))
}

export function getLocalDemoRecurring(): LocalDemoRecurring[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = window.localStorage.getItem(recurringStorageKey)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

export function appendLocalDemoRecurring(recurring: LocalDemoRecurring) {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(
        recurringStorageKey,
        JSON.stringify([...getLocalDemoRecurring(), recurring])
    )
}

export function updateLocalDemoRecurring(id: string, updates: Partial<LocalDemoRecurring>) {
    if (typeof window === 'undefined') return

    const recurring = getLocalDemoRecurring().map(item =>
        item.id === id ? { ...item, ...updates, id: item.id } : item
    )
    window.localStorage.setItem(recurringStorageKey, JSON.stringify(recurring))
}

export function deleteLocalDemoRecurring(id: string) {
    if (typeof window === 'undefined') return

    const recurring = getLocalDemoRecurring().filter(item => item.id !== id)
    window.localStorage.setItem(recurringStorageKey, JSON.stringify(recurring))
}