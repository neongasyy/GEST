import { useState, type SyntheticEvent } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { resetPassword } from '../api/auth'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault()
    setError('')

    if (!token) {
      setError('Missing or invalid reset link')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      await resetPassword(token, newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setError('This reset link is invalid or has expired — request a new one')
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-80 space-y-4 text-center">
          <p className="text-red-600 text-sm">This reset link is missing its token.</p>
          <Link to="/forgot-password" className="text-blue-600 text-sm">Request a new link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-80 space-y-4">
        <h1 className="text-2xl font-semibold text-slate-800">Reset password</h1>
        {success ? (
          <p className="text-sm text-slate-600">Password reset — redirecting you to login...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <button type="submit" className="w-full bg-slate-800 text-white rounded py-2">
              Reset password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
