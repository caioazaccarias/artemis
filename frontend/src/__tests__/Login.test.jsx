import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from '../pages/Login';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

// Mock do useNavigate e useAuth se necessário
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
  }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Componente de Login', () => {
  it('Deve renderizar os campos de email e senha', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/Email/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Senha/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeDefined();
  });

  it('Deve mostrar mensagens de erro ao submeter formulário vazio', async () => {
    renderLogin();
    const submitButton = screen.getByRole('button', { name: /Entrar/i });
    
    fireEvent.click(submitButton);

    // React Hook Form valida assincronamente
    const emailError = await screen.findByText(/Email é obrigatório/i);
    const passwordError = await screen.findByText(/Senha é obrigatória/i);
    
    expect(emailError).toBeDefined();
    expect(passwordError).toBeDefined();
  });
});
