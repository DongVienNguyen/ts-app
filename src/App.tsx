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
import NotFound from '@/pages/NotFound';
import ResetPassword from '@/pages/ResetPassword';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg">Đang tải...</p>
      <p className="text-gray-500 text-sm mt-2">Vui lòng chờ trong giây lát</p>
    </div>
  </div>
);

// Component to handle default route based on user role
function DefaultRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Regular users go to asset-entry, admins/NQ go to dashboard
  if (user.role === 'user') {
    return <Navigate to="/asset-entry" replace />;
  } else {
    return (
      <Layout>
        <Index />
      </Layout>
    );
  }
}

function AppContent() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Force light theme on body
    document.body.classList.remove('dark');
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
    
    // Set light color scheme
    document.documentElement.style.colorScheme = 'light';
  }, []);

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <Routes>
        {/* Public routes without Layout */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPassword />} />
        
        {/* Default route - redirects based on user role */}
        <Route path="/" element={
          <ProtectedRoute>
            <DefaultRoute />
          </ProtectedRoute>
        } />
        
        {/* Protected routes with Layout */}
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
        
        {/* 404 route */}
        <Route path="*" element={user ? (
          <Layout>
            <NotFound />
          </Layout>
        ) : <Navigate to="/login" replace />} />
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
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #e5e7eb'
              }
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;