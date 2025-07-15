import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Package, 
  FileText, 
  Bell, 
  Database,
  Shield,
  Activity,
  BarChart3,
  Home,
  Key,
  Settings,
  ChevronDown,
  HardDrive,
  BellRing,
  Download
} from 'lucide-react';
import { isAdmin, isNqOrAdmin } from '@/utils/permissions';
import { NotificationBell } from '@/components/NotificationBell';
import { requestNotificationPermission, subscribeUserToPush } from '@/utils/pushNotificationUtils';
import { toast } from 'sonner';
import { usePushNotificationStatus } from '@/hooks/usePushNotificationStatus';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const NavigationHeader: React.FC = () => {
  const { user, logout } = useSecureAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  
  const { status: pushStatus, refreshStatus } = usePushNotificationStatus();
  const { canInstall, triggerInstall } = usePWAInstall();

  console.log('[NavigationHeader] Rendering with status:', { canInstall, pushStatus });

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleInstallPWA = async () => {
    const success = await triggerInstall();
    if (success) {
      toast.success('Ứng dụng đã được cài đặt thành công!');
    }
  };

  const handleEnableNotifications = async () => {
    if (!user || !user.username) return;
    
    setIsEnablingNotifications(true);
    
    try {
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        const subscriptionSuccess = await subscribeUserToPush(user.username);
        if (subscriptionSuccess) {
          toast.success('🔔 Push Notifications đã bật!', {
            description: 'Bạn sẽ nhận được các thông báo quan trọng.',
          });
        } else {
          toast.warning('⚠️ Hỗ trợ thông báo hạn chế', {
            description: 'Không thể đăng ký push, nhưng bạn sẽ nhận thông báo khi app đang mở.',
          });
        }
      } else if (permission === 'denied') {
        toast.error('❌ Thông báo bị chặn', {
          description: 'Vui lòng bật trong cài đặt trình duyệt để nhận cảnh báo.',
        });
      }
    } catch (error) {
      console.error('❌ Lỗi khi bật thông báo:', error);
      toast.error('❌ Thiết lập thông báo thất bại.');
    } finally {
      setIsEnablingNotifications(false);
      refreshStatus();
    }
  };

  const userIsAdmin = isAdmin(user);
  const userIsNqOrAdmin = isNqOrAdmin(user);

  const mainNavItems = [
    { name: 'Trang chủ', href: '/', icon: Home, show: true },
    { name: 'Thông báo M/X', href: '/asset-entry', icon: Package, show: true },
    { name: 'DS TS cần lấy', href: '/daily-report', icon: FileText, show: true },
    { name: 'Báo cáo TS', href: '/borrow-report', icon: BarChart3, show: userIsNqOrAdmin },
    { name: 'Nhắc nhở TS', href: '/asset-reminders', icon: Bell, show: userIsNqOrAdmin },
    { name: 'Nhắc nhở CRC', href: '/crc-reminders', icon: Bell, show: userIsNqOrAdmin },
    { name: 'Tài sản khác', href: '/other-assets', icon: Package, show: userIsNqOrAdmin },
    { name: 'Thông báo', href: '/notifications', icon: Bell, show: true }
  ].filter(item => item.show);

  const systemNavItems = [
    { name: 'Quản lý DL', href: '/data-management', icon: Database, show: userIsAdmin },
    { name: 'Bảo mật', href: '/security-monitor', icon: Shield, show: userIsAdmin },
    { name: 'Lỗi hệ thống', href: '/error-monitoring', icon: Activity, show: userIsAdmin },
    { name: 'Sử dụng', href: '/usage-monitoring', icon: BarChart3, show: userIsAdmin },
    { name: 'Backup & Restore', href: '/backup', icon: HardDrive, show: userIsAdmin }
  ].filter(item => item.show);

  const isSystemMenuActive = systemNavItems.some(item => location.pathname === item.href);

  const renderSetupButtons = (isMobile = false) => {
    // Show notification button if not granted, not unsupported, and not loading
    const showNotificationSetupButton = pushStatus !== 'granted' && pushStatus !== 'unsupported' && pushStatus !== 'loading';

    return (
    <>
      {canInstall && (
        <Button
          variant="outline"
          size={isMobile ? 'default' : 'sm'}
          onClick={isMobile ? () => { handleInstallPWA(); setIsMobileMenuOpen(false); } : handleInstallPWA}
          className={`${isMobile ? 'w-full' : 'hidden md:flex'} items-center text-blue-600 border-blue-400 hover:bg-blue-50 hover:text-blue-700 animate-pulse`}
          title="Cài đặt ứng dụng PWA để truy cập nhanh hơn"
        >
          <Download className="h-4 w-4 mr-2" />
          Cài đặt App
        </Button>
      )}
      {showNotificationSetupButton && (
        <Button
          variant="outline"
          size={isMobile ? 'default' : 'sm'}
          onClick={isMobile ? () => { handleEnableNotifications(); setIsMobileMenuOpen(false); } : handleEnableNotifications}
          disabled={isEnablingNotifications}
          className={`${isMobile ? 'w-full' : 'hidden md:flex'} items-center text-yellow-600 border-yellow-400 hover:bg-yellow-50 hover:text-yellow-700 animate-pulse`}
          title="Cài đặt thông báo để nhận cảnh báo real-time"
        >
          <BellRing className="h-4 w-4 mr-2" />
          {isEnablingNotifications ? 'Đang cài đặt...' : 'Cài đặt thông báo'}
        </Button>
      )}
    </>
  )};

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">
                Asset Manager
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.href ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <item.icon className="inline-block w-4 h-4 mr-1" />
                {item.name}
              </Link>
            ))}
            {systemNavItems.length > 0 && (
              <DropdownMenu open={isSystemMenuOpen} onOpenChange={setIsSystemMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`px-3 py-2 text-sm font-medium transition-colors ${isSystemMenuActive || isSystemMenuOpen ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                    <Settings className="inline-block w-4 h-4 mr-1" />
                    Hệ thống
                    <ChevronDown className="inline-block w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {systemNavItems.map((item, index) => (
                    <React.Fragment key={item.href}>
                      <DropdownMenuItem asChild>
                        <Link to={item.href} className="flex items-center w-full cursor-pointer">
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                      {index < systemNavItems.length - 1 && <DropdownMenuSeparator />}
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <div className="flex items-center space-x-2 md:space-x-4">
            {renderSetupButtons()}
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline-block">
                    {user.staff_name || user.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  <div className="font-medium text-gray-900">{user.staff_name || user.username}</div>
                  <div className="text-xs">{user.role} - {user.department}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/reset-password" className="flex items-center"><Key className="mr-2 h-4 w-4" />Đổi mật khẩu</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Đăng xuất</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="px-1 pb-2 space-y-2">{renderSetupButtons(true)}</div>
              {mainNavItems.map((item) => (
                <Link key={item.href} to={item.href} className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${location.pathname === item.href ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <item.icon className="inline-block w-4 h-4 mr-2" />{item.name}
                </Link>
              ))}
              {systemNavItems.length > 0 && (
                <>
                  <div className="px-3 py-2 text-sm font-medium text-gray-500 border-t border-gray-200 mt-2 pt-4">
                    <Settings className="inline-block w-4 h-4 mr-2" />
                    🔧 Hệ thống ({systemNavItems.length})
                  </div>
                  {systemNavItems.map((item) => (
                    <Link key={item.href} to={item.href} className={`block px-6 py-2 rounded-md text-base font-medium transition-colors ${location.pathname === item.href ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => setIsMobileMenuOpen(false)}>
                      <item.icon className="inline-block w-4 h-4 mr-2" />{item.name}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavigationHeader;