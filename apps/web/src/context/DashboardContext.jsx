import { createContext, useContext, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '../utils/apiClient';
import { useAuth } from './AuthContext';

export const DashboardContext = createContext(null);

function authApi() {
  return authClient();
}

export function DashboardProvider({ children }) {
  const { token } = useAuth();

  // Tienda activa — persiste entre recargas
  const [activeStoreId, setActiveStoreIdState] = useState(
    () => localStorage.getItem('activeStoreId')
  );

  const { data: stores = [], isLoading, refetch: refetchStores } = useQuery({
    queryKey: ['my-stores', token],
    queryFn: async () => {
      const { data } = await authApi().get('/stores');
      return data;
    },
    enabled: !!token,
  });

  const activeStore = stores.find(s => s.id === activeStoreId) ?? stores[0] ?? null;

  const setActiveStore = useCallback((store) => {
    localStorage.setItem('activeStoreId', store.id);
    setActiveStoreIdState(store.id);
  }, []);

  return (
    <DashboardContext.Provider value={{ stores, activeStore, setActiveStore, isLoading, authApi, refetchStores }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
}
