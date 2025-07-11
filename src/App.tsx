import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEffect } from 'react';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import AssetEntry from '@/pages/AssetEntry';
import DailyReport from '@/pages/DailyReport';
import BorrowReport from '@/pages/BorrowReport';
import AssetReminders from '@/pages/AssetReminders';
import CRCReminders from '@/pages/CRCReminders';
import OtherAssets from '@/pages/OtherAssets';
import DataManagement from '@/pages/DataManagement';
import SecurityMonitor from '@/pages/SecurityMonitor';
import ErrorMonitoring from '@/pages/ErrorMonitoring';
import UsageMonitoring from '@/pages/UsageMonitoring';
import Notifications from '@/pages/Notifications';
import ResetPassword from '@/pages/ResetPassword';
import SystemBackup from '@/pages/SystemBackup';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function AppContent() {
  // Listen for service worker navigation messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO_NOTIFICATION') {
        const targetUrl = event.data.url || '/notifications';
        const notificationId = event.data.notificationId;
        
        // Navigate to the target URL
        if (notificationId) {
          window.location.href = `${targetUrl}?id=${notificationId}`;
        } else {
          window.location.href = targetUrl;
        }
      }
    };

    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/asset-entry" element={
            <ProtectedRoute>
              <AssetEntry />
            </ProtectedRoute>
          } />
          <Route path="/daily-report" element={
            <ProtectedRoute>
              <DailyReport />
            </ProtectedRoute>
          } />
          <Route path="/borrow-report" element={
            <ProtectedRoute>
              <BorrowReport />
            </ProtectedRoute>
          } />
          <Route path="/asset-reminders" element={
            <ProtectedRoute>
              <AssetReminders />
            </ProtectedRoute>
          } />
          <Route path="/crc-reminders" element={
            <ProtectedRoute>
              <CRCReminders />
            </ProtectedRoute>
          } />
          <Route path="/other-assets" element={
            <ProtectedRoute>
              <OtherAssets />
            </ProtectedRoute>
          } />
          <Route path="/data-management" element={
            <ProtectedRoute>
              <DataManagement />
            </ProtectedRoute>
          } />
          <Route path="/security-monitor" element={
            <ProtectedRoute>
              <SecurityMonitor />
            </ProtectedRoute>
          } />
          <Route path="/error-monitoring" element={
            <ProtectedRoute>
              <ErrorMonitoring />
            </ProtectedRoute>
          } />
          <Route path="/usage-monitoring" element={
            <ProtectedRoute>
              <UsageMonitoring />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/system-backup" element={
            <ProtectedRoute>
              <SystemBackup />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Global Components */}
        <NotificationPermissionPrompt />
        <PWAInstallPrompt />
        <Toaster 
          position="top-right" 
          closeButton={true}
          richColors={true}
          duration={4000}
          visibleToasts={3}
        />
      </Router>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;