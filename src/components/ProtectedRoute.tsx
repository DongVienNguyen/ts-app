import React from 'react';
import { useSecureAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Staff } from '@/types/auth';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthorized?: (user: Staff) => boolean;
}

export function ProtectedRoute({ children, isAuthorized }: ProtectedRouteProps) {
  const { user, loading } = useSecureAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // Save the current location to redirect back after login
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" replace />;
  }

  if (isAuthorized && !isAuthorized(user)) {
    // If user is not authorized, show a toast and redirect to the home page
    toast.error("Bạn không có quyền truy cập trang này");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}