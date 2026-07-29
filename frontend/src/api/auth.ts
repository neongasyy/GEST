import client from './client'

export interface User {
    id: number
    email: string
    name: string
    created_at: string
}

export async function register(email: string, password: string, name: string): Promise<User> {
    const response = await client.post<User>('/auth/register', { email, password, name })
    return response.data
}

export async function login(email: string, password: string): Promise<string> {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await client.post<{ access_token: string; token_type: string }>('/auth/login', formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    return response.data.access_token
}

export async function getCurrentUser(): Promise<User> {
    const response = await client.get<User>('/auth/me')
    return response.data
}

export async function forgotPassword(email: string): Promise<void> {
    await client.post('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
    await client.post('/auth/reset-password', { token, new_password: newPassword })
}