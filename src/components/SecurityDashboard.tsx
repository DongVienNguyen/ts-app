import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, Unlock, AlertTriangle, CheckCircle, Eye, Activity, Clock, Key } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { getSecurityLogs, SecurityEvent } from '@/utils/secureAuthUtils';

interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  recentFailedLogins: number;
  securityEvents: SecurityEvent[];
}

export function SecurityDashboard() {
  const [stats, setStats] = useState<SecurityStats>({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    recentFailedLogins: 0,
    securityEvents: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityStats();
  }, []);

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
      const securityEvents = getSecurityLogs().slice(0, 10); // Last 10 events

      setStats({
        totalUsers,
        activeUsers,
        lockedUsers,
        recentFailedLogins,
        securityEvents
      });
    } catch (error) {
      console.error('Error loading security stats:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const getSecurityScore = () => {
    if (stats.totalUsers === 0) return 100;
    
    const lockedRatio = stats.lockedUsers / stats.totalUsers;
    const failedRatio = stats.recentFailedLogins / stats.totalUsers;
    
    // Calculate security score (0-100)
    let score = 100;
    score -= lockedRatio * 30; // Reduce score for locked accounts
    score -= failedRatio * 20; // Reduce score for failed logins
    
    return Math.max(0, Math.round(score));
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 75) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 60) return { level: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
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
      default:
        return event.type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải thống kê bảo mật...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Không thể tải thống kê bảo mật: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const securityScore = getSecurityScore();
  const securityLevel = getSecurityLevel(securityScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Dashboard Bảo mật</h1>
            <p className="text-gray-600">Tổng quan về tình trạng bảo mật hệ thống</p>
          </div>
        </div>
        <Button onClick={loadSecurityStats} variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Điểm số bảo mật</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{securityScore}/100</span>
                <Badge className={`${securityLevel.bg} ${securityLevel.color}`}>
                  {securityLevel.level}
                </Badge>
              </div>
              <Progress value={securityScore} className="h-3" />
            </div>
            <div className={`w-16 h-16 rounded-full ${securityLevel.bg} flex items-center justify-center`}>
              <Shield className={`w-8 h-8 ${securityLevel.color}`} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Điểm số dựa trên tỷ lệ tài khoản bị khóa và số lần đăng nhập thất bại gần đây
          </p>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-gray-600">Tổng người dùng</p>
              </div>
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

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Hoạt động bảo mật gần đây</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.securityEvents.length > 0 ? (
            <div className="space-y-3">
              {stats.securityEvents.map((event, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Khuyến nghị bảo mật</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.lockedUsers > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Có {stats.lockedUsers} tài khoản đang bị khóa. Hãy kiểm tra và mở khóa nếu cần thiết.
                </AlertDescription>
              </Alert>
            )}
            
            {stats.recentFailedLogins > 5 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Có {stats.recentFailedLogins} lần đăng nhập thất bại trong 24h qua. Hãy kiểm tra hoạt động bất thường.
                </AlertDescription>
              </Alert>
            )}

            {securityScore >= 90 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Hệ thống bảo mật đang hoạt động tốt! Tiếp tục duy trì các biện pháp bảo mật hiện tại.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Các biện pháp bảo mật đã triển khai:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✅ Mã hóa mật khẩu với bcrypt</li>
                <li>✅ Khóa tài khoản tự động sau 3 lần thất bại</li>
                <li>✅ Rate limiting cho đăng nhập và đổi mật khẩu</li>
                <li>✅ JWT authentication với thời gian hết hạn</li>
                <li>✅ Ghi log tất cả hoạt động bảo mật</li>
                <li>✅ Công cụ quản lý tài khoản cho admin</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}