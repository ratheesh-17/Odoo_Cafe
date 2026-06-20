import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, Trash2, UserCheck, ArrowLeft } from 'lucide-react'
import { Table, Th, Td, Tr } from '../../components/DataTable'
import Modal from '../../components/Modal'
import { PageLoader, EmptyState, ConfirmDialog } from '../../components/ui'
import { usePosStore } from '../../store/posStore'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// ── Customer form ─────────────────────────────────────────────────────────────

function CustomerForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    name:  initial?.name  ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    onSubmit({
      name:  form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Name *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Smith" autoFocus />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Phone</label>
        <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9999..." />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Email</label>
        <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Customer'}
        </button>
      </div>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomerPage() {
  const navigate = useNavigate()
  const { activeOrder, linkCustomer } = usePosStore()

  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')

  const [createOpen,   setCreateOpen]   = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [linking,      setLinking]      = useState(null) // customer id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
      const { data } = await api.get(`/customers${qs}`)
      setCustomers(data)
    } catch {
    } finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreate = async (payload) => {
    setSaving(true)
    try {
      await api.post('/customers', payload)
      toast.success('Customer created!')
      setCreateOpen(false)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleEdit = async (payload) => {
    setSaving(true)
    try {
      await api.put(`/customers/${editTarget.id}`, payload)
      toast.success('Customer updated!')
      setEditTarget(null)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/customers/${deleteTarget.id}`)
      toast.success('Customer deleted!')
      setDeleteTarget(null)
      load()
    } catch {}
  }

  const handleSelect = async (customer) => {
    if (!activeOrder) {
      toast.error('No active order to link customer to')
      return
    }
    setLinking(customer.id)
    try {
      await linkCustomer(customer.id)
      toast.success(`${customer.name} linked to order`)
      navigate('/pos/order')
    } catch {
    } finally { setLinking(null) }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-border bg-panel flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate('/pos/order')}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Back to Order
        </button>
        <div className="flex-1 relative min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-8 py-1.5 text-sm w-full"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus size={14} /> New Customer
        </button>
      </div>

      {activeOrder && (
        <div className="flex-shrink-0 px-5 py-2 bg-primary-500/10 border-b border-primary-500/20 text-xs text-primary-300 flex items-center gap-2">
          <UserCheck size={12} />
          Click <strong>Select</strong> to link a customer to order <strong>{activeOrder.order_number}</strong>
          {activeOrder.customer && <span className="ml-1 text-emerald-400">· Currently: {activeOrder.customer.name}</span>}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? <PageLoader /> : (
          <div className="card m-4 overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Email</Th>
                  <Th>Since</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => {
                  const isLinked = activeOrder?.customer?.id === c.id
                  return (
                    <Tr key={c.id}>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-300 text-xs font-bold flex-shrink-0">
                            {c.name[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{c.name}</span>
                          {isLinked && <span className="text-[10px] text-emerald-400 font-semibold">● Linked</span>}
                        </div>
                      </Td>
                      <Td className="text-muted">{c.phone ?? '—'}</Td>
                      <Td className="text-muted">{c.email ?? '—'}</Td>
                      <Td className="text-muted text-xs">{new Date(c.created_at).toLocaleDateString()}</Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {activeOrder && (
                            <button
                              onClick={() => handleSelect(c)}
                              disabled={linking === c.id || isLinked}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                isLinked
                                  ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                                  : 'bg-primary-500/15 text-primary-400 hover:bg-primary-500/25'
                              } disabled:opacity-60`}
                            >
                              <UserCheck size={12} />
                              {linking === c.id ? '…' : isLinked ? 'Selected' : 'Select'}
                            </button>
                          )}
                          <button
                            onClick={() => setEditTarget(c)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
            {customers.length === 0 && (
              <EmptyState
                title="No customers found"
                description={search ? 'Try a different search term.' : 'Create your first customer.'}
                action={
                  !search && (
                    <button onClick={() => setCreateOpen(true)} className="btn-primary">
                      <Plus size={14} /> New Customer
                    </button>
                  )
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Create */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Customer">
        <CustomerForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} saving={saving} />
      </Modal>

      {/* Edit */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Customer">
        {editTarget && (
          <CustomerForm initial={editTarget} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} saving={saving} />
        )}
      </Modal>

      {/* Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
