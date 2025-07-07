import { Staff } from '@/types/auth';

const USER_STORAGE_KEY = 'secure_user';
const TOKEN_STORAGE_KEY = 'secure_token';

export function storeUser(user: Staff): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Error storing user in localStorage", e);
  }
}

export function getStoredUser(): Staff | null {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Error getting user from localStorage", e);
    return null;
  }
}

export function removeStoredUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY); // Also remove token for consistency
  } catch (e) {
    console.error("Error removing user and token from localStorage", e);
  }
}

export function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (e) {
    console.error("Error storing token in localStorage", e);
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    console.error("Error getting token from localStorage", e);
    return null;
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    console.error("Error removing token from localStorage", e);
  }
}