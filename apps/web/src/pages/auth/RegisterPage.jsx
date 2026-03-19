import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function slugify(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 60);
}

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow';
const LABEL = 'block text-xs font-semibold text-gray-500 mb-1';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '972', storeName: '', password: '', confirm: '',
  });
  const [slugPreview, setSlugPreview] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    setSlugPreview(slugify(form.storeName));
  }, [form.storeName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email:     form.email,
        password:  form.password,
        firstName: form.firstName,
        lastName:  form.lastName,
        phone:     form.phone,
        storeName: form.storeName,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error, intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">StoresFast</h1>
          <p className="text-gray-500 text-sm mt-1">Creá tu tienda online en minutos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Crear cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Nombre *</label>
                <input
                  type="text" placeholder="Ej: Nicolás" required
                  value={form.firstName} onChange={set('firstName')}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Apellido *</label>
                <input
                  type="text" placeholder="Ej: García" required
                  value={form.lastName} onChange={set('lastName')}
                  className={INPUT}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={LABEL}>Email *</label>
              <input
                type="email" placeholder="tucorreo@email.com" required
                value={form.email} onChange={set('email')}
                className={INPUT}
              />
            </div>

            {/* WhatsApp con prefijo */}
            <div>
              <label className={LABEL}>WhatsApp de la Tienda *</label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 font-mono shrink-0">
                  +
                </span>
                <input
                  type="tel" placeholder="972501234567" required
                  value={form.phone} onChange={set('phone')}
                  className={INPUT}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Incluí el código de país. Ej: 972501234567 (Israel)
              </p>
            </div>

            {/* Nombre de la Tienda */}
            <div>
              <label className={LABEL}>Nombre de la Tienda *</label>
              <input
                type="text" placeholder="Ej: Accesorios Luna" required
                value={form.storeName} onChange={set('storeName')}
                className={INPUT}
              />
              {slugPreview && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <span className="text-gray-300">🔗</span>
                  <span>Tu URL: <span className="font-mono text-primary">storesfast.com/tienda/<strong>{slugPreview}</strong></span></span>
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Contraseña *</label>
                <input
                  type="password" placeholder="Mín. 6 caracteres" required minLength={6}
                  value={form.password} onChange={set('password')}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Repetir contraseña *</label>
                <input
                  type="password" placeholder="Igual que arriba" required minLength={6}
                  value={form.confirm} onChange={set('confirm')}
                  className={INPUT}
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center bg-red-50 rounded-xl py-2.5 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !form.storeName || !form.firstName || !form.email}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60 transition-opacity shadow-sm"
            >
              {loading ? 'Creando tu tienda…' : '🚀 Crear mi tienda'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
