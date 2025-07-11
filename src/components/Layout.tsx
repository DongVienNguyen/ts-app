import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
  HardDrive
} from 'lucide-react';
import { isAdmin, isNqOrAdmin } from '@/utils/permissions';
import { NotificationBell } from '@/components/NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!user) {
    return null;
  }

  // Use permission functions consistently
  const userIsAdmin = isAdmin(user);
  const userIsNqOrAdmin = isNqOrAdmin(user);

  // MAIN NAVIGATION ITEMS - NO SYSTEM ITEMS
  const mainNavigationItems = [
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
      show: userIsNqOrAdmin
    },
    {
      name: 'Nhắc nhở TS',
      href: '/asset-reminders',
      icon: Bell,
      show: userIsNqOrAdmin
    },
    {
      name: 'Nhắc nhở CRC',
      href: '/crc-reminders',
      icon: Bell,
      show: userIsNqOrAdmin
    },
    {
      name: 'Tài sản khác',
      href: '/other-assets',
      icon: Package,
      show: userIsNqOrAdmin
    },
    {
      name: 'Thông báo',
      href: '/notifications',
      icon: Bell,
      show: true
    }
  ];

  // SYSTEM ITEMS - SEPARATE ARRAY FOR ADMIN ONLY
  const systemItems = [
    {
      name: 'Quản lý DL',
      href: '/data-management',
      icon: Database,
      show: userIsAdmin
    },
    {
      name: 'Bảo mật',
      href: '/security-monitor',
      icon: Shield,
      show: userIsAdmin
    },
    {
      name: 'Lỗi hệ thống',
      href: '/error-monitoring',
      icon: Activity,
      show: userIsAdmin
    },
    {
      name: 'Sử dụng',
      href: '/usage-monitoring',
      icon: BarChart3,
      show: userIsAdmin
    },
    {
      name: 'Backup & Restore',
      href: '/system-backup',
      icon: HardDrive,
      show: userIsAdmin
    }
  ];

  // Filter visible items
  const visibleMainItems = mainNavigationItems.filter(item => item.show);
  const visibleSystemItems = systemItems.filter(item => item.show);

  // Check if any system menu item is currently active
  const isSystemMenuActive = visibleSystemItems.some(item => location.pathname === item.href);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  // DEBUG LOGGING
  console.log('🔍 LAYOUT DEBUG:', {
    user: user?.username,
    role: user?.role,
    department: user?.department,
    userIsAdmin,
    userIsNqOrAdmin,
    visibleMainItems: visibleMainItems.length,
    mainItemNames: visibleMainItems.map(item => item.name),
    visibleSystemItems: visibleSystemItems.length,
    systemItemNames: visibleSystemItems.map(item => item.name),
    isSystemMenuActive,
    currentPath: location.pathname
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
        isScrolled 
          ? 'shadow-lg border-b border-gray-200' 
          : 'shadow-sm border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo & Menu */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu using Sheet */}
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 bg-white">
                  <SheetHeader className="px-4 py-4 border-b border-gray-200 bg-white">
                    <SheetTitle className="flex items-center space-x-2 text-left">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-bold text-gray-900">Asset Manager</span>
                    </SheetTitle>
                  </SheetHeader>
                  
                  {/* Navigation Links - FIXED TO GROUP SYSTEM ITEMS */}
                  <nav className="flex-1 px-2 py-4 overflow-y-auto bg-white">
                    <div className="space-y-1">
                      {/* MAIN NAVIGATION ITEMS ONLY */}
                      {visibleMainItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        console.log(`📱 Mobile Main: ${item.name}`);
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                              isActive
                                ? 'bg-green-100 text-green-700 border-r-2 border-green-600'
                                : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                            }`}
                            onClick={() => setIsSidebarOpen(false)}
                          >
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </Link>
                        );
                      })}

                      {/* SYSTEM MENU SECTION - GROUPED */}
                      {visibleSystemItems.length > 0 && (
                        <>
                          {/* System Header */}
                          <div className="px-3 py-2 text-sm font-medium text-gray-500 border-t border-gray-200 mt-4 pt-4">
                            <Settings className="inline-block w-4 h-4 mr-2" />
                            🔧 Hệ thống ({visibleSystemItems.length})
                          </div>
                          {/* System Items - Indented */}
                          {visibleSystemItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            console.log(`📱 Mobile System: ${item.name}`);
                            return (
                              <Link
                                key={item.href}
                                to={item.href}
                                className={`group flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                                  isActive
                                    ? 'bg-green-100 text-green-700 border-r-2 border-green-600'
                                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                                }`}
                                onClick={() => setIsSidebarOpen(false)}
                              >
                                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                <span className="truncate">{item.name}</span>
                              </Link>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </nav>

                  {/* Footer */}
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.staff_name || user.username}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user.role} - {user.department}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Asset Manager
                </span>
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* MAIN NAVIGATION ITEMS */}
              {visibleMainItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
                    }`}
                  >
                    <item.icon className="inline-block w-4 h-4 mr-2" />
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
                      className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        isSystemMenuActive
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
                      }`}
                    >
                      <Settings className="inline-block w-4 h-4 mr-2" />
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
            </div>

            {/* Right: Notifications & User */}
            <div className="flex items-center space-x-3">
              <NotificationBell />
              
              {/* User Dropdown */}
              <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-lg">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {user.staff_name || user.username}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.role} - {user.department}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
                  <div className="px-3 py-2 bg-gray-50">
                    <div className="font-medium text-gray-900">
                      {user.staff_name || user.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.role} - {user.department}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem asChild>
                    <Link to="/reset-password" className="flex items-center cursor-pointer">
                      <Key className="w-4 h-4 mr-2" />
                      Đổi mật khẩu
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;