import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { canInstall, triggerInstall, isInstalled } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [isAndroidChrome, setIsAndroidChrome] = useState(false);

  useEffect(() => {
    // Detect iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isIOSSafariDetected = isIOS && isSafari;
    
    // Detect Android Chrome
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isAndroidChromeDetected = isAndroid && isChrome;
    
    setIsIOSSafari(isIOSSafariDetected);
    setIsAndroidChrome(isAndroidChromeDetected);

    // Check if should show prompt
    const checkShouldShow = () => {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const lastShown = localStorage.getItem('pwa-install-last-shown');
      const now = Date.now();
      
      // Don't show if dismissed permanently or shown recently (within 24 hours)
      if (dismissed === 'permanent') return false;
      if (lastShown && (now - parseInt(lastShown)) < 24 * 60 * 60 * 1000) return false;
      
      // Show for iOS Safari or Android Chrome if not installed
      if ((isIOSSafariDetected || isAndroidChromeDetected || canInstall) && !isInstalled) {
        // Show after 10 seconds
        const timer = setTimeout(() => {
          setShowPrompt(true);
          localStorage.setItem('pwa-install-last-shown', now.toString());
        }, 10000);

        return () => clearTimeout(timer);
      }
    };

    checkShouldShow();
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    if (canInstall) {
      const success = await triggerInstall();
      if (success) {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'permanent');
      }
    }
  };

  const handleDismiss = (permanent = false) => {
    if (permanent) {
      localStorage.setItem('pwa-install-dismissed', 'permanent');
    } else {
      localStorage.setItem('pwa-install-dismissed', 'temporary');
    }
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
              <Button onClick={() => handleDismiss(false)} variant="ghost" size="sm">
                Để sau
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col space-y-1">
          <Button onClick={() => handleDismiss(true)} variant="ghost" size="icon" className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}