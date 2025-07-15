import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useSecureAuth } from '@/contexts/AuthContext';

export function PWAInstallPrompt() {
  const { canInstall, triggerInstall, isInstalled } = usePWAInstall();
  const { user } = useSecureAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [isAndroidChrome, setIsAndroidChrome] = useState(false);

  // Detect platform once on component mount
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    setIsIOSSafari(isIOS && isSafari);

    const isAndroid = /Android/.test(ua);
    const isChrome = /Chrome/.test(ua);
    setIsAndroidChrome(isAndroid && isChrome);
  }, []);

  // Effect to decide whether to show the prompt based on various conditions
  useEffect(() => {
    const checkShouldShow = () => {
      console.log('PWAInstallPrompt: Checking conditions...', { user: !!user, isInstalled, canInstall, isIOSSafari, isAndroidChrome });

      if (!user) {
        console.log('PWAInstallPrompt: Abort - No user.');
        setShowPrompt(false);
        return;
      }
      if (isInstalled) {
        console.log('PWAInstallPrompt: Abort - Already installed.');
        setShowPrompt(false);
        return;
      }
      
      if (sessionStorage.getItem('pwa-prompt-shown-session')) {
        console.log('PWAInstallPrompt: Abort - Already shown this session.');
        return;
      }

      if (isIOSSafari || isAndroidChrome || canInstall) {
        console.log('PWAInstallPrompt: Conditions met. Scheduling prompt.');
        const timer = setTimeout(() => {
          console.log('PWAInstallPrompt: Showing prompt now.');
          setShowPrompt(true);
          sessionStorage.setItem('pwa-prompt-shown-session', 'true');
        }, 5000);

        return () => clearTimeout(timer);
      } else {
        console.log('PWAInstallPrompt: Conditions not met for showing prompt.');
      }
    };

    checkShouldShow();
  }, [user, canInstall, isInstalled, isIOSSafari, isAndroidChrome]);

  const handleInstall = async () => {
    if (canInstall) {
      const success = await triggerInstall();
      if (success) {
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    // This now only dismisses the prompt for the current view.
    // The session storage check prevents it from reappearing in the same session.
    setShowPrompt(false);
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-white p-4 rounded-lg shadow-xl border-2 border-green-200 animate-slide-in-up">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-1">
          {isIOSSafari ? (
            <Smartphone className="h-6 w-6 text-blue-600" />
          ) : isAndroidChrome ? (
            <Smartphone className="h-6 w-6 text-green-600" />
          ) : (
            <Download className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">📱 Cài đặt TS Manager</p>
          <p className="text-sm text-gray-600 mt-1">
            {isIOSSafari ? (
              <>Nhấn nút <strong>Chia sẻ</strong> → <strong>Thêm vào Màn hình chính</strong> để cài đặt ứng dụng</>
            ) : isAndroidChrome ? (
              <>Cài đặt ứng dụng để truy cập nhanh hơn và nhận thông báo đẩy</>
            ) : (
              <>Cài đặt ứng dụng để sử dụng offline và nhận thông báo</>
            )}
          </p>
          
          {isIOSSafari ? (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Hướng dẫn iOS Safari:</strong><br/>
                1. Nhấn nút <strong>Chia sẻ</strong> (⬆️) ở thanh công cụ<br/>
                2. Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính"</strong><br/>
                3. Nhấn <strong>"Thêm"</strong> để hoàn tất
              </p>
            </div>
          ) : (
            <div className="flex space-x-2 mt-3">
              {canInstall ? (
                <Button onClick={handleInstall} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Cài đặt ngay
                </Button>
              ) : (
                <div className="text-xs text-gray-500">
                  Sử dụng Chrome hoặc Edge để cài đặt
                </div>
              )}
              <Button onClick={handleDismiss} variant="ghost" size="sm">
                Để sau
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col space-y-1">
          <Button onClick={handleDismiss} variant="ghost" size="icon" className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}