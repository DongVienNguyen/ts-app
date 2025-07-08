// Ensure VITE_APP_VAPID_PUBLIC_KEY is defined in your .env file
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_APP_VAPID_PUBLIC_KEY || '';

if (!VAPID_PUBLIC_KEY) {
  console.error("VAPID Public Key is not defined. Please set VITE_APP_VAPID_PUBLIC_KEY in your .env file.");
} else {
  console.log("VAPID Public Key loaded via import.meta.env:", VAPID_PUBLIC_KEY);
}