import { useState, useEffect } from 'react';
import { useSecureAuth } from '@/contexts/AuthContext';
import { requestNotificationPermission, subscribeUserToPush } from '@/utils/pushNotificationUtils';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const { user } = useSecureAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('usePWAInstall: Hook mounted.');
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
      console.log(`usePWAInstall: Initial check - isInstalled: ${isStandalone || isInWebAppiOS}`);
    };

    checkIfInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('usePWAInstall: beforeinstallprompt event fired.');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setCanInstall(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      console.log('usePWAInstall: appinstalled event fired.');
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // New: Automatically setup push notifications after PWA install
  useEffect(() => {
    const setupPushAfterInstall = async () => {
      // Only run if PWA is installed and user is logged in
      if (isInstalled && user?.username) {
        // Check if we've already attempted this in the current session
        const hasAttempted = sessionStorage.getItem('pwa-push-setup-attempted');
        if (hasAttempted) {
          return;
        }
        sessionStorage.setItem('pwa-push-setup-attempted', 'true');

        try {
          const permission = await requestNotificationPermission();
          if (permission === 'granted') {
            await subscribeUserToPush(user.username);
            console.log('✅ Push notifications automatically configured after PWA installation.');
          }
        } catch (error) {
          console.error('Failed to setup push notifications after PWA install:', error);
        }
      }
    };

    setupPushAfterInstall();
  }, [isInstalled, user]);

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setCanInstall(false);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error triggering install prompt:', error);
      return false;
    }
  };

  return {
    canInstall: canInstall && !isInstalled,
    isInstalled,
    triggerInstall,
  };
}