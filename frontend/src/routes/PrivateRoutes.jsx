import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoutes = () => {
  const { signed, loading } = useAuth();

  if (loading) {
    return <div className="d-flex justify-content-center mt-5"><div className="spinner-border"></div></div>;
  }

  return signed ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoutes;
