import { Staff } from '@/types/auth';

const USER_STORAGE_KEY = 'secure_user';
const TOKEN_STORAGE_KEY = 'secure_token';

export function storeUser(user: Staff): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user:', error);
  }
}

export function getStoredUser(): Staff | null {
  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Failed to get stored user:', error);
    return null;
  }
}

export function removeStoredUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to remove stored user:', error);
  }
}

export function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error('Failed to store token:', error);
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get stored token:', error);
    return null;
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to remove stored token:', error);
  }
}

export function clearAllAuthData(): void {
  removeStoredUser();
  removeStoredToken();
  // Clear any other auth-related data
  localStorage.removeItem('loggedInStaff');
  localStorage.removeItem('currentUser');
}