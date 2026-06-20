import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, MapPin } from 'lucide-react'
import { Table, Th, Td, Tr } from '../../components/DataTable'
import Modal from '../../components/Modal'
import { PageLoader, EmptyState, ConfirmDialog, Badge } from '../../components/ui'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

// ── Floor form ────────────────────────────────────────────────────────────────

function FloorForm({ initial, onSubmit, onCancel, saving }) {
  const [name, setName] = useState(initial?.name ?? '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Floor name is required')
    onSubmit({ name: name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Floor Name</Label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ground Floor"
          autoFocus
        />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Floor'}
        </button>
      </div>
    </form>
  )
}

// ── Table form ────────────────────────────────────────────────────────────────

function TableForm({ initial, floorId, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    table_number: initial?.table_number ?? '',
    seats: initial?.seats ?? 2,
    is_active: initial?.is_active ?? true,
  })

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.table_number.trim()) return toast.error('Table number is required')
    if (!form.seats || parseInt(form.seats) < 1) return toast.error('Seats must be at least 1')

    const payload = {
      table_number: form.table_number.trim(),
      seats: parseInt(form.seats),
    }
    if (!initial) payload.floor_id = floorId
    if (initial) payload.is_active = form.is_active
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Table Number</Label>
          <input
            className="input"
            value={form.table_number}
            onChange={(e) => set('table_number', e.target.value)}
            placeholder="e.g. T1 or A3"
            autoFocus
          />
        </div>
        <div>
          <Label>Seats</Label>
          <input
            className="input"
            type="number"
            min="1"
            step="1"
            value={form.seats}
            onChange={(e) => set('seats', e.target.value)}
          />
        </div>
      </div>

      {initial && (
        <div>
          <Label>Status</Label>
          <select
            className="input"
            value={form.is_active ? 'true' : 'false'}
            onChange={(e) => set('is_active', e.target.value === 'true')}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Table'}
        </button>
      </div>
    </form>
  )
}

// ── Floor section (collapsible) ───────────────────────────────────────────────

function FloorSection({ floor, onEditFloor, onDeleteFloor, onAddTable, onEditTable, onDeleteTable }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="card overflow-hidden">
      {/* Floor header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-white/[0.02]">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-white font-semibold hover:text-primary-400 transition-colors"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <MapPin size={15} className="text-primary-400" />
          {floor.name}
          <span className="text-xs font-normal text-muted ml-1">
            ({floor.tables.length} table{floor.tables.length !== 1 ? 's' : ''})
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddTable(floor)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors"
          >
            <Plus size={12} /> Add Table
          </button>
          <button
            onClick={() => onEditFloor(floor)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDeleteFloor(floor)}
            className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Tables */}
      {open && (
        floor.tables.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <Th>Table #</Th>
                <Th>Seats</Th>
                <Th>Status</Th>
                <Th>Self-Order</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {floor.tables.map((t) => (
                <Tr key={t.id}>
                  <Td className="font-semibold text-white">{t.table_number}</Td>
                  <Td className="text-muted">{t.seats}</Td>
                  <Td>
                    <Badge color={t.is_active ? 'green' : 'gray'}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    {t.self_order_token
                      ? <Badge color="blue">QR Ready</Badge>
                      : <span className="text-muted text-xs">—</span>}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEditTable(t, floor)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteTable(t)}
                        className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="px-5 py-6 text-sm text-muted text-center">
            No tables yet —{' '}
            <button onClick={() => onAddTable(floor)} className="text-primary-400 hover:underline">
              add one
            </button>
          </div>
        )
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FloorsPage() {
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // floor modal state
  const [floorCreate, setFloorCreate] = useState(false)
  const [floorEdit, setFloorEdit] = useState(null)
  const [floorDelete, setFloorDelete] = useState(null)

  // table modal state — tableFloor holds the parent floor context
  const [tableFloor, setTableFloor] = useState(null)   // { floor } for create
  const [tableEdit, setTableEdit] = useState(null)      // { table, floor } for edit
  const [tableDelete, setTableDelete] = useState(null)  // table object

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/floors')
      setFloors(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Floor handlers ───────────────────────────────────────────────────────

  const handleFloorCreate = async (payload) => {
    setSaving(true)
    try {
      await api.post('/floors', payload)
      toast.success('Floor created!')
      setFloorCreate(false)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleFloorEdit = async (payload) => {
    setSaving(true)
    try {
      await api.put(`/floors/${floorEdit.id}`, payload)
      toast.success('Floor updated!')
      setFloorEdit(null)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleFloorDelete = async () => {
    try {
      await api.delete(`/floors/${floorDelete.id}`)
      toast.success('Floor deleted!')
      setFloorDelete(null)
      load()
    } catch {}
  }

  // ── Table handlers ───────────────────────────────────────────────────────

  const handleTableCreate = async (payload) => {
    setSaving(true)
    try {
      await api.post('/tables', payload)
      toast.success('Table added!')
      setTableFloor(null)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleTableEdit = async (payload) => {
    setSaving(true)
    try {
      await api.put(`/tables/${tableEdit.table.id}`, payload)
      toast.success('Table updated!')
      setTableEdit(null)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleTableDelete = async () => {
    try {
      await api.delete(`/tables/${tableDelete.id}`)
      toast.success('Table deleted!')
      setTableDelete(null)
      load()
    } catch {}
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Floors & Tables</h1>
          <p className="text-sm text-muted mt-0.5">Manage your restaurant layout</p>
        </div>
        <button onClick={() => setFloorCreate(true)} className="btn-primary">
          <Plus size={15} /> Add Floor
        </button>
      </div>

      {/* Floor sections */}
      {floors.length > 0 ? (
        <div className="space-y-4">
          {floors.map((floor) => (
            <FloorSection
              key={floor.id}
              floor={floor}
              onEditFloor={(f) => setFloorEdit(f)}
              onDeleteFloor={(f) => setFloorDelete(f)}
              onAddTable={(f) => setTableFloor(f)}
              onEditTable={(t, f) => setTableEdit({ table: t, floor: f })}
              onDeleteTable={(t) => setTableDelete(t)}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            title="No floors yet"
            description="Create a floor first, then add tables to it."
            action={
              <button onClick={() => setFloorCreate(true)} className="btn-primary">
                <Plus size={14} /> Add Floor
              </button>
            }
          />
        </div>
      )}

      {/* ── Floor modals ──────────────────────────────────────────────────── */}
      <Modal open={floorCreate} onClose={() => setFloorCreate(false)} title="New Floor">
        <FloorForm onSubmit={handleFloorCreate} onCancel={() => setFloorCreate(false)} saving={saving} />
      </Modal>

      <Modal open={!!floorEdit} onClose={() => setFloorEdit(null)} title="Edit Floor">
        {floorEdit && (
          <FloorForm initial={floorEdit} onSubmit={handleFloorEdit} onCancel={() => setFloorEdit(null)} saving={saving} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!floorDelete}
        title="Delete Floor"
        message={`Delete "${floorDelete?.name}" and all its tables? This cannot be undone.`}
        onConfirm={handleFloorDelete}
        onCancel={() => setFloorDelete(null)}
        danger
      />

      {/* ── Table modals ───────────────────────────────────────────────────── */}
      <Modal
        open={!!tableFloor}
        onClose={() => setTableFloor(null)}
        title={tableFloor ? `Add Table — ${tableFloor.name}` : ''}
      >
        {tableFloor && (
          <TableForm
            floorId={tableFloor.id}
            onSubmit={handleTableCreate}
            onCancel={() => setTableFloor(null)}
            saving={saving}
          />
        )}
      </Modal>

      <Modal
        open={!!tableEdit}
        onClose={() => setTableEdit(null)}
        title={tableEdit ? `Edit Table — ${tableEdit.floor.name}` : ''}
      >
        {tableEdit && (
          <TableForm
            initial={tableEdit.table}
            floorId={tableEdit.floor.id}
            onSubmit={handleTableEdit}
            onCancel={() => setTableEdit(null)}
            saving={saving}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!tableDelete}
        title="Delete Table"
        message={`Delete table "${tableDelete?.table_number}"? This cannot be undone.`}
        onConfirm={handleTableDelete}
        onCancel={() => setTableDelete(null)}
        danger
      />
    </div>
  )
}
