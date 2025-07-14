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
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const ErrorReport = lazy(() => import('@/pages/ErrorReport'));

// Heavy admin pages - lazy load with higher priority
const DataManagement = lazy(() => import('@/pages/DataManagement'));
const SecurityMonitor = lazy(() => import('@/pages/SecurityMonitor'));
const ErrorMonitoring = lazy(() => import('@/pages/ErrorMonitoring'));
const UsageMonitoring = lazy(() => import('@/pages/UsageMonitoring'));
const SystemBackup = lazy(() => import('@/pages/SystemBackup'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Loading component
export const PageLoader = () => (
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

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <Suspense fallback={<PageLoader />}>
              <Login />
            </Suspense>
          } />
          <Route path="/reset-password" element={
            <Suspense fallback={<PageLoader />}>
              <ResetPassword />
            </Suspense>
          } />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Index />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/asset-entry" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <AssetEntry />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/daily-report" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <DailyReport />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/borrow-report" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <BorrowReport />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/asset-reminders" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <AssetReminders />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/crc-reminders" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <CRCReminders />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/other-assets" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <OtherAssets />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Notifications />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/error-report" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ErrorReport />
              </Suspense>
            </ProtectedRoute>
          } />

          {/* Admin-only routes */}
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
          
          <Route path="/error-monitoring" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ErrorMonitoring />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/usage-monitoring" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <UsageMonitoring />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/system-backup" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <SystemBackup />
              </Suspense>
            </ProtectedRoute>
          } />

          {/* 404 route */}
          <Route path="*" element={
            <Suspense fallback={<PageLoader />}>
              <NotFound />
            </Suspense>
          } />
        </Routes>

        {/* Global components */}
        <NotificationPermissionPrompt />
        <PWAInstallPrompt />
        <Toaster position="top-right" />
      </div>
    </Router>
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