import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Table, Th, Td, Tr } from '../../components/DataTable'
import Modal from '../../components/Modal'
import { PageLoader, EmptyState, ConfirmDialog, Badge } from '../../components/ui'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDiscount = (type, value) =>
  type === 'percent' ? `${value}%` : `₹${parseFloat(value).toFixed(2)}`

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—')

const toDatetimeLocal = (iso) => (iso ? iso.slice(0, 16) : '')
const fromDatetimeLocal = (v) => (v ? new Date(v).toISOString() : null)

// ── Field label ───────────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

// ── Coupon form ───────────────────────────────────────────────────────────────

function CouponForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    discount_type: initial?.discount_type ?? 'percent',
    discount_value: initial?.discount_value ?? '',
    usage_limit: initial?.usage_limit ?? '',
    expires_at: toDatetimeLocal(initial?.expires_at),
    is_active: initial?.is_active ?? true,
  })

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.code.trim()) return toast.error('Code is required')
    if (!form.discount_value || parseFloat(form.discount_value) <= 0)
      return toast.error('Discount value must be > 0')

    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      expires_at: fromDatetimeLocal(form.expires_at),
    }
    if (initial) payload.is_active = form.is_active
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Coupon Code">
        <input
          className="input uppercase"
          value={form.code}
          onChange={(e) => set('code', e.target.value)}
          placeholder="e.g. SAVE10"
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Discount Type">
          <select className="input" value={form.discount_type} onChange={(e) => set('discount_type', e.target.value)}>
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
        </Field>
        <Field label={form.discount_type === 'percent' ? 'Value (%)' : 'Value (₹)'}>
          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            value={form.discount_value}
            onChange={(e) => set('discount_value', e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Usage Limit (optional)">
          <input
            className="input"
            type="number"
            min="1"
            step="1"
            value={form.usage_limit}
            onChange={(e) => set('usage_limit', e.target.value)}
            placeholder="Unlimited"
          />
        </Field>
        <Field label="Expires At (optional)">
          <input
            className="input"
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => set('expires_at', e.target.value)}
          />
        </Field>
      </div>

      {initial && (
        <Field label="Status">
          <select className="input" value={form.is_active ? 'true' : 'false'} onChange={(e) => set('is_active', e.target.value === 'true')}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </Field>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Coupon'}
        </button>
      </div>
    </form>
  )
}

// ── Promotion form ────────────────────────────────────────────────────────────

function PromotionForm({ initial, products, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    applies_to: initial?.applies_to ?? 'order',
    product_id: initial?.product?.id ?? '',
    min_quantity: initial?.min_quantity ?? '',
    min_order_amount: initial?.min_order_amount ?? '',
    discount_type: initial?.discount_type ?? 'percent',
    discount_value: initial?.discount_value ?? '',
    is_active: initial?.is_active ?? true,
    starts_at: toDatetimeLocal(initial?.starts_at),
    ends_at: toDatetimeLocal(initial?.ends_at),
  })

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))
  const isProduct = form.applies_to === 'product'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.discount_value || parseFloat(form.discount_value) <= 0)
      return toast.error('Discount value must be > 0')
    if (isProduct) {
      if (!form.product_id) return toast.error('Product is required')
      if (!form.min_quantity || parseInt(form.min_quantity) < 1)
        return toast.error('Min quantity must be at least 1')
    } else {
      if (!form.min_order_amount || parseFloat(form.min_order_amount) <= 0)
        return toast.error('Min order amount must be > 0')
    }

    const payload = {
      name: form.name.trim(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      starts_at: fromDatetimeLocal(form.starts_at),
      ends_at: fromDatetimeLocal(form.ends_at),
    }

    if (!initial) {
      payload.applies_to = form.applies_to
    }

    if (isProduct) {
      payload.product_id = parseInt(form.product_id)
      payload.min_quantity = parseInt(form.min_quantity)
    } else {
      payload.min_order_amount = parseFloat(form.min_order_amount)
    }

    if (initial) payload.is_active = form.is_active
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Promotion Name">
        <input
          className="input"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Buy 2 Get Discount"
          autoFocus
        />
      </Field>

      {/* applies_to only shown on create */}
      {!initial && (
        <Field label="Applies To">
          <div className="grid grid-cols-2 gap-2">
            {['order', 'product'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => set('applies_to', type)}
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                  form.applies_to === type
                    ? 'border-primary-500 bg-primary-500/15 text-primary-400'
                    : 'border-border text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {type === 'order' ? '🛒 Order Level' : '📦 Product Level'}
              </button>
            ))}
          </div>
        </Field>
      )}

      {/* Conditional fields */}
      {isProduct ? (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Product">
            <select
              className="input"
              value={form.product_id}
              onChange={(e) => set('product_id', e.target.value)}
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Min Quantity">
            <input
              className="input"
              type="number"
              min="1"
              step="1"
              value={form.min_quantity}
              onChange={(e) => set('min_quantity', e.target.value)}
              placeholder="e.g. 2"
            />
          </Field>
        </div>
      ) : (
        <Field label="Min Order Amount (₹)">
          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            value={form.min_order_amount}
            onChange={(e) => set('min_order_amount', e.target.value)}
            placeholder="e.g. 500"
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Discount Type">
          <select className="input" value={form.discount_type} onChange={(e) => set('discount_type', e.target.value)}>
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
        </Field>
        <Field label={form.discount_type === 'percent' ? 'Value (%)' : 'Value (₹)'}>
          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            value={form.discount_value}
            onChange={(e) => set('discount_value', e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts At (optional)">
          <input className="input" type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
        </Field>
        <Field label="Ends At (optional)">
          <input className="input" type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} />
        </Field>
      </div>

      {initial && (
        <Field label="Status">
          <select className="input" value={form.is_active ? 'true' : 'false'} onChange={(e) => set('is_active', e.target.value === 'true')}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </Field>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Promotion'}
        </button>
      </div>
    </form>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, description, onAdd, addLabel, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="text-sm text-muted mt-0.5">{description}</p>
        </div>
        <button onClick={onAdd} className="btn-primary">
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      <div className="card overflow-hidden">{children}</div>
    </div>
  )
}

// ── Action buttons ────────────────────────────────────────────────────────────

function Actions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors">
        <Pencil size={14} />
      </button>
      <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CouponPromotionPage() {
  const [coupons, setCoupons] = useState([])
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // coupon modal state
  const [couponCreate, setCouponCreate] = useState(false)
  const [couponEdit, setCouponEdit] = useState(null)
  const [couponDelete, setCouponDelete] = useState(null)

  // promotion modal state
  const [promoCreate, setPromoCreate] = useState(false)
  const [promoEdit, setPromoEdit] = useState(null)
  const [promoDelete, setPromoDelete] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [c, p, prods] = await Promise.all([
        api.get('/coupons').then((r) => r.data),
        api.get('/promotions').then((r) => r.data),
        api.get('/products').then((r) => r.data).catch(() => []),
      ])
      setCoupons(c)
      setPromotions(p)
      setProducts(prods)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Coupon handlers ──────────────────────────────────────────────────────

  const handleCouponCreate = async (payload) => {
    setSaving(true)
    try {
      await api.post('/coupons', payload)
      toast.success('Coupon created!')
      setCouponCreate(false)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleCouponEdit = async (payload) => {
    setSaving(true)
    try {
      await api.put(`/coupons/${couponEdit.id}`, payload)
      toast.success('Coupon updated!')
      setCouponEdit(null)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handleCouponDelete = async () => {
    try {
      await api.delete(`/coupons/${couponDelete.id}`)
      toast.success('Coupon deleted!')
      setCouponDelete(null)
      load()
    } catch {}
  }

  // ── Promotion handlers ───────────────────────────────────────────────────

  const handlePromoCreate = async (payload) => {
    setSaving(true)
    try {
      await api.post('/promotions', payload)
      toast.success('Promotion created!')
      setPromoCreate(false)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handlePromoEdit = async (payload) => {
    setSaving(true)
    try {
      await api.put(`/promotions/${promoEdit.id}`, payload)
      toast.success('Promotion updated!')
      setPromoEdit(null)
      load()
    } catch {
    } finally { setSaving(false) }
  }

  const handlePromoDelete = async () => {
    try {
      await api.delete(`/promotions/${promoDelete.id}`)
      toast.success('Promotion deleted!')
      setPromoDelete(null)
      load()
    } catch {}
  }

  if (loading) return <PageLoader />

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in space-y-10">
      <div>
        <h1 className="text-xl font-bold text-white">Coupons & Promotions</h1>
        <p className="text-sm text-muted mt-0.5">Manage discount codes and automatic promotions</p>
      </div>

      {/* ── Coupons ──────────────────────────────────────────────────────── */}
      <Section
        title="Coupons"
        description="One-time or limited-use discount codes customers enter at checkout"
        onAdd={() => setCouponCreate(true)}
        addLabel="Add Coupon"
      >
        <Table>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Used / Limit</Th>
              <Th>Expires</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <Tr key={c.id}>
                <Td><span className="font-mono font-semibold text-white">{c.code}</span></Td>
                <Td>{fmtDiscount(c.discount_type, c.discount_value)}</Td>
                <Td className="text-muted">{c.used_count} / {c.usage_limit ?? '∞'}</Td>
                <Td className="text-muted">{fmtDate(c.expires_at)}</Td>
                <Td>
                  <Badge color={c.is_active ? 'green' : 'gray'}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <Actions onEdit={() => setCouponEdit(c)} onDelete={() => setCouponDelete(c)} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {coupons.length === 0 && (
          <EmptyState
            title="No coupons yet"
            description="Create a coupon code to offer discounts at checkout."
            action={<button onClick={() => setCouponCreate(true)} className="btn-primary"><Plus size={14} /> Add Coupon</button>}
          />
        )}
      </Section>

      {/* ── Promotions ───────────────────────────────────────────────────── */}
      <Section
        title="Promotions"
        description="Automatic discounts triggered by cart conditions — no code needed"
        onAdd={() => setPromoCreate(true)}
        addLabel="Add Promotion"
      >
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Condition</Th>
              <Th>Discount</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium text-white">{p.name}</Td>
                <Td>
                  <Badge color={p.applies_to === 'product' ? 'blue' : 'purple'}>
                    {p.applies_to === 'product' ? 'Product' : 'Order'}
                  </Badge>
                </Td>
                <Td className="text-muted text-xs">
                  {p.applies_to === 'product'
                    ? <span>{p.product?.name ?? '—'} × {p.min_quantity}</span>
                    : <span>Order ≥ ₹{parseFloat(p.min_order_amount).toFixed(0)}</span>
                  }
                </Td>
                <Td>{fmtDiscount(p.discount_type, p.discount_value)}</Td>
                <Td className="text-muted text-xs">
                  {p.starts_at || p.ends_at
                    ? `${fmtDate(p.starts_at)} – ${fmtDate(p.ends_at)}`
                    : 'Always'}
                </Td>
                <Td>
                  <Badge color={p.is_active ? 'green' : 'gray'}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <Actions onEdit={() => setPromoEdit(p)} onDelete={() => setPromoDelete(p)} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {promotions.length === 0 && (
          <EmptyState
            title="No promotions yet"
            description="Create an automatic promotion to apply discounts based on cart rules."
            action={<button onClick={() => setPromoCreate(true)} className="btn-primary"><Plus size={14} /> Add Promotion</button>}
          />
        )}
      </Section>

      {/* ── Coupon modals ─────────────────────────────────────────────────── */}
      <Modal open={couponCreate} onClose={() => setCouponCreate(false)} title="New Coupon">
        <CouponForm onSubmit={handleCouponCreate} onCancel={() => setCouponCreate(false)} saving={saving} />
      </Modal>
      <Modal open={!!couponEdit} onClose={() => setCouponEdit(null)} title="Edit Coupon">
        {couponEdit && (
          <CouponForm initial={couponEdit} onSubmit={handleCouponEdit} onCancel={() => setCouponEdit(null)} saving={saving} />
        )}
      </Modal>
      <ConfirmDialog
        open={!!couponDelete}
        title="Delete Coupon"
        message={`Delete coupon "${couponDelete?.code}"? This cannot be undone.`}
        onConfirm={handleCouponDelete}
        onCancel={() => setCouponDelete(null)}
        danger
      />

      {/* ── Promotion modals ──────────────────────────────────────────────── */}
      <Modal open={promoCreate} onClose={() => setPromoCreate(false)} title="New Promotion" size="lg">
        <PromotionForm products={products} onSubmit={handlePromoCreate} onCancel={() => setPromoCreate(false)} saving={saving} />
      </Modal>
      <Modal open={!!promoEdit} onClose={() => setPromoEdit(null)} title="Edit Promotion" size="lg">
        {promoEdit && (
          <PromotionForm initial={promoEdit} products={products} onSubmit={handlePromoEdit} onCancel={() => setPromoEdit(null)} saving={saving} />
        )}
      </Modal>
      <ConfirmDialog
        open={!!promoDelete}
        title="Delete Promotion"
        message={`Delete promotion "${promoDelete?.name}"? This cannot be undone.`}
        onConfirm={handlePromoDelete}
        onCancel={() => setPromoDelete(null)}
        danger
      />
    </div>
  )
}
