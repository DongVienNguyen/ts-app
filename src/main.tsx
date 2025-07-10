import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 Asset Management System starting...');

// Set initial light theme on document
document.documentElement.classList.remove('dark');
document.documentElement.style.colorScheme = 'light';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)