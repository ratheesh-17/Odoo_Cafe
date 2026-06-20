import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Table, Th, Td, Tr } from '../../components/DataTable'
import Modal from '../../components/Modal'
import { PageLoader, EmptyState, ConfirmDialog, Badge } from '../../components/ui'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// ── Status config ─────────────────────────────────────────────────────────────
// Mirrors _ALLOWED_TRANSITIONS from services/booking/__init__.py

const TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['seated',    'cancelled'],
  seated:    ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

const STATUS_BADGE = {
  pending:   'yellow',
  confirmed: 'blue',
  seated:    'purple',
  completed: 'green',
  cancelled: 'red',
}

const NEXT_LABEL = {
  confirmed: 'Confirm',
  seated:    'Seat',
  completed: 'Complete',
  cancelled: 'Cancel',
}

const toDatetimeLocal = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '')
const fmtDT = (iso) => iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

// ── Booking form ──────────────────────────────────────────────────────────────

function BookingForm({ initial, tables, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    guest_name:   initial?.guest_name   ?? '',
    guest_phone:  initial?.guest_phone  ?? '',
    guest_email:  initial?.guest_email  ?? '',
    table_id:     initial?.table?.id    ?? '',
    scheduled_at: toDatetimeLocal(initial?.scheduled_at),
    party_size:   initial?.party_size   ?? 2,
    note:         initial?.note         ?? '',
  })

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.guest_name.trim()) return toast.error('Guest name is required')
    if (!form.scheduled_at)      return toast.error('Scheduled time is required')
    if (!form.party_size || parseInt(form.party_size) < 1)
      return toast.error('Party size must be at least 1')

    const payload = {
      guest_name:   form.guest_name.trim(),
      guest_phone:  form.guest_phone.trim() || null,
      guest_email:  form.guest_email.trim() || null,
      table_id:     form.table_id ? parseInt(form.table_id) : null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      party_size:   parseInt(form.party_size),
      note:         form.note.trim() || null,
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Guest Name *</Label>
          <input
            className="input"
            value={form.guest_name}
            onChange={(e) => set('guest_name', e.target.value)}
            placeholder="John Smith"
            autoFocus
          />
        </div>
        <div>
          <Label>Phone</Label>
          <input
            className="input"
            value={form.guest_phone}
            onChange={(e) => set('guest_phone', e.target.value)}
            placeholder="+91 9999..."
          />
        </div>
        <div>
          <Label>Email</Label>
          <input
            className="input"
            type="email"
            value={form.guest_email}
            onChange={(e) => set('guest_email', e.target.value)}
            placeholder="john@example.com"
          />
        </div>
        <div>
          <Label>Scheduled At *</Label>
          <input
            className="input"
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => set('scheduled_at', e.target.value)}
          />
        </div>
        <div>
          <Label>Party Size *</Label>
          <input
            className="input"
            type="number"
            min="1"
            value={form.party_size}
            onChange={(e) => set('party_size', e.target.value)}
          />
        </div>
        <div>
          <Label>Table (optional)</Label>
          <select className="input" value={form.table_id} onChange={(e) => set('table_id', e.target.value)}>
            <option value="">No table assigned</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.table_number} ({t.floor?.name ?? t.floor_name ?? ''}) — {t.seats} seats
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Note</Label>
          <input
            className="input"
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="Any special requests…"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Booking'}
        </button>
      </div>
    </form>
  )
}

// ── Status transition buttons ─────────────────────────────────────────────────

function StatusActions({ booking, onTransition }) {
  const next = TRANSITIONS[booking.status] ?? []
  if (next.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      {next.map((s) => (
        <button
          key={s}
          onClick={() => onTransition(booking, s)}
          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
            s === 'cancelled'
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20'
          }`}
        >
          {NEXT_LABEL[s]}
        </button>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [transitionTarget, setTransitionTarget] = useState(null) // { booking, newStatus }

  const load = async () => {
    setLoading(true)
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : ''
      const [b, t] = await Promise.all([
        api.get(`/bookings${qs}`).then((r) => r.data),
        api.get('/tables').then((r) => r.data).catch(() => []),
      ])
      setBookings(b)
      setTables(t)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = async (payload) => {
    setSaving(true)
    try {
      await api.post('/bookings', payload)
      toast.success('Booking created!')
      setCreateOpen(false)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleEdit = async (payload) => {
    setSaving(true)
    try {
      await api.put(`/bookings/${editTarget.id}`, payload)
      toast.success('Booking updated!')
      setEditTarget(null)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleTransition = async () => {
    const { booking, newStatus } = transitionTarget
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: newStatus })
      toast.success(`Booking ${newStatus}!`)
      setTransitionTarget(null)
      load()
    } catch {}
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/bookings/${deleteTarget.id}`)
      toast.success('Booking deleted!')
      setDeleteTarget(null)
      load()
    } catch {}
  }

  if (loading) return <PageLoader />

  const canDelete = (b) => ['pending', 'cancelled'].includes(b.status)
  const canEdit   = (b) => !['completed', 'cancelled'].includes(b.status)

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Bookings</h1>
          <p className="text-sm text-muted mt-0.5">Table reservations and walk-in scheduling</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={15} /> New Booking
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {['', 'pending', 'confirmed', 'seated', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize ${
              statusFilter === s
                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {s === '' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Guest</Th>
              <Th>Contact</Th>
              <Th>Scheduled</Th>
              <Th>Party</Th>
              <Th>Table</Th>
              <Th>Status</Th>
              <Th>Advance</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <Tr key={b.id}>
                <Td>
                  <p className="font-medium text-white">{b.guest_name ?? b.customer?.name ?? '—'}</p>
                  {b.note && <p className="text-[11px] text-muted mt-0.5 truncate max-w-[140px]">{b.note}</p>}
                </Td>
                <Td className="text-muted text-xs">
                  <p>{b.guest_phone ?? b.customer?.phone ?? '—'}</p>
                  <p>{b.guest_email ?? b.customer?.email ?? ''}</p>
                </Td>
                <Td className="text-muted text-xs whitespace-nowrap">{fmtDT(b.scheduled_at)}</Td>
                <Td className="text-muted">{b.party_size}</Td>
                <Td className="text-muted">{b.table?.table_number ?? '—'}</Td>
                <Td>
                  <Badge color={STATUS_BADGE[b.status]}>{b.status}</Badge>
                </Td>
                <Td>
                  <StatusActions
                    booking={b}
                    onTransition={(booking, newStatus) => setTransitionTarget({ booking, newStatus })}
                  />
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canEdit(b) && (
                      <button
                        onClick={() => setEditTarget(b)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canDelete(b) && (
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        {bookings.length === 0 && (
          <EmptyState
            title="No bookings"
            description={statusFilter ? `No ${statusFilter} bookings found.` : 'Create a booking to get started.'}
            action={
              !statusFilter && (
                <button onClick={() => setCreateOpen(true)} className="btn-primary">
                  <Plus size={14} /> New Booking
                </button>
              )
            }
          />
        )}
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Booking" size="lg">
        <BookingForm tables={tables} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} saving={saving} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Booking" size="lg">
        {editTarget && (
          <BookingForm initial={editTarget} tables={tables} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} saving={saving} />
        )}
      </Modal>

      {/* Status transition confirm */}
      <ConfirmDialog
        open={!!transitionTarget}
        title="Update Booking Status"
        message={
          transitionTarget
            ? `Move booking for "${transitionTarget.booking.guest_name ?? transitionTarget.booking.customer?.name}" to "${transitionTarget.newStatus}"?`
            : ''
        }
        onConfirm={handleTransition}
        onCancel={() => setTransitionTarget(null)}
        danger={transitionTarget?.newStatus === 'cancelled'}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Booking"
        message={`Delete booking for "${deleteTarget?.guest_name ?? deleteTarget?.customer?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
