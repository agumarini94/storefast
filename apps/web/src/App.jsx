import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { TenantProvider } from './context/TenantContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import CatalogPage from './pages/catalog/CatalogPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import StoreSelectorPage from './pages/dashboard/StoreSelectorPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

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

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
