import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout'; // Import the Layout component

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
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

  return (
    <Layout> {/* Wrap children with the Layout component */}
      {children}
    </Layout>
  );
};

export default ProtectedRoute;