import { clsx } from 'clsx'
import { AlertTriangle, Inbox } from 'lucide-react'

export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray:   'bg-white/10 text-white/70',
    green:  'bg-emerald-500/15 text-emerald-400',
    yellow: 'bg-yellow-500/15 text-yellow-400',
    red:    'bg-red-500/15 text-red-400',
    blue:   'bg-blue-500/15 text-blue-400',
    purple: 'bg-primary-500/15 text-primary-400',
    orange: 'bg-orange-500/15 text-orange-400',
  }
  return (
    <span className={clsx('badge', colors[color] || colors.gray)}>
      {children}
    </span>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <svg
      className="animate-spin text-primary-400"
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  )
}

export function EmptyState({ title = 'No data', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Inbox size={24} className="text-muted" />
      </div>
      <p className="font-semibold text-white/80">{title}</p>
      {description && <p className="text-sm text-muted mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl animate-slide-up p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-muted mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-ghost text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={clsx(
        'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
        enabled ? 'bg-primary-500' : 'bg-white/20',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      <span
        className={clsx(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200',
          enabled ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

export function StatCard({ label, value, sub, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-500/15 text-primary-400',
    green:   'bg-emerald-500/15 text-emerald-400',
    yellow:  'bg-yellow-500/15 text-yellow-400',
    blue:    'bg-blue-500/15 text-blue-400',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colors[color])}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}
