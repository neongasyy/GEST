import { useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault()
    setError('')
    try {
      await forgotPassword(email)
      setSubmitted(true)
    } catch {
      setError('Something went wrong — please try again')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-80 space-y-4">
        <h1 className="text-2xl font-semibold text-slate-800">Forgot password</h1>
        {submitted ? (
          <p className="text-sm text-slate-600">
            If that email exists, a password reset link has been sent. Check your inbox (or, in dev mode, your backend server's console).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <button type="submit" className="w-full bg-slate-800 text-white rounded py-2">
              Send reset link
            </button>
          </form>
        )}
        <p className="text-sm text-slate-500">
          <Link to="/login" className="text-blue-600">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
