import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  User
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-green-600" />
            <span className="text-lg font-semibold text-gray-900">Asset Manager</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-4 px-2">
          <div className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.staff_name || user.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.role} - {user.department}
              </p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Main Content - NO TOP BAR */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Menu Button - Only visible on mobile */}
        <div className="lg:hidden bg-white shadow-sm border-b h-16 flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="ml-2">Menu</span>
          </Button>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;