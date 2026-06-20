import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, ArchiveX, Archive } from 'lucide-react'
import { Table, Th, Td, Tr } from '../../components/DataTable'
import Modal from '../../components/Modal'
import { PageLoader, EmptyState, ConfirmDialog, Badge, Toggle } from '../../components/ui'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const UOM_OPTIONS = ['piece', 'kg', 'litre', 'plate', 'cup', 'glass', 'serving']

function Label({ children }) {
  return (
    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

// ── Product form ──────────────────────────────────────────────────────────────

function ProductForm({ initial, categories, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    name:            initial?.name            ?? '',
    category_id:     initial?.category?.id   ?? '',
    price:           initial?.price           ?? '',
    unit_of_measure: initial?.unit_of_measure ?? 'piece',
    tax_percent:     initial?.tax_percent     ?? 0,
    description:     initial?.description     ?? '',
    show_in_kds:     initial?.show_in_kds     ?? true,
    is_active:       initial?.is_active       ?? true,
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim())    return toast.error('Name is required')
    if (!form.category_id)    return toast.error('Category is required')
    if (form.price === '' || parseFloat(form.price) < 0)
      return toast.error('Price must be 0 or greater')

    const payload = {
      name:            form.name.trim(),
      category_id:     parseInt(form.category_id),
      price:           parseFloat(form.price),
      unit_of_measure: form.unit_of_measure,
      tax_percent:     parseFloat(form.tax_percent) || 0,
      description:     form.description.trim() || null,
      show_in_kds:     form.show_in_kds,
    }
    if (initial) payload.is_active = form.is_active
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name *</Label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Masala Chai" autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category *</Label>
          <select className="input" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
            <option value="">Select…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <Label>Unit of Measure</Label>
          <select className="input" value={form.unit_of_measure} onChange={e => set('unit_of_measure', e.target.value)}>
            {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Price (₹) *</Label>
          <input className="input" type="number" min="0" step="0.01" value={form.price}
            onChange={e => set('price', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label>Tax (%)</Label>
          <input className="input" type="number" min="0" max="100" step="0.01" value={form.tax_percent}
            onChange={e => set('tax_percent', e.target.value)} placeholder="0" />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <textarea className="input resize-none" rows={2} value={form.description}
          onChange={e => set('description', e.target.value)} placeholder="Optional description…" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Toggle enabled={form.show_in_kds} onChange={v => set('show_in_kds', v)} />
          <span className="text-sm text-white/70">Show in Kitchen Display</span>
        </div>
        {initial && (
          <div className="flex items-center gap-3">
            <Toggle enabled={form.is_active} onChange={v => set('is_active', v)} />
            <span className="text-sm text-white/70">Active</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)

  const [search, setSearch]           = useState('')
  const [catFilter, setCatFilter]     = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const [createOpen,   setCreateOpen]   = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (catFilter)    params.set('category_id', catFilter)
      if (search.trim()) params.set('search', search.trim())
      if (showArchived) params.set('include_archived', 'true')
      const [prods, cats] = await Promise.all([
        api.get(`/products?${params}`).then(r => r.data),
        api.get('/categories').then(r => r.data),
      ])
      setProducts(prods)
      setCategories(cats)
    } catch {
    } finally { setLoading(false) }
  }, [search, catFilter, showArchived])

  useEffect(() => { load() }, [load])

  const handleCreate = async (payload) => {
    setSaving(true)
    try {
      await api.post('/products', payload)
      toast.success('Product created!')
      setCreateOpen(false)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleEdit = async (payload) => {
    setSaving(true)
    try {
      await api.put(`/products/${editTarget.id}`, payload)
      toast.success('Product updated!')
      setEditTarget(null)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleArchiveToggle = async (product) => {
    try {
      await api.put(`/products/${product.id}`, { is_active: !product.is_active })
      toast.success(product.is_active ? 'Product archived' : 'Product restored')
      load()
    } catch {}
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteTarget.id}`)
      toast.success('Product deleted!')
      setDeleteTarget(null)
      load()
    } catch {}
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Products</h1>
          <p className="text-sm text-muted mt-0.5">Manage your menu items</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <input
            className="input text-sm py-1.5 w-full pl-3"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input text-sm py-1.5 w-44" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
          <Toggle enabled={showArchived} onChange={setShowArchived} />
          Show Archived
        </label>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th>Price</Th>
                  <Th>Tax</Th>
                  <Th>UOM</Th>
                  <Th>KDS</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <Tr key={p.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: p.category?.color ?? '#6366f1' }} />
                        <span className="font-medium text-white">{p.name}</span>
                      </div>
                    </Td>
                    <Td className="text-muted">{p.category?.name}</Td>
                    <Td className="font-medium text-white">₹{parseFloat(p.price).toFixed(2)}</Td>
                    <Td className="text-muted">{p.tax_percent}%</Td>
                    <Td className="text-muted capitalize">{p.unit_of_measure}</Td>
                    <Td>
                      <Badge color={p.show_in_kds ? 'green' : 'gray'}>{p.show_in_kds ? 'Yes' : 'No'}</Badge>
                    </Td>
                    <Td>
                      <Badge color={p.is_active ? 'green' : 'gray'}>{p.is_active ? 'Active' : 'Archived'}</Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditTarget(p)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleArchiveToggle(p)}
                          className={`p-1.5 rounded-lg transition-colors ${p.is_active ? 'hover:bg-yellow-500/15 text-muted hover:text-yellow-400' : 'hover:bg-emerald-500/15 text-muted hover:text-emerald-400'}`}
                          title={p.is_active ? 'Archive' : 'Restore'}
                        >
                          {p.is_active ? <ArchiveX size={14} /> : <Archive size={14} />}
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            {products.length === 0 && (
              <EmptyState
                title="No products found"
                description="Add your first product to get started."
                action={<button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={14} /> Add Product</button>}
              />
            )}
          </>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Product" size="lg">
        <ProductForm categories={categories} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} saving={saving} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Product" size="lg">
        {editTarget && (
          <ProductForm initial={editTarget} categories={categories} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} saving={saving} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
