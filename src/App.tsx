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
import NotFound from '@/pages/NotFound';
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
const LoadingScreen = () => {
  console.log('🔄 LoadingScreen rendering...');
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ 
        backgroundColor: '#ffffff',
        color: '#111827',
        minHeight: '100vh'
      }}
    >
      <div className="text-center">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
          style={{ borderColor: '#10b981' }}
        ></div>
        <p className="text-lg" style={{ color: '#111827' }}>Đang tải...</p>
        <p className="text-sm mt-2" style={{ color: '#6b7280' }}>Vui lòng chờ trong giây lát</p>
      </div>
    </div>
  );
};

// Component to handle default route based on user role
function DefaultRoute() {
  const { user, loading } = useAuth();
  
  console.log('🎯 DefaultRoute - user:', user?.username, 'loading:', loading);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    console.log('🔒 No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Regular users go to asset-entry, admins/NQ go to dashboard
  if (user.role === 'user') {
    console.log('👤 User role, redirecting to asset-entry');
    return <Navigate to="/asset-entry" replace />;
  } else {
    console.log('👑 Admin/NQ role, showing dashboard');
    return (
      <Layout>
        <Index />
      </Layout>
    );
  }
}

function AppContent() {
  const { user, loading } = useAuth();

  console.log('🚀 AppContent rendering - user:', user?.username, 'loading:', loading);

  useEffect(() => {
    console.log('🌞 [APP] Forcing light theme...');
    
    // Aggressive light theme forcing
    const forceLight = () => {
      // Remove all dark theme classes
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
      
      // Set light color scheme
      document.documentElement.style.colorScheme = 'light';
      document.body.style.colorScheme = 'light';
      
      // Force light background and text
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#111827';
      document.documentElement.style.backgroundColor = '#ffffff';
      document.documentElement.style.color = '#111827';
      
      console.log('✅ [APP] Light theme applied');
    };

    // Apply immediately
    forceLight();

    // Apply periodically
    const interval = setInterval(forceLight, 1000);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Show loading screen while checking authentication
  if (loading) {
    console.log('⏳ App loading...');
    return <LoadingScreen />;
  }

  console.log('🎯 App rendering routes...');

  return (
    <Router future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <Routes>
        {/* Public routes without Layout */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        
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
  console.log('🚀 App component initializing...');

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