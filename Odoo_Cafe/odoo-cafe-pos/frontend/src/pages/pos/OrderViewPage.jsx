import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Minus, Trash2, Tag, ChefHat,
  CreditCard, Ticket, ShoppingCart,
} from 'lucide-react'
import { usePosStore } from '../../store/posStore'
import Modal from '../../components/Modal'
import { Spinner, PageLoader } from '../../components/ui'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const fmt = (n) => `₹${parseFloat(n ?? 0).toFixed(2)}`

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ product, onAdd, adding }) {
  return (
    <button
      onClick={() => onAdd(product)}
      disabled={adding === product.id}
      className="relative flex flex-col bg-card border border-border rounded-xl p-3 text-left hover:border-primary-500/50 hover:bg-white/5 transition-all active:scale-95 disabled:opacity-60"
    >
      <div
        className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-white text-xs font-bold"
        style={{ backgroundColor: product.category?.color ?? '#6366f1' }}
      >
        {product.name[0]}
      </div>
      <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{product.name}</p>
      <p className="text-xs text-primary-400 font-bold mt-1">{fmt(product.price)}</p>
      {adding === product.id && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
          <Spinner size={16} />
        </div>
      )}
    </button>
  )
}

// ── Cart item row ─────────────────────────────────────────────────────────────

function CartItem({ item, onUpdate, onRemove, updating }) {
  const busy = updating === item.id
  return (
    <div className={clsx('flex items-start gap-2 py-2.5 border-b border-border/50', busy && 'opacity-60')}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
        <p className="text-xs text-muted">{fmt(item.unit_price)} each</p>
        {item.line_discount > 0 && (
          <p className="text-[11px] text-emerald-400">-{fmt(item.line_discount)} promo</p>
        )}
        {item.note && <p className="text-[11px] text-muted italic mt-0.5">{item.note}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => item.quantity > 1 ? onUpdate(item.id, item.quantity - 1) : onRemove(item.id)}
          disabled={busy}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
        </button>
        <span className="w-6 text-center text-sm font-semibold text-white">{item.quantity}</span>
        <button
          onClick={() => onUpdate(item.id, item.quantity + 1)}
          disabled={busy}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <Plus size={11} />
        </button>
      </div>
      <p className="text-sm font-semibold text-white w-16 text-right flex-shrink-0">{fmt(item.line_total)}</p>
    </div>
  )
}

// ── Discount modal ────────────────────────────────────────────────────────────

function DiscountModal({ open, onClose, order }) {
  const { applyCoupon, removeCoupon } = usePosStore()
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // reset state when modal opens
  useEffect(() => { if (open) { setCode(''); setError(null) } }, [open])

  const handleApply = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setError(null)
    setLoading(true)
    try {
      await applyCoupon(code.trim().toUpperCase())
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.detail
      setError(typeof msg === 'string' ? msg : 'Invalid or expired coupon code')
    } finally { setLoading(false) }
  }

  const handleRemove = async () => {
    setLoading(true)
    try {
      await removeCoupon()
      onClose()
    } catch {
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Apply Coupon" size="sm">
      {order?.coupon ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Ticket size={16} className="text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-300">{order.coupon.code}</p>
              <p className="text-xs text-muted">
                {order.coupon.discount_type === 'percent'
                  ? `${order.coupon.discount_value}% off`
                  : `₹${order.coupon.discount_value} off`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="btn-ghost">Close</button>
            <button onClick={handleRemove} disabled={loading} className="btn-danger">
              Remove Coupon
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Coupon Code
            </label>
            <input
              className={`input uppercase ${error ? 'border-red-500/50' : ''}`}
              value={code}
              onChange={e => { setCode(e.target.value); setError(null) }}
              placeholder="e.g. SAVE10"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500/20 flex items-center justify-center text-[8px]">!</span>
                {error}
              </p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !code.trim()}>
              {loading ? 'Applying…' : 'Apply'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ── Payment modal ─────────────────────────────────────────────────────────────

function PaymentModal({ open, onClose, order, onPaid }) {
  const { processPayment } = usePosStore()
  const [methods, setMethods] = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const [amountPaid, setAmountPaid] = useState('')
  const [txRef, setTxRef] = useState('')
  const [upiQr, setUpiQr] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    api.get('/payment-methods').then(r => {
      const enabled = r.data.filter(m => m.is_enabled)
      setMethods(enabled)
      if (enabled.length > 0) setSelectedType(enabled[0].type)
    }).catch(() => {})
  }, [open])

  useEffect(() => {
    if (selectedType === 'upi' && order) {
      api.get(`/payment-methods/upi/qr?amount=${order.total_amount}`)
        .then(r => setUpiQr(r.data))
        .catch(() => setUpiQr(null))
    }
  }, [selectedType, order])

  const total = parseFloat(order?.total_amount ?? 0)
  const change = selectedType === 'cash' ? Math.max(parseFloat(amountPaid || 0) - total, 0) : 0

  const handlePay = async () => {
    if (!selectedType) return
    const paid = selectedType === 'cash' ? parseFloat(amountPaid) : total
    if (selectedType === 'cash' && paid < total)
      return toast.error(`Amount must be at least ${fmt(total)}`)
    if (selectedType === 'card' && !txRef.trim())
      return toast.error('Transaction reference is required for card payment')

    setLoading(true)
    try {
      const result = await processPayment(
        selectedType,
        paid,
        selectedType === 'card' ? txRef.trim() : null
      )
      onPaid(result)
    } catch {
    } finally { setLoading(false) }
  }

  const METHOD_LABELS = { cash: 'Cash', card: 'Card', upi: 'UPI QR' }

  return (
    <Modal open={open} onClose={onClose} title="Process Payment" size="md">
      <div className="space-y-4">
        {/* Total */}
        <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-center">
          <p className="text-xs text-muted uppercase tracking-wider">Total Due</p>
          <p className="text-3xl font-bold text-white mt-1">{fmt(total)}</p>
        </div>

        {/* Method tabs */}
        <div className="flex gap-2">
          {methods.map(m => (
            <button
              key={m.type}
              onClick={() => setSelectedType(m.type)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                selectedType === m.type
                  ? 'border-primary-500 bg-primary-500/15 text-primary-400'
                  : 'border-border text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {METHOD_LABELS[m.type] ?? m.type}
            </button>
          ))}
        </div>

        {/* Cash */}
        {selectedType === 'cash' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">Amount Received (₹)</label>
            <input
              className="input text-lg font-bold"
              type="number"
              min={total}
              step="0.01"
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              placeholder={total.toFixed(2)}
              autoFocus
            />
            {parseFloat(amountPaid) > 0 && (
              <div className="flex justify-between text-sm px-1">
                <span className="text-muted">Change Due</span>
                <span className="text-emerald-400 font-bold">{fmt(change)}</span>
              </div>
            )}
          </div>
        )}

        {/* Card */}
        {selectedType === 'card' && (
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Transaction Reference *</label>
            <input
              className="input"
              value={txRef}
              onChange={e => setTxRef(e.target.value)}
              placeholder="e.g. TXN123456"
              autoFocus
            />
          </div>
        )}

        {/* UPI */}
        {selectedType === 'upi' && (
          <div className="flex flex-col items-center gap-2">
            {upiQr ? (
              <>
                <img
                  src={`data:image/png;base64,${upiQr.qr_base64}`}
                  alt="UPI QR"
                  className="w-40 h-40 rounded-xl border border-border"
                />
                <p className="text-xs text-muted">{upiQr.upi_id}</p>
                <p className="text-xs text-muted">Ask customer to scan and pay {fmt(total)}</p>
              </>
            ) : (
              <div className="flex items-center justify-center h-40">
                <Spinner size={24} />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handlePay} className="btn-primary" disabled={loading}>
            {loading ? 'Processing…' : `Confirm Payment · ${fmt(total)}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Receipt modal ─────────────────────────────────────────────────────────────

function ReceiptModal({ open, order, onNewOrder }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  if (!order) return null

  const handleEmail = async () => {
    if (!email.trim()) return toast.error('Enter an email address')
    setSending(true)
    try {
      await api.post(`/orders/${order.id}/receipt/email`, { email: email.trim() })
      toast.success('Receipt sent!')
    } catch {
    } finally { setSending(false) }
  }

  const handlePrint = async () => {
    try {
      const resp = await api.get(`/orders/${order.id}/receipt/print`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
      toast.success('Opening print preview…')
    } catch {}
  }

  return (
    <Modal open={open} onClose={onNewOrder} title="Payment Complete 🎉">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-sm text-emerald-400 font-semibold">Order {order.order_number}</p>
          <p className="text-2xl font-bold text-white mt-1">{fmt(order.total_amount)}</p>
          <p className="text-xs text-muted mt-1">
            Paid via {order.payment?.payment_type?.toUpperCase()}
            {order.payment?.change_due > 0 && ` · Change: ${fmt(order.payment.change_due)}`}
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Email Receipt (optional)
          </label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="customer@email.com"
            />
            <button onClick={handleEmail} disabled={sending} className="btn-primary">
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-ghost flex-1">🖨 Print Receipt</button>
          <button onClick={onNewOrder} className="btn-primary flex-1">New Order</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Order View Page ───────────────────────────────────────────────────────────

export default function OrderViewPage() {
  const navigate = useNavigate()
  const { activeOrder, activeTable, session, addItem, updateItem, removeItem, clearOrder, createOrder, sendToKitchen } = usePosStore()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState(null)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(null)   // product id being added
  const [updating, setUpdating] = useState(null) // item id being updated

  const [discountOpen, setDiscountOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paidOrder, setPaidOrder] = useState(null)

  const [loadingData, setLoadingData] = useState(true)

  // Redirect to table view if no session
  useEffect(() => {
    if (!session) { navigate('/pos'); return }
  }, [session])

  // Load products + categories
  useEffect(() => {
    Promise.all([
      api.get('/products').then(r => r.data.filter(p => p.is_active)),
      api.get('/categories').then(r => r.data),
    ]).then(([prods, cats]) => {
      setProducts(prods)
      setCategories(cats)
    }).catch(() => {}).finally(() => setLoadingData(false))
  }, [])

  // Ensure we have an active order
  useEffect(() => {
    if (session && !activeOrder) {
      createOrder(activeTable?.id ?? null)
    }
  }, [session, activeOrder])

  const handleAddItem = async (product) => {
    if (!activeOrder) return
    setAdding(product.id)
    try { await addItem(product.id) }
    catch {} finally { setAdding(null) }
  }

  const handleUpdateItem = async (itemId, qty) => {
    setUpdating(itemId)
    try { await updateItem(itemId, qty) }
    catch {} finally { setUpdating(null) }
  }

  const handleRemoveItem = async (itemId) => {
    setUpdating(itemId)
    try { await removeItem(itemId) }
    catch {} finally { setUpdating(null) }
  }

  const [kitchenLoading, setKitchenLoading] = useState(false)

  const handleSendToKitchen = async () => {
    setKitchenLoading(true)
    try { await sendToKitchen() }
    catch {} finally { setKitchenLoading(false) }
  }

  const handlePaid = (order) => {
    setPaymentOpen(false)
    setPaidOrder(order)
  }

  const handleNewOrder = async () => {
    setPaidOrder(null)
    clearOrder()
    navigate('/pos')
  }

  // Filter products
  const filtered = products.filter(p => {
    const matchCat = activeCat ? p.category?.id === activeCat || p.category_id === activeCat : true
    const matchSearch = search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
    return matchCat && matchSearch
  })

  const order = activeOrder
  const isEmpty = !order?.items?.length
  const isDraft = order?.status === 'draft'
  const isSentToKitchen = order?.status === 'sent_to_kitchen'
  const canModify = isDraft || isSentToKitchen
  const isPaid = order?.status === 'paid'

  if (loadingData) return <PageLoader />

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Products ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        {/* Search + category tabs */}
        <div className="flex-shrink-0 p-3 space-y-2 border-b border-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-8 py-1.5 text-sm"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <button
              onClick={() => setActiveCat(null)}
              className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                !activeCat ? 'bg-primary-500/15 text-primary-400' : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeCat === c.id ? 'bg-primary-500/15 text-primary-400' : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <p className="text-center text-muted text-sm py-12">No products found</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {filtered.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAdd={handleAddItem}
                  adding={adding}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart ──────────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-panel">
        {/* Cart header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              {order ? order.order_number : 'No Order'}
            </p>
            <p className="text-xs text-muted">
              {activeTable ? `Table ${activeTable.table_number}` : 'Takeaway'}
              {order?.customer ? ` · ${order.customer.name}` : ''}
            </p>
          </div>
          {order && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isPaid ? 'bg-emerald-500/15 text-emerald-400' :
              isSentToKitchen ? 'bg-blue-500/15 text-blue-400' :
              'bg-white/10 text-muted'
            }`}>
              {order.status.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ShoppingCart size={28} className="text-muted mb-2" />
              <p className="text-sm text-muted">Cart is empty</p>
              <p className="text-xs text-muted mt-1">Tap a product to add it</p>
            </div>
          ) : (
            <div>
              {order.items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                  updating={updating}
                />
              ))}
            </div>
          )}
        </div>

        {/* Discount/promo lines */}
        {order && (order.coupon || order.promotion) && (
          <div className="px-4 py-2 border-t border-border/50 space-y-1">
            {order.promotion && (
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400 flex items-center gap-1">
                  <Tag size={10} /> {order.promotion.name}
                </span>
                <span className="text-emerald-400">Auto</span>
              </div>
            )}
            {order.coupon && (
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400 flex items-center gap-1">
                  <Ticket size={10} /> {order.coupon.code}
                </span>
                <span className="text-emerald-400">
                  {order.coupon.discount_type === 'percent'
                    ? `${order.coupon.discount_value}%`
                    : fmt(order.coupon.discount_value)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Order summary */}
        {order && !isEmpty && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-border space-y-1.5">
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
        )}

        {/* Action buttons */}
        {!isPaid && (
          <div className="flex-shrink-0 p-3 border-t border-border space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => setDiscountOpen(true)}
                disabled={isEmpty || !canModify}
                className="flex-1 btn-ghost text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Ticket size={13} />
                {order?.coupon ? 'Coupon Applied' : 'Coupon'}
              </button>
              <button
                onClick={handleSendToKitchen}
                disabled={isEmpty || kitchenLoading}
                className="flex-1 btn-ghost text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <ChefHat size={13} /> {kitchenLoading ? 'Sending…' : 'Kitchen'}
              </button>
            </div>
            <button
              onClick={() => setPaymentOpen(true)}
              disabled={isEmpty}
              className="w-full btn-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <CreditCard size={15} /> Pay {!isEmpty && fmt(order?.total_amount)}
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <DiscountModal open={discountOpen} onClose={() => setDiscountOpen(false)} order={order} />
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        order={order}
        onPaid={handlePaid}
      />
      <ReceiptModal open={!!paidOrder} order={paidOrder} onNewOrder={handleNewOrder} />
    </div>
  )
}
