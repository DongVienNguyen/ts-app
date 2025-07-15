import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Index from '@/pages/Index';
import AssetEntry from '@/pages/AssetEntry';
import DailyReport from '@/pages/DailyReport';
import BorrowReport from '@/pages/BorrowReport';
import AssetReminders from '@/pages/AssetReminders';
import CRCReminders from '@/pages/CRCReminders';
import OtherAssets from '@/pages/OtherAssets';
import Notifications from '@/pages/Notifications';
import DataManagement from '@/pages/DataManagement';
import SecurityMonitor from '@/pages/SecurityMonitor';
import ErrorMonitoring from '@/pages/ErrorMonitoring';
import UsageMonitoring from '@/pages/UsageMonitoring';
import SystemBackup from '@/pages/SystemBackup';
import ResetPassword from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Toaster } from "@/components/ui/sonner"
import { isAdmin, isNqOrAdmin } from './utils/permissions';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { NotificationPermissionPrompt } from './components/NotificationPermissionPrompt';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Layout>
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