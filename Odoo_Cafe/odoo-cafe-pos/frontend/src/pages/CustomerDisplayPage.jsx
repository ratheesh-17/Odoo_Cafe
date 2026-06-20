import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Coffee, CheckCircle2 } from 'lucide-react'
import api from '../lib/api'
import { clsx } from 'clsx'

const POLL_MS = 3000
const fmt = (n) => `₹${parseFloat(n ?? 0).toFixed(2)}`

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spin({ size = 32 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full border-4 border-white/10 border-t-primary-400 animate-spin"
    />
  )
}

// ── Idle view — waiting for an order ─────────────────────────────────────────

function IdleView() {
  return (
    <div className="flex flex-col items-center gap-5 text-center px-8">
      <div className="w-24 h-24 rounded-3xl bg-primary-500/20 flex items-center justify-center">
        <Coffee size={44} className="text-primary-400" />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">Welcome!</p>
        <p className="text-white/50 text-base mt-2 max-w-xs">
          Your order will appear here as soon as the cashier processes it.
        </p>
      </div>
      <div className="flex items-center gap-2 text-white/30 text-sm mt-4">
        <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
        Waiting for order…
      </div>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS = {
  draft:           { label: 'Order Open',      cls: 'bg-white/10 text-white/60' },
  sent_to_kitchen: { label: 'Being Prepared',  cls: 'bg-blue-500/15 text-blue-400' },
  paid:            { label: 'Paid ✓',          cls: 'bg-emerald-500/15 text-emerald-400' },
  cancelled:       { label: 'Cancelled',       cls: 'bg-red-500/15 text-red-400' },
}

// ── Order view — lines + totals ───────────────────────────────────────────────

function OrderView({ data }) {
  const s = STATUS[data.status] ?? STATUS.draft
  return (
    <div className="flex flex-col items-center w-full max-w-lg gap-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-white/40 text-sm uppercase tracking-widest">Order</p>
        <p className="text-5xl font-black text-white mt-1">{data.order_number}</p>
        <span className={clsx('inline-block mt-3 px-5 py-1.5 rounded-full text-sm font-semibold', s.cls)}>
          {s.label}
        </span>
      </div>

      {/* Items */}
      <div className="w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {data.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-0">
            <div>
              <span className="text-white text-sm font-medium">{item.product_name}</span>
              <span className="text-white/40 text-sm ml-2">×{item.quantity}</span>
            </div>
            <span className="text-white font-semibold text-sm">{fmt(item.line_total)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="w-full space-y-2">
        <div className="flex justify-between text-white/40 text-sm"><span>Subtotal</span><span>{fmt(data.subtotal)}</span></div>
        <div className="flex justify-between text-white/40 text-sm"><span>Tax</span><span>{fmt(data.tax_amount)}</span></div>
        {data.discount_amount > 0 && (
          <div className="flex justify-between text-emerald-400 text-sm"><span>Discount</span><span>–{fmt(data.discount_amount)}</span></div>
        )}
        <div className="flex justify-between text-white font-black text-2xl pt-3 border-t border-white/10">
          <span>Total</span><span>{fmt(data.total_amount)}</span>
        </div>
      </div>
    </div>
  )
}

// ── UPI view — QR + total ─────────────────────────────────────────────────────

function UpiView({ data }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-sm">
      <div>
        <p className="text-white/40 text-sm uppercase tracking-widest">Order {data.order_number}</p>
        <p className="text-4xl font-black text-white mt-1">{fmt(data.total_amount)}</p>
        <p className="text-white/50 text-sm mt-2">Scan with any UPI app to pay</p>
      </div>

      {data.upi_qr_base64 ? (
        <div className="p-4 bg-white rounded-3xl shadow-2xl">
          <img
            src={`data:image/png;base64,${data.upi_qr_base64}`}
            alt="UPI QR"
            className="w-56 h-56 block"
          />
        </div>
      ) : (
        <div className="w-64 h-64 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center">
          <Spin size={36} />
        </div>
      )}

      <div className="flex items-center gap-2 text-white/30 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Waiting for payment confirmation…
      </div>
    </div>
  )
}

// ── Completion view ───────────────────────────────────────────────────────────

function CompletionView({ data }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-sm">
      <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
        <CheckCircle2 size={48} className="text-emerald-400" />
      </div>
      <div>
        <p className="text-4xl font-black text-white">Thank You!</p>
        <p className="text-white/50 text-base mt-2">Order {data.order_number} · Payment received</p>
      </div>
      <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-5 text-center">
        <p className="text-emerald-400 font-black text-3xl">{fmt(data.total_amount)}</p>
        <p className="text-white/40 text-sm mt-1 capitalize">{data.payment_type} payment</p>
      </div>
      <p className="text-white/40 text-sm">Please collect your receipt at the counter</p>
    </div>
  )
}

// ── Customer Display Page ─────────────────────────────────────────────────────

export default function CustomerDisplayPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')

  const [data, setData]     = useState(null)
  const [seeded, setSeeded] = useState(false) // first load complete
  const intervalRef = useRef(null)

  const poll = useCallback(async () => {
    if (!orderId) { setSeeded(true); return }
    try {
      const { data: d } = await api.get(`/customer-display/${orderId}`)
      setData(d)
    } catch {
      setData(null)
    } finally {
      setSeeded(true)
    }
  }, [orderId])

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, POLL_MS)
    return () => clearInterval(intervalRef.current)
  }, [poll])

  // Decide which view to render
  const view = (() => {
    if (!data) return 'idle'
    if (data.is_paid) return 'complete'
    if (data.status !== 'paid' && data.payment_type === 'upi') return 'upi'
    return 'order'
  })()

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      {/* Branding bar */}
      <header className="flex-shrink-0 h-16 bg-panel border-b border-border flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <Coffee size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">Odoo Cafe</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live · updates every {POLL_MS / 1000}s
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        {!seeded ? (
          <Spin size={40} />
        ) : (
          <>
            {view === 'idle'     && <IdleView />}
            {view === 'order'    && <OrderView data={data} />}
            {view === 'upi'      && <UpiView data={data} />}
            {view === 'complete' && <CompletionView data={data} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 h-10 bg-panel border-t border-border flex items-center justify-center">
        <p className="text-xs text-muted">Customer Display — Odoo Cafe POS</p>
      </footer>
    </div>
  )
}
