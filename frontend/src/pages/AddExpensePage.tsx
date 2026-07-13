import { useEffect, useState, type SyntheticEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getGroup, type GroupDetail } from '../api/groups'
import { createExpense, type SplitType } from '../api/expenses'

interface ParticipantState {
  included: boolean
  value: string
}

export default function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState<number | ''>('')
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [participants, setParticipants] = useState<Record<number, ParticipantState>>({})

  useEffect(() => {
    loadGroup()
  }, [groupId])

  async function loadGroup() {
    if (!groupId) return
    setIsLoading(true)
    try {
      const data = await getGroup(Number(groupId))
      setGroup(data)
      const initialParticipants: Record<number, ParticipantState> = {}
      for (const member of data.members) {
        initialParticipants[member.user.id] = { included: true, value: '' }
      }
      setParticipants(initialParticipants)
      if (data.members.length > 0) {
        setPaidBy(data.members[0].user.id)
      }
    } catch {
      setError('Failed to load group')
    } finally {
      setIsLoading(false)
    }
  }

  function toggleParticipant(userId: number) {
    setParticipants((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], included: !prev[userId].included },
    }))
  }

  function setParticipantValue(userId: number, value: string) {
    setParticipants((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], value },
    }))
  }

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault()
    if (!groupId || !description.trim() || !amount || paidBy === '') return
    setError('')

    const splits = Object.entries(participants)
      .filter(([, state]) => state.included)
      .map(([userId, state]) => ({
        user_id: Number(userId),
        value: splitType === 'equal' ? undefined : state.value,
      }))

    if (splits.length === 0) {
      setError('Select at least one participant')
      return
    }

    try {
      await createExpense(Number(groupId), {
        description,
        amount,
        paid_by: Number(paidBy),
        split_type: splitType,
        splits,
      })
      navigate(`/groups/${groupId}`)
    } catch {
      setError('Could not add expense — check the split values are valid')
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
      <Link to={`/groups/${groupId}`} className="text-sm text-blue-600 mb-4 inline-block">&larr; Back to {group.name}</Link>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Add expense</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 space-y-3 max-w-md">
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        >
          {group.members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              Paid by {member.user.name}
            </option>
          ))}
        </select>
        <select
          value={splitType}
          onChange={(e) => setSplitType(e.target.value as SplitType)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="equal">Split equally</option>
          <option value="exact">Exact amounts</option>
          <option value="percentage">Percentages</option>
        </select>

        <div className="space-y-2">
          {group.members.map((member) => {
            const state = participants[member.user.id] ?? { included: false, value: '' }
            return (
              <div key={member.user.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.included}
                  onChange={() => toggleParticipant(member.user.id)}
                />
                <span className="flex-1">{member.user.name}</span>
                {splitType !== 'equal' && state.included && (
                  <input
                    type="text"
                    placeholder={splitType === 'exact' ? 'Amount' : 'Percent'}
                    value={state.value}
                    onChange={(e) => setParticipantValue(member.user.id, e.target.value)}
                    className="w-24 border rounded px-2 py-1"
                  />
                )}
              </div>
            )
          })}
        </div>

        <button type="submit" className="bg-slate-800 text-white rounded px-4 py-2">
          Add expense
        </button>
      </form>
    </div>
  )
}