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
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/asset-entry" element={<AssetEntry />} />
                  <Route path="/daily-report" element={<DailyReport />} />
                  <Route path="/borrow-report" element={<BorrowReport />} />
                  <Route path="/asset-reminders" element={<AssetReminders />} />
                  <Route path="/crc-reminders" element={<CRCReminders />} />
                  <Route path="/other-assets" element={<OtherAssets />} />
                  <Route path="/data-management" element={<DataManagement />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/security-monitor" element={<SecurityMonitor />} />
                  <Route path="/error-monitoring" element={<ErrorMonitoring />} />
                  <Route path="/usage-monitoring" element={<UsageMonitoring />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
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