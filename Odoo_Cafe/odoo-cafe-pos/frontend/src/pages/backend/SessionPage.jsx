import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePosStore } from '../../store/posStore'
import { Play, Square, Coffee, Clock, DollarSign, Hash } from 'lucide-react'
import { PageLoader, StatCard } from '../../components/ui'
import Modal from '../../components/Modal'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function SessionPage() {
  const [sessions, setSessions] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [openingCash, setOpeningCash] = useState('')
  const [closeNote, setCloseNote] = useState('')
  const [summary, setSummary] = useState(null)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const [cur, all] = await Promise.all([
        api.get('/sessions/current').then(r => r.data).catch(() => null),
        api.get('/sessions').then(r => r.data).catch(() => []),
      ])
      setCurrent(cur)
      setSessions(all)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleOpen = async () => {
    try {
      await api.post('/sessions/open', { opening_cash: parseFloat(openingCash) || 0 })
      toast.success('Session opened!')
      setOpenModal(false)
      load()
    } catch {}
  }

  const handleClose = async () => {
    try {
      const { data } = await api.post(`/sessions/${current.id}/close`, { note: closeNote })
      setSummary(data.summary)
      toast.success('Session closed!')
      setCloseModal(false)
      load()
    } catch {}
  }

  if (loading) return <PageLoader />

  const last = sessions.find(s => s.status === 'closed')

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">POS Session</h1>
          <p className="text-sm text-muted mt-0.5">Manage your daily sales sessions</p>
        </div>
        {current
          ? <button onClick={() => setCloseModal(true)} className="btn-danger"><Square size={15} /> Close Session</button>
          : <button onClick={() => setOpenModal(true)} className="btn-primary"><Play size={15} /> Open Session</button>
        }
      </div>

      {/* Status banner */}
      <div className={`card p-6 mb-6 border ${current ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${current ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
            <Coffee size={22} className={current ? 'text-emerald-400' : 'text-muted'} />
          </div>
          <div className="flex-1">
            {current ? (
              <>
                <p className="font-semibold text-emerald-400">Session Active</p>
                <p className="text-sm text-muted">
                  Opened {format(new Date(current.opened_at), 'MMM d, yyyy · h:mm a')} by {current.opened_by?.name}
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-white">No Active Session</p>
                <p className="text-sm text-muted">
                  {last
                    ? `Last session closed on ${format(new Date(last.closed_at), 'MMM d, yyyy')} · ₹${last.closing_total_sales?.toFixed(2)} total`
                    : 'Open a session to start taking orders'}
                </p>
              </>
            )}
          </div>
          {current && (
            <button onClick={() => navigate('/pos')} className="btn-primary">
              Open POS Terminal →
            </button>
          )}
        </div>
      </div>

      {/* Summary after close */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-slide-up">
          <StatCard label="Total Orders"   value={summary.total_orders}                    icon={Hash}        color="primary" />
          <StatCard label="Revenue"        value={`₹${summary.total_revenue.toFixed(2)}`}  icon={DollarSign}  color="green" />
          <StatCard label="Cash Sales"     value={`₹${summary.cash_sales.toFixed(2)}`}     icon={DollarSign}  color="yellow" />
          <StatCard label="Total Discount" value={`₹${summary.total_discount.toFixed(2)}`} icon={Clock}       color="blue" />
        </div>
      )}

      {/* Past sessions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-white">Session History</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['#', 'Opened By', 'Opened At', 'Closed At', 'Total Sales', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted">#{s.id}</td>
                <td className="px-4 py-3 text-white">{s.opened_by?.name}</td>
                <td className="px-4 py-3 text-muted">{format(new Date(s.opened_at), 'MMM d, HH:mm')}</td>
                <td className="px-4 py-3 text-muted">{s.closed_at ? format(new Date(s.closed_at), 'MMM d, HH:mm') : '—'}</td>
                <td className="px-4 py-3 font-medium text-white">₹{parseFloat(s.closing_total_sales).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${s.status === 'open' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-muted'}`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No sessions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Open Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Open Session">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Opening Cash (₹)</label>
            <input type="number" min="0" step="0.01" className="input" value={openingCash}
              onChange={e => setOpeningCash(e.target.value)} placeholder="0.00" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setOpenModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleOpen} className="btn-primary"><Play size={14} /> Open Session</button>
          </div>
        </div>
      </Modal>

      {/* Close Modal */}
      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Close Session">
        <div className="space-y-4">
          <p className="text-sm text-muted">This will end the current session and calculate the closing summary.</p>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Note (optional)</label>
            <textarea className="input resize-none" rows={3} value={closeNote}
              onChange={e => setCloseNote(e.target.value)} placeholder="End of shift notes…" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCloseModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleClose} className="btn-danger"><Square size={14} /> Close Session</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
