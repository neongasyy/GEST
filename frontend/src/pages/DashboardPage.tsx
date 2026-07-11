import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Welcome, {user?.name}</h1>
        <button onClick={logout} className="text-sm text-red-600">Log out</button>
      </div>
      <p className="text-slate-500">Groups will show up here soon.</p>
    </div>
  )
}
