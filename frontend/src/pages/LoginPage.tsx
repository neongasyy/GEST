import { useState, type SyntheticEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(event: SyntheticEvent ) {
        event.preventDefault()
        setError('')
        try {
            await login(email, password)
            navigate('/')
        } catch {
            setError('Invalid email or password')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-80 space-y-4">
                <h1 className="text-2xl font-semibold text-slate-800">Login</h1>
                {error && <p className="text-red-600">{error}</p>}
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
                    className = "w-full border rounded px-3 py-2"
                    required
                />
                <button type="submit" className="w-full bg-slate-800 text-white rounded py-2">
                    Login
                </button>
                <p className="text-sm text-slate-500">
                    <Link to="/register" className="text-blue-600">Create new account</Link>
                </p>
                <p className="text-sm text-slate-500">
                    <Link to="/forgot-password" className="text-blue-600">Forgot password?</Link>
                </p>
            </form>
        </div>
    )
}