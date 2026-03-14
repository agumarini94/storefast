import axios from 'axios';

// En dev usa el proxy de Vite (/api → localhost:3001)
// En producción usa la URL de Railway via VITE_API_URL
const BASE = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({ baseURL: BASE });

// Axios autenticado (para rutas protegidas del dashboard)
export function authClient() {
  return axios.create({
    baseURL: BASE,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
}
