import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Index from '@/pages/Index';
import AssetEntry from '@/pages/AssetEntry';
import DailyReport from '@/pages/DailyReport';
import BorrowReport from '@/pages/BorrowReport';
import AssetReminders from '@/pages/AssetReminders';
import CRCReminders from '@/pages/CRCReminders';
import OtherAssets from '@/pages/OtherAssets';
import DataManagement from '@/pages/DataManagement';
import Notifications from '@/pages/Notifications';
import SecurityMonitor from '@/pages/SecurityMonitor';
import ErrorMonitoring from '@/pages/ErrorMonitoring';
import UsageMonitoring from '@/pages/UsageMonitoring';
import NotFound from '@/pages/NotFound';
import ResetPassword from '@/pages/ResetPassword';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    console.log('🔍 App component rendering...');
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes without Layout */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected routes with Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Index />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/asset-entry" element={
          <ProtectedRoute>
            <Layout>
              <AssetEntry />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/daily-report" element={
          <ProtectedRoute>
            <Layout>
              <DailyReport />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/borrow-report" element={
          <ProtectedRoute>
            <Layout>
              <BorrowReport />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/asset-reminders" element={
          <ProtectedRoute>
            <Layout>
              <AssetReminders />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/crc-reminders" element={
          <ProtectedRoute>
            <Layout>
              <CRCReminders />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/other-assets" element={
          <ProtectedRoute>
            <Layout>
              <OtherAssets />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/data-management" element={
          <ProtectedRoute>
            <Layout>
              <DataManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/security-monitor" element={
          <ProtectedRoute>
            <Layout>
              <SecurityMonitor />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/error-monitoring" element={
          <ProtectedRoute>
            <Layout>
              <ErrorMonitoring />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/usage-monitoring" element={
          <ProtectedRoute>
            <Layout>
              <UsageMonitoring />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;