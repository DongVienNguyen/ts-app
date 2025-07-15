import { safeDbOperation } from '@/utils/supabaseAuth';
import { SystemError, SystemMetric, SystemStatus, SystemAlert } from '@/types/system';

export async function logSystemError(errorData: Omit<SystemError, 'id' | 'created_at'>): Promise<void> {
  try {
    const result = await safeDbOperation(async (client) => {
      const { error } = await client.from('system_errors').insert({ ...errorData, created_at: new Date().toISOString() });
      if (error) throw error;
      return true;
    });

    if (result) {
      console.log('✅ System error logged successfully');
    } else {
      throw new Error('Failed to log system error');
    }
  } catch (error) {
    console.error('❌ Failed to log system error:', error);
    try {
      const existingErrors = JSON.parse(localStorage.getItem('system_errors') || '[]');
      existingErrors.push({ ...errorData, timestamp: new Date().toISOString(), fallback: true });
      if (existingErrors.length > 100) {
        existingErrors.splice(0, existingErrors.length - 100);
      }
      localStorage.setItem('system_errors', JSON.stringify(existingErrors));
      console.log('📝 Error logged to localStorage as fallback');
    } catch (storageError) {
      console.error('❌ Failed to log to localStorage:', storageError);
    }
  }
}

export async function logSystemMetric(metricData: Omit<SystemMetric, 'id' | 'created_at'>): Promise<void> {
  try {
    const result = await safeDbOperation(async (client) => {
      const { error } = await client.from('system_metrics').insert({ ...metricData, created_at: new Date().toISOString() });
      if (error) throw error;
      return true;
    });
    if (!result) console.warn('⚠️ Failed to log system metric');
  } catch (error) {
    console.warn('⚠️ Failed to log system metric:', error);
  }
}

export async function updateSystemStatus(statusData: Omit<SystemStatus, 'id' | 'created_at' | 'last_check'>): Promise<void> {
  try {
    const result = await safeDbOperation(async (client) => {
      const { error } = await client.from('system_status').insert({ ...statusData, last_check: new Date().toISOString(), created_at: new Date().toISOString() });
      if (error) throw error;
      return true;
    });
    if (!result) console.warn('⚠️ Failed to update system status');
  } catch (error) {
    console.warn('⚠️ Failed to update system status:', error);
  }
}

export async function createSystemAlert(alertData: Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  try {
    const result = await safeDbOperation(async (client) => {
      const { error } = await client.from('system_alerts').insert({ ...alertData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      if (error) throw error;
      return true;
    });
    if (result) console.log('🔔 System alert created successfully');
    else throw new Error('Failed to create system alert');
  } catch (error) {
    console.error('❌ Failed to create system alert:', error);
  }
}