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
  Smartphone,
  Settings,
  ChevronDown,
  HardDrive
} from 'lucide-react';
import { isAdmin, isNqOrAdmin } from '@/utils/permissions';
import { NotificationBell } from '@/components/NotificationBell';
import { requestNotificationPermission, subscribeUserToPush } from '@/utils/pushNotificationUtils';
import { toast } from 'sonner';

export const NavigationHeader: React.FC = () => {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const { user, logout } = useSecureAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  const isMountedRef = useRef(false);

  // useEffect MUST be called unconditionally
  useEffect(() => {
    if (isMountedRef.current) {
      console.warn('⚠️ Multiple NavigationHeader instances detected');
      return;
    }
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Early return AFTER all hooks have been called
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEnableNotifications = async () => {
    if (!user || !user.username) return;
    
    setIsEnablingNotifications(true);
    
    try {
      console.log('🔔 Bắt đầu quá trình bật thông báo...');
      
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        toast.info('🚧 Chế độ phát triển', {
          description: 'Push notifications có thể bị hạn chế trên localhost. Tính năng đầy đủ có sẵn trên HTTPS production.',
          duration: 5000
        });
      }
      
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        console.log('✅ Quyền thông báo đã được cấp');
        
        const subscriptionSuccess = await subscribeUserToPush(user.username);
        
        if (subscriptionSuccess) {
          if (isDevelopment) {
            toast.success('🔔 Thông báo đã bật (Chế độ phát triển)', {
              description: 'Thông báo local đang hoạt động. Để có push notifications đầy đủ, hãy deploy lên môi trường HTTPS production.',
              duration: 8000
            });
          } else {
            toast.success('🔔 Push Notifications đã bật!', {
              description: 'Bạn sẽ nhận được thông báo về nhắc nhở tài sản và cập nhật quan trọng, ngay cả khi app đã đóng.',
              duration: 5000
            });
          }
        } else {
          toast.warning('⚠️ Hỗ trợ thông báo hạn chế', {
            description: 'Push notifications không khả dụng, nhưng bạn sẽ nhận thông báo khi app đang mở.',
            duration: 6000
          });
        }
      } else if (permission === 'denied') {
        toast.error('❌ Thông báo bị chặn', {
          description: 'Bạn đã từ chối quyền thông báo. Vui lòng bật trong cài đặt trình duyệt để nhận cảnh báo.',
          duration: 8000
        });
      } else {
        toast.warning('⚠️ Cần quyền thông báo', {
          description: 'Vui lòng cho phép thông báo để nhận nhắc nhở tài sản và cập nhật quan trọng.',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('❌ Lỗi khi bật thông báo:', error);
      toast.error('❌ Thiết lập thông báo thất bại', {
        description: 'Có lỗi khi thiết lập thông báo. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
        duration: 5000
      });
    } finally {
      setIsEnablingNotifications(false);
    }
  };

  // Define system paths to exclude from main navigation
  const systemPaths = [
    '/data-management',
    '/security-monitor', 
    '/error-monitoring',
    '/usage-monitoring',
    '/system-backup'
  ];

  // MAIN NAVIGATION ITEMS - ABSOLUTELY NO SYSTEM ITEMS
  const navigationItems = [
    {
      name: 'Trang chủ',
      href: '/',
      icon: Home,
      show: true
    },
    {
      name: 'Thông báo M/X',
      href: '/asset-entry',
      icon: Package,
      show: true
    },
    {
      name: 'DS TS cần lấy',
      href: '/daily-report',
      icon: FileText,
      show: true
    },
    {
      name: 'Báo cáo TS',
      href: '/borrow-report',
      icon: BarChart3,
      show: isNqOrAdmin(user)
    },
    {
      name: 'Nhắc nhở TS',
      href: '/asset-reminders',
      icon: Bell,
      show: isNqOrAdmin(user)
    },
    {
      name: 'Nhắc nhở CRC',
      href: '/crc-reminders',
      icon: Bell,
      show: isNqOrAdmin(user)
    },
    {
      name: 'Tài sản khác',
      href: '/other-assets',
      icon: Package,
      show: isNqOrAdmin(user)
    },
    {
      name: 'Thông báo',
      href: '/notifications',
      icon: Bell,
      show: true
    }
  ].filter(item => !systemPaths.includes(item.href)); // Extra safety filter

  // SYSTEM MENU ITEMS - ONLY FOR DROPDOWN
  const systemMenuItems = [
    {
      name: 'Quản lý DL',
      href: '/data-management',
      icon: Database,
      show: isAdmin(user)
    },
    {
      name: 'Bảo mật',
      href: '/security-monitor',
      icon: Shield,
      show: isAdmin(user)
    },
    {
      name: 'Lỗi hệ thống',
      href: '/error-monitoring',
      icon: Activity,
      show: isAdmin(user)
    },
    {
      name: 'Sử dụng',
      href: '/usage-monitoring',
      icon: BarChart3,
      show: isAdmin(user)
    },
    {
      name: 'Backup & Restore',
      href: '/system-backup',
      icon: HardDrive,
      show: isAdmin(user)
    }
  ];

  const visibleItems = navigationItems.filter(item => item.show);
  const visibleSystemItems = systemMenuItems.filter(item => item.show);

  // Check if any system menu item is currently active
  const isSystemMenuActive = visibleSystemItems.some(item => location.pathname === item.href);

  // Enhanced debug logging
  console.log('🔍 Navigation Debug:', {
    userRole: user?.role,
    userDepartment: user?.department,
    isAdminResult: isAdmin(user),
    visibleMainItems: visibleItems.length,
    mainItemNames: visibleItems.map(item => item.name),
    visibleSystemItems: visibleSystemItems.length,
    systemItemNames: visibleSystemItems.map(item => item.name),
    isSystemMenuActive,
    currentPath: location.pathname,
    shouldShowSystemMenu: visibleSystemItems.length > 0
  });

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">
                Asset Manager
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {/* MAIN NAVIGATION ITEMS ONLY */}
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="inline-block w-4 h-4 mr-1" />
                  {item.name}
                </Link>
              );
            })}

            {/* SYSTEM MENU DROPDOWN */}
            {visibleSystemItems.length > 0 && (
              <DropdownMenu open={isSystemMenuOpen} onOpenChange={setIsSystemMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      isSystemMenuActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="inline-block w-4 h-4 mr-1" />
                    Hệ thống
                    <ChevronDown className="inline-block w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {visibleSystemItems.map((item, index) => (
                    <React.Fragment key={item.href}>
                      <DropdownMenuItem asChild>
                        <Link
                          to={item.href}
                          className="flex items-center w-full cursor-pointer"
                          onClick={() => setIsSystemMenuOpen(false)}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                      {index < visibleSystemItems.length - 1 && <DropdownMenuSeparator />}
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Menu */}
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
                  <div className="font-medium text-gray-900">
                    {user.staff_name || user.username}
                  </div>
                  <div className="text-xs">
                    {user.role} - {user.department}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleEnableNotifications}
                  disabled={isEnablingNotifications}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  {isEnablingNotifications ? 'Đang bật...' : 'Bật thông báo đẩy'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/reset-password" className="flex items-center">
                    <Key className="mr-2 h-4 w-4" />
                    Đổi mật khẩu
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* MAIN NAVIGATION ITEMS ONLY */}
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="inline-block w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}

              {/* MOBILE SYSTEM MENU SECTION */}
              {visibleSystemItems.length > 0 && (
                <>
                  <div className="px-3 py-2 text-sm font-medium text-gray-500 border-t border-gray-200 mt-2 pt-4">
                    <Settings className="inline-block w-4 h-4 mr-2" />
                    Hệ thống
                  </div>
                  {visibleSystemItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`block px-6 py-2 rounded-md text-base font-medium transition-colors ${
                          isActive
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="inline-block w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    );
                  })}
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