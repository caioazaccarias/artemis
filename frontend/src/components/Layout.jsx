import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return <span>{time.toLocaleString('pt-BR')}</span>;
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="wrapper">
      {/* Navbar */}
      <nav className="main-header navbar navbar-expand navbar-white navbar-light">
        <ul className="navbar-nav">
          <li className="nav-item">
            <a className="nav-link" data-widget="pushmenu" href="#" role="button"><i className="fas fa-bars"></i></a>
          </li>
        </ul>
        <ul className="navbar-nav ml-auto">
          <li className="nav-item">
            <button className="btn btn-link nav-link" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Sair
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Sidebar Container */}
      <aside className="main-sidebar sidebar-dark-primary elevation-4">
        {/* Brand Logo */}
        <Link to="/" className="brand-link">
          <span className="brand-text font-weight-light ml-3">Controle Financeiro</span>
        </Link>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Sidebar Menu */}
          <nav className="mt-2">
            <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  <i className="nav-icon fas fa-tachometer-alt"></i>
                  <p>Dashboard</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/transactions" className="nav-link">
                  <i className="nav-icon fas fa-list"></i>
                  <p>Transações</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/categories" className="nav-link">
                  <i className="nav-icon fas fa-tags"></i>
                  <p>Categorias</p>
                </Link>
              </li>
              {user?.role === 'admin' && (
                <li className="nav-item">
                  <Link to="/users" className="nav-link">
                    <i className="nav-icon fas fa-users"></i>
                    <p>Usuários</p>
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className="content-wrapper p-4">
        <Outlet />
      </div>

      <footer className="main-footer text-right">
        <strong><Clock /></strong>
      </footer>
    </div>
  );
};

export default Layout;
