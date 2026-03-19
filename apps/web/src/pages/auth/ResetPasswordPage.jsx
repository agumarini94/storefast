import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-sm w-full text-center space-y-3">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm text-gray-700">Enlace inválido o expirado.</p>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6)  { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Token inválido o expirado. Solicitá un nuevo enlace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">StoresFast</h1>
          <p className="text-gray-500 text-sm mt-1">Nueva contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {success ? (
            <div className="text-center space-y-3 py-4">
              <div className="text-5xl">✅</div>
              <p className="text-sm font-semibold text-gray-800">¡Contraseña actualizada!</p>
              <p className="text-xs text-gray-500">Redirigiendo al login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="password"
                placeholder="Repetir contraseña"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {error && (
                <p className="text-red-500 text-xs text-center bg-red-50 rounded-lg py-2 px-3">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
              <p className="text-center">
                <Link to="/login" className="text-xs text-gray-400 hover:underline">
                  ← Volver al login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
