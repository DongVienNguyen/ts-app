import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { Button } from './ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useSecureAuth } from '@/contexts/AuthContext';

export function PWAInstallPrompt() {
  const { canInstall, triggerInstall, isInstalled } = usePWAInstall();
  const { user } = useSecureAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    setIsIOSSafari(isIOS && isSafari);
  }, []);

  useEffect(() => {
    const checkShouldShow = () => {
      if (!user || isInstalled || sessionStorage.getItem('pwa-prompt-shown-session')) {
        setShowPrompt(false);
        return;
      }

      if (isIOSSafari || canInstall) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
          sessionStorage.setItem('pwa-prompt-shown-session', 'true');
        }, 5000);
        return () => clearTimeout(timer);
      }
    };

    checkShouldShow();
  }, [user, canInstall, isInstalled, isIOSSafari]);

  const handleInstall = async () => {
    if (canInstall) {
      const success = await triggerInstall();
      if (success) {
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-green-700 text-white shadow-lg animate-slide-in-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 space-x-4">
          <div className="flex items-center flex-1 min-w-0">
            <button onClick={handleDismiss} title="Đóng" className="p-1 rounded-full hover:bg-white/20 transition-colors mr-3">
              <X className="h-5 w-5" />
            </button>
            <Smartphone className="h-8 w-8 mr-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-bold truncate">Cài đặt TS Manager</p>
              <p className="text-sm opacity-90 hidden sm:block">Truy cập nhanh hơn và nhận thông báo.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {isIOSSafari ? (
              <div className="flex items-center space-x-2 text-sm bg-white/20 px-3 py-1.5 rounded-md">
                <span>Nhấn</span>
                <Share className="h-5 w-5" />
                <span className="hidden sm:inline">và "Thêm vào MH chính"</span>
              </div>
            ) : (
              canInstall && (
                <Button onClick={handleInstall} size="sm" className="bg-white text-green-700 hover:bg-gray-200">
                  <Download className="h-4 w-4 mr-2" />
                  Cài đặt
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}