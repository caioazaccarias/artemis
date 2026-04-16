import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Update with the correct port if different
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
