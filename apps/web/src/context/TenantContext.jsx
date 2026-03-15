import { createContext, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';

const TenantContext = createContext(null);

async function fetchStore(slug) {
  const { data } = await apiClient.get(`/stores/public/${slug}`);
  return data;
}

export function TenantProvider({ children }) {
  const { slug } = useParams();

  const { data: store, isLoading, isError } = useQuery({
    queryKey: ['store', slug],
    queryFn: () => fetchStore(slug),
    enabled: !!slug,
    retry: 1,
  });

  useEffect(() => {
    if (!store?.theme) return;
    const root = document.documentElement;
    if (store.theme.primary_color)   root.style.setProperty('--color-primary',   store.theme.primary_color);
    if (store.theme.secondary_color) root.style.setProperty('--color-secondary', store.theme.secondary_color);
    // Wrap font name in quotes so CSS font-family handles multi-word names (e.g. "Playfair Display")
    if (store.theme.font)            root.style.setProperty('--font-main',        `'${store.theme.font}'`);
  }, [store?.theme]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center text-gray-400">
          <div className="text-4xl animate-pulse mb-3">🛍️</div>
          <p className="text-sm">Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (isError || !store) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center text-gray-400 px-6">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-lg font-bold text-gray-700 mb-1">Tienda no encontrada</h2>
          <p className="text-sm">No existe ninguna tienda con el slug <code className="bg-gray-100 px-1 rounded text-gray-600">"{slug}"</code></p>
          <p className="text-xs mt-3 text-gray-400">Verificá que la URL sea correcta.</p>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={store}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
