import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import ProductsManager from './ProductsManager';
import ThemeEditor from './ThemeEditor';
import ContactEditor from './ContactEditor';

export default function DashboardLayout() {
  const { logout } = useAuth();
  const { activeStore, isLoading } = useDashboard();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    );
  }

  // Si no hay tienda activa, redirigir al selector
  if (!activeStore) {
    return <Navigate to="/dashboard/stores" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav Mobile-First */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <NavLink
              to="/dashboard/products"
              className={({ isActive }) =>
                `text-sm font-semibold pb-1 border-b-2 transition-colors ${
                  isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500'
                }`
              }
            >
              Productos
            </NavLink>
            <NavLink
              to="/dashboard/theme"
              className={({ isActive }) =>
                `text-sm font-semibold pb-1 border-b-2 transition-colors ${
                  isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500'
                }`
              }
            >
              Apariencia
            </NavLink>
            <NavLink
              to="/dashboard/contact"
              className={({ isActive }) =>
                `text-sm font-semibold pb-1 border-b-2 transition-colors ${
                  isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500'
                }`
              }
            >
              Contacto
            </NavLink>
          </div>

          <div className="flex items-center gap-3">
            {/* Store switcher */}
            <button
              onClick={() => navigate('/dashboard/stores')}
              className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg max-w-[120px] truncate hover:bg-gray-200 transition-colors"
              title={activeStore.name}
            >
              {activeStore.name}
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-6">
        <Routes>
          <Route path="products" element={<ProductsManager />} />
          <Route path="theme"    element={<ThemeEditor />} />
          <Route path="contact"  element={<ContactEditor />} />
          <Route path="*"        element={<Navigate to="products" replace />} />
        </Routes>
      </main>
    </div>
  );
}
