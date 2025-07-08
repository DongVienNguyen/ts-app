import { createContext, useContext } from 'react';
import { AuthContextType } from '@/types/auth';

export const SecureAuthContext = createContext<AuthContextType | undefined>(undefined);

export function useSecureAuth() {
  const context = useContext(SecureAuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
}