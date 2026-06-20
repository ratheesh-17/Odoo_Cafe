import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import RoleBasedRoute from "./components/RoleBasedRoute";
import { isAuthenticated, getUserRole } from "./auth";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

import BackendLayout from "./layouts/BackendLayout";
import SessionPage from "./pages/backend/SessionPage";
import DashboardPage from "./pages/backend/DashboardPage";
import ProductsPage from "./pages/backend/ProductsPage";
import CategoriesPage from "./pages/backend/CategoriesPage";
import PaymentMethodsPage from "./pages/backend/PaymentMethodsPage";
import FloorsPage from "./pages/backend/FloorsPage";
import CouponPromotionPage from "./pages/backend/CouponPromotionPage";
import EmployeesPage from "./pages/backend/EmployeesPage";
import BookingsPage from "./pages/backend/BookingsPage";
import SelfOrderConfigPage from "./pages/backend/SelfOrderConfigPage";
import ReportsPage from "./pages/backend/ReportsPage";

import PosLayout from "./layouts/PosLayout";
import OrderViewPage from "./pages/pos/OrderViewPage";
import OrdersListPage from "./pages/pos/OrdersListPage";
import CustomersPage from "./pages/pos/CustomersPage";
import TableViewPage from "./pages/pos/TableViewPage";

import KitchenPage from "./pages/kitchen/KitchenPage";
import SelfOrderPage from "./pages/SelfOrderPage";
import CustomerDisplayPage from "./pages/CustomerDisplayPage";
import NotFoundPage from "./pages/NotFoundPage";

import "./App.css";

function RootRedirect() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const role = getUserRole();
  return <Navigate to={role === "employee" ? "/pos" : "/backend"} replace />;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e1e2e",
            color: "#fff",
            border: "1px solid #3a3a5c",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Backend - Admin only */}
        <Route path="/backend" element={<RoleBasedRoute allowedRoles={["admin"]}><BackendLayout /></RoleBasedRoute>}>
          <Route index element={<SessionPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="payments" element={<PaymentMethodsPage />} />
          <Route path="floors" element={<FloorsPage />} />
          <Route path="coupons" element={<CouponPromotionPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="self-order" element={<SelfOrderConfigPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        {/* POS Terminal - Employee or Admin */}
        <Route path="/pos" element={<RoleBasedRoute allowedRoles={["admin", "employee"]}><PosLayout /></RoleBasedRoute>}>
          <Route index element={<Navigate to="order" replace />} />
          <Route path="order" element={<OrderViewPage />} />
          <Route path="orders" element={<OrdersListPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="tables" element={<TableViewPage />} />
        </Route>

        {/* Public screens */}
        <Route path="/kitchen" element={<KitchenPage />} />
        <Route path="/s/:token" element={<SelfOrderPage />} />
        <Route path="/customer-display" element={<CustomerDisplayPage />} />

        {/* Redirects */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
