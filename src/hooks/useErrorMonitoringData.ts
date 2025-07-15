import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SystemError, SystemAlert } from '@/types/system';
import { getErrorStatistics } from '@/utils/errorAnalytics';
import { healthCheckService } from '@/services/healthCheckService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { SystemHealth } from '../components/system-health/types'; // Import SystemHealth

export interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  errorRate: number;
  topErrorTypes: { type: string; count: number }[];
  errorTrend: { date: string; count: number }[];
  byType: { [key: string]: number };
  bySeverity: { [key: string]: number };
  byBrowser: { [key: string]: number };
  byOS: { [key: string]: number };
  recent: SystemError[];
}

export type RealtimeStatus = 'connected' | 'disconnected' | 'error';

const initialErrorStats: ErrorStats = {
  totalErrors: 0,
  criticalErrors: 0,
  resolvedErrors: 0,
  errorRate: 0,
  topErrorTypes: [],
  errorTrend: [],
  byType: {},
  bySeverity: {},
  byBrowser: {},
  byOS: {},
  recent: [],
};

export const useErrorMonitoringData = () => {
  const { user } = useAuth();
  const [errorStats, setErrorStats] = useState<ErrorStats>(initialErrorStats);
  const [recentErrors, setRecentErrors] = useState<SystemError[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null); // Thay đổi kiểu dữ liệu và giá trị khởi tạo
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('disconnected');

  const fetchAllData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [errors, alerts, healthStatus] = await Promise.all([
        supabase.from('system_errors').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('system_alerts').select('*').eq('acknowledged', false).order('created_at', { ascending: false }),
        healthCheckService.getHealthSummary(), // Thay đổi lời gọi hàm
      ]);

      if (errors.error) throw errors.error;
      if (alerts.error) throw alerts.error;

      const typedErrors = errors.data as SystemError[];
      setRecentErrors(typedErrors);
      setErrorStats(getErrorStatistics(typedErrors));
      setSystemAlerts(alerts.data as SystemAlert[]);
      setHealth(healthStatus);
    } catch (error) {
      console.error("Error fetching monitoring data:", error);
      toast.error("Không thể tải dữ liệu giám sát.");
    } finally {
      if (isInitialLoad) setIsLoading(false);
      else setIsRefreshing(false);
    }
  }, []);

  const handleNewError = useCallback((payload: any) => {
    const newError = { ...payload.new, isNew: true } as SystemError;
    setRecentErrors(prevErrors => {
      const updatedErrors = [newError, ...prevErrors];
      setErrorStats(getErrorStatistics(updatedErrors)); // Đã thêm dấu đóng ngoặc đơn ở đây
      return updatedErrors;
    });
    toast.warning(`Lỗi mới: ${newError.error_message}`);
  }, []);

  const handleNewAlert = useCallback((payload: any) => {
    const newAlert = { ...payload.new, isNew: true } as SystemAlert;
    setSystemAlerts(prev => [newAlert, ...prev]);
    toast.error(`Cảnh báo hệ thống mới: ${newAlert.message}`, {
      duration: 10000,
    });
  }, []);

  useEffect(() => {
    fetchAllData(true);

    const errorChannel = supabase.channel('system_errors-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_errors' }, handleNewError)
      .subscribe((status) => setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected'));

    const alertChannel = supabase.channel('system_alerts-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_alerts' }, handleNewAlert)
      .subscribe();

    return () => {
      supabase.removeChannel(errorChannel);
      supabase.removeChannel(alertChannel);
    };
  }, [fetchAllData, handleNewError, handleNewAlert]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    if (!user) {
      toast.error('Bạn phải đăng nhập để thực hiện hành động này.');
      return;
    }

    const { error } = await supabase
      .from('system_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: user.username,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      toast.error('Ghi nhận cảnh báo thất bại.');
      console.error('Error acknowledging alert:', error);
    } else {
      toast.success('Cảnh báo đã được ghi nhận.');
      setSystemAlerts(prev => prev.filter(a => a.id !== alertId));
    }
  }, [user]);

  const refreshAll = useCallback(async () => {
    await fetchAllData(false);
  }, [fetchAllData]);

  return {
    errorStats,
    recentErrors,
    systemAlerts,
    health,
    isLoading,
    isRefreshing,
    realtimeStatus,
    refreshAll,
    acknowledgeAlert,
  };
};