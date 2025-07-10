import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandling } from '@/utils/errorTracking'
import { healthCheckService } from '@/services/healthCheckService'

// Setup global error handling
setupGlobalErrorHandling();

// Start health monitoring (check every 5 minutes)
healthCheckService.startMonitoring(5);

// Log app startup
console.log('🚀 Asset Management System starting...');

// Performance monitoring for app initialization
const startTime = performance.now();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Log app initialization time
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  console.log(`✅ App initialized in ${loadTime.toFixed(2)}ms`);
});

// Handle app visibility changes for health monitoring
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('📱 App went to background - pausing health monitoring');
    healthCheckService.stopMonitoring();
  } else {
    console.log('📱 App came to foreground - resuming health monitoring');
    healthCheckService.startMonitoring(5);
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  console.log('👋 App shutting down - stopping health monitoring');
  healthCheckService.stopMonitoring();
});