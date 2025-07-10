import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';

interface SecurityStatus {
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  activeUsers: number;
  recentFailedLogins: number;
  lockedAccounts: number;
  lastUpdated: Date;
}

export function SecurityStatusWidget() {
  const [status, setStatus] = useState<SecurityStatus>({
    threatLevel: 'LOW',
    activeUsers: 0,
    recentFailedLogins: 0,
    lockedAccounts: 0,
    lastUpdated: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSecureAuth();

  // Only show to admins
  if (user?.role !== 'admin') {
    return null;
  }

  useEffect(() => {
    loadSecurityStatus();
    
    // Update every 30 seconds
    const interval = setInterval(loadSecurityStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityStatus = async () => {
    try {
      setIsLoading(true);
      
      // Get user statistics
      const { data: users, error } = await supabase
        .from('staff')
        .select('account_status, failed_login_attempts, last_failed_login');

      if (error) throw error;

      const activeUsers = users?.filter(u => u.account_status === 'active').length || 0;
      const lockedAccounts = users?.filter(u => u.account_status === 'locked').length || 0;
      
      // Count recent failed logins (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentFailedLogins = users?.filter(u => 
        u.last_failed_login && new Date(u.last_failed_login) > twentyFourHoursAgo
      ).length || 0;

      // Determine threat level
      let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (recentFailedLogins >= 20 || lockedAccounts >= 5) {
        threatLevel = 'CRITICAL';
      } else if (recentFailedLogins >= 10 || lockedAccounts >= 3) {
        threatLevel = 'HIGH';
      } else if (recentFailedLogins >= 5 || lockedAccounts >= 1) {
        threatLevel = 'MEDIUM';
      }

      setStatus({
        threatLevel,
        activeUsers,
        recentFailedLogins,
        lockedAccounts,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error loading security status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getThreatLevelIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Tình trạng Bảo mật</span>
        </CardTitle>
        <Link to="/security-monitor">
          <Button variant="outline" size="sm">
            Xem chi tiết
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Threat Level */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mức độ đe dọa:</span>
              <Badge className={`${getThreatLevelColor(status.threatLevel)} flex items-center space-x-1`}>
                {getThreatLevelIcon(status.threatLevel)}
                <span>{status.threatLevel}</span>
              </Badge>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 text-blue-500 mr-1" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{status.activeUsers}</div>
                <div className="text-xs text-gray-600">Người dùng hoạt động</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
                </div>
                <div className="text-2xl font-bold text-red-600">{status.recentFailedLogins}</div>
                <div className="text-xs text-gray-600">Thất bại 24h</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Shield className="w-4 h-4 text-orange-500 mr-1" />
                </div>
                <div className="text-2xl font-bold text-orange-600">{status.lockedAccounts}</div>
                <div className="text-xs text-gray-600">Tài khoản khóa</div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center">
              Cập nhật lần cuối: {status.lastUpdated.toLocaleTimeString('vi-VN')}
            </div>

            {/* Alerts */}
            {status.threatLevel === 'CRITICAL' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Cảnh báo nghiêm trọng!</span>
                </div>
                <p className="text-xs text-red-700 mt-1">
                  Hệ thống có thể đang bị tấn công. Hãy kiểm tra ngay.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}