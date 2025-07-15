import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  Package, 
  FileText, 
  Bell, 
  Database,
  BarChart3, 
  LogOut,
  User,
  ChevronDown,
  Home,
  Shield,
  Activity,
  Key,
  Settings,
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

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, loading } = useSecureAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);
  
  const { status: pushStatus, refreshStatus } = usePushNotificationStatus();
  const { canInstall, triggerInstall } = usePWAInstall();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not loading, and we are on login or there is no user, just render children
  // This allows Login page to render, and ProtectedRoute to handle redirects
  if (location.pathname === '/login' || !user) {
    return <>{children}</>;
  }

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

  const renderSetupButtons = (isMobile = false, onLinkClick?: () => void) => {
    const showNotificationSetupButton = pushStatus !== 'granted' && pushStatus !== 'unsupported' && pushStatus !== 'loading';

    return (
      <div className={`flex items-center gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
        {canInstall && (
          <Button
            variant="outline"
            size={isMobile ? 'default' : 'sm'}
            onClick={() => {
              handleInstallPWA();
              if (isMobile && onLinkClick) onLinkClick();
            }}
            className={`items-center text-blue-600 border-blue-400 hover:bg-blue-50 hover:text-blue-700 animate-pulse ${isMobile ? 'w-full' : ''}`}
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
            onClick={() => {
              handleEnableNotifications();
              if (isMobile && onLinkClick) onLinkClick();
            }}
            disabled={isEnablingNotifications}
            className={`items-center text-yellow-600 border-yellow-400 hover:bg-yellow-50 hover:text-yellow-700 animate-pulse ${isMobile ? 'w-full' : ''}`}
            title="Cài đặt thông báo để nhận cảnh báo real-time"
          >
            <BellRing className="h-4 w-4 mr-2" />
            {isEnablingNotifications ? 'Đang cài đặt...' : 'Cài đặt thông báo'}
          </Button>
        )}
      </div>
    );
  };

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => {
    const [isSystemDropdownOpen, setIsSystemDropdownOpen] = useState(false);
    const userIsAdmin = isAdmin(user);
    const userIsNqOrAdmin = isNqOrAdmin(user);

    const mainNavigationItems = [
      { name: 'Trang chủ', href: '/', icon: Home, show: true },
      { name: 'Thông báo M/X', href: '/asset-entry', icon: Package, show: true },
      { name: 'DS TS cần lấy', href: '/daily-report', icon: FileText, show: true },
      { name: 'Báo cáo TS', href: '/borrow-report', icon: BarChart3, show: userIsNqOrAdmin },
      { name: 'Nhắc nhở TS', href: '/asset-reminders', icon: Bell, show: userIsNqOrAdmin },
      { name: 'Nhắc nhở CRC', href: '/crc-reminders', icon: Bell, show: userIsNqOrAdmin },
      { name: 'Tài sản khác', href: '/other-assets', icon: Package, show: userIsNqOrAdmin },
      { name: 'Thông báo', href: '/notifications', icon: Bell, show: true }
    ].filter(item => item.show);

    const systemItems = [
      { name: 'Quản lý DL', href: '/data-management', icon: Database, show: userIsAdmin },
      { name: 'Bảo mật', href: '/security-monitor', icon: Shield, show: userIsAdmin },
      { name: 'Lỗi hệ thống', href: '/error-monitoring', icon: Activity, show: userIsAdmin },
      { name: 'Sử dụng', href: '/usage-monitoring', icon: BarChart3, show: userIsAdmin },
      { name: 'Backup & Restore', href: '/backup', icon: HardDrive, show: userIsAdmin }
    ].filter(item => item.show);

    return (
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Asset Manager</span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li className="px-2 py-4 border-b border-gray-200 lg:hidden">
              {renderSetupButtons(true, onLinkClick)}
            </li>
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {mainNavigationItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={onLinkClick}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          isActive
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                        }`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
            {systemItems.length > 0 && (
              <li>
                <DropdownMenu open={isSystemDropdownOpen} onOpenChange={setIsSystemDropdownOpen} modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full justify-start ${
                        systemItems.some(item => location.pathname.startsWith(item.href))
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                      }`}
                    >
                      <Settings className="h-6 w-6 shrink-0" />
                      Hệ thống
                      <ChevronDown
                        className={`ml-auto h-5 w-5 shrink-0 transform transition-transform duration-200 ${
                          isSystemDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="w-56">
                    {systemItems.map((item) => {
                      const isActive = location.pathname.startsWith(item.href);
                      return (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link
                            to={item.href}
                            onClick={() => {
                              onLinkClick?.();
                              setIsSystemDropdownOpen(false);
                            }}
                            className={`group flex gap-x-3 rounded-md py-2 pr-2 pl-4 text-sm leading-6 font-semibold w-full ${
                              isActive
                                ? 'bg-green-100 text-green-700'
                                : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                            }`}
                          >
                            <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                            {item.name}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )}
            <li className="mt-auto">
              <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{user.staff_name || user.username}</p>
                  <p className="truncate text-xs text-gray-500">{user.role} - {user.department}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (onLinkClick) onLinkClick();
                  logout();
                }}
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  return (
    <div>
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent className="w-72 p-0" side="left">
          <SheetHeader className="sr-only">
            <SheetTitle>Main Menu</SheetTitle>
            <SheetDescription>
              Main navigation menu for the Asset Management System.
            </SheetDescription>
          </SheetHeader>
          <SidebarContent onLinkClick={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
            <div className="hidden lg:flex items-center gap-x-2">
              {renderSetupButtons(false)}
            </div>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-x-2 p-1.5">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-2 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                      {user.staff_name || user.username}
                    </span>
                    <ChevronDown className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium text-gray-900 truncate">{user.staff_name || user.username}</p>
                  <p className="text-sm text-gray-500 truncate">{user.role} - {user.department}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/reset-password" className="flex items-center cursor-pointer">
                    <Key className="w-4 h-4 mr-2" />
                    Đổi mật khẩu
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 hover:bg-red-50 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <main className="py-8">
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;