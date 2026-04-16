import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storagedUser = localStorage.getItem('@ControleFinanceiro:user');
    const storagedToken = localStorage.getItem('@ControleFinanceiro:token');

    if (storagedUser && storagedToken) {
      setUser(JSON.parse(storagedUser));
      api.defaults.headers.Authorization = `Bearer ${storagedToken}`;
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    try {
      // In the backend make sure to have an endpoint /login POST that returns { token, user }
      // Or adjust according to the backend
      const response = await api.post('/auth/login', { email, senha: password });
      
      const { token, user, permissions } = response.data;
      
      const userWithPermissions = { ...user, permissions };
      
      localStorage.setItem('@ControleFinanceiro:user', JSON.stringify(userWithPermissions));
      localStorage.setItem('@ControleFinanceiro:token', token);
      
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(userWithPermissions);
    } catch (error) {
      Swal.fire('Erro!', 'Credenciais inválidas.', 'error');
      throw error;
    }
  }

  function logout() {
    localStorage.removeItem('@ControleFinanceiro:user');
    localStorage.removeItem('@ControleFinanceiro:token');
    api.defaults.headers.Authorization = null;
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
