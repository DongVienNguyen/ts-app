import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin, isNqOrAdmin } from '@/utils/permissions';
import Layout from './Layout'; // Import Layout component

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'nq_or_admin';
}

// Loading component for protected routes
const ProtectedRouteLoading = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
      <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute check:', {
    loading,
    hasUser: !!user,
    username: user?.username,
    role: user?.role,
    requiredRole
  });

  // Show loading while checking authentication
  if (loading) {
    console.log('⏳ ProtectedRoute: Still loading auth state');
    return <ProtectedRouteLoading />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('❌ ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    let hasAccess = false;
    
    switch (requiredRole) {
      case 'admin':
        hasAccess = isAdmin(user);
        break;
      case 'nq_or_admin':
        hasAccess = isNqOrAdmin(user);
        break;
      default:
        hasAccess = true;
    }

    if (!hasAccess) {
      console.log('❌ ProtectedRoute: Insufficient permissions', {
        userRole: user.role,
        requiredRole,
        hasAccess
      });
      return <Navigate to="/" replace />;
    }
  }

  console.log('✅ ProtectedRoute: Access granted');
  return <Layout>{children}</Layout>; // Wrap children with Layout
};

export default ProtectedRoute;