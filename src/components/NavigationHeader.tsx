import { useState } from 'react';
import { Package, Menu, LogOut, Key, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { NotificationBell } from './NotificationBell';
import { requestNotificationPermission, subscribeUserToPush } from '@/utils/pushNotificationUtils';
import { toast } from 'sonner';

export function NavigationHeader() {
  const { user, logout } = useSecureAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleEnableNotifications = async () => {
    if (!user || !user.username) return;
    
    setIsEnablingNotifications(true);
    
    try {
      console.log('🔔 Bắt đầu quá trình bật thông báo...');
      
      // Check if we're in development
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        toast.info('🚧 Development Mode', {
          description: 'Push notifications may be limited on localhost. Full functionality available on HTTPS production.',
          duration: 5000
        });
      }
      
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        console.log('✅ Quyền thông báo đã được cấp');
        
        const subscriptionSuccess = await subscribeUserToPush(user.username);
        
        if (subscriptionSuccess) {
          if (isDevelopment) {
            toast.success('🔔 Notifications Enabled (Development Mode)', {
              description: 'Local notifications are working. For full push notifications, deploy to HTTPS production environment.',
              duration: 8000
            });
          } else {
            toast.success('🔔 Push Notifications Enabled!', {
              description: 'You will now receive notifications about asset reminders and important updates, even when the app is closed.',
              duration: 5000
            });
          }
        } else {
          // Even if push subscription failed, we can still do local notifications
          toast.warning('⚠️ Limited Notification Support', {
            description: 'Push notifications unavailable, but you will receive notifications when the app is open.',
            duration: 6000
          });
        }
      } else if (permission === 'denied') {
        toast.error('❌ Notifications Blocked', {
          description: 'You have denied notification permissions. Please enable them in your browser settings to receive alerts.',
          duration: 8000
        });
      } else {
        toast.warning('⚠️ Notification Permission Required', {
          description: 'Please allow notifications to receive important asset reminders and updates.',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('❌ Lỗi khi bật thông báo:', error);
      toast.error('❌ Notification Setup Failed', {
        description: 'There was an error setting up notifications. Please try again or contact support.',
        duration: 5000
      });
    } finally {
      setIsEnablingNotifications(false);
    }
  };

  const allMenuItems = [
    { label: 'Thông báo Mượn/Xuất', path: '/asset-entry', icon: Package },
    { label: 'Danh sách TS cần lấy', path: '/daily-report', icon: Package },
    { label: 'Nhắc nhở Tài sản đến hạn', path: '/asset-reminders', icon: Package },
    { label: 'Nhắc nhở Duyệt CRC', path: '/crc-reminders', icon: Package },
    { label: 'Báo cáo tài sản đã mượn', path: '/borrow-report', icon: Package },
    { label: 'Tài sản, thùng khác gửi kho', path: '/other-assets', icon: Package },
    { label: 'Quản lý dữ liệu', path: '/data-management', icon: Package },
  ];

  const getVisibleMenuItems = () => {
    if (!user) return [];
    if (user.role === 'admin') {
      return allMenuItems;
    }

    if (user.role === 'user') {
      const standardUserDepartments = ['QLN', 'CMT8', 'NS', 'ĐS', 'LĐH', 'DVKH'];
      if (user.department && standardUserDepartments.includes(user.department)) {
        return allMenuItems.filter(item => 
          item.path === '/asset-entry' || item.path === '/daily-report'
        );
      }

      if (user.department === 'NQ') {
        return allMenuItems.filter(item => item.path !== '/data-management');
      }
    }
    return [];
  };

  const visibleMenuItems = getVisibleMenuItems();

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Menu className="w-4 h-4 mr-2" />
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-white">
                  {visibleMenuItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="w-full flex items-center space-x-2">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xs">
                  <SheetHeader className="pb-4">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-2 pb-4">
                    {visibleMenuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleMenuItemClick}
                        className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center space-x-4">
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-green-600 text-white">
                      {user?.staff_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.staff_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.department} - {user?.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleEnableNotifications}
                  disabled={isEnablingNotifications}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  <span>
                    {isEnablingNotifications ? 'Đang bật...' : 'Bật thông báo đẩy'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/reset-password" className="flex items-center">
                    <Key className="mr-2 h-4 w-4" />
                    <span>Đổi mật khẩu</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}