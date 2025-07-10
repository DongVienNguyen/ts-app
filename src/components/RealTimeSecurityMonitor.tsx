import { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Users, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Activity, 
  Clock, 
  Key,
  Wifi,
  WifiOff,
  Pause,
  Play,
  RotateCcw,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { getSecurityLogs, SecurityEvent, logSecurityEvent } from '@/utils/secureAuthUtils';

interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  recentFailedLogins: number;
  securityEvents: SecurityEvent[];
  onlineUsers: number;
  suspiciousActivities: number;
  lastUpdated: Date;
}

interface RealTimeMetrics {
  loginAttempts: number;
  failedLogins: number;
  successfulLogins: number;
  accountLocks: number;
  passwordResets: number;
  suspiciousActivities: number;
}

interface AlertConfig {
  enabled: boolean;
  threshold: number;
  type: 'sound' | 'notification' | 'both';
}

export function RealTimeSecurityMonitor() {
  const [stats, setStats] = useState<SecurityStats>({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    recentFailedLogins: 0,
    securityEvents: [],
    onlineUsers: 0,
    suspiciousActivities: 0,
    lastUpdated: new Date()
  });

  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    loginAttempts: 0,
    failedLogins: 0,
    successfulLogins: 0,
    accountLocks: 0,
    passwordResets: 0,
    suspiciousActivities: 0
  });

  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    enabled: true,
    threshold: 5,
    type: 'both'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for alerts
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const createBeepSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    audioRef.current = {
      play: () => Promise.resolve(createBeepSound())
    } as HTMLAudioElement;
  }, []);

  // Real-time data fetching
  useEffect(() => {
    if (isRealTimeEnabled && !isPaused) {
      loadSecurityStats();
      
      // Set up interval for real-time updates
      intervalRef.current = setInterval(() => {
        loadSecurityStats();
        updateRealTimeMetrics();
      }, 5000); // Update every 5 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRealTimeEnabled, isPaused]);

  // Simulate connection status
  useEffect(() => {
    setIsConnected(isRealTimeEnabled && !isPaused);
  }, [isRealTimeEnabled, isPaused]);

  const loadSecurityStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load user statistics
      const { data: users, error: usersError } = await supabase
        .from('staff')
        .select('account_status, failed_login_attempts, last_failed_login');

      if (usersError) throw usersError;

      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.account_status === 'active').length || 0;
      const lockedUsers = users?.filter(u => u.account_status === 'locked').length || 0;

      // Count recent failed logins (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentFailedLogins = users?.filter(u => 
        u.last_failed_login && new Date(u.last_failed_login) > twentyFourHoursAgo
      ).length || 0;

      // Load security events from localStorage
      const securityEvents = getSecurityLogs().slice(0, 20); // Last 20 events

      // Simulate online users and suspicious activities
      const onlineUsers = Math.floor(activeUsers * 0.3); // Assume 30% are online
      const suspiciousActivities = securityEvents.filter(e => 
        e.type === 'SUSPICIOUS_ACTIVITY' || e.type === 'RATE_LIMIT_EXCEEDED'
      ).length;

      setStats({
        totalUsers,
        activeUsers,
        lockedUsers,
        recentFailedLogins,
        securityEvents,
        onlineUsers,
        suspiciousActivities,
        lastUpdated: new Date()
      });

      // Check for alerts
      if (alertConfig.enabled && recentFailedLogins >= alertConfig.threshold) {
        triggerAlert(`Cảnh báo: ${recentFailedLogins} lần đăng nhập thất bại trong 24h qua!`);
      }

    } catch (error) {
      console.error('Error loading security stats:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRealTimeMetrics = () => {
    const recentEvents = getSecurityLogs().filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      return eventTime > fiveMinutesAgo;
    });

    setRealTimeMetrics({
      loginAttempts: recentEvents.filter(e => e.type.includes('LOGIN')).length,
      failedLogins: recentEvents.filter(e => e.type === 'LOGIN_FAILED').length,
      successfulLogins: recentEvents.filter(e => e.type === 'LOGIN_SUCCESS').length,
      accountLocks: recentEvents.filter(e => e.type === 'ACCOUNT_LOCKED').length,
      passwordResets: recentEvents.filter(e => e.type.includes('PASSWORD_RESET')).length,
      suspiciousActivities: recentEvents.filter(e => 
        e.type === 'SUSPICIOUS_ACTIVITY' || e.type === 'RATE_LIMIT_EXCEEDED'
      ).length
    });
  };

  const triggerAlert = (message: string) => {
    if (alertConfig.type === 'sound' || alertConfig.type === 'both') {
      audioRef.current?.play().catch(console.error);
    }
    
    if (alertConfig.type === 'notification' || alertConfig.type === 'both') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Cảnh báo bảo mật', {
          body: message,
          icon: '/favicon.ico'
        });
      }
    }

    logSecurityEvent('SECURITY_ALERT_TRIGGERED', { message, threshold: alertConfig.threshold });
  };

  const resetMetrics = () => {
    setRealTimeMetrics({
      loginAttempts: 0,
      failedLogins: 0,
      successfulLogins: 0,
      accountLocks: 0,
      passwordResets: 0,
      suspiciousActivities: 0
    });
    logSecurityEvent('METRICS_RESET', { resetBy: 'admin' });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'LOGIN_SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'LOGIN_FAILED':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'ACCOUNT_LOCKED':
        return <Lock className="w-4 h-4 text-orange-500" />;
      case 'ACCOUNT_UNLOCKED':
        return <Unlock className="w-4 h-4 text-blue-500" />;
      case 'PASSWORD_RESET_SUCCESS':
        return <Key className="w-4 h-4 text-purple-500" />;
      case 'SUSPICIOUS_ACTIVITY':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'RATE_LIMIT_EXCEEDED':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventDescription = (event: SecurityEvent) => {
    switch (event.type) {
      case 'LOGIN_SUCCESS':
        return `Đăng nhập thành công`;
      case 'LOGIN_FAILED':
        return `Đăng nhập thất bại`;
      case 'ACCOUNT_LOCKED':
        return `Tài khoản bị khóa`;
      case 'ACCOUNT_UNLOCKED':
        return `Tài khoản được mở khóa`;
      case 'PASSWORD_RESET_SUCCESS':
        return `Đổi mật khẩu thành công`;
      case 'PASSWORD_RESET_FAILED':
        return `Đổi mật khẩu thất bại`;
      case 'RATE_LIMIT_EXCEEDED':
        return `Vượt quá giới hạn thử`;
      case 'SUSPICIOUS_ACTIVITY':
        return `Hoạt động đáng nghi`;
      case 'SECURITY_ALERT_TRIGGERED':
        return `Cảnh báo bảo mật được kích hoạt`;
      case 'METRICS_RESET':
        return `Đặt lại số liệu thống kê`;
      default:
        return event.type;
    }
  };

  const getMetricTrend = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Không thể tải dữ liệu theo dõi thời gian thực: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Theo dõi Bảo mật Thời gian Thực</h1>
            <p className="text-gray-600">
              Giám sát hoạt động bảo mật trực tiếp - Cập nhật lần cuối: {stats.lastUpdated.toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
            </span>
          </div>

          {/* Real-time Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={isRealTimeEnabled}
              onCheckedChange={setIsRealTimeEnabled}
            />
            <span className="text-sm">Thời gian thực</span>
          </div>

          {/* Pause/Play Button */}
          <Button
            onClick={() => setIsPaused(!isPaused)}
            variant="outline"
            size="sm"
            disabled={!isRealTimeEnabled}
          >
            {isPaused ? (
              <Play className="w-4 h-4 mr-2" />
            ) : (
              <Pause className="w-4 h-4 mr-2" />
            )}
            {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          </Button>

          {/* Reset Metrics */}
          <Button
            onClick={resetMetrics}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Đặt lại
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Số liệu thời gian thực (5 phút qua)</span>
            {isRealTimeEnabled && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{realTimeMetrics.loginAttempts}</div>
              <div className="text-sm text-gray-600">Thử đăng nhập</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{realTimeMetrics.successfulLogins}</div>
              <div className="text-sm text-gray-600">Thành công</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{realTimeMetrics.failedLogins}</div>
              <div className="text-sm text-gray-600">Thất bại</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{realTimeMetrics.accountLocks}</div>
              <div className="text-sm text-gray-600">Khóa tài khoản</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{realTimeMetrics.passwordResets}</div>
              <div className="text-sm text-gray-600">Đổi mật khẩu</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{realTimeMetrics.suspiciousActivities}</div>
              <div className="text-sm text-gray-600">Hoạt động nghi ngờ</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-600">Tổng người dùng</p>
                </div>
              </div>
              <Badge variant="secondary">{stats.onlineUsers} online</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                <p className="text-sm text-gray-600">Tài khoản hoạt động</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Lock className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.lockedUsers}</p>
                <p className="text-sm text-gray-600">Tài khoản bị khóa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.recentFailedLogins}</p>
                <p className="text-sm text-gray-600">Thất bại 24h qua</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Cấu hình Cảnh báo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={alertConfig.enabled}
                onCheckedChange={(enabled) => setAlertConfig(prev => ({ ...prev, enabled }))}
              />
              <span className="text-sm">Bật cảnh báo</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm">Ngưỡng cảnh báo:</span>
              <select
                value={alertConfig.threshold}
                onChange={(e) => setAlertConfig(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={3}>3 lần thất bại</option>
                <option value={5}>5 lần thất bại</option>
                <option value={10}>10 lần thất bại</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm">Loại cảnh báo:</span>
              <select
                value={alertConfig.type}
                onChange={(e) => setAlertConfig(prev => ({ ...prev, type: e.target.value as 'sound' | 'notification' | 'both' }))}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="sound">Âm thanh</option>
                <option value="notification">Thông báo</option>
                <option value="both">Cả hai</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Luồng Hoạt động Trực tiếp</span>
            {isRealTimeEnabled && (
              <Badge variant="outline" className="ml-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                LIVE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Đang tải dữ liệu...</span>
            </div>
          ) : stats.securityEvents.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.securityEvents.map((event, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{getEventDescription(event)}</span>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(event.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                    {event.data?.username && (
                      <p className="text-sm text-gray-600">Người dùng: {event.data.username}</p>
                    )}
                    {event.data?.message && (
                      <p className="text-sm text-gray-600">{event.data.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có hoạt động bảo mật nào được ghi nhận</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Alerts */}
      {stats.recentFailedLogins > 5 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cảnh báo cao:</strong> Phát hiện {stats.recentFailedLogins} lần đăng nhập thất bại trong 24h qua. 
            Hệ thống có thể đang bị tấn công brute force!
          </AlertDescription>
        </Alert>
      )}

      {stats.suspiciousActivities > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Phát hiện {stats.suspiciousActivities} hoạt động đáng nghi. Hãy kiểm tra log chi tiết.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}