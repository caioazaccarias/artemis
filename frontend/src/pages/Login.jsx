import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.senha);
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="login-page" style={{ height: '100vh' }}>
      <div className="login-box">
        <div className="login-logo">
          <b>Controle</b>Financeiro
        </div>
        <div className="card">
          <div className="card-body login-card-body">
            <p className="login-box-msg">Faça login para iniciar sua sessão</p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="input-group mb-3">
                <input 
                  type="email" 
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
                  placeholder="Email" 
                  {...register('email', { required: 'Email é obrigatório' })} 
                />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <span className="fas fa-envelope"></span>
                  </div>
                </div>
                {errors.email && <span className="error invalid-feedback d-block">{errors.email.message}</span>}
              </div>
              <div className="input-group mb-3">
                <input 
                  type="password" 
                  className={`form-control ${errors.senha ? 'is-invalid' : ''}`} 
                  placeholder="Senha" 
                  {...register('senha', { required: 'Senha é obrigatória' })} 
                />
                <div className="input-group-append">
                  <div className="input-group-text">
                    <span className="fas fa-lock"></span>
                  </div>
                </div>
                {errors.password && <span className="error invalid-feedback d-block">{errors.password.message}</span>}
              </div>
              <div className="row">
                <div className="col-12">
                  <button type="submit" className="btn btn-primary btn-block">Entrar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
