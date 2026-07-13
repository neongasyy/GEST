import client from './client'
import type { User } from './auth'

export type SplitType = 'equal' | 'exact' | 'percentage'

export interface SplitInput {
    user_id: number
    value?: string
}

export interface ExpenseSplit {
    id: number
    user: User
    amount_owed: string
}

export interface Expense {
  id: number
  group_id: number
  description: string
  amount: string
  paid_by: number
  split_type: SplitType
  created_at: string
  splits: ExpenseSplit[]
}

export interface ExpenseCreateInput {
  description: string
  amount: string
  paid_by: number
  split_type: SplitType
  splits: SplitInput[]
}

export async function listExpenses(groupId: number): Promise<Expense[]> {
    const response = await client.get<Expense[]>(`/groups/${groupId}/expenses`)
    return response.data
}

export async function createExpense(groupId: number, data: ExpenseCreateInput): Promise<Expense> {
    const response = await client.post<Expense>(`/groups/${groupId}/expenses`, data)
    return response.data
}