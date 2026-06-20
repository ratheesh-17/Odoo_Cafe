import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag, DollarSign, TrendingUp,
  Package, Tag, CreditCard, Map, Ticket,
  Percent, Users, CalendarCheck, Settings,
  BarChart2, Tablet, RefreshCw,
} from 'lucide-react'
import { StatCard, PageLoader } from '../../components/ui'
import api from '../../lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `₹${parseFloat(n ?? 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const today = () => new Date().toISOString().slice(0, 10)

// ── Quick-link card ───────────────────────────────────────────────────────────

function QuickLink({ icon: Icon, label, description, to, color = 'primary' }) {
  const navigate = useNavigate()
  const colors = {
    primary: 'bg-primary-500/15 text-primary-400',
    green:   'bg-emerald-500/15 text-emerald-400',
    blue:    'bg-blue-500/15 text-blue-400',
    yellow:  'bg-yellow-500/15 text-yellow-400',
    purple:  'bg-purple-500/15 text-purple-400',
    orange:  'bg-orange-500/15 text-orange-400',
  }
  return (
    <button
      onClick={() => navigate(to)}
      className="card p-4 flex items-start gap-3 hover:bg-white/5 transition-colors text-left w-full"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        {description && <p className="text-xs text-muted mt-0.5 truncate">{description}</p>}
      </div>
    </button>
  )
}

// ── Quick links config ────────────────────────────────────────────────────────

const LINKS = [
  { icon: Package,       label: 'Products',        description: 'Manage menu items',          to: '/backend/products',   color: 'primary' },
  { icon: Tag,           label: 'Categories',       description: 'Organise menu sections',     to: '/backend/categories', color: 'blue'    },
  { icon: Map,           label: 'Floors & Tables',  description: 'Restaurant layout',          to: '/backend/floors',     color: 'green'   },
  { icon: Ticket,        label: 'Coupons',          description: 'Discount codes',             to: '/backend/coupons',    color: 'yellow'  },
  { icon: Percent,       label: 'Promotions',       description: 'Auto discounts',             to: '/backend/promotions', color: 'orange'  },
  { icon: CreditCard,    label: 'Payment Methods',  description: 'Cash, Card, UPI',            to: '/backend/payments',   color: 'purple'  },
  { icon: Users,         label: 'Employees',        description: 'Staff accounts & roles',     to: '/backend/employees',  color: 'blue'    },
  { icon: CalendarCheck, label: 'Bookings',         description: 'Table reservations',         to: '/backend/bookings',   color: 'green'   },
  { icon: Settings,      label: 'Self Order',       description: 'Customer kiosk config',      to: '/backend/self-order', color: 'primary' },
  { icon: BarChart2,     label: 'Reports',          description: 'Sales analytics',            to: '/backend/reports',    color: 'yellow'  },
  { icon: Tablet,        label: 'POS Session',      description: 'Open / close session',       to: '/backend',            color: 'orange'  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshedAt, setRefreshedAt] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const t = today()
      const { data } = await api.get(
        `/reports/dashboard?date_from=${t}&date_to=${t}`
      )
      setSummary(data.summary)
      setRefreshedAt(new Date())
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">
            Today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 btn-ghost text-sm disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Metric cards */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Today's Orders"
            value={summary?.total_orders ?? 0}
            sub="Paid orders today"
            icon={ShoppingBag}
            color="primary"
          />
          <StatCard
            label="Today's Revenue"
            value={fmt(summary?.revenue ?? 0)}
            sub={`Discount ${fmt(summary?.total_discount ?? 0)} · Tax ${fmt(summary?.total_tax ?? 0)}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            label="Avg Order Value"
            value={fmt(summary?.avg_order_value ?? 0)}
            sub={refreshedAt ? `Updated ${refreshedAt.toLocaleTimeString()}` : ''}
            icon={TrendingUp}
            color="blue"
          />
        </div>
      )}

      {/* Quick links */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Quick Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {LINKS.map((l) => (
            <QuickLink key={l.to} {...l} />
          ))}
        </div>
      </div>
    </div>
  )
}
