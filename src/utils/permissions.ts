import { Staff } from '@/types/auth';

export const isAdmin = (user: Staff | null): boolean => {
  const result = user?.role === 'admin';
  // console.log('🔍 isAdmin check:', {
  //   user: user?.username,
  //   role: user?.role,
  //   isAdmin: result
  // });
  return result;
};

export const isNqOrAdmin = (user: Staff | null): boolean => {
  const result = user?.department === 'NQ' || user?.role === 'admin';
  // console.log('🔍 isNqOrAdmin check:', {
  //   user: user?.username,
  //   role: user?.role,
  //   department: user?.department,
  //   isNqOrAdmin: result
  // });
  return result;
};

export const hasPermission = (user: Staff | null, requiredRole: string): boolean => {
  return user?.role === requiredRole;
};

export const hasAnyPermission = (user: Staff | null, roles: string[]): boolean => {
  return roles.includes(user?.role || '');
};