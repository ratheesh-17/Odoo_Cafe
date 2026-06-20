import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Search, Plus, Minus, Trash2, ShoppingCart,
  X, Ticket, ChefHat, CheckCircle2, Clock,
} from 'lucide-react'
import api from '../lib/api'
import { clsx } from 'clsx'

const fmt = (n) => `₹${parseFloat(n ?? 0).toFixed(2)}`

// ── Inline spinner ────────────────────────────────────────────────────────────

function Spin({ size = 20 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full border-2 border-white/20 border-t-white animate-spin flex-shrink-0"
    />
  )
}

// ── Full-screen loader ────────────────────────────────────────────────────────

function FullLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <Spin size={36} />
    </div>
  )
}

// ── Error screen ──────────────────────────────────────────────────────────────

function ErrorScreen({ message }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 gap-4 px-8 text-center">
      <div className="text-5xl">🔗</div>
      <p className="font-bold text-white text-lg">Invalid QR Code</p>
      <p className="text-white/50 text-sm">{message}</p>
    </div>
  )
}

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ product, qty, onAdd, onInc, onDec, readOnly }) {
  return (
    <div className="flex flex-col bg-white/10 border border-white/15 rounded-2xl p-3 gap-2 backdrop-blur-sm">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: product.category?.color ?? '#6366f1' }}
      >
        {product.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{product.name}</p>
        {product.description && (
          <p className="text-white/40 text-[10px] mt-0.5 line-clamp-1">{product.description}</p>
        )}
        <p className="text-white font-bold text-sm mt-1">{fmt(product.price)}</p>
      </div>

      {!readOnly && (
        qty > 0 ? (
          <div className="flex items-center justify-between bg-white/10 rounded-xl px-1 py-0.5">
            <button onClick={onDec} className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              {qty === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
            </button>
            <span className="text-white text-sm font-bold">{qty}</span>
            <button onClick={onInc} className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Plus size={11} />
            </button>
          </div>
        ) : (
          <button
            onClick={onAdd}
            className="w-full py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={12} /> Add
          </button>
        )
      )}
    </div>
  )
}

// ── Cart sheet ────────────────────────────────────────────────────────────────

function CartSheet({ token, order, open, onClose, onOrderUpdated, onSubmitted }) {
  const [code, setCode]         = useState('')
  const [codeErr, setCodeErr]   = useState(null)
  const [applying, setApplying] = useState(false)
  const [placing, setPlacing]   = useState(false)

  const handleCoupon = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setCodeErr(null)
    setApplying(true)
    try {
      const { data } = await api.post(`/s/${token}/orders/${order.id}/coupon`, {
        code: code.trim().toUpperCase(),
      })
      onOrderUpdated(data)
      setCode('')
    } catch (err) {
      const msg = err?.response?.data?.detail
      setCodeErr(typeof msg === 'string' ? msg : 'Invalid or expired coupon code')
    } finally { setApplying(false) }
  }

  const handleSubmit = async () => {
    setPlacing(true)
    try {
      const { data } = await api.post(`/s/${token}/orders/${order.id}/submit`)
      onSubmitted(data)
    } catch {
    } finally { setPlacing(false) }
  }

  if (!open) return null
  const empty = !order?.items?.length

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-gray-900 border-l border-white/10 flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <p className="font-semibold text-white">Your Order</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {empty ? (
            <p className="text-center text-white/30 text-sm py-10">Your cart is empty</p>
          ) : order.items.map(item => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-white/40">{fmt(item.unit_price)} each</p>
                {item.line_discount > 0 && (
                  <p className="text-[11px] text-emerald-400">–{fmt(item.line_discount)} promo</p>
                )}
              </div>
              <p className="text-sm font-semibold text-white whitespace-nowrap">{fmt(item.line_total)}</p>
            </div>
          ))}
        </div>

        {/* Coupon */}
        {!empty && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-white/10">
            {order?.coupon ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-xl px-3 py-2">
                <Ticket size={12} /> {order.coupon.code} applied
              </div>
            ) : (
              <form onSubmit={handleCoupon} className="flex gap-2">
                <input
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                  value={code}
                  onChange={e => { setCode(e.target.value); setCodeErr(null) }}
                  placeholder="Coupon code"
                />
                <button
                  type="submit"
                  disabled={applying}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
                >
                  {applying ? '…' : 'Apply'}
                </button>
              </form>
            )}
            {codeErr && <p className="text-xs text-red-400 mt-1.5">{codeErr}</p>}
          </div>
        )}

        {/* Totals */}
        {!empty && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-white/10 space-y-1.5">
            <div className="flex justify-between text-xs text-white/40"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            <div className="flex justify-between text-xs text-white/40"><span>Tax</span><span>{fmt(order.tax_amount)}</span></div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400"><span>Discount</span><span>–{fmt(order.discount_amount)}</span></div>
            )}
            <div className="flex justify-between font-bold text-white text-sm pt-1.5 border-t border-white/10">
              <span>Total</span><span>{fmt(order.total_amount)}</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex-shrink-0 p-4 border-t border-white/10">
          <button
            onClick={handleSubmit}
            disabled={empty || placing}
            className="w-full py-3 rounded-2xl bg-white text-gray-900 font-bold text-sm hover:bg-white/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {placing ? <Spin size={16} /> : <ChefHat size={15} />}
            {placing ? 'Placing order…' : `Place Order · ${fmt(order?.total_amount)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Order tracker ─────────────────────────────────────────────────────────────

const STAGE_META = {
  to_cook:   { label: 'Received — waiting to cook', emoji: '🕐' },
  preparing: { label: 'Being prepared',              emoji: '🍳' },
  completed: { label: 'Ready to collect!',           emoji: '✅' },
}

function OrderTracker({ token, order, onBack }) {
  const [status, setStatus] = useState(null)
  const intervalRef = useRef(null)

  const poll = useCallback(async () => {
    try {
      const { data } = await api.get(`/s/${token}/orders/${order.id}/status`)
      setStatus(data)
    } catch {}
  }, [token, order.id])

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, 4000)
    return () => clearInterval(intervalRef.current)
  }, [poll])

  const stage = status?.kitchen_stage
  const stageMeta = stage ? STAGE_META[stage] : { label: 'Order received', emoji: '🧾' }
  const allDone = stage === 'completed' && status?.items?.every(i => i.is_done)

  return (
    <div className="flex flex-col items-center min-h-screen px-6 pt-12 pb-6 text-center gap-6">
      <div className="text-6xl">{stageMeta.emoji}</div>

      <div>
        <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Order {order.order_number}</p>
        <p className="text-2xl font-bold text-white">{stageMeta.label}</p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-3">
        {['to_cook', 'preparing', 'completed'].map((s, idx) => {
          const stageOrder = ['to_cook', 'preparing', 'completed']
          const cur = stage ? stageOrder.indexOf(stage) : -1
          const active = stageOrder.indexOf(s) <= cur
          return (
            <div key={s} className="flex items-center gap-3">
              <div className={clsx(
                'w-3 h-3 rounded-full transition-all duration-500',
                active ? 'bg-emerald-400 scale-110' : 'bg-white/20'
              )} />
              {idx < 2 && <div className={clsx('w-10 h-0.5 transition-all duration-500', active && stageOrder.indexOf(s) < cur ? 'bg-emerald-400' : 'bg-white/20')} />}
            </div>
          )
        })}
      </div>

      {/* Per-item status */}
      {status?.items?.length > 0 && (
        <div className="w-full max-w-xs space-y-2">
          {status.items.map((item, i) => (
            <div key={i} className={clsx(
              'flex items-center justify-between rounded-xl px-4 py-2.5 border transition-all',
              item.is_done ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/10 border-white/10'
            )}>
              <span className={clsx('text-sm', item.is_done ? 'line-through text-white/40' : 'text-white')}>
                {item.product_name} ×{item.quantity}
              </span>
              {item.is_done && <CheckCircle2 size={14} className="text-emerald-400" />}
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl px-5 py-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-white/40"><span>Subtotal</span><span>{fmt(status?.subtotal)}</span></div>
        {status?.discount_amount > 0 && (
          <div className="flex justify-between text-emerald-400"><span>Discount</span><span>–{fmt(status?.discount_amount)}</span></div>
        )}
        <div className="flex justify-between text-white/40"><span>Tax</span><span>{fmt(status?.tax_amount)}</span></div>
        <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10">
          <span>Total</span><span>{fmt(status?.total_amount)}</span>
        </div>
      </div>

      {allDone && (
        <div className="text-emerald-400 font-semibold text-sm animate-bounce">
          Your order is ready — please collect! 🎉
        </div>
      )}

      <div className="flex items-center gap-2 text-white/30 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Updates every 4s
      </div>

      <button
        onClick={onBack}
        className="mt-2 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 text-sm transition-colors"
      >
        ← Back to menu
      </button>
    </div>
  )
}

// ── Self Order Page ───────────────────────────────────────────────────────────

export default function SelfOrderPage() {
  const { token } = useParams()

  const [menu, setMenu]         = useState(null)
  const [order, setOrder]       = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch]     = useState('')
  const [activeCat, setActiveCat] = useState(null)
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [menuError, setMenuError]     = useState(null)
  const [busy, setBusy]         = useState(null) // product id being mutated

  // Load menu
  useEffect(() => {
    api.get(`/s/${token}/menu`)
      .then(r => setMenu(r.data))
      .catch(err => {
        const msg = err?.response?.data?.detail
        setMenuError(typeof msg === 'string' ? msg : 'QR code is invalid or expired.')
      })
      .finally(() => setLoadingMenu(false))
  }, [token])

  const isOrdering = menu?.config?.is_enabled && menu?.config?.mode === 'online_ordering'

  // Ensure a draft order exists
  const ensureOrder = useCallback(async () => {
    if (order) return order
    const { data } = await api.post(`/s/${token}/orders`)
    setOrder(data)
    return data
  }, [token, order])

  const handleAdd = async (productId) => {
    setBusy(productId)
    try {
      const o = await ensureOrder()
      const { data } = await api.post(`/s/${token}/orders/${o.id}/items`, {
        product_id: productId, quantity: 1,
      })
      setOrder(data)
    } catch {
    } finally { setBusy(null) }
  }

  const handleChange = async (itemId, qty, productId) => {
    setBusy(productId)
    try {
      const { data } = await api.put(`/s/${token}/orders/${order.id}/items/${itemId}`, { quantity: qty })
      setOrder(data)
    } catch {
    } finally { setBusy(null) }
  }

  const handleRemove = async (itemId, productId) => {
    setBusy(productId)
    try {
      const { data } = await api.delete(`/s/${token}/orders/${order.id}/items/${itemId}`)
      setOrder(data)
    } catch {
    } finally { setBusy(null) }
  }

  const handleSubmitted = (submittedOrder) => {
    setOrder(submittedOrder)
    setCartOpen(false)
    setSubmitted(true)
  }

  if (loadingMenu) return <FullLoader />
  if (menuError)   return <ErrorScreen message={menuError} />

  const { config, table, categories, products } = menu

  const bgStyle = {
    backgroundColor: config.background_color,
    ...(config.background_image && {
      backgroundImage: `url(${config.background_image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
  }

  // Order tracking view
  if (submitted && order) {
    return (
      <div className="min-h-screen" style={bgStyle}>
        <div className="min-h-screen bg-black/55">
          <OrderTracker token={token} order={order} onBack={() => setSubmitted(false)} />
        </div>
      </div>
    )
  }

  // Filter products
  const filtered = products.filter(p => {
    const mc = activeCat ? p.category?.id === activeCat : true
    const ms = search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
    return mc && ms
  })

  const cartCount = order?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0
  const cartTotal = order?.total_amount ?? 0

  return (
    <div className="min-h-screen" style={bgStyle}>
      <div className="min-h-screen bg-black/50 flex flex-col">

        {/* Sticky header */}
        <header className="sticky top-0 z-10 bg-black/60 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-white text-sm">Table {table.table_number}</p>
            <p className="text-[11px] text-white/50">{table.seats} seats</p>
          </div>
          {isOrdering && cartCount > 0 && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-colors"
            >
              <ShoppingCart size={14} />
              {fmt(cartTotal)}
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-gray-900 text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          )}
        </header>

        {/* Search */}
        <div className="px-4 pt-3 pb-1 space-y-2 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
              placeholder="Search menu…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <button
              onClick={() => setActiveCat(null)}
              className={clsx('flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors', {
                'bg-white text-gray-900': !activeCat,
                'bg-white/10 text-white/60 hover:bg-white/20': activeCat,
              })}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
                className={clsx('flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors', {
                  'bg-white text-gray-900': activeCat === c.id,
                  'bg-white/10 text-white/60 hover:bg-white/20': activeCat !== c.id,
                })}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </button>
            ))}
          </div>

          {!isOrdering && (
            <div className="text-center py-1.5 rounded-xl bg-white/10 text-white/50 text-xs">
              📖 Menu view — please order at the counter
            </div>
          )}
        </div>

        {/* Products */}
        <div className="flex-1 px-4 pb-24 pt-2">
          {filtered.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-12">No items found</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filtered.map(p => {
                const cartItem = order?.items?.find(i => i.product.id === p.id)
                const qty = cartItem?.quantity ?? 0
                return (
                  <ProductCard
                    key={p.id}
                    product={p}
                    qty={qty}
                    readOnly={!isOrdering || busy === p.id}
                    onAdd={() => handleAdd(p.id)}
                    onInc={() => handleChange(cartItem.id, qty + 1, p.id)}
                    onDec={() => qty === 1
                      ? handleRemove(cartItem.id, p.id)
                      : handleChange(cartItem.id, qty - 1, p.id)
                    }
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Floating cart bar */}
        {isOrdering && cartCount > 0 && !cartOpen && (
          <div className="fixed bottom-5 inset-x-4 z-20 flex justify-center">
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-gray-900 font-bold shadow-2xl hover:bg-white/90 transition-colors"
            >
              <ShoppingCart size={15} />
              View Order
              <span className="bg-gray-900 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
              <span className="font-bold">{fmt(cartTotal)}</span>
            </button>
          </div>
        )}
      </div>

      <CartSheet
        token={token}
        order={order}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onOrderUpdated={setOrder}
        onSubmitted={handleSubmitted}
      />
    </div>
  )
}
