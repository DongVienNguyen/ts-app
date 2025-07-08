import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient({
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;