import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Table, Th, Td, Tr } from '../../components/DataTable'
import Modal from '../../components/Modal'
import { PageLoader, EmptyState, ConfirmDialog } from '../../components/ui'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const DEFAULT_COLOR = '#6366f1'

function CategoryForm({ initial, onSubmit, onCancel, loading }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Name is required')
    onSubmit({ name: name.trim(), color })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
          Name
        </label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Beverages"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
          Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-border"
          />
          <input
            className="input flex-1"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#6366f1"
            maxLength={7}
          />
          <div
            className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save Changes' : 'Create Category'}
        </button>
      </div>
    </form>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)   // category object
  const [deleteTarget, setDeleteTarget] = useState(null) // category object

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/categories')
      setCategories(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (payload) => {
    setSaving(true)
    try {
      await api.post('/categories', payload)
      toast.success('Category created!')
      setCreateOpen(false)
      load()
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (payload) => {
    setSaving(true)
    try {
      await api.put(`/categories/${editTarget.id}`, payload)
      toast.success('Category updated!')
      setEditTarget(null)
      load()
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${deleteTarget.id}`)
      toast.success('Category deleted!')
      setDeleteTarget(null)
      load()
    } catch {}
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Categories</h1>
          <p className="text-sm text-muted mt-0.5">Organise your menu into categories</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={15} /> Add Category
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Color</Th>
              <Th>Name</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <Tr key={cat.id}>
                <Td className="text-muted">{cat.id}</Td>
                <Td>
                  <div
                    className="w-6 h-6 rounded-md border border-border"
                    style={{ backgroundColor: cat.color }}
                    title={cat.color}
                  />
                </Td>
                <Td className="font-medium text-white">{cat.name}</Td>
                <Td className="text-muted">
                  {new Date(cat.created_at).toLocaleDateString()}
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditTarget(cat)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        {categories.length === 0 && (
          <EmptyState
            title="No categories yet"
            description="Create a category to start organising your menu."
            action={
              <button onClick={() => setCreateOpen(true)} className="btn-primary">
                <Plus size={14} /> Add Category
              </button>
            }
          />
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Category">
        <CategoryForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Category">
        {editTarget && (
          <CategoryForm
            initial={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
