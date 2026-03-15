import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import ProductsManager from './ProductsManager';
import ThemeEditor from './ThemeEditor';
import ContactEditor from './ContactEditor';

export default function DashboardLayout() {
  const { logout } = useAuth();
  const { activeStore, isLoading } = useDashboard();
  const navigate  = useNavigate();
  const location  = useLocation();

  const isThemeRoute = location.pathname.includes('/theme');

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

  if (!activeStore) {
    return <Navigate to="/dashboard/stores" replace />;
  }

  return (
    <div className={`bg-gray-50 flex flex-col ${isThemeRoute ? 'h-screen' : 'min-h-screen'}`}>
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <NavLink to="/dashboard/products"
              className={({ isActive }) =>
                `text-sm font-semibold pb-1 border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`
              }>
              Productos
            </NavLink>
            <NavLink to="/dashboard/theme"
              className={({ isActive }) =>
                `text-sm font-semibold pb-1 border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`
              }>
              🎨 Apariencia
            </NavLink>
            <NavLink to="/dashboard/contact"
              className={({ isActive }) =>
                `text-sm font-semibold pb-1 border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`
              }>
              Contacto
            </NavLink>
          </div>

          <div className="flex items-center gap-2">
            <a href={`/tienda/${activeStore.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1.5 rounded-lg hover:bg-primary/20 transition-colors font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ver tienda
            </a>
            <button onClick={() => navigate('/dashboard/stores')}
              className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg max-w-[100px] truncate hover:bg-gray-200 transition-colors"
              title={activeStore.name}>
              {activeStore.name}
            </button>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Main — full-width for theme editor, contained for others */}
      <main className={isThemeRoute ? 'flex-1 overflow-hidden' : 'max-w-lg mx-auto w-full px-4 py-6'}>
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
