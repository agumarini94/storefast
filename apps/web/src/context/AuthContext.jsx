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

  const register = useCallback(async ({ email, password, firstName, lastName, phone, storeName }) => {
    const { data } = await apiClient.post('/auth/register', { email, password, firstName, lastName, phone, storeName });
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

  const requestPasswordReset = useCallback(async (email) => {
    await apiClient.post('/auth/forgot-password', { email });
  }, []);

  const resetPassword = useCallback(async (resetToken, newPassword) => {
    await apiClient.post('/auth/reset-password', { token: resetToken, newPassword });
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const jwt = localStorage.getItem('token');
    await apiClient.post('/auth/change-password', { currentPassword, newPassword }, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
  }, []);

  const updateProfile = useCallback(async ({ firstName, lastName, phone }) => {
    const jwt = localStorage.getItem('token');
    const { data } = await apiClient.patch('/auth/profile', { firstName, lastName, phone }, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const updated = { ...parseStored('user'), ...data };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout, requestPasswordReset, resetPassword, changePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
