import { useEffect, useState, type SyntheticEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getGroup, addMember, removeMember, deleteGroup, type GroupDetail as GroupDetailType } from '../api/groups'
import axios from 'axios'
import { listExpenses, type Expense } from '../api/expenses'
import { getGroupBalances, createSettlement, listSettlements, type GroupBalances, type Settlement } from '../api/balances'
import { useAuth } from '../context/AuthContext'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [group, setGroup] = useState<GroupDetailType | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<GroupBalances | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showTransferPicker, setShowTransferPicker] = useState(false)
  const [newOwnerId, setNewOwnerId] = useState<number | ''>('')

  useEffect(() => {
    loadGroup()
    loadExpenses()
    loadBalances()
    loadSettlements()
  }, [groupId])

  async function loadGroup() {
    if (!groupId) return
    setIsLoading(true)
    try {
      const data = await getGroup(Number(groupId))
      setGroup(data)
    } catch {
      setError('Failed to load group')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadExpenses() {
    if (!groupId) return
    try {
      const data = await listExpenses(Number(groupId))
      setExpenses(data)
    } catch {
      setError('Failed to load expenses')
    }
  }

  async function loadBalances() {
    if (!groupId) return
    try {
      const data = await getGroupBalances(Number(groupId))
      setBalances(data)
    } catch {
      setError('Failed to load balances')
    }
  }

  async function loadSettlements() {
    if (!groupId) return
    try {
      const data = await listSettlements(Number(groupId))
      setSettlements(data)
    } catch {
      setError('Failed to load settlement history')
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
      setError('Could not add member — check the email is correct and they exist')
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

  async function handleLeave() {
    if (!groupId || !user || !group) return
    const otherMembers = group.members.filter((m) => m.user.id !== user.id)
    if (user.id === group.created_by && otherMembers.length > 0) {
      setShowTransferPicker(true)
      return
    }
    try {
      await removeMember(Number(groupId), user.id)
      navigate('/')
    } catch {
      setError('Could not leave group')
    }
  }

  async function handleConfirmTransferAndLeave() {
    if (!groupId || !user || newOwnerId === '') return
    setError('')
    try {
      await removeMember(Number(groupId), user.id, Number(newOwnerId))
      navigate('/')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Could not leave group')
      }
    }
  }

  async function handleSettle(fromUserId: number, toUserId: number, amount: string) {
    if (!groupId) return
    try {
      await createSettlement(Number(groupId), fromUserId, toUserId, amount)
      await loadBalances()
      await loadSettlements()
    } catch {
      setError('Could not record settlement')
    }
  }

  async function handleDeleteGroup() {
    if (!groupId || !group) return
    if (!window.confirm(`Delete "${group.name}"? This cannot be undone.`)) return
    setError('')
    try {
      await deleteGroup(Number(groupId))
      navigate('/')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Could not delete group')
      }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">{group.name}</h1>
        {user?.id === group.created_by && (
          <button onClick={handleDeleteGroup} className="text-sm text-red-600">
            Delete Group
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Members</h2>
        <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Add member by email"
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
            const isSelf = member.user.id === user?.id
            const canRemove = isSelf || user?.id === group.created_by
            return (
              <li key={member.id} className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
                <span>{member.user.name} ({member.user.email})</span>
                {canRemove && (
                  <button
                    onClick={() => (isSelf ? handleLeave() : handleRemoveMember(member.user.id))}
                    className="text-sm text-red-600"
                  >
                    {isSelf ? 'Leave' : 'Remove'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        {showTransferPicker && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-slate-700 mb-2">
              You're the owner — choose who takes over before you leave:
            </p>
            <div className="flex gap-2">
              <select
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(Number(e.target.value))}
                className="border rounded px-3 py-2 flex-1"
              >
                <option value="">Select new owner...</option>
                {group.members
                  .filter((m) => m.user.id !== user?.id)
                  .map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
              </select>
              <button onClick={handleConfirmTransferAndLeave} className="bg-slate-800 text-white rounded px-4 py-2">
                Transfer & leave
              </button>
              <button onClick={() => setShowTransferPicker(false)} className="text-slate-500 px-4 py-2">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-slate-800">Expenses</h2>
          <Link to={`/groups/${groupId}/expenses/new`} className="text-sm bg-slate-800 text-white rounded px-3 py-1">
            + Add expense
          </Link>
        </div>
        {expenses.length === 0 ? (
          <p className="text-slate-500">No expenses yet.</p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((expense) => (
              <li key={expense.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between">
                  <span className="font-medium">{expense.description}</span>
                  <span>${expense.amount}</span>
                </div>
                <p className="text-sm text-slate-500">
                  Paid by {group.members.find((m) => m.user.id === expense.paid_by)?.user.name} &middot; {expense.split_type}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-slate-800">Balances</h2>
          <Link to={`/groups/${groupId}/settlements/new`} className="text-sm bg-slate-800 text-white rounded px-3 py-1">
            + Record settlement
          </Link>
        </div>
        {balances && (
          <>
            <ul className="space-y-2 mb-4">
              {balances.balances.map((b) => {
                const net = Number(b.net_balance)
                return (
                  <li key={b.user.id} className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
                    <span>{b.user.name}</span>
                    <span className={net > 0 ? 'text-green-600' : net < 0 ? 'text-red-600' : 'text-slate-500'}>
                      {net > 0
                        ? `is owed $${b.net_balance}`
                        : net < 0
                          ? `owes $${Math.abs(net).toFixed(2)}`
                          : 'settled up'}
                    </span>
                  </li>
                )
              })}
            </ul>

            {balances.suggested_settlements.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-slate-700 mb-2">Suggested settlements</h3>
                <ul className="space-y-2">
                  {balances.suggested_settlements.map((s, index) => (
                    <li key={index} className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
                      <span>{s.from_user.name} owes {s.to_user.name} ${s.amount}</span>
                      <button
                        onClick={() => handleSettle(s.from_user.id, s.to_user.id, s.amount)}
                        className="text-sm bg-slate-800 text-white rounded px-3 py-1"
                      >
                        Settle
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Settlement history</h2>
        {settlements.length === 0 ? (
          <p className="text-slate-500">No settlements recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {settlements.map((s) => (
              <li key={s.id} className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
                <span>{s.payer.name} paid {s.payee.name}</span>
                <span className="text-slate-500 text-sm">${s.amount} &middot; {new Date(s.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
