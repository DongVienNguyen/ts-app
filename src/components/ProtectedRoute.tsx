import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: (user: any) => boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useSecureAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !requiredRole(user)) {
    toast.error('Không có quyền truy cập', {
      description: 'Bạn không có quyền truy cập vào trang này.',
    });
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {children}
    </>
  );
};

export default ProtectedRoute;