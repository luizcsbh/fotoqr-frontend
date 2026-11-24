import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isSuperAdmin } from '../../utils/roles';
import { ProtectedRoute } from './ProtectedRoute';

/**
 * Route only a super admin may open; anyone else logged in goes back to the dashboard.
 * The API enforces the same rule — this only keeps the screen out of reach.
 */
export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      {isSuperAdmin(user) ? <>{children}</> : <Navigate to="/dashboard" replace />}
    </ProtectedRoute>
  );
};
