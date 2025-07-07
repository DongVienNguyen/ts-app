import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from './ui/button';
import { Download, X } from 'lucide-react';
import { useState } from 'react';

export function PWAInstallPrompt() {
  const { canInstall, triggerInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleInstallClick = () => {
    triggerInstall();
    setIsDismissed(true);
  };

  if (!canInstall || isDismissed) {
    return null;
  }

  // Simple check for iOS Safari to show different instructions
  const isIosSafari = /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent) && !/CriOS/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-secondary text-secondary-foreground p-3 shadow-lg flex items-center justify-center text-center animate-slide-in-up">
      <div className="flex items-center space-x-4">
        <Download className="h-5 w-5 hidden sm:block" />
        <p className="text-sm font-medium">
          {isIosSafari 
            ? "Để có trải nghiệm tốt nhất, hãy thêm ứng dụng vào Màn hình chính."
            : "Cài đặt ứng dụng để truy cập nhanh và sử dụng ngoại tuyến."
          }
        </p>
        {!isIosSafari && (
          <Button onClick={handleInstallClick} size="sm">
            Cài đặt
          </Button>
        )}
      </div>
      <Button onClick={() => setIsDismissed(true)} variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}