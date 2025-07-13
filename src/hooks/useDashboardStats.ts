import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { useSecureAuth } from '@/contexts/AuthContext';
import { AdvancedSystemHealthService } from '@/components/system-health/AdvancedSystemHealthService'; // Import AdvancedSystemHealthService
import { SystemHealth } from '@/components/system-health/types'; // Import SystemHealth type

export function useDashboardStats() {
  const { user } = useSecureAuth();
  const { activeUsers } = useRealTimeSecurityMonitoring(user);
  const [transactionsToday, setTransactionsToday] = useState(0);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null); // Use SystemHealth type
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setIsLoading(true);
      
      const today = new Date().toISOString().split('T')[0];

      const transactionsPromise = supabase
        .from('asset_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('transaction_date', today);
        
      // Use AdvancedSystemHealthService for health check
      const healthPromise = AdvancedSystemHealthService.checkSystemHealth();

      const [transactionsResult, healthResult] = await Promise.all([
        transactionsPromise,
        healthPromise
      ]);

      if (transactionsResult.count !== null) {
        setTransactionsToday(transactionsResult.count);
      }
      
      if (healthResult) {
        setSystemHealth(healthResult);
      }

      setIsLoading(false);
    };

    fetchStats();
  }, [user]);

  const getSystemStatusInfo = () => {
    if (isLoading || !systemHealth) return { text: 'Đang tải...', color: 'text-gray-600', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' };
    
    // Use overall status from SystemHealth
    if (systemHealth.overall === 'error') return { text: 'Có gián đoạn', color: 'text-red-600', iconBg: 'bg-red-100', iconColor: 'text-red-600' };
    if (systemHealth.overall === 'warning') return { text: 'Hoạt động chậm', color: 'text-yellow-600', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' };
    return { text: 'Hoạt động bình thường', color: 'text-green-600', iconBg: 'bg-green-100', iconColor: 'text-green-600' };
  };

  return {
    stats: {
      onlineUsers: activeUsers,
      transactionsToday,
    },
    systemStatusInfo: getSystemStatusInfo(),
    isLoading,
  };
}