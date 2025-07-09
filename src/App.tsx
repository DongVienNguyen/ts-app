import React from 'react';
import { Toaster } from "@/components/SimpleToaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import NotFound from "./pages/NotFound";

// Create QueryClient instance outside component to prevent recreation
let queryClient: QueryClient;

function getQueryClient() {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          retry: 1,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 1,
        },
      },
    });
  }
  return queryClient;
}

function App() {
  console.log('🔍 App component rendering...');
  
  // Safety check for React
  if (!React || !React.useEffect) {
    console.error('❌ React is not properly loaded');
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">React Loading Error</h1>
          <p className="text-red-600">React is not properly loaded. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const client = getQueryClient();

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