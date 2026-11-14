import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from './LoadingScreen';
import { staffConsolePath } from '../../services/staff.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Which exclusive-link session (DJ or reader) may open this route. Any other route — the dashboard
   * included — sends such a session back to its own console.
   */
  allowStaff?: 'dj' | 'reader';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowStaff }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?mode=login" state={{ from: location }} replace />;
  }

  if (user?.scope && user.scope.kind !== allowStaff) {
    return <Navigate to={staffConsolePath(user.scope)} replace />;
  }

  return <>{children}</>;
};
