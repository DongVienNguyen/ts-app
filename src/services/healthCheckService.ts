import { AdvancedSystemHealthService } from '@/components/system-health/AdvancedSystemHealthService';
import { SystemHealth } from '@/components/system-health/types';

export const healthCheckService = {
  async getHealthSummary(): Promise<SystemHealth | null> {
    try {
      const health = await AdvancedSystemHealthService.checkSystemHealth();
      return health;
    } catch (error) {
      console.error('Error fetching health summary:', error);
      return null;
    }
  },
};