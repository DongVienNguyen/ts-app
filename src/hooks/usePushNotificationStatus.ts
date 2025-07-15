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
    console.log('[Push Status] Checking...');
    if (!user) {
      console.log('[Push Status] Final Result: unauthenticated');
      setStatus('unauthenticated');
      return;
    }

    setStatus('loading');

    const { supported, reasons } = checkPushNotificationSupport();
    if (!supported) {
      console.warn('Push notifications not supported:', reasons);
      console.log('[Push Status] Final Result: unsupported');
      setStatus('unsupported');
      return;
    }

    const permission = Notification.permission;
    console.log(`[Push Status] Notification.permission: ${permission}`);
    if (permission === 'denied') {
      console.log('[Push Status] Final Result: denied');
      setStatus('denied');
      return;
    }

    const isSubscribed = await hasActivePushSubscription(user.username);
    console.log(`[Push Status] hasActivePushSubscription: ${isSubscribed}`);
    if (isSubscribed) {
      console.log('[Push Status] Final Result: subscribed');
      setStatus('subscribed');
      return;
    }
    
    console.log('[Push Status] Final Result: prompt_required');
    setStatus('prompt_required');
  }, [user]);

  useEffect(() => {
    if (isVisible) {
      checkStatus();
    }
  }, [user, isVisible, checkStatus]);

  const refreshStatus = useCallback(() => {
    checkStatus();
  }, [checkStatus]);

  return { status, refreshStatus };
};