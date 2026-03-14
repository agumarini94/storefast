import { createContext, useContext, useState, useCallback } from 'react';
import { apiClient } from '../utils/apiClient';

const AuthContext = createContext(null);

function parseStored(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => parseStored('user'));
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const persist = (userData, jwt) => {
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    persist(data.user, data.token);
    return data;
  }, []);

  const register = useCallback(async (email, password) => {
    const { data } = await apiClient.post('/auth/register', { email, password });
    persist(data.user, data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeStoreId');
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
