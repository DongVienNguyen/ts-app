import React from 'react';
import { NavigationHeader } from './NavigationHeader';
import { requestNotificationPermission, subscribeUserToPush, checkPushNotificationSupport } from '@/utils/pushNotificationUtils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;