import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SecureAuthProvider } from './hooks/useSecureAuth.tsx'
import React from 'react'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SecureAuthProvider>
      <App />
    </SecureAuthProvider>
  </React.StrictMode>
);