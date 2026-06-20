import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usePosStore } from '../store/posStore'
import { ShoppingCart, List, Users, LayoutGrid, Coffee, LogOut, Settings } from 'lucide-react'

export default function PosLayout() {
  const { user, logout } = useAuthStore()
  const { activeTable, activeOrder } = usePosStore()
  const navigate = useNavigate()

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
          <NavLink to="/pos" end
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
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {activeTable && (
            <span className="px-3 py-1 rounded-lg bg-primary-500/15 text-primary-400 text-xs font-semibold">
              Table {activeTable.table_number}
            </span>
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
            onClick={() => { logout(); navigate('/login') }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-red-400 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
