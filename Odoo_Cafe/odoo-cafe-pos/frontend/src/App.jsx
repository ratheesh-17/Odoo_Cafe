import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import LoginPage       from './pages/LoginPage'
import SignupPage      from './pages/SignupPage'
import BackendLayout   from './layouts/BackendLayout'
import PosLayout       from './layouts/PosLayout'

import DashboardPage        from './pages/backend/DashboardPage'
import ProductsPage         from './pages/backend/ProductsPage'
import CategoriesPage       from './pages/backend/CategoriesPage'
import PaymentMethodsPage   from './pages/backend/PaymentMethodsPage'
import FloorsPage           from './pages/backend/FloorsPage'
import CouponsPage          from './pages/backend/CouponsPage'
import PromotionsPage       from './pages/backend/PromotionsPage'
import EmployeesPage        from './pages/backend/EmployeesPage'
import BookingsPage         from './pages/backend/BookingsPage'
import SessionPage          from './pages/backend/SessionPage'
import SelfOrderConfigPage  from './pages/backend/SelfOrderConfigPage'
import ReportsPage          from './pages/backend/ReportsPage'

import PosTerminal     from './pages/pos/PosTerminal'
import OrdersListPage  from './pages/pos/OrdersListPage'
import KitchenPage     from './pages/kitchen/KitchenPage'

function RequireAuth({ children, role }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (role && user && user.role !== role && user.role !== 'admin') return <Navigate to="/backend" replace />
  return children
}

function RequireGuest({ children }) {
  const { token } = useAuthStore()
  if (token) return <Navigate to="/backend" replace />
  return children
}

export default function App() {
  const { token, fetchMe } = useAuthStore()

  useEffect(() => {
    if (token) fetchMe()
  }, [token])

  return (
    <Routes>
      <Route path="/login"  element={<RequireGuest><LoginPage /></RequireGuest>} />
      <Route path="/signup" element={<RequireGuest><SignupPage /></RequireGuest>} />

      <Route path="/backend" element={<RequireAuth><BackendLayout /></RequireAuth>}>
        <Route index              element={<SessionPage />} />
        <Route path="dashboard"   element={<DashboardPage />} />
        <Route path="products"    element={<ProductsPage />} />
        <Route path="categories"  element={<CategoriesPage />} />
        <Route path="payments"    element={<PaymentMethodsPage />} />
        <Route path="floors"      element={<FloorsPage />} />
        <Route path="coupons"     element={<CouponsPage />} />
        <Route path="promotions"  element={<PromotionsPage />} />
        <Route path="employees"   element={<EmployeesPage />} />
        <Route path="bookings"    element={<BookingsPage />} />
        <Route path="self-order"  element={<SelfOrderConfigPage />} />
        <Route path="reports"     element={<ReportsPage />} />
      </Route>

      <Route path="/pos" element={<RequireAuth><PosLayout /></RequireAuth>}>
        <Route index          element={<PosTerminal />} />
        <Route path="orders"  element={<OrdersListPage />} />
      </Route>

      <Route path="/kitchen" element={<KitchenPage />} />

      <Route path="/" element={<Navigate to="/backend" replace />} />
      <Route path="*" element={<Navigate to="/backend" replace />} />
    </Routes>
  )
}
