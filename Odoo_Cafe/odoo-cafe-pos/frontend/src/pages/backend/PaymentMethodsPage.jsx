import { useEffect, useState, useRef } from 'react'
import { Banknote, CreditCard, QrCode, Check, Pencil } from 'lucide-react'
import { PageLoader, Toggle } from '../../components/ui'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const META = {
  cash: {
    label: 'Cash',
    description: 'Accept physical cash payments at the counter.',
    icon: Banknote,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
  },
  card: {
    label: 'Card / Digital',
    description: 'Accept debit and credit card payments via POS terminal.',
    icon: CreditCard,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
  },
  upi: {
    label: 'UPI QR',
    description: 'Display a UPI QR code for customers to scan and pay.',
    icon: QrCode,
    color: 'text-primary-400',
    bg: 'bg-primary-500/15',
  },
}

function UpiIdField({ upiId, onSave, disabled }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(upiId ?? '')
  const inputRef = useRef(null)

  useEffect(() => { setValue(upiId ?? '') }, [upiId])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = () => {
    const trimmed = value.trim()
    if (!trimmed) { toast.error('UPI ID cannot be empty'); return }
    if (trimmed === upiId) { setEditing(false); return }
    onSave(trimmed)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') { setValue(upiId ?? ''); setEditing(false) }
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">UPI ID</p>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="input flex-1 text-sm"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            placeholder="yourname@upi"
            disabled={disabled}
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); commit() }}
            className="p-1.5 rounded-lg bg-primary-500/15 text-primary-400 hover:bg-primary-500/30 transition-colors"
          >
            <Check size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <span className={clsx('text-sm flex-1', value ? 'text-white' : 'text-muted italic')}>
            {value || 'Not configured'}
          </span>
          <button
            onClick={() => setEditing(true)}
            disabled={disabled}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-muted hover:text-white transition-all"
          >
            <Pencil size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

function PaymentCard({ method, onToggle, onUpiSave, toggling }) {
  const meta = META[method.type]
  const Icon = meta.icon

  return (
    <div className={clsx(
      'card p-6 transition-opacity',
      !method.is_enabled && 'opacity-60',
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', meta.bg)}>
            <Icon size={20} className={meta.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white">{meta.label}</p>
              {method.is_enabled
                ? <span className="badge bg-emerald-500/15 text-emerald-400">Enabled</span>
                : <span className="badge bg-white/10 text-muted">Disabled</span>
              }
            </div>
            <p className="text-sm text-muted mt-0.5">{meta.description}</p>
          </div>
        </div>
        <Toggle
          enabled={method.is_enabled}
          onChange={(val) => onToggle(method.type, val)}
          disabled={toggling === method.type}
        />
      </div>

      {method.type === 'upi' && (
        <UpiIdField
          upiId={method.upi_id}
          onSave={(id) => onUpiSave(id)}
          disabled={!method.is_enabled}
        />
      )}
    </div>
  )
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null) // type string while saving

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/payment-methods')
      // ensure consistent order: cash → card → upi
      const order = ['cash', 'card', 'upi']
      setMethods(data.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type)))
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const patch = async (type, payload, successMsg) => {
    setToggling(type)
    try {
      const { data } = await api.put(`/payment-methods/${type}`, payload)
      setMethods((prev) => prev.map((m) => (m.type === type ? data : m)))
      toast.success(successMsg)
    } catch {
    } finally {
      setToggling(null)
    }
  }

  const handleToggle = (type, value) =>
    patch(type, { is_enabled: value }, value ? `${META[type].label} enabled` : `${META[type].label} disabled`)

  const handleUpiSave = (upiId) =>
    patch('upi', { upi_id: upiId }, 'UPI ID saved')

  if (loading) return <PageLoader />

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Payment Methods</h1>
        <p className="text-sm text-muted mt-0.5">Enable or disable payment options available at checkout</p>
      </div>

      <div className="space-y-4">
        {methods.map((method) => (
          <PaymentCard
            key={method.type}
            method={method}
            onToggle={handleToggle}
            onUpiSave={handleUpiSave}
            toggling={toggling}
          />
        ))}
      </div>
    </div>
  )
}
