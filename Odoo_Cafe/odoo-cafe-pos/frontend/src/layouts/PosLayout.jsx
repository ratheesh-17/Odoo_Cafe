import { useEffect, useState, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usePosStore } from '../store/posStore'
import {
  ShoppingCart, List, LayoutGrid, Coffee,
  LogOut, Settings, Users, RefreshCw,
} from 'lucide-react'
import { Spinner } from '../components/ui'
import api from '../lib/api'

// ── Table card ────────────────────────────────────────────────────────────────

function TableCard({ table, hasOrder, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 transition-all hover:scale-105 active:scale-95 ${
        hasOrder
          ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/15'
          : 'border-border bg-white/5 hover:bg-white/10'
      }`}
    >
      {hasOrder && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
        hasOrder ? 'bg-emerald-500/20' : 'bg-white/10'
      }`}>
        <LayoutGrid size={18} className={hasOrder ? 'text-emerald-400' : 'text-muted'} />
      </div>
      <p className={`text-sm font-bold ${hasOrder ? 'text-emerald-300' : 'text-white'}`}>
        {table.table_number}
      </p>
      <p className="text-[10px] text-muted mt-0.5">{table.seats} seats</p>
      {hasOrder && (
        <p className="text-[10px] text-emerald-400 mt-1 font-medium">Active Order</p>
      )}
      {!table.is_active && (
        <p className="text-[10px] text-red-400 mt-1">Inactive</p>
      )}
    </button>
  )
}

// ── Floor popup ───────────────────────────────────────────────────────────────

function FloorPopup({ onClose }) {
  const [floors, setFloors] = useState([])
  const [activeOrderTableIds, setActiveOrderTableIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const { setActiveTable, createOrder, session, activeOrder, setActiveOrder } = usePosStore()
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [floorsData, ordersData] = await Promise.all([
        api.get('/floors').then(r => r.data),
        session
          ? api.get(`/orders?session_id=${session.id}&status=draft`).then(r => r.data).catch(() => [])
          : Promise.resolve([]),
      ])
      setFloors(floorsData)
      const tableIds = new Set(
        ordersData.filter(o => o.table).map(o => o.table.id)
      )
      setActiveOrderTableIds(tableIds)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  const handleTableClick = async (table) => {
    if (!table.is_active) return
    setActiveTable(table)

    // check if there's already a draft order for this table in the session
    try {
      const orders = session
        ? await api.get(`/orders?session_id=${session.id}&status=draft`).then(r => r.data)
        : []
      const existing = orders.find(o => o.table?.id === table.id)
      if (existing) {
        setActiveOrder(existing)
      } else {
        await createOrder(table.id)
      }
    } catch {
      await createOrder(table.id)
    }

    onClose()
    navigate('/pos/order')
  }

  const handleNoTable = async () => {
    setActiveTable(null)
    if (!activeOrder) {
      await createOrder(null)
    }
    onClose()
    navigate('/pos/order')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-panel border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">Select a Table</h2>
            <p className="text-xs text-muted mt-0.5">
              {session ? `Session #${session.id} · ${session.opened_by?.name}` : 'No active session'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors">
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleNoTable}
              className="btn-ghost text-sm"
            >
              No Table / Takeaway
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Spinner size={28} />
            </div>
          ) : floors.length === 0 ? (
            <p className="text-center text-muted py-12 text-sm">No floors configured. Add floors in the backend.</p>
          ) : (
            <div className="space-y-6">
              {floors.map(floor => (
                <div key={floor.id}>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                    {floor.name}
                  </p>
                  {floor.tables.length === 0 ? (
                    <p className="text-xs text-muted">No tables on this floor.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {floor.tables.map(table => (
                        <TableCard
                          key={table.id}
                          table={table}
                          hasOrder={activeOrderTableIds.has(table.id)}
                          onClick={() => handleTableClick(table)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── POS Layout ────────────────────────────────────────────────────────────────

export default function PosLayout() {
  const { user, logout } = useAuthStore()
  const { activeTable, activeOrder, session, fetchSession } = usePosStore()
  const navigate = useNavigate()
  const [showFloor, setShowFloor] = useState(false)
  const [sessionLoaded, setSessionLoaded] = useState(false)

  useEffect(() => {
    fetchSession()
      .then(s => {
        setSessionLoaded(true)
        // open floor popup on entry if no active order/table
        if (s && !activeOrder) setShowFloor(true)
      })
      .catch(() => setSessionLoaded(true))
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 h-14 bg-panel border-b border-border flex items-center px-4 gap-2">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
            <Coffee size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">Odoo Cafe POS</span>
        </div>

        <nav className="flex items-center gap-1">
          <button
            onClick={() => setShowFloor(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <LayoutGrid size={15} /> Table View
          </button>
          <NavLink to="/pos/order"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary-500/15 text-primary-400' : 'text-muted hover:text-white hover:bg-white/5'}`
            }
          >
            <ShoppingCart size={15} /> Order
          </NavLink>
          <NavLink to="/pos/orders"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary-500/15 text-primary-400' : 'text-muted hover:text-white hover:bg-white/5'}`
            }
          >
            <List size={15} /> Orders
          </NavLink>
          <NavLink to="/pos/customers"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary-500/15 text-primary-400' : 'text-muted hover:text-white hover:bg-white/5'}`
            }
          >
            <Users size={15} /> Customers
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {activeTable && (
            <button
              onClick={() => setShowFloor(true)}
              className="px-3 py-1 rounded-lg bg-primary-500/15 text-primary-400 text-xs font-semibold hover:bg-primary-500/25 transition-colors"
            >
              Table {activeTable.table_number}
            </button>
          )}
          {activeOrder && (
            <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold">
              {activeOrder.order_number}
            </span>
          )}
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-primary-500/30 flex items-center justify-center text-primary-300 text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-xs text-muted font-medium">{user?.name}</span>
          </div>
          <button
            onClick={() => navigate('/backend')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
            title="Backend"
          >
            <Settings size={15} />
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-red-400 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {showFloor && <FloorPopup onClose={() => setShowFloor(false)} />}
    </div>
  )
}
