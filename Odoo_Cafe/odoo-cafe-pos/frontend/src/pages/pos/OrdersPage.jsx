import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Pencil, Trash2, X, ChevronRight } from 'lucide-react'
import { Table, Th, Td, Tr } from '../../components/DataTable'
import { PageLoader, EmptyState, ConfirmDialog, Badge } from '../../components/ui'
import { usePosStore } from '../../store/posStore'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const fmt = (n) => `₹${parseFloat(n ?? 0).toFixed(2)}`
const fmtDT = (iso) => iso
  ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  : '—'

const STATUS_COLOR = {
  draft:            'gray',
  sent_to_kitchen:  'blue',
  paid:             'green',
  cancelled:        'red',
}

// ── Order detail panel ────────────────────────────────────────────────────────

function OrderDetailPanel({ order, onClose, onEdit, onDelete }) {
  if (!order) return null
  const isDraft = order.status === 'draft'
  const isCancellable = ['draft', 'cancelled'].includes(order.status)

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-panel border-l border-border flex flex-col h-full shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <p className="font-semibold text-white">{order.order_number}</p>
            <p className="text-xs text-muted">{fmtDT(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            {isDraft && (
              <>
                <button onClick={() => onEdit(order)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors" title="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDelete(order)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="px-5 py-3 border-b border-border flex-shrink-0 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Status</span>
            <Badge color={STATUS_COLOR[order.status]}>{order.status.replace('_', ' ')}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Table</span>
            <span className="text-white">{order.table?.table_number ?? 'Takeaway'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Employee</span>
            <span className="text-white">{order.employee?.name}</span>
          </div>
          {order.customer && (
            <div className="flex justify-between">
              <span className="text-muted">Customer</span>
              <span className="text-white">{order.customer.name}</span>
            </div>
          )}
          {order.payment && (
            <div className="flex justify-between">
              <span className="text-muted">Payment</span>
              <span className="text-white capitalize">{order.payment.payment_type} · {fmt(order.payment.amount_paid)}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-white/80">
                {item.product.name}
                <span className="text-muted ml-1">× {item.quantity}</span>
              </span>
              <span className="text-white font-medium">{fmt(item.line_total)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-border space-y-1.5">
          <div className="flex justify-between text-xs text-muted">
            <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>Tax</span><span>{fmt(order.tax_amount)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-xs text-emerald-400">
              <span>Discount</span><span>-{fmt(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-border">
            <span>Total</span><span>{fmt(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const navigate = useNavigate()
  const { session, setActiveOrder, setActiveTable, loadOrder } = usePosStore()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (session?.id) params.set('session_id', session.id)
      if (statusFilter)  params.set('status', statusFilter)
      if (search.trim()) params.set('search', search.trim())
      const { data } = await api.get(`/orders?${params}`)
      setOrders(data)
    } catch {
    } finally { setLoading(false) }
  }, [session, statusFilter, search])

  useEffect(() => { load() }, [load])

  const handleEdit = async (order) => {
    await loadOrder(order.id)
    // restore table context if present
    if (order.table) setActiveTable(order.table)
    setSelected(null)
    navigate('/pos/order')
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/orders/${deleteTarget.id}`)
      toast.success('Order deleted')
      setDeleteTarget(null)
      setSelected(null)
      load()
    } catch {}
  }

  const STATUSES = ['', 'draft', 'sent_to_kitchen', 'paid', 'cancelled']

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-border bg-panel flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-8 py-1.5 text-sm w-full"
            placeholder="Search order #, customer, date…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                  : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {s === '' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? <PageLoader /> : (
          <div className="card m-4 overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <Th>Order #</Th>
                  <Th>Date</Th>
                  <Th>Table</Th>
                  <Th>Customer</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const isDraft = o.status === 'draft'
                  const isCancellable = ['draft', 'cancelled'].includes(o.status)
                  return (
                    <Tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer">
                      <Td><span className="font-mono font-semibold text-white">{o.order_number}</span></Td>
                      <Td className="text-muted text-xs whitespace-nowrap">{fmtDT(o.created_at)}</Td>
                      <Td className="text-muted">{o.table?.table_number ?? 'Takeaway'}</Td>
                      <Td className="text-muted">{o.customer?.name ?? '—'}</Td>
                      <Td className="font-medium text-white">{fmt(o.total_amount)}</Td>
                      <Td>
                        <Badge color={STATUS_COLOR[o.status]}>
                          {o.status.replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelected(o)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          {isDraft && (
                            <button
                              onClick={() => handleEdit(o)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {isCancellable && (
                            <button
                              onClick={() => setDeleteTarget(o)}
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
            {orders.length === 0 && (
              <EmptyState
                title="No orders"
                description={session ? 'No orders found for this session.' : 'No active session.'}
              />
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <OrderDetailPanel
        order={selected}
        onClose={() => setSelected(null)}
        onEdit={handleEdit}
        onDelete={(o) => { setDeleteTarget(o) }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Order"
        message={`Delete order "${deleteTarget?.order_number}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
