import { supabase } from '@/integrations/supabase/client';
import { SystemHealth } from '@/components/system-health/types';

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  recipients: string[];
  lastTriggered?: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

class SystemHealthAlertService {
  private static instance: SystemHealthAlertService;
  private alertRules: AlertRule[] = [];
  private activeAlerts: Alert[] = [];

  static getInstance(): SystemHealthAlertService {
    if (!SystemHealthAlertService.instance) {
      SystemHealthAlertService.instance = new SystemHealthAlertService();
    }
    return SystemHealthAlertService.instance;
  }

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    this.alertRules = [
      {
        id: 'db_response_time',
        name: 'Database Response Time Alert',
        metric: 'database.responseTime',
        condition: 'greater_than',
        threshold: 1000,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 5,
        recipients: ['admin@system.local']
      },
      {
        id: 'memory_usage',
        name: 'High Memory Usage Alert',
        metric: 'memory.percentage',
        condition: 'greater_than',
        threshold: 85,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 10,
        recipients: ['admin@system.local']
      },
      {
        id: 'storage_usage',
        name: 'Critical Storage Usage Alert',
        metric: 'storage.percentage',
        condition: 'greater_than',
        threshold: 90,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 15,
        recipients: ['admin@system.local']
      },
      {
        id: 'api_response_time',
        name: 'API Response Time Alert',
        metric: 'api.responseTime',
        condition: 'greater_than',
        threshold: 2000,
        severity: 'medium',
        enabled: true,
        cooldownMinutes: 5,
        recipients: ['admin@system.local']
      },
      {
        id: 'security_failed_logins',
        name: 'Multiple Failed Login Attempts',
        metric: 'security.failedLogins',
        condition: 'greater_than',
        threshold: 10,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 30,
        recipients: ['admin@system.local', 'security@system.local']
      },
      {
        id: 'system_overall_health',
        name: 'System Health Degradation',
        metric: 'overall',
        condition: 'not_equals',
        threshold: 0, // 0 = healthy, 1 = warning, 2 = error
        severity: 'high',
        enabled: true,
        cooldownMinutes: 5,
        recipients: ['admin@system.local']
      }
    ];
  }

  async evaluateAlerts(health: SystemHealth): Promise<Alert[]> {
    const newAlerts: Alert[] = [];
    const now = new Date().toISOString();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered) {
        const lastTriggered = new Date(rule.lastTriggered);
        const cooldownEnd = new Date(lastTriggered.getTime() + rule.cooldownMinutes * 60 * 1000);
        if (new Date() < cooldownEnd) {
          continue;
        }
      }

      const currentValue = this.getMetricValue(health, rule.metric);
      const shouldTrigger = this.evaluateCondition(currentValue, rule.condition, rule.threshold);

      if (shouldTrigger) {
        const alert: Alert = {
          id: `${rule.id}_${Date.now()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          metric: rule.metric,
          currentValue,
          threshold: rule.threshold,
          severity: rule.severity,
          message: this.generateAlertMessage(rule, currentValue),
          timestamp: now,
          acknowledged: false
        };

        newAlerts.push(alert);
        
        // Update last triggered time
        rule.lastTriggered = now;

        // Send notifications
        await this.sendAlertNotifications(alert, rule.recipients);
      }
    }

    // Add to active alerts
    this.activeAlerts.push(...newAlerts);

    // Store in database
    if (newAlerts.length > 0) {
      await this.storeAlerts(newAlerts);
    }

    return newAlerts;
  }

  private getMetricValue(health: SystemHealth, metric: string): number {
    const parts = metric.split('.');
    let value: any = health;

    for (const part of parts) {
      value = value?.[part];
    }

    // Convert overall health status to numeric
    if (metric === 'overall') {
      return health.overall === 'healthy' ? 0 : 
             health.overall === 'warning' ? 1 : 2;
    }

    return typeof value === 'number' ? value : 0;
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      default:
        return false;
    }
  }

  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const metricName = rule.metric.split('.').pop() || rule.metric;
    
    switch (rule.condition) {
      case 'greater_than':
        return `${metricName} (${currentValue}) exceeded threshold of ${rule.threshold}`;
      case 'less_than':
        return `${metricName} (${currentValue}) fell below threshold of ${rule.threshold}`;
      case 'equals':
        return `${metricName} equals critical value of ${rule.threshold}`;
      case 'not_equals':
        if (rule.metric === 'overall') {
          const statusName = currentValue === 1 ? 'warning' : 'error';
          return `System health status changed to ${statusName}`;
        }
        return `${metricName} changed from expected value`;
      default:
        return `Alert triggered for ${metricName}`;
    }
  }

  private async sendAlertNotifications(alert: Alert, recipients: string[]): Promise<void> {
    try {
      // Send email notifications via Supabase Edge Function
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          recipients,
          subject: `[${alert.severity.toUpperCase()}] ${alert.ruleName}`,
          message: alert.message,
          alertDetails: {
            metric: alert.metric,
            currentValue: alert.currentValue,
            threshold: alert.threshold,
            timestamp: alert.timestamp
          }
        }
      });

      if (error) {
        console.error('Failed to send alert notifications:', error);
      } else {
        console.log(`✅ Alert notifications sent to ${recipients.length} recipients`);
      }

      // Store notification in database
      await supabase.from('notifications').insert({
        recipient_username: 'admin', // Default to admin
        title: alert.ruleName,
        message: alert.message,
        notification_type: 'system_alert',
        related_data: {
          alertId: alert.id,
          severity: alert.severity,
          metric: alert.metric,
          currentValue: alert.currentValue,
          threshold: alert.threshold
        }
      });

    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  }

  private async storeAlerts(alerts: Alert[]): Promise<void> {
    try {
      const alertRecords = alerts.map(alert => ({
        alert_id: alert.id,
        rule_id: alert.ruleId,
        rule_name: alert.ruleName,
        metric: alert.metric,
        current_value: alert.currentValue,
        threshold: alert.threshold,
        severity: alert.severity,
        message: alert.message,
        acknowledged: alert.acknowledged,
        created_at: alert.timestamp
      }));

      const { error } = await supabase
        .from('system_alerts')
        .insert(alertRecords);

      if (error) {
        console.error('Failed to store alerts in database:', error);
      } else {
        console.log(`✅ Stored ${alerts.length} alerts in database`);
      }
    } catch (error) {
      console.error('Error storing alerts:', error);
    }
  }

  async acknowledgeAlert(alertDbId: string, acknowledgedBy: string): Promise<boolean> {
    try {
      const acknowledgedAt = new Date().toISOString();

      // Update in database
      const { error } = await supabase
        .from('system_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: acknowledgedBy,
          acknowledged_at: acknowledgedAt
        })
        .eq('id', alertDbId); // Use the database row's UUID

      if (error) {
        console.error('Failed to acknowledge alert in database:', error);
        return false;
      }

      // Since we don't have a reliable way to map db id to internal alert id,
      // we will just log success and let the UI refetch.
      console.log(`✅ Alert ${alertDbId} acknowledged by ${acknowledgedBy}`);
      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  getActiveAlerts(): Alert[] {
    return this.activeAlerts.filter(alert => !alert.acknowledged);
  }

  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return false;

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    console.log(`✅ Updated alert rule: ${ruleId}`);
    return true;
  }

  addAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `custom_${Date.now()}`
    };

    this.alertRules.push(newRule);
    console.log(`✅ Added new alert rule: ${newRule.id}`);
    return newRule;
  }

  removeAlertRule(ruleId: string): boolean {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return false;

    this.alertRules.splice(ruleIndex, 1);
    console.log(`✅ Removed alert rule: ${ruleId}`);
    return true;
  }

  getAlertStats(): {
    totalRules: number;
    enabledRules: number;
    activeAlerts: number;
    criticalAlerts: number;
    acknowledgedAlerts: number;
  } {
    const activeAlerts = this.getActiveAlerts();
    
    return {
      totalRules: this.alertRules.length,
      enabledRules: this.alertRules.filter(r => r.enabled).length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
      acknowledgedAlerts: this.activeAlerts.filter(a => a.acknowledged).length
    };
  }
}

// Export singleton instance
export const systemHealthAlertService = SystemHealthAlertService.getInstance();