import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";

import { ProtectedRoute } from './components/ProtectedRoute';
import { useSecureAuth } from './hooks/useSecureAuth';
import { isAdmin, isNqOrAdmin } from './utils/permissions';

// Lazy load pages for code-splitting
const Index = React.lazy(() => import('./pages/Index'));
const Login = React.lazy(() => import('./pages/Login'));
const AssetEntry = React.lazy(() => import('./pages/AssetEntry'));
const DailyReport = React.lazy(() => import('./pages/DailyReport'));
const BorrowReport = React.lazy(() => import('./pages/BorrowReport'));
const AssetReminders = React.lazy(() => import('./pages/AssetReminders'));
const CRCReminders = React.lazy(() => import('./pages/CRCReminders'));
const OtherAssets = React.lazy(() => import('./pages/OtherAssets'));
const DataManagement = React.lazy(() => import('./pages/DataManagement'));
const ErrorReport = React.lazy(() => import('./pages/ErrorReport'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { NotificationPermissionPrompt } from './components/NotificationPermissionPrompt';

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  const { loading } = useSecureAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/asset-entry" element={<ProtectedRoute><AssetEntry /></ProtectedRoute>} />
            <Route path="/daily-report" element={<ProtectedRoute><DailyReport /></ProtectedRoute>} />
            <Route path="/borrow-report" element={<ProtectedRoute isAuthorized={isNqOrAdmin}><BorrowReport /></ProtectedRoute>} />
            <Route path="/asset-reminders" element={<ProtectedRoute isAuthorized={isNqOrAdmin}><AssetReminders /></ProtectedRoute>} />
            <Route path="/crc-reminders" element={<ProtectedRoute isAuthorized={isNqOrAdmin}><CRCReminders /></ProtectedRoute>} />
            <Route path="/other-assets" element={<ProtectedRoute isAuthorized={isNqOrAdmin}><OtherAssets /></ProtectedRoute>} />
            <Route path="/data-management" element={<ProtectedRoute isAuthorized={isAdmin}><DataManagement /></ProtectedRoute>} />
            <Route path="/error-report" element={<ProtectedRoute><ErrorReport /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <PWAInstallPrompt />
        <NotificationPermissionPrompt />
      </Router>
      <Toaster richColors />
    </QueryClientProvider>
  );
}

export default App;