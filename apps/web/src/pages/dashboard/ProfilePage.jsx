import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { apiClient } from '../../utils/apiClient';

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white';
const LABEL = 'block text-xs font-semibold text-gray-500 mb-1';

function slugify(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 60) || 'tienda';
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
      ${type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { activeStore, refetchStores } = useDashboard();

  // ── Account form ──────────────────────────────────────────────
  const [profile, setProfile] = useState({
    firstName: user?.first_name || '',
    lastName:  user?.last_name  || '',
    phone:     user?.phone      || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Store info form ───────────────────────────────────────────
  const [storeName,   setStoreName]   = useState(activeStore?.name || '');
  const [updateSlug,  setUpdateSlug]  = useState(false);
  const [slugPreview, setSlugPreview] = useState('');
  const [storeLoading, setStoreLoading] = useState(false);

  useEffect(() => {
    if (activeStore) setStoreName(activeStore.name);
  }, [activeStore]);

  useEffect(() => {
    setSlugPreview(slugify(storeName));
  }, [storeName]);

  // ── Change password form ──────────────────────────────────────
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Handlers ─────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfile(profile);
      showToast('Perfil actualizado correctamente.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al actualizar el perfil.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleStoreSave = async (e) => {
    e.preventDefault();
    if (!activeStore) return;
    setStoreLoading(true);
    try {
      const jwt = localStorage.getItem('token');
      await apiClient.patch(`/stores/${activeStore.id}/info`, { name: storeName, updateSlug }, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      // Refresh store list so sidebar shows new name/slug
      await refetchStores();
      showToast('Tienda actualizada correctamente.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al actualizar la tienda.', 'error');
    } finally {
      setStoreLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) { showToast('Las contraseñas nuevas no coinciden.', 'error'); return; }
    if (pwd.next.length < 6)     { showToast('La nueva contraseña debe tener al menos 6 caracteres.', 'error'); return; }
    setPwdLoading(true);
    try {
      await changePassword(pwd.current, pwd.next);
      setPwd({ current: '', next: '', confirm: '' });
      showToast('Contraseña actualizada correctamente.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Verificá tu contraseña actual.', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto px-4 py-6">
      <h2 className="text-lg font-bold text-gray-900">Mi Perfil</h2>

      {/* ── Información de la cuenta ── */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">👤</span>
          <h3 className="font-semibold text-gray-800 text-sm">Información personal</h3>
        </div>

        <p className="text-xs text-gray-400">{user?.email} · <span className="capitalize">{user?.role?.replace('_', ' ')}</span></p>

        <form onSubmit={handleProfileSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Nombre</label>
              <input
                type="text" placeholder="Ej: Nicolás"
                value={profile.firstName}
                onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Apellido</label>
              <input
                type="text" placeholder="Ej: García"
                value={profile.lastName}
                onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>WhatsApp personal</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 font-mono shrink-0">+</span>
              <input
                type="tel" placeholder="972501234567"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                className={INPUT}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-opacity"
          >
            {profileLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </section>

      {/* ── Información de la tienda ── */}
      {activeStore && (
        <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <h3 className="font-semibold text-gray-800 text-sm">Información de la tienda</h3>
          </div>

          <form onSubmit={handleStoreSave} className="space-y-3">
            <div>
              <label className={LABEL}>Nombre de la tienda</label>
              <input
                type="text" placeholder="Ej: Accesorios Luna" required
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className={INPUT}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateSlug}
                onChange={e => setUpdateSlug(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-xs text-gray-600">Actualizar URL de la tienda</span>
            </label>

            {updateSlug && slugPreview && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                ⚠️ La URL cambiará a: <span className="font-mono font-semibold">storesfast.com/tienda/{slugPreview}</span>
                <br />
                <span className="text-gray-500">Los links anteriores dejarán de funcionar.</span>
              </p>
            )}

            {!updateSlug && (
              <p className="text-xs text-gray-400">
                URL actual: <span className="font-mono text-primary">storesfast.com/tienda/{activeStore.slug}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={storeLoading || !storeName.trim()}
              className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-opacity"
            >
              {storeLoading ? 'Guardando...' : 'Guardar tienda'}
            </button>
          </form>
        </section>
      )}

      {/* ── Seguridad ── */}
      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔐</span>
          <h3 className="font-semibold text-gray-800 text-sm">Seguridad</h3>
        </div>

        <form onSubmit={handlePasswordSave} className="space-y-3">
          <div>
            <label className={LABEL}>Contraseña actual</label>
            <input
              type="password" required
              value={pwd.current}
              onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
              className={INPUT}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Nueva contraseña</label>
              <input
                type="password" required minLength={6}
                value={pwd.next}
                onChange={e => setPwd(p => ({ ...p, next: e.target.value }))}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Repetir nueva</label>
              <input
                type="password" required minLength={6}
                value={pwd.confirm}
                onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
                className={INPUT}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pwdLoading}
            className="w-full bg-gray-800 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-opacity"
          >
            {pwdLoading ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
