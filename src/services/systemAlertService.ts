import { safeDbOperation } from '@/utils/supabaseAuth';
import { SystemAlert } from '@/utils/errorTracking';

export const systemAlertService = {
  /**
   * Creates a new system alert.
   * @param alertData The data for the new alert.
   */
  createAlert: async (alertData: Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    try {
      const result = await safeDbOperation(async (client) => {
        const { error } = await client
          .from('system_alerts')
          .insert({
            ...alertData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        return true;
      });

      if (result) {
        console.log('🔔 System alert created successfully:', alertData.message);
      } else {
        throw new Error('Failed to create system alert');
      }
    } catch (error) {
      console.error('❌ Error creating system alert:', error);
      throw error; // Re-throw to be handled by captureError or other callers
    }
  },

  /**
   * Fetches active (unacknowledged) system alerts.
   * @returns A promise that resolves to an array of SystemAlerts.
   */
  getActiveAlerts: async (): Promise<SystemAlert[]> => {
    try {
      const result = await safeDbOperation(async (client) => {
        const { data, error } = await client
          .from('system_alerts')
          .select('*')
          .eq('acknowledged', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      });
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching active system alerts:', error);
      return [];
    }
  },

  /**
   * Marks a system alert as acknowledged.
   * @param alertId The ID of the alert to acknowledge.
   * @param acknowledgedBy The username of the person acknowledging the alert.
   */
  acknowledgeAlert: async (alertId: string, acknowledgedBy: string): Promise<boolean> => {
    try {
      const result = await safeDbOperation(async (client) => {
        const { error } = await client
          .from('system_alerts')
          .update({
            acknowledged: true,
            acknowledged_by: acknowledgedBy,
            acknowledged_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', alertId);

        if (error) throw error;
        return true;
      });
      if (result) {
        console.log(`✅ Alert ${alertId} acknowledged by ${acknowledgedBy}`);
        return true;
      } else {
        throw new Error('Failed to acknowledge alert');
      }
    } catch (error) {
      console.error(`❌ Error acknowledging alert ${alertId}:`, error);
      return false;
    }
  },

  /**
   * Fetches all system alerts (acknowledged and unacknowledged).
   * @returns A promise that resolves to an array of SystemAlerts.
   */
  getAllAlerts: async (): Promise<SystemAlert[]> => {
    try {
      const result = await safeDbOperation(async (client) => {
        const { data, error } = await client
          .from('system_alerts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      });
      return result || [];
    } catch (error) {
      console.error('❌ Error fetching all system alerts:', error);
      return [];
    }
  },
};