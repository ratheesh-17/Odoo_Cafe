import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, KeyRound, ArchiveX, Archive } from 'lucide-react'
import { Table, Th, Td, Tr } from '../../components/DataTable'
import Modal from '../../components/Modal'
import { PageLoader, EmptyState, ConfirmDialog, Badge } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

// ── Create / Edit form ────────────────────────────────────────────────────────

function UserForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    password: '',
    role: initial?.role ?? 'employee',
  })

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.email.trim()) return toast.error('Email is required')
    if (!initial && form.password.length < 8)
      return toast.error('Password must be at least 8 characters')

    const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role }
    if (!initial) payload.password = form.password
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Full Name</Label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Jane Doe"
          autoFocus
        />
      </div>

      <div>
        <Label>Email</Label>
        <input
          className="input"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="jane@example.com"
        />
      </div>

      {!initial && (
        <div>
          <Label>Password</Label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="Min. 8 characters"
          />
        </div>
      )}

      <div>
        <Label>Role</Label>
        <div className="grid grid-cols-2 gap-2">
          {['employee', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => set('role', r)}
              className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors capitalize ${
                form.role === r
                  ? 'border-primary-500 bg-primary-500/15 text-primary-400'
                  : 'border-border text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Account'}
        </button>
      </div>
    </form>
  )
}

// ── Change password form ──────────────────────────────────────────────────────

function ChangePasswordForm({ target, onSubmit, onCancel, saving }) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password.length < 8) return toast.error('Password must be at least 8 characters')
    onSubmit({ new_password: password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted">
        Setting a new password for <span className="text-white font-medium">{target.name}</span>.
      </p>
      <div>
        <Label>New Password</Label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          autoFocus
        />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Change Password'}
        </button>
      </div>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [pwTarget, setPwTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null) // { user, action: 'archive'|'unarchive' }

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users')
      setUsers(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreate = async (payload) => {
    setSaving(true)
    try {
      await api.post('/users', payload)
      toast.success('Account created!')
      setCreateOpen(false)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleEdit = async (payload) => {
    setSaving(true)
    try {
      await api.put(`/users/${editTarget.id}`, payload)
      toast.success('Account updated!')
      setEditTarget(null)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleChangePassword = async (payload) => {
    setSaving(true)
    try {
      await api.patch(`/users/${pwTarget.id}/change-password`, payload)
      toast.success('Password changed!')
      setPwTarget(null)
    } catch {
    } finally { setSaving(false) }
  }

  const handleArchiveToggle = async () => {
    const { user, action } = archiveTarget
    try {
      await api.patch(`/users/${user.id}/${action}`)
      toast.success(`Account ${action === 'archive' ? 'archived' : 'unarchived'}!`)
      setArchiveTarget(null)
      load()
    } catch {}
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteTarget.id}`)
      toast.success('Account deleted!')
      setDeleteTarget(null)
      load()
    } catch {}
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Employees</h1>
          <p className="text-sm text-muted mt-0.5">Manage staff accounts and access roles</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id
              return (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-300 text-xs font-bold flex-shrink-0">
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-white">
                        {u.name}
                        {isSelf && <span className="ml-1.5 text-[10px] text-muted">(you)</span>}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-muted">{u.email}</Td>
                  <Td>
                    <Badge color={u.role === 'admin' ? 'purple' : 'blue'}>
                      {u.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge color={u.is_active ? 'green' : 'gray'}>
                      {u.is_active ? 'Active' : 'Archived'}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit */}
                      <button
                        onClick={() => setEditTarget(u)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Change password */}
                      <button
                        onClick={() => setPwTarget(u)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                        title="Change Password"
                      >
                        <KeyRound size={14} />
                      </button>

                      {/* Archive / Unarchive — disabled for self */}
                      {!isSelf && (
                        <button
                          onClick={() =>
                            setArchiveTarget({ user: u, action: u.is_active ? 'archive' : 'unarchive' })
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.is_active
                              ? 'hover:bg-yellow-500/15 text-muted hover:text-yellow-400'
                              : 'hover:bg-emerald-500/15 text-muted hover:text-emerald-400'
                          }`}
                          title={u.is_active ? 'Archive' : 'Unarchive'}
                        >
                          {u.is_active ? <ArchiveX size={14} /> : <Archive size={14} />}
                        </button>
                      )}

                      {/* Delete — disabled for self */}
                      {!isSelf && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>

        {users.length === 0 && (
          <EmptyState
            title="No employees yet"
            description="Create an account to let staff log in."
            action={
              <button onClick={() => setCreateOpen(true)} className="btn-primary">
                <Plus size={14} /> Add Employee
              </button>
            }
          />
        )}
      </div>

      {/* Create */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Employee Account">
        <UserForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} saving={saving} />
      </Modal>

      {/* Edit */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Account">
        {editTarget && (
          <UserForm initial={editTarget} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} saving={saving} />
        )}
      </Modal>

      {/* Change password */}
      <Modal open={!!pwTarget} onClose={() => setPwTarget(null)} title="Change Password">
        {pwTarget && (
          <ChangePasswordForm target={pwTarget} onSubmit={handleChangePassword} onCancel={() => setPwTarget(null)} saving={saving} />
        )}
      </Modal>

      {/* Archive confirm */}
      <ConfirmDialog
        open={!!archiveTarget}
        title={archiveTarget?.action === 'archive' ? 'Archive Account' : 'Unarchive Account'}
        message={
          archiveTarget?.action === 'archive'
            ? `Archive "${archiveTarget?.user.name}"? They will no longer be able to log in.`
            : `Restore access for "${archiveTarget?.user.name}"?`
        }
        onConfirm={handleArchiveToggle}
        onCancel={() => setArchiveTarget(null)}
        danger={archiveTarget?.action === 'archive'}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Account"
        message={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
