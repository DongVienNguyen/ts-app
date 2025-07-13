import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SystemError, SystemAlert } from '@/utils/errorTracking';
import { healthCheckService } from '@/services/healthCheckService';
import { AuthenticatedStaff } from '@/contexts/AuthContext';

// Define the HealthSummary interface
export interface HealthSummary {
  overallHealth: number;
  services: any; // Consider defining a more specific type for services if possible
  summary: {
    total: number;
    online: number;
    degraded: number;
    offline: number;
  };
}

export const useErrorMonitoringData = (user?: AuthenticatedStaff | null) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected'>('connected');

  const { data: errorStatsData, isLoading: isErrorStatsLoading } = useQuery({
    queryKey: ['errorStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_errors')
        .select('severity, status', { count: 'exact' });

      if (error) throw error;

      const totalErrors = data?.length || 0;
      const criticalErrors = data?.filter(e => e.severity === 'critical').length || 0;
      const resolvedErrors = data?.filter(e => e.status === 'resolved').length || 0;
      const errorRate = totalErrors / 7; // Assuming 7 days for now

      return { totalErrors, criticalErrors, resolvedErrors, errorRate };
    },
    staleTime: 1000 * 60, // 1 minute
  });

  const { data: recentErrorsData, isLoading: isRecentErrorsLoading } = useQuery({
    queryKey: ['recentErrors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Limit to 10 recent errors for dashboard display

      if (error) throw error;
      return data as SystemError[];
    },
    staleTime: 1000 * 10, // 10 seconds
  });

  const { data: systemAlertsData, isLoading: isSystemAlertsLoading } = useQuery({
    queryKey: ['systemAlerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('acknowledged', false) // Only fetch unacknowledged alerts
        .order('created_at', { ascending: false })
        .limit(5); // Limit to 5 recent alerts for dashboard display

      if (error) throw error;
      return data as SystemAlert[];
    },
    staleTime: 1000 * 10, // 10 seconds
  });

  const { data: healthData, isLoading: isHealthLoading } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => healthCheckService.getHealthSummary(),
    staleTime: 1000 * 60, // 1 minute
  });

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['errorStats'] }),
        queryClient.invalidateQueries({ queryKey: ['recentErrors'] }),
        queryClient.invalidateQueries({ queryKey: ['systemAlerts'] }),
        queryClient.invalidateQueries({ queryKey: ['systemHealth'] }),
      ]);
      toast.success('Dữ liệu đã được làm mới.');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Không thể làm mới dữ liệu.');
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    if (!user) {
      toast.error('Bạn phải đăng nhập để thực hiện hành động này.');
      return;
    }
    const { error } = await supabase
      .from('system_alerts')
      .update({ acknowledged: true, acknowledged_by: user.username, acknowledged_at: new Date().toISOString() })
      .eq('id', alertId);

    if (error) {
      toast.error('Không thể ghi nhận cảnh báo.');
    } else {
      toast.success('Cảnh báo đã được ghi nhận.');
      queryClient.invalidateQueries({ queryKey: ['systemAlerts'] }); // Refresh alerts after acknowledging
    }
  }, [queryClient, user]);

  useEffect(() => {
    const channel = supabase
      .channel('error-monitoring-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_errors' }, () => {
        queryClient.invalidateQueries({ queryKey: ['errorStats'] });
        queryClient.invalidateQueries({ queryKey: ['recentErrors'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_alerts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['systemAlerts'] });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else {
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const isLoading = isErrorStatsLoading || isRecentErrorsLoading || isSystemAlertsLoading || isHealthLoading;

  const errorStats = errorStatsData || { totalErrors: 0, criticalErrors: 0, resolvedErrors: 0, errorRate: 0 };
  const recentErrors = recentErrorsData || [];
  const systemAlerts = systemAlertsData || [];
  const health = healthData || { overallHealth: 0, services: {}, summary: { total: 0, online: 0, degraded: 0, offline: 0 } };

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