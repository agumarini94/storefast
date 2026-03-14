import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';

export default function StoreSelectorPage() {
  const { stores, setActiveStore, authApi } = useDashboard();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [showForm, setShowForm]   = useState(false);
  const [name,     setName]       = useState('');
  const [slug,     setSlug]       = useState('');
  const [error,    setError]      = useState('');

  // Auto-genera slug desde el nombre
  const handleNameChange = (val) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const createMutation = useMutation({
    mutationFn: () => authApi().post('/stores', { name, slug }),
    onSuccess: ({ data: newStore }) => {
      queryClient.invalidateQueries(['my-stores']);
      setActiveStore(newStore);
      navigate('/dashboard/products');
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Error al crear la tienda');
    },
  });

  const selectStore = (store) => {
    setActiveStore(store);
    navigate('/dashboard/products');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Mis Tiendas</h1>
          <p className="text-gray-500 text-sm mt-1">Seleccioná una tienda para gestionar</p>
        </div>

        {/* Lista de tiendas existentes */}
        {stores.length > 0 && (
          <div className="space-y-2">
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => selectStore(store)}
                className="w-full bg-white rounded-xl p-4 shadow-sm text-left flex items-center justify-between hover:ring-2 hover:ring-primary transition-all"
              >
                <div>
                  <p className="font-semibold text-gray-900">{store.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">/{store.slug}</p>
                </div>
                <span className="text-primary text-lg">›</span>
              </button>
            ))}
          </div>
        )}

        {/* Crear nueva tienda */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm font-semibold text-gray-500 hover:border-primary hover:text-primary transition-colors"
          >
            + Crear nueva tienda
          </button>
        ) : (
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">Nueva tienda</h3>

            <input
              type="text"
              placeholder="Nombre (ej: Ropa María)"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div>
              <input
                type="text"
                placeholder="slug (ej: ropa-maria)"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tu catálogo estará en: /tienda/<strong>{slug || '...'}</strong>
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 rounded-lg py-2 px-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setError(''); }}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!name || !slug || createMutation.isPending}
                className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
