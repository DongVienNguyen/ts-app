import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SecureAuthProvider } from './hooks/useSecureAuth'; // Import SecureAuthProvider
import React from 'react'; // Import React for StrictMode

// With vite-plugin-pwa, the service worker is registered automatically.
// No manual registration is needed here.

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SecureAuthProvider> {/* Wrap App with SecureAuthProvider */}
      <App />
    </SecureAuthProvider>
  </React.StrictMode>
);