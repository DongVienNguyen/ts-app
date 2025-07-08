import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';

// Pages
import Login from '@/pages/Login';
import Index from '@/pages/Index';
import AssetEntry from '@/pages/AssetEntry';
import DailyReport from '@/pages/DailyReport';
import BorrowReport from '@/pages/BorrowReport';
import AssetReminders from '@/pages/AssetReminders';
import CRCReminders from '@/pages/CRCReminders';
import OtherAssets from '@/pages/OtherAssets';
import DataManagement from '@/pages/DataManagement';
import ResetPassword from '@/pages/ResetPassword';
import ErrorReport from '@/pages/ErrorReport';
import NotFound from '@/pages/NotFound';

function App() {
  const { user, loading } = useSecureAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <Login />} 
          />
          
          {/* Protected routes */}
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
            <ProtectedRoute requiredRole="nq_or_admin">
              <BorrowReport />
            </ProtectedRoute>
          } />
          
          <Route path="/asset-reminders" element={
            <ProtectedRoute requiredRole="nq_or_admin">
              <AssetReminders />
            </ProtectedRoute>
          } />
          
          <Route path="/crc-reminders" element={
            <ProtectedRoute requiredRole="nq_or_admin">
              <CRCReminders />
            </ProtectedRoute>
          } />
          
          <Route path="/other-assets" element={
            <ProtectedRoute requiredRole="nq_or_admin">
              <OtherAssets />
            </ProtectedRoute>
          } />
          
          <Route path="/data-management" element={
            <ProtectedRoute requiredRole="admin">
              <DataManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/reset-password" element={
            <ProtectedRoute>
              <ResetPassword />
            </ProtectedRoute>
          } />
          
          <Route path="/error-report" element={
            <ProtectedRoute>
              <ErrorReport />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* PWA and Notification prompts */}
        {user && (
          <>
            <PWAInstallPrompt />
            <NotificationPermissionPrompt />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;