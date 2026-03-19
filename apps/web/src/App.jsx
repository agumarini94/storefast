import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { TenantProvider } from './context/TenantContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import CatalogPage from './pages/catalog/CatalogPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import StoreSelectorPage from './pages/dashboard/StoreSelectorPage';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import ProspectorMap from './pages/admin/ProspectorMap';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* Catálogo público */}
        <Route
          path="/tienda/:slug/*"
          element={
            <TenantProvider>
              <CatalogPage />
            </TenantProvider>
          }
        />

        {/* Dashboard (protegido) */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardProvider>
                <Routes>
                  <Route path="stores"    element={<StoreSelectorPage />} />
                  <Route path="*"         element={<DashboardLayout />} />
                </Routes>
              </DashboardProvider>
            </ProtectedRoute>
          }
        />

        {/* Super Admin — sin protección (solo para pruebas de diseño) */}
        <Route path="/admin/super-control" element={<SuperAdminDashboard />} />
        <Route path="/admin/prospector-map" element={<ProspectorMap />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
