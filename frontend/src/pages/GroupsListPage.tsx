import { useEffect, useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listGroups, createGroup, type Group } from '../api/groups'

export default function GroupsListPage() {
    const { user, logout } = useAuth()
    const [groups, setGroups] = useState<Group[]>([])
    const [newGroupName, setNewGroupName] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadGroups()
    }, [])

    async function loadGroups() {
        try {
            const data = await listGroups()
            setGroups(data)
        } catch {
            setError('Failed to load the groups')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleCreate(event: SyntheticEvent) {
        event.preventDefault()
        if (!newGroupName.trim()) return
        try {
            await createGroup(newGroupName)
            setNewGroupName('')
            await loadGroups()
        } catch {
            setError('Failed to create new group')
        }
    }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Welcome, {user?.name}</h1>
        <button onClick={logout} className="text-sm text-red-600">Log out</button>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New Group Name"
          value={newGroupName}
          onChange={(event) => setNewGroupName(event.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <button type="submit" className="bg-slate-800 text-white rounded px-4 py-2">
          Create Group
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="text-slate-500">There are no groups yet</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                to={`/groups/${group.id}`}
                className="block bg-white rounded-lg shadow-sm p-4 hover:bg-slate-100"
              >
                {group.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}