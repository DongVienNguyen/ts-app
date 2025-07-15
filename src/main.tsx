import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

console.log('🚀 Asset Management System starting...');

// Create a client
const queryClient = new QueryClient()

// Set initial light theme on document
document.documentElement.classList.remove('dark');
document.documentElement.style.colorScheme = 'light';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)