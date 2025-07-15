import { useState, useEffect, useCallback } from 'react';
import { checkPushNotificationSupport, hasActivePushSubscription } from '@/utils/pushNotificationUtils';
import { useSecureAuth } from '@/contexts/AuthContext';

type PushStatus = 'supported' | 'unsupported' | 'granted' | 'denied' | 'prompt_required' | 'loading';

export function usePushNotificationStatus() {
  const { user } = useSecureAuth();
  const [status, setStatus] = useState<PushStatus>('loading');
  const [reasons, setReasons] = useState<string[]>([]);

  const refreshStatus = useCallback(async () => {
    if (!user?.username) {
      setStatus('loading');
      return;
    }

    setStatus('loading');
    
    const { supported, reasons: supportReasons } = checkPushNotificationSupport();
    if (!supported) {
      setStatus('unsupported');
      setReasons(supportReasons);
      return;
    }

    const permission = Notification.permission;
    if (permission === 'denied') {
      setStatus('denied');
      return;
    }

    if (permission === 'granted') {
      const isSubscribed = await hasActivePushSubscription(user.username);
      if (isSubscribed) {
        setStatus('granted');
      } else {
        setStatus('prompt_required');
      }
    } else { // 'default'
      setStatus('prompt_required');
    }
  }, [user?.username]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Add event listener to refresh status on demand
  useEffect(() => {
    const handleSubscriptionChange = () => {
      console.log('[usePushNotificationStatus] Detected subscription change. Refreshing status.');
      refreshStatus();
    };

    window.addEventListener('push-subscription-changed', handleSubscriptionChange);
    
    return () => {
      window.removeEventListener('push-subscription-changed', handleSubscriptionChange);
    };
  }, [refreshStatus]);

  return { status, reasons, refreshStatus };
}