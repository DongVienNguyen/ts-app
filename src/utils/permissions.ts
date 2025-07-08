import { Staff } from '@/types/auth';

/**
 * Checks if the user is an Admin.
 */
export const isAdmin = (user: Staff | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Checks if the user is from the NQ department or is an Admin.
 * These users have access to reminder, reporting, and other asset pages.
 */
export const isNqOrAdmin = (user: Staff | null): boolean => {
  if (!user) return false;
  return user.role === 'admin' || user.department === 'NQ';
};