import { useEffect, useState } from 'react';
import { subscribeToSecurityEvents, SecurityEvent } from '@/utils/realTimeSecurityUtils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SecurityNotification {
  id: string;
  event: SecurityEvent;
  severity: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  timestamp: Date;
}

export function useSecurityNotifications() {
  const [notifications, setNotifications] = useState<SecurityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Only admins should receive security notifications
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToSecurityEvents((event) => {
      const severity = getSeverityLevel(event);
      
      const notification: SecurityNotification = {
        id: `${event.timestamp}-${Math.random()}`,
        event,
        severity,
        read: false,
        timestamp: new Date(event.timestamp)
      };

      setNotifications(prev => [notification, ...prev].slice(0, 100)); // Keep last 100
      setUnreadCount(prev => prev + 1);

      // Show toast for high/critical events
      if (severity === 'high' || severity === 'critical') {
        toast.error(`Cảnh báo bảo mật: ${getEventMessage(event)}`, {
          duration: 10000,
          action: {
            label: 'Xem chi tiết',
            onClick: () => {
              // Navigate to security monitor
              window.location.href = '/security-monitor';
            }
          }
        });
      }

      // Request notification permission and show browser notification
      if (severity === 'critical' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Cảnh báo bảo mật nghiêm trọng', {
            body: getEventMessage(event),
            icon: '/favicon.ico',
            tag: 'security-alert'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Cảnh báo bảo mật nghiêm trọng', {
                body: getEventMessage(event),
                icon: '/favicon.ico',
                tag: 'security-alert'
              });
            }
          });
        }
      }
    });

    return unsubscribe;
  }, [isAdmin]);

  const getSeverityLevel = (event: SecurityEvent): 'low' | 'medium' | 'high' | 'critical' => {
    switch (event.type) {
      case 'LOGIN_FAILED':
        return 'medium';
      case 'ACCOUNT_LOCKED':
        return 'high';
      case 'SUSPICIOUS_ACTIVITY':
      case 'RATE_LIMIT_EXCEEDED':
        return 'critical';
      case 'SECURITY_ALERT_TRIGGERED':
        return 'critical';
      case 'SESSION_EXPIRED':
        return 'medium';
      case 'TOKEN_VALIDATION_FAILED':
        return 'high';
      default:
        return 'low';
    }
  };

  const getEventMessage = (event: SecurityEvent): string => {
    const messages: Record<string, string> = {
      'LOGIN_FAILED': `Đăng nhập thất bại từ ${event.username || 'người dùng không xác định'}`,
      'ACCOUNT_LOCKED': `Tài khoản ${event.username} đã bị khóa`,
      'SUSPICIOUS_ACTIVITY': `Phát hiện hoạt động đáng nghi từ ${event.username || 'nguồn không xác định'}`,
      'RATE_LIMIT_EXCEEDED': `Vượt quá giới hạn thử từ ${event.ip || 'IP không xác định'}`,
      'SECURITY_ALERT_TRIGGERED': `Cảnh báo bảo mật được kích hoạt`,
      'SESSION_EXPIRED': `Phiên làm việc của ${event.username} đã hết hạn`,
      'TOKEN_VALIDATION_FAILED': `Xác thực token thất bại`
    };
    return messages[event.type] || `Sự kiện bảo mật: ${event.type}`;
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isAdmin
  };
}