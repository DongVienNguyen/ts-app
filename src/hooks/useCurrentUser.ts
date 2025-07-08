import { useSecureAuth } from '@/contexts/AuthContext';

export function useCurrentUser() {
  const { user, loading } = useSecureAuth();
  
  return {
    user,
    currentUser: user, // Add this for backward compatibility
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isNqUser: user?.department === 'NQ',
    isNqOrAdmin: user?.role === 'admin' || user?.department === 'NQ',
  };
}