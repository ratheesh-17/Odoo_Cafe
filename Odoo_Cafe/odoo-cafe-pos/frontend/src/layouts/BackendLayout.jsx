import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Package, Tag, CreditCard, Map, Ticket,
  Percent, Users, CalendarCheck, Tablet, BarChart2, Settings,
  LogOut, ChefHat, Coffee,
} from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { label: 'Session',        to: '/backend',            icon: Tablet,         end: true },
  { label: 'Dashboard',      to: '/backend/dashboard',  icon: LayoutDashboard },
  { label: 'Products',       to: '/backend/products',   icon: Package },
  { label: 'Categories',     to: '/backend/categories', icon: Tag },
  { label: 'Payment Methods',to: '/backend/payments',   icon: CreditCard },
  { label: 'Floor & Tables', to: '/backend/floors',     icon: Map },
  { label: 'Coupons',        to: '/backend/coupons',    icon: Ticket },
  { label: 'Promotions',     to: '/backend/promotions', icon: Percent },
  { label: 'Employees',      to: '/backend/employees',  icon: Users },
  { label: 'Bookings',       to: '/backend/bookings',   icon: CalendarCheck },
  { label: 'Self Order',     to: '/backend/self-order', icon: Settings },
  { label: 'Reports',        to: '/backend/reports',    icon: BarChart2 },
]

export default function BackendLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-panel border-r border-border flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <Coffee size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Odoo Cafe</p>
            <p className="text-[10px] text-muted uppercase tracking-wider">POS System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {nav.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary-500/15 text-primary-400'
                  : 'text-muted hover:text-white hover:bg-white/5',
              )}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: POS link + user */}
        <div className="p-3 border-t border-border space-y-1">
          <NavLink
            to="/pos"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <ChefHat size={16} />
            Open POS Terminal
          </NavLink>
          <NavLink
            to="/kitchen"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <Tablet size={16} />
            Kitchen Display
          </NavLink>
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="w-7 h-7 rounded-full bg-primary-500/30 flex items-center justify-center text-primary-300 text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-muted capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
