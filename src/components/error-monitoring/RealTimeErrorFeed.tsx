import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface ErrorEvent {
  id: string;
  error_type: string;
  error_message: string;
  created_at: string;
}

export const RealTimeErrorFeed: React.FC = () => {
  const [errors, setErrors] = useState<ErrorEvent[]>([]);

  useEffect(() => {
    const fetchInitialErrors = async () => {
      const { data, error } = await supabase
        .from('system_errors')
        .select('id, error_type, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching initial errors:', error);
      } else {
        setErrors(data as ErrorEvent[]);
      }
    };

    fetchInitialErrors();

    const channel = supabase.channel('public:system_errors');
    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_errors' },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          setErrors(currentErrors => [payload.new as ErrorEvent, ...currentErrors].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
          Luồng Lỗi Thời Gian Thực
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {errors.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có lỗi nào được ghi nhận...</p>
          ) : (
            <ul className="space-y-3">
              {errors.map(error => (
                <li key={error.id} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="font-semibold text-red-700 dark:text-red-300">{error.error_type}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{error.error_message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(error.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};