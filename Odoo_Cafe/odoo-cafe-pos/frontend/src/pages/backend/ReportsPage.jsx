import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { ShoppingBag, DollarSign, TrendingUp, FileDown, Sheet } from 'lucide-react'
import { Table, Th, Td, Tr } from '../../components/DataTable'
import { PageLoader, StatCard } from '../../components/ui'
import api from '../../lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) => `₹${parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function buildQueryString(filters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
  return params.toString()
}

// ── Filter select ─────────────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">{label}</span>
      <select
        className="input text-sm py-1.5 min-w-[140px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'revenue' ? fmt(p.value) : `${p.value} orders`}
        </p>
      ))}
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }) {
  return <h2 className="text-sm font-semibold text-white mb-3">{children}</h2>
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: 'All Time',    value: '' },
  { label: 'Today',       value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days',value: '30d' },
  { label: 'This Month',  value: 'month' },
]

function periodToDates(period) {
  const now = new Date()
  const fmt = (d) => d.toISOString().slice(0, 10)
  const today = fmt(now)
  if (period === 'today')  return { date_from: today, date_to: today }
  if (period === '7d')     return { date_from: fmt(new Date(now - 6 * 86400000)), date_to: today }
  if (period === '30d')    return { date_from: fmt(new Date(now - 29 * 86400000)), date_to: today }
  if (period === 'month')  {
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    return { date_from: fmt(first), date_to: today }
  }
  return { date_from: '', date_to: '' }
}

export default function ReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null) // 'pdf' | 'xls'

  // filter options lists
  const [employees, setEmployees] = useState([])
  const [sessions, setSessions] = useState([])
  const [products, setProducts] = useState([])

  // filter state
  const [period, setPeriod] = useState('30d')
  const [employeeId, setEmployeeId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [productId, setProductId] = useState('')

  // load filter options once
  useEffect(() => {
    Promise.all([
      api.get('/users').then((r) => r.data).catch(() => []),
      api.get('/sessions').then((r) => r.data).catch(() => []),
      api.get('/products').then((r) => r.data).catch(() => []),
    ]).then(([u, s, p]) => {
      setEmployees(u)
      setSessions(s)
      setProducts(p)
    })
  }, [])

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const dates = periodToDates(period)
      const qs = buildQueryString({
        date_from: dates.date_from,
        date_to: dates.date_to,
        employee_id: employeeId,
        session_id: sessionId,
        product_id: productId,
      })
      const { data: d } = await api.get(`/reports/dashboard${qs ? `?${qs}` : ''}`)
      setData(d)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [period, employeeId, sessionId, productId])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const handleExport = async (type) => {
    setExporting(type)
    try {
      const dates = periodToDates(period)
      const qs = buildQueryString({
        date_from: dates.date_from,
        date_to: dates.date_to,
        employee_id: employeeId,
        session_id: sessionId,
        product_id: productId,
      })
      const resp = await api.get(`/reports/export/${type}${qs ? `?${qs}` : ''}`, {
        responseType: 'blob',
      })
      const mime = type === 'pdf' ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const ext = type === 'pdf' ? 'pdf' : 'xlsx'
      const url = URL.createObjectURL(new Blob([resp.data], { type: mime }))
      const a = document.createElement('a')
      a.href = url
      a.download = `sales_report.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
    } finally {
      setExporting(null) }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-sm text-muted mt-0.5">Sales analytics and performance overview</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            <FileDown size={14} />
            {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            onClick={() => handleExport('xls')}
            disabled={!!exporting}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            <Sheet size={14} />
            {exporting === 'xls' ? 'Exporting…' : 'Export XLS'}
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="card p-4 flex flex-wrap gap-4 items-end">
        <FilterSelect label="Period" value={period} onChange={setPeriod}>
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </FilterSelect>
        <FilterSelect label="Employee" value={employeeId} onChange={setEmployeeId}>
          <option value="">All Employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </FilterSelect>
        <FilterSelect label="Session" value={sessionId} onChange={setSessionId}>
          <option value="">All Sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              #{s.id} — {s.opened_by?.name} ({s.status})
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Product" value={productId} onChange={setProductId}>
          <option value="">All Products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </FilterSelect>
      </div>

      {loading ? <PageLoader /> : data && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Orders"
              value={data.summary.total_orders}
              icon={ShoppingBag}
              color="primary"
            />
            <StatCard
              label="Revenue"
              value={fmt(data.summary.revenue)}
              sub={`Discount: ${fmt(data.summary.total_discount)} · Tax: ${fmt(data.summary.total_tax)}`}
              icon={DollarSign}
              color="green"
            />
            <StatCard
              label="Avg Order Value"
              value={fmt(data.summary.avg_order_value)}
              icon={TrendingUp}
              color="blue"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales trend */}
            <div className="card p-5 lg:col-span-2">
              <SectionHeading>Sales Trend</SectionHeading>
              {data.sales_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.sales_trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted">No data for this period</div>
              )}
            </div>

            {/* Top categories */}
            <div className="card p-5">
              <SectionHeading>Top Categories</SectionHeading>
              {data.top_categories.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.top_categories} layout="vertical" margin={{ top: 0, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <YAxis type="category" dataKey="category_name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={72} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {data.top_categories.map((entry) => (
                        <Cell key={entry.category_id} fill={entry.category_color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted">No data</div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div>
            <SectionHeading>Top Products</SectionHeading>
            <div className="card overflow-hidden">
              <Table>
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Product</Th>
                    <Th>Category</Th>
                    <Th>Qty Sold</Th>
                    <Th>Revenue</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_products.length > 0 ? data.top_products.map((p, i) => (
                    <Tr key={p.product_id}>
                      <Td className="text-muted">{i + 1}</Td>
                      <Td className="font-medium text-white">{p.product_name}</Td>
                      <Td className="text-muted">{p.category_name}</Td>
                      <Td className="text-muted">{p.quantity_sold}</Td>
                      <Td className="font-medium text-white">{fmt(p.revenue)}</Td>
                    </Tr>
                  )) : (
                    <Tr><Td colSpan={5} className="text-center text-muted py-8">No data</Td></Tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Top Orders */}
          <div>
            <SectionHeading>Top Orders</SectionHeading>
            <div className="card overflow-hidden">
              <Table>
                <thead>
                  <tr>
                    <Th>Order #</Th>
                    <Th>Employee</Th>
                    <Th>Customer</Th>
                    <Th>Paid At</Th>
                    <Th>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_orders.length > 0 ? data.top_orders.map((o) => (
                    <Tr key={o.order_id}>
                      <Td className="font-mono text-white">{o.order_number}</Td>
                      <Td className="text-muted">{o.employee_name}</Td>
                      <Td className="text-muted">{o.customer_name ?? '—'}</Td>
                      <Td className="text-muted text-xs">
                        {o.paid_at ? new Date(o.paid_at).toLocaleString() : '—'}
                      </Td>
                      <Td className="font-medium text-white">{fmt(o.total_amount)}</Td>
                    </Tr>
                  )) : (
                    <Tr><Td colSpan={5} className="text-center text-muted py-8">No data</Td></Tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
