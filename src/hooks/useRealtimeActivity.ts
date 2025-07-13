import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SystemError } from '@/utils/errorTracking';
import { Tables } from '@/integrations/supabase/types';

type SecurityEvent = Tables<'security_events'>;
export type Activity = (SystemError | SecurityEvent) & { activity_type: 'error' | 'security' };

export function useRealtimeActivity(limit: number = 5) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addActivity = (newActivity: Activity) => {
    setActivities(prev => [newActivity, ...prev].slice(0, limit));
  };

  useEffect(() => {
    const fetchInitialData = async () => {
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
    };

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
        (payload) => addActivity({ ...payload.new, activity_type: 'security' })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(errorChannel);
      supabase.removeChannel(securityChannel);
    };
  }, [limit]);

  return { activities, isLoading };
}