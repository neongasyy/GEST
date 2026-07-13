import { useEffect, useState, type SyntheticEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getGroup, type GroupDetail } from '../api/groups'
import { createSettlement } from '../api/balances'

export default function RecordSettlementPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [paidBy, setPaidBy] = useState<number | ''>('')
  const [paidTo, setPaidTo] = useState<number | ''>('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    loadGroup()
  }, [groupId])

  async function loadGroup() {
    if (!groupId) return
    setIsLoading(true)
    try {
      const data = await getGroup(Number(groupId))
      setGroup(data)
      if (data.members.length > 0) {
        setPaidBy(data.members[0].user.id)
      }
      if (data.members.length > 1) {
        setPaidTo(data.members[1].user.id)
      }
    } catch {
      setError('Failed to load group')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault()
    if (!groupId || paidBy === '' || paidTo === '' || !amount) return
    setError('')

    if (paidBy === paidTo) {
      setError('Payer and recipient must be different people')
      return
    }

    try {
      await createSettlement(Number(groupId), Number(paidBy), Number(paidTo), amount)
      navigate(`/groups/${groupId}`)
    } catch {
      setError('Could not record settlement')
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
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Record a settlement</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 space-y-3 max-w-md">
        <label className="block text-sm text-slate-600">Paid by</label>
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        >
          {group.members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name}
            </option>
          ))}
        </select>

        <label className="block text-sm text-slate-600">Paid to</label>
        <select
          value={paidTo}
          onChange={(e) => setPaidTo(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        >
          {group.members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />

        <button type="submit" className="bg-slate-800 text-white rounded px-4 py-2">
          Record settlement
        </button>
      </form>
    </div>
  )
}