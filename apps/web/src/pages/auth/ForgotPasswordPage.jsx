import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">StoresFast</h1>
          <p className="text-gray-500 text-sm mt-1">Recuperar contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {sent ? (
            <div className="text-center space-y-3 py-4">
              <div className="text-5xl">📬</div>
              <p className="text-sm font-semibold text-gray-800">¡Revisá tu email!</p>
              <p className="text-xs text-gray-500">
                Si tu dirección está registrada, te enviamos un enlace para restablecer tu contraseña.
              </p>
              <Link to="/login" className="block text-xs text-primary hover:underline mt-2">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
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
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
              <p className="text-center">
                <Link to="/login" className="text-xs text-gray-400 hover:underline">
                  ← Volver al login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
