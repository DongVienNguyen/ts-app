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
    <header className="header-mobile bg-white shadow-sm border-b">
      <div className="container-mobile">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-responsive-x">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="hidden sm:block font-semibold text-green-800">TS Manager</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="btn-responsive">
                    <Menu className="w-4 h-4 mr-2" />
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-white">
                  {visibleMenuItems.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="w-full flex items-center space-x-3 p-3">
                        <item.icon className="w-4 h-4" />
                        <span className="text-responsive-sm">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="btn-touch">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm">
                  <SheetHeader className="pb-4">
                    <SheetTitle className="text-responsive-lg">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="space-responsive-y pb-4">
                    {visibleMenuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleMenuItemClick}
                        className="flex items-center space-x-3 p-responsive rounded-md text-responsive-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 btn-touch"
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
          <div className="flex items-center space-responsive-x">
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full btn-touch">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarFallback className="bg-green-600 text-white text-responsive-sm">
                      {user?.staff_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 sm:w-72 bg-white" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-responsive-sm font-medium leading-none">
                      {user?.staff_name}
                    </p>
                    <p className="text-responsive-xs leading-none text-muted-foreground">
                      {user?.department} - {user?.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleEnableNotifications}
                  disabled={isEnablingNotifications}
                  className="p-3"
                >
                  <Smartphone className="mr-3 h-4 w-4" />
                  <span className="text-responsive-sm">
                    {isEnablingNotifications ? 'Đang bật...' : 'Bật thông báo đẩy'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="p-3">
                  <Link to="/reset-password" className="flex items-center">
                    <Key className="mr-3 h-4 w-4" />
                    <span className="text-responsive-sm">Đổi mật khẩu</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="p-3">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-responsive-sm">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}