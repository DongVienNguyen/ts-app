import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { isAdmin, isNqOrAdmin } from '@/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'nq_or_admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useSecureAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    if (requiredRole === 'admin' && !isAdmin(user)) {
      return <Navigate to="/" replace />;
    }
    
    if (requiredRole === 'nq_or_admin' && !isNqOrAdmin(user)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;