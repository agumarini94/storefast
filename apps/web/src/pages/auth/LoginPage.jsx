import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Email o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">StoresFast</h1>
          <p className="text-gray-500 text-sm mt-1">Tu tienda online en minutos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {error && (
              <p className="text-red-500 text-xs text-center bg-red-50 rounded-xl py-2 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60 transition-opacity"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <p className="text-center">
              <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </form>

          <div className="border-t border-gray-100 pt-3 text-center">
            <p className="text-xs text-gray-500">
              ¿No tenés cuenta?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Creá tu tienda gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
