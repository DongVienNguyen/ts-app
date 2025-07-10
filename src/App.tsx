import React from 'react';
import { Toaster } from "@/components/SimpleToaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAutoNotificationSetup } from "@/hooks/useAutoNotificationSetup";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import AssetEntry from "./pages/AssetEntry";
import DailyReport from "./pages/DailyReport";
import BorrowReport from "./pages/BorrowReport";
import AssetReminders from "./pages/AssetReminders";
import CRCReminders from "./pages/CRCReminders";
import OtherAssets from "./pages/OtherAssets";
import DataManagement from "./pages/DataManagement";
import ErrorReport from "./pages/ErrorReport";
import PushNotificationTest from "./pages/PushNotificationTest";
import Notifications from "./pages/Notifications";
import SecurityMonitor from "./pages/SecurityMonitor";
import NotFound from "./pages/NotFound";

// Create QueryClient instance with error handling
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        onError: (error) => {
          console.error('Mutation error:', error);
        }
      },
    }
  });
};

// Global query client instance
let queryClient: QueryClient | null = null;

function getQueryClient() {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}

// Component to handle auto notification setup
function AppWithNotifications() {
  useAutoNotificationSetup();
  return null;
}

function App() {
  console.log('🔍 App component rendering...');
  
  // Comprehensive React safety checks
  if (!React) {
    console.error('❌ React is not loaded');
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-4">React Loading Error</h1>
          <p className="text-red-600 mb-4">React framework is not properly loaded.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Check for React hooks
  if (!React.useEffect || !React.useState || !React.useContext) {
    console.error('❌ React hooks are not available');
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-4">React Hooks Error</h1>
          <p className="text-red-600 mb-4">React hooks are not available. This might be a version mismatch.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Get query client with error handling
  let client: QueryClient;
  try {
    client = getQueryClient();
  } catch (error) {
    console.error('❌ Failed to create QueryClient:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Query Client Error</h1>
          <p className="text-red-600 mb-4">Failed to initialize React Query client.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <TooltipProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AuthProvider>
                <AppWithNotifications />
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
                  <Route path="/data-management" element={
                    <ProtectedRoute>
                      <DataManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/security-monitor" element={
                    <ProtectedRoute>
                      <SecurityMonitor />
                    </ProtectedRoute>
                  } />
                  <Route path="/error-report" element={
                    <ProtectedRoute>
                      <ErrorReport />
                    </ProtectedRoute>
                  } />
                  <Route path="/push-test" element={
                    <ProtectedRoute>
                      <PushNotificationTest />
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;