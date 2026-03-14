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

  const { data: store, isLoading } = useQuery({
    queryKey: ['store', slug],
    queryFn: () => fetchStore(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (!store?.theme) return;
    const root = document.documentElement;
    if (store.theme.primary_color)   root.style.setProperty('--color-primary',   store.theme.primary_color);
    if (store.theme.secondary_color) root.style.setProperty('--color-secondary', store.theme.secondary_color);
    if (store.theme.font)            root.style.setProperty('--font-main',        store.theme.font);
  }, [store?.theme]);

  if (isLoading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;

  return (
    <TenantContext.Provider value={store}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
