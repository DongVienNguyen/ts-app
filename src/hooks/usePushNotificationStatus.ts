import { useState, useEffect, useCallback } from 'react';
import { useSecureAuth } from '@/contexts/AuthContext';
import { checkPushNotificationSupport, hasActivePushSubscription } from '@/utils/pushNotificationUtils';
import { usePageVisibility } from './usePageVisibility';

export type PushStatus = 'loading' | 'unsupported' | 'denied' | 'prompt_required' | 'subscribed' | 'unauthenticated';

export const usePushNotificationStatus = () => {
  const { user } = useSecureAuth();
  const [status, setStatus] = useState<PushStatus>('loading');
  const isVisible = usePageVisibility();

  const checkStatus = useCallback(async () => {
    if (!user) {
      setStatus('unauthenticated');
      return;
    }

    setStatus('loading');

    const { supported, reasons } = checkPushNotificationSupport();
    if (!supported) {
      console.warn('Push notifications not supported:', reasons);
      setStatus('unsupported');
      return;
    }

    const permission = Notification.permission;
    if (permission === 'denied') {
      setStatus('denied');
      return;
    }

    const isSubscribed = await hasActivePushSubscription(user.username);
    if (isSubscribed) {
      setStatus('subscribed');
      return;
    }
    
    // If not subscribed, and permission is not denied, we need to prompt.
    // This covers both 'default' and 'granted' (where subscription might have failed or been removed).
    setStatus('prompt_required');
  }, [user]);

  useEffect(() => {
    // Check status on mount, when user changes, or when tab becomes visible
    if (isVisible) {
      checkStatus();
    }
  }, [user, isVisible, checkStatus]);

  // Function to manually re-check status, e.g., after a user action
  const refreshStatus = useCallback(() => {
    checkStatus();
  }, [checkStatus]);

  return { status, refreshStatus };
};