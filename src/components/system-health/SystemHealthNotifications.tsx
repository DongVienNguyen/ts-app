import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { SystemHealth } from './types';

interface SystemHealthNotificationsProps {
  health: SystemHealth;
  previousHealth?: SystemHealth;
  enabled: boolean;
}

interface HealthAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  component: string;
}

export const SystemHealthNotifications: React.FC<SystemHealthNotificationsProps> = ({
  health,
  previousHealth,
  enabled
}) => {
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);

  useEffect(() => {
    if (!enabled || !previousHealth) return;

    const newAlerts: HealthAlert[] = [];

    // Check for status changes
    const components = [
      { key: 'database', name: 'Database', current: health.database.status, previous: previousHealth.database.status },
      { key: 'api', name: 'API', current: health.api.status, previous: previousHealth.api.status },
      { key: 'storage', name: 'Storage', current: health.storage.status, previous: previousHealth.storage.status },
      { key: 'memory', name: 'Memory', current: health.memory.status, previous: previousHealth.memory.status },
      { key: 'security', name: 'Security', current: health.security.status, previous: previousHealth.security.status }
    ];

    components.forEach(({ key, name, current, previous }) => {
      if (current !== previous) {
        const alertType = current === 'healthy' ? 'success' : 
                         current === 'warning' ? 'warning' : 'error';
        
        const alert: HealthAlert = {
          id: `${key}_${Date.now()}`,
          type: alertType,
          title: `${name} Status Changed`,
          message: `${name} status changed from ${previous} to ${current}`,
          timestamp: new Date(),
          component: name
        };

        newAlerts.push(alert);
      }
    });

    // Check for performance degradation
    if (health.database.responseTime && previousHealth.database.responseTime) {
      const currentResponse = health.database.responseTime;
      const previousResponse = previousHealth.database.responseTime;
      const increase = ((currentResponse - previousResponse) / previousResponse) * 100;

      if (increase > 50 && currentResponse > 1000) {
        newAlerts.push({
          id: `db_perf_${Date.now()}`,
          type: 'warning',
          title: 'Database Performance Degraded',
          message: `Database response time increased by ${increase.toFixed(1)}% to ${currentResponse}ms`,
          timestamp: new Date(),
          component: 'Database'
        });
      }
    }

    // Check for memory usage spikes
    if (health.memory.percentage > 85 && previousHealth.memory.percentage <= 85) {
      newAlerts.push({
        id: `memory_spike_${Date.now()}`,
        type: 'warning',
        title: 'High Memory Usage',
        message: `Memory usage exceeded 85% (${health.memory.percentage.toFixed(1)}%)`,
        timestamp: new Date(),
        component: 'Memory'
      });
    }

    // Check for storage issues
    if (health.storage.percentage > 90 && previousHealth.storage.percentage <= 90) {
      newAlerts.push({
        id: `storage_critical_${Date.now()}`,
        type: 'error',
        title: 'Critical Storage Usage',
        message: `Storage usage exceeded 90% (${health.storage.percentage.toFixed(1)}%)`,
        timestamp: new Date(),
        component: 'Storage'
      });
    }

    // Check for security events
    if (health.security.failedLogins > previousHealth.security.failedLogins + 5) {
      newAlerts.push({
        id: `security_alert_${Date.now()}`,
        type: 'warning',
        title: 'Multiple Failed Login Attempts',
        message: `${health.security.failedLogins} failed login attempts detected`,
        timestamp: new Date(),
        component: 'Security'
      });
    }

    // Show notifications
    newAlerts.forEach(alert => {
      const icon = alert.type === 'success' ? CheckCircle :
                   alert.type === 'warning' ? AlertTriangle :
                   alert.type === 'error' ? XCircle : Bell;

      toast[alert.type](alert.title, {
        description: alert.message,
        icon: React.createElement(icon, { className: "h-4 w-4" }),
        duration: alert.type === 'error' ? 10000 : 5000,
        action: {
          label: 'View Details',
          onClick: () => {
            console.log('Health Alert Details:', alert);
          }
        }
      });
    });

    // Update alerts state
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-9), ...newAlerts].slice(-10));
    }

  }, [health, previousHealth, enabled]);

  // Overall health status change notification
  useEffect(() => {
    if (!enabled || !previousHealth) return;

    if (health.overall !== previousHealth.overall) {
      const isImprovement = 
        (health.overall === 'healthy' && previousHealth.overall !== 'healthy') ||
        (health.overall === 'warning' && previousHealth.overall === 'error');

      const alertType = health.overall === 'healthy' ? 'success' :
                       health.overall === 'warning' ? 'warning' : 'error';

      const title = isImprovement ? 'System Health Improved' : 'System Health Alert';
      const message = `Overall system health changed to ${health.overall}`;

      toast[alertType](title, {
        description: message,
        icon: React.createElement(
          health.overall === 'healthy' ? CheckCircle :
          health.overall === 'warning' ? AlertTriangle : XCircle,
          { className: "h-4 w-4" }
        ),
        duration: health.overall === 'error' ? 15000 : 7000
      });
    }
  }, [health.overall, previousHealth?.overall, enabled]);

  return null; // This component only handles notifications, no UI
};

export default SystemHealthNotifications;