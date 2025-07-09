import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { canInstall, triggerInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt after 10 seconds if can install and not dismissed
    if (canInstall) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 10000);

        return () => clearTimeout(timer);
      }
    }
  }, [canInstall]);

  const handleInstall = async () => {
    const success = await triggerInstall();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || !canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-background p-4 rounded-lg shadow-lg border animate-slide-in-up">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-1">
          <Download className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Cài đặt ứng dụng</p>
          <p className="text-sm text-muted-foreground">
            Cài đặt ứng dụng để truy cập nhanh hơn và sử dụng offline.
          </p>
          <div className="flex space-x-2 mt-3">
            <Button onClick={handleInstall} size="sm">
              Cài đặt
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              Để sau
            </Button>
          </div>
        </div>
        <Button onClick={handleDismiss} variant="ghost" size="icon" className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}