import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEffect, Suspense, lazy } from 'react';
import { memoryManager } from '@/utils/memoryManager';

// Lazy load all pages for better performance
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const AssetEntry = lazy(() => import('@/pages/AssetEntry'));
const DailyReport = lazy(() => import('@/pages/DailyReport'));
const BorrowReport = lazy(() => import('@/pages/BorrowReport'));
const AssetReminders = lazy(() => import('@/pages/AssetReminders'));
const CRCReminders = lazy(() => import('@/pages/CRCReminders'));
const OtherAssets = lazy(() => import('@/pages/OtherAssets'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword')); // Added lazy import for ResetPassword

// Heavy admin pages - lazy load with higher priority
const DataManagement = lazy(() => import('@/pages/DataManagement'));
const SecurityMonitor = lazy(() => import('@/pages/SecurityMonitor'));
const ErrorMonitoring = lazy(() => import('@/pages/ErrorMonitoring'));
const UsageMonitoring = lazy(() => import('@/pages/UsageMonitoring'));
const SystemBackup = lazy(() => import('@/pages/SystemBackup'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="text-gray-600 animate-pulse">Đang tải trang...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      // Enable background refetch for better UX
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

function AppContent() {
  // Initialize memory management
  useEffect(() => {
    console.log('🧠 Initializing memory management...');
    
    // Set cleanup threshold to 85%
    memoryManager.setCleanupThreshold(85);
    
    // Log initial memory stats
    const stats = memoryManager.getMemoryStats();
    if (stats) {
      console.log('🧠 Initial memory usage:', `${stats.usagePercentage.toFixed(1)}%`);
    }

    // Cleanup on app unmount
    return () => {
      memoryManager.stopMonitoring();
    };
  }, []);

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
        <Suspense fallback={<PageLoader />}>
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
            
            {/* Heavy admin pages with suspense */}
            <Route path="/data-management" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <DataManagement />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/security-monitor" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <SecurityMonitor />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/error-monitoring" element={<ProtectedRoute><ErrorMonitoring /></ProtectedRoute>} />
            <Route path="/usage-monitoring" element={<ProtectedRoute><UsageMonitoring /></ProtectedRoute>}/>
            <Route path="/backup" element={<ProtectedRoute><SystemBackup /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        
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