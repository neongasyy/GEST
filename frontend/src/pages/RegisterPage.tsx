import { useState, type SyntheticEvent  } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(event: SyntheticEvent ) {
        event.preventDefault()
        setError('')
        try{
            await register(email, password, name)
            await login(email,password)
            navigate('/')
        } catch {
            setError('Registration failed. Email may already be in use.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-80 space-y-4">
                <h1 className="text-2xl font-semibold text-slate-800">Register</h1>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                />
                <button type="submit" className="w-full bg-slate-800 text-white rounded py-2">
                    Register
                </button>
                <p className="text-sm text-slate-500"> 
                    Already have an account? <Link to="/login" className="text-blue-600">Log in</Link>
                </p>
            </form>
        </div>
    )
}