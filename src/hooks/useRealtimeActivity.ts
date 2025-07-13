import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SystemError } from '@/utils/errorTracking';
import { Tables } from '@/integrations/supabase/types';

type SecurityEvent = Tables<'security_events'>;
export type Activity = (SystemError | SecurityEvent) & { activity_type: 'error' | 'security' };

const VALID_SECURITY_EVENT_TYPES = ['LOGIN_FAILED', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 'ACCOUNT_LOCKED', 'ACCESS_DENIED', 'SECURITY_CONFIG_CHANGE', 'HEALTH_CHECK'];

export function useRealtimeActivity(limit: number = 5) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addActivity = (newActivity: Activity) => {
    setActivities(prev => [newActivity, ...prev].slice(0, limit));
  };

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    const halfLimit = Math.floor(limit / 2);

    const errorsPromise = supabase
      .from('system_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(halfLimit);

    const securityPromise = supabase
      .from('security_events')
      .select('*')
      .in('event_type', VALID_SECURITY_EVENT_TYPES)
      .order('created_at', { ascending: false })
      .limit(limit - halfLimit);

    const [{ data: errors }, { data: securityEvents }] = await Promise.all([errorsPromise, securityPromise]);

    const combined: Activity[] = [
      ...(errors || []).map(e => ({ ...e, activity_type: 'error' as const })),
      ...(securityEvents || []).map(s => ({ ...s, activity_type: 'security' as const })),
    ];

    combined.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    
    setActivities(combined.slice(0, limit));
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchInitialData();

    const errorChannel = supabase
      .channel('realtime-activity-errors')
      .on<SystemError>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_errors' },
        (payload) => addActivity({ ...payload.new, activity_type: 'error' })
      )
      .subscribe();

    const securityChannel = supabase
      .channel('realtime-activity-security')
      .on<SecurityEvent>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_events' },
        (payload) => {
          if (VALID_SECURITY_EVENT_TYPES.includes(payload.new.event_type)) {
            addActivity({ ...payload.new, activity_type: 'security' });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(errorChannel);
      supabase.removeChannel(securityChannel);
    };
  }, [limit, fetchInitialData]);

  return { activities, isLoading, refetch: fetchInitialData };
}