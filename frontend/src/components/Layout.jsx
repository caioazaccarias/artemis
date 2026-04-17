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
  const [showOptions, setShowOptions] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fecha o menu lateral automaticamente em dispositivos móveis após clicar em um link
  const handleNavLinkClick = () => {
    if (window.innerWidth <= 992) {
      document.body.classList.remove('sidebar-open');
      document.body.classList.add('sidebar-collapse');
    }
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

        {/* Nome do usuário centralizado vertical e horizontalmente para alinhar com o card do meio do Dashboard */}
        {user && (
          <div className="d-none d-sm-flex align-items-center justify-content-center" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, pointerEvents: 'none' }}>
            <div className="font-weight-bold text-dark" style={{ pointerEvents: 'auto' }}>
              <i className="fas fa-user-circle mr-2 text-primary"></i>
              {user.nome}
            </div>
          </div>
        )}

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
        <Link to="/" className="brand-link text-center px-0 py-3">
          <span className="brand-text font-weight-bold" style={{ fontSize: '1.6rem', display: 'block', letterSpacing: '2px' }}>ARTEMIS</span>
        </Link>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Sidebar Menu */}
          <nav className="mt-2">
            <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu">
              {user?.permissions?.includes('dashboard') && (
                <li className="nav-item">
                  <Link to="/" className="nav-link" onClick={handleNavLinkClick}>
                    <i className="nav-icon fas fa-tachometer-alt"></i>
                    <p>Dashboard</p>
                  </Link>
                </li>
              )}
              {user?.permissions?.includes('transactions') && (
                <li className="nav-item">
                  <Link to="/transactions" className="nav-link" onClick={handleNavLinkClick}>
                    <i className="nav-icon fas fa-list"></i>
                    <p>Transações</p>
                  </Link>
                </li>
              )}
              {user?.permissions?.includes('categories') && (
                <li className="nav-item">
                  <Link to="/categories" className="nav-link" onClick={handleNavLinkClick}>
                    <i className="nav-icon fas fa-tags"></i>
                    <p>Categorias</p>
                  </Link>
                </li>
              )}
              {user?.permissions?.includes('commissions') && (
                <li className="nav-item">
                  <Link to="/commissions" className="nav-link" onClick={handleNavLinkClick}>
                    <i className="nav-icon fas fa-hand-holding-usd text-success"></i>
                    <p>Comissões</p>
                  </Link>
                </li>
              )}
              {(user?.permissions?.includes('backup') || user?.permissions?.includes('roles') || user?.permissions?.includes('users') || user?.permissions?.includes('settings')) && (
                <li className={`nav-item ${showOptions ? 'menu-open' : ''}`}>
                  <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setShowOptions(!showOptions); }}>
                    <i className="nav-icon fas fa-cogs"></i>
                    <p>
                      Opções
                      <i className={`right fas fa-angle-left ${showOptions ? 'rotate-90' : ''}`} style={{ transition: 'transform 0.3s' }}></i>
                    </p>
                  </a>
                  <ul className="nav nav-treeview" style={{ display: showOptions ? 'block' : 'none', paddingLeft: '15px' }}>
                    {user?.permissions?.includes('settings') && (
                      <li className="nav-item">
                        <Link to="/settings" className="nav-link" onClick={handleNavLinkClick}>
                          <i className="nav-icon fas fa-sliders-h text-primary"></i>
                          <p>Taxas Gerais</p>
                        </Link>
                      </li>
                    )}
                      {user?.permissions?.includes('users') && (
                        <li className="nav-item">
                          <Link to="/users" className="nav-link" onClick={handleNavLinkClick}>
                            <i className="nav-icon fas fa-users"></i>
                            <p>Usuários</p>
                          </Link>
                        </li>
                      )}
                      {user?.permissions?.includes('backup') && (
                        <li className="nav-item">
                          <Link to="/backup" className="nav-link" onClick={handleNavLinkClick}>
                            <i className="fas fa-database nav-icon text-info"></i>
                            <p>Backup</p>
                          </Link>
                        </li>
                      )}
                      {user?.permissions?.includes('roles') && (
                        <li className="nav-item">
                          <Link to="/roles" className="nav-link" onClick={handleNavLinkClick}>
                            <i className="nav-icon fas fa-user-tag"></i>
                            <p>Perfis</p>
                          </Link>
                        </li>
                      )}
                    </ul>
                  </li>
                )}
              </ul>
          </nav>
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className="content-wrapper" style={{ padding: '1rem', minHeight: 'calc(100vh - 57px - 57px)' }}>
        <div className="container-fluid">
          <Outlet />
        </div>
      </div>

      <footer className="main-footer text-right py-2 px-3">
        <strong><Clock /></strong>
      </footer>
    </div>
  );
};

export default Layout;
