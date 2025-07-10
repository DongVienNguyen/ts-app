import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  X, 
  Package, 
  FileText, 
  Bell, 
  Database,
  Shield,
  Activity,
  BarChart3,
  LogOut,
  User,
  ChevronDown
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

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  if (!user) {
    return null;
  }

  const navigationItems = [
    {
      name: 'Thông báo Mượn/Xuất',
      href: '/asset-entry',
      icon: Package,
      show: true
    },
    {
      name: 'Danh sách TS cần lấy',
      href: '/daily-report',
      icon: FileText,
      show: true
    },
    {
      name: 'Nhắc tài sản đến hạn',
      href: '/asset-reminders',
      icon: Bell,
      show: isNqOrAdmin(user)
    },
    {
      name: 'Nhắc duyệt CRC',
      href: '/crc-reminders',
      icon: Bell,
      show: isNqOrAdmin(user)
    },
    {
      name: 'Báo cáo TS đã mượn',
      href: '/borrow-report',
      icon: BarChart3,
      show: isNqOrAdmin(user)
    },
    {
      name: 'Tài sản khác gửi kho',
      href: '/other-assets',
      icon: Package,
      show: isNqOrAdmin(user)
    },
    {
      name: 'Quản lý dữ liệu',
      href: '/data-management',
      icon: Database,
      show: isAdmin(user)
    },
    {
      name: 'Thông báo',
      href: '/notifications',
      icon: Bell,
      show: true
    }
  ];

  const visibleItems = navigationItems.filter(item => item.show);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Light Top Navigation Bar - z-50 to stay above sidebar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-lg border-b border-gray-200' 
          : 'bg-white shadow-sm border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo & Menu */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
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
              {visibleItems.map((item) => {
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

      {/* Mobile Sidebar Overlay - z-30 (below navigation) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeSidebar}
          onTouchStart={closeSidebar}
        />
      )}

      {/* Mobile Sidebar - z-40 (below navigation but above overlay) */}
      <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Asset Manager</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeSidebar}
            className="text-gray-500 hover:bg-gray-100 hover:text-gray-700 p-2 rounded-md"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-2 py-4 bg-white overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="space-y-1 pb-20">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-700 border-r-2 border-green-600'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                  }`}
                  onClick={closeSidebar}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-gray-50">
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
      </div>

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