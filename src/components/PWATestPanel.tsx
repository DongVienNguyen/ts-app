import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Download, 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Monitor,
  Globe
} from 'lucide-react';

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screen: string;
  viewport: string;
  pixelRatio: number;
  touchSupport: boolean;
  standalone: boolean;
  displayMode: string;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export const PWATestPanel = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swStatus, setSWStatus] = useState('checking');
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({} as DeviceInfo);

  useEffect(() => {
    // Check if app is installed (running in standalone mode)
    const checkInstalled = () => {
      const nav = navigator as NavigatorWithStandalone;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          nav.standalone ||
                          document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    // Check service worker status
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          setSWStatus(registration ? 'active' : 'inactive');
        } catch (error) {
          setSWStatus('error');
        }
      } else {
        setSWStatus('unsupported');
      }
    };

    // Get device info
    const getDeviceInfo = () => {
      const nav = navigator as NavigatorWithStandalone;
      const info: DeviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        pixelRatio: window.devicePixelRatio,
        touchSupport: 'ontouchstart' in window,
        standalone: nav.standalone || false,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
      };
      setDeviceInfo(info);
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    checkInstalled();
    checkServiceWorker();
    getDeviceInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log('Install prompt result:', outcome);
      setInstallPrompt(null);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        new Notification('Test Notification', {
          body: 'PWA notifications are working!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        });
      }
    }
  };

  const testOfflineMode = () => {
    // Simulate offline by making a request that will fail
    fetch('/test-offline-endpoint')
      .then(() => console.log('Online'))
      .catch(() => console.log('Offline mode detected'));
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case 'active':
      case 'granted':
      case true:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
      case 'denied':
      case false:
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'active':
      case 'granted':
      case true:
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'denied':
      case false:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>PWA Status Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PWA Features Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                {isOnline ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
                <span>Network Status</span>
              </div>
              <Badge className={getStatusColor(isOnline)}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                {getStatusIcon(isInstalled)}
                <span>App Installed</span>
              </div>
              <Badge className={getStatusColor(isInstalled)}>
                {isInstalled ? 'Yes' : 'No'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                {getStatusIcon(swStatus === 'active')}
                <span>Service Worker</span>
              </div>
              <Badge className={getStatusColor(swStatus === 'active')}>
                {swStatus}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                {getStatusIcon(notificationPermission === 'granted')}
                <span>Notifications</span>
              </div>
              <Badge className={getStatusColor(notificationPermission === 'granted')}>
                {notificationPermission}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {installPrompt && (
              <Button onClick={handleInstallApp} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
            
            <Button 
              onClick={requestNotificationPermission}
              variant="outline"
              disabled={notificationPermission === 'granted'}
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>

            <Button onClick={testOfflineMode} variant="outline">
              <WifiOff className="w-4 h-4 mr-2" />
              Test Offline
            </Button>
          </div>

          {/* Device Information */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Monitor className="w-4 h-4 mr-2" />
              Device Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><strong>Platform:</strong> {deviceInfo.platform}</div>
              <div><strong>Screen:</strong> {deviceInfo.screen}</div>
              <div><strong>Viewport:</strong> {deviceInfo.viewport}</div>
              <div><strong>Pixel Ratio:</strong> {deviceInfo.pixelRatio}</div>
              <div><strong>Touch Support:</strong> {deviceInfo.touchSupport ? 'Yes' : 'No'}</div>
              <div><strong>Display Mode:</strong> {deviceInfo.displayMode}</div>
              <div><strong>Language:</strong> {deviceInfo.language}</div>
              <div><strong>Cookies:</strong> {deviceInfo.cookieEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>

          {/* Browser Detection */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Browser Detection
            </h3>
            <div className="text-sm space-y-1">
              {deviceInfo.userAgent?.includes('Chrome') && <Badge variant="outline">Chrome</Badge>}
              {deviceInfo.userAgent?.includes('Safari') && !deviceInfo.userAgent?.includes('Chrome') && <Badge variant="outline">Safari</Badge>}
              {deviceInfo.userAgent?.includes('Firefox') && <Badge variant="outline">Firefox</Badge>}
              {deviceInfo.userAgent?.includes('Edge') && <Badge variant="outline">Edge</Badge>}
              {deviceInfo.userAgent?.includes('iPhone') && <Badge variant="outline">iPhone</Badge>}
              {deviceInfo.userAgent?.includes('Android') && <Badge variant="outline">Android</Badge>}
              {deviceInfo.userAgent?.includes('iPad') && <Badge variant="outline">iPad</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PWA Installation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>PWA Installation Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Chrome Android:</strong> Tap menu (⋮) → "Add to Home screen" → "Install"
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Safari iOS:</strong> Tap Share button (□↗) → "Add to Home Screen"
            </AlertDescription>
          </Alert>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Chrome Desktop:</strong> Look for install icon in address bar or use menu → "Install app"
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};