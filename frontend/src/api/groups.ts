import client from './client'
import type { User } from './auth'

export interface Group {
    id: number
    name: string
    created_by: number
    created_at: string
}

export interface GroupMember {
    id: number
    user: User
    joined_at: string
}

export interface GroupDetail extends Group {
    members: GroupMember[]
}

export async function listGroups(): Promise<Group[]> {
    const response = await client.get<Group[]>('/groups')
    return response.data
}

export async function createGroup(name: string): Promise<Group> {
    const response = await client.post<Group>('/groups', { name })
    return response.data
}

export async function getGroup(groupId: number): Promise<GroupDetail> {
    const response = await client.get<GroupDetail>(`/groups/${groupId}`)
    return response.data
}

export async function addMember(groupId: number, email: string): Promise<GroupDetail> {
    const response = await client.post<GroupDetail>(`/groups/${groupId}/members`, { email })
    return response.data
}

export async function removeMember(groupId: number, userId: number, newOwnerId?: number): Promise<void> {
    await client.delete(`/groups/${groupId}/members/${userId}`, {
        params: newOwnerId ? { new_owner_id: newOwnerId } : undefined,
    })
}

export async function deleteGroup(groupId: number): Promise<void> {
    await client.delete(`/groups/${groupId}`)
}