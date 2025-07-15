import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Toaster } from "@/components/ui/sonner";
import { isAdmin, isNqOrAdmin } from './utils/permissions';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { NotificationPermissionPrompt } from './components/NotificationPermissionPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingFallback from './components/LoadingFallback';

// Dynamically import pages for code splitting
const Login = lazy(() => import('@/pages/Login'));
const Index = lazy(() => import('@/pages/Index'));
const AssetEntry = lazy(() => import('@/pages/AssetEntry'));
const DailyReport = lazy(() => import('@/pages/DailyReport'));
const BorrowReport = lazy(() => import('@/pages/BorrowReport'));
const AssetReminders = lazy(() => import('@/pages/AssetReminders'));
const CRCReminders = lazy(() => import('@/pages/CRCReminders'));
const OtherAssets = lazy(() => import('@/pages/OtherAssets'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const DataManagement = lazy(() => import('@/pages/DataManagement'));
const SecurityMonitor = lazy(() => import('@/pages/SecurityMonitor'));
const ErrorMonitoring = lazy(() => import('@/pages/ErrorMonitoring'));
const UsageMonitoring = lazy(() => import('@/pages/UsageMonitoring'));
const SystemBackup = lazy(() => import('@/pages/SystemBackup'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/asset-entry" element={<ProtectedRoute><AssetEntry /></ProtectedRoute>} />
                <Route path="/daily-report" element={<ProtectedRoute><DailyReport /></ProtectedRoute>} />
                <Route path="/borrow-report" element={<ProtectedRoute requiredRole={isNqOrAdmin}><BorrowReport /></ProtectedRoute>} />
                <Route path="/asset-reminders" element={<ProtectedRoute requiredRole={isNqOrAdmin}><AssetReminders /></ProtectedRoute>} />
                <Route path="/crc-reminders" element={<ProtectedRoute requiredRole={isNqOrAdmin}><CRCReminders /></ProtectedRoute>} />
                <Route path="/other-assets" element={<ProtectedRoute requiredRole={isNqOrAdmin}><OtherAssets /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/data-management" element={<ProtectedRoute requiredRole={isAdmin}><DataManagement /></ProtectedRoute>} />
                <Route path="/security-monitor" element={<ProtectedRoute requiredRole={isAdmin}><SecurityMonitor /></ProtectedRoute>} />
                <Route path="/error-monitoring" element={<ProtectedRoute requiredRole={isAdmin}><ErrorMonitoring /></ProtectedRoute>} />
                <Route path="/usage-monitoring" element={<ProtectedRoute requiredRole={isAdmin}><UsageMonitoring /></ProtectedRoute>} />
                <Route path="/backup" element={<ProtectedRoute requiredRole={isAdmin}><SystemBackup /></ProtectedRoute>} />
                <Route path="/reset-password" element={<ProtectedRoute><ResetPassword /></ProtectedRoute>} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
        <Toaster richColors position="top-right" />
        <PWAInstallPrompt />
        <NotificationPermissionPrompt />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;