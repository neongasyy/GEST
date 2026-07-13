import client from './client'
import type { User } from './auth'

export interface UserBalance {
  user: User
  net_balance: string
}

export interface SettlementSuggestion {
  from_user: User
  to_user: User
  amount: string
}

export interface GroupBalances {
  balances: UserBalance[]
  suggested_settlements: SettlementSuggestion[]
}

export interface Settlement {
  id: number
  payer: User
  payee: User
  amount: string
  created_at: string
}

export async function getGroupBalances(groupId: number): Promise<GroupBalances> {
    const response = await client.get<GroupBalances>(`/groups/${groupId}/balances`)
    return response.data
}

export async function listSettlements(groupId: number): Promise<Settlement[]> {
  const response = await client.get<Settlement[]>(`/groups/${groupId}/settlements`)
  return response.data
}

export async function createSettlement(groupId: number, paidBy: number, paidTo: number, amount: string): Promise<void> {
    await client.post(`/groups/${groupId}/settlements`, {paid_by: paidBy, paid_to: paidTo, amount})
}