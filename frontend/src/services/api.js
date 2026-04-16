import axios from 'axios';

const api = axios.create({
  // Utiliza caminho relativo para funcionar tanto no proxy dev (Vite) quanto na produção (Nginx Docker proxy)
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor for adding the JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@ControleFinanceiro:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
