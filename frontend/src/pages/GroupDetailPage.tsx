import { useEffect, useState, type SyntheticEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGroup, addMember, removeMember, type GroupDetail as GroupDetailType } from '../api/groups'
import { useAuth } from '../context/AuthContext'

export default function GroupDetailPage() {
    const { groupId } = useParams<{ groupId: string }>()
    const { user } = useAuth()
    const [group, setGroup] = useState<GroupDetailType | null>(null)
    const [newMemberEmail, setNewMemberEmail] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadGroup()
    }, [groupId])

    async function loadGroup() {
        if (!groupId) return
        setIsLoading(true)
        try {
            const data = await getGroup(Number(groupId))
            setGroup(data)
        } catch {
            setError('Failed to load the group')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleAddMember(event: SyntheticEvent) {
        event.preventDefault()
        if (!groupId || !newMemberEmail.trim()) return
        setError('')
        try {
            await addMember(Number(groupId), newMemberEmail)
            setNewMemberEmail('')
            await loadGroup()
        } catch {
            setError('Could not add member. Check if the email exists and is correct.')
        }
    }

    async function handleRemoveMember(userId: number) {
        if (!groupId) return
        try {
            await removeMember(Number(groupId), userId)
            await loadGroup()
        } catch {
            setError('Could not remove member')
        }
    }

    if (isLoading) {
        return <p className="p-8 text-slate-500">Loading...</p>
    }

    if (!group) {
        return <p className="p-8 text-red-600">Group not found</p>
    }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Link to="/" className="text-sm text-blue-600 mb-4 inline-block">&larr; Back</Link>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">{group.name}</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
        <input
          type="email"
          placeholder="Email"
          value={newMemberEmail}
          onChange={(e) => setNewMemberEmail(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <button type="submit" className="bg-slate-800 text-white rounded px-4 py-2">
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {group.members.map((member) => {
          const canRemove = member.user.id === user?.id || user?.id === group.created_by
          return (
            <li key={member.id} className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
              <span>{member.user.name} ({member.user.email})</span>
              {canRemove && (
                <button onClick={() => handleRemoveMember(member.user.id)} className="text-sm text-red-600">
                  {member.user.id === user?.id ? 'Leave' : 'Remove'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}