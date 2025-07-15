import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { SystemError } from '@/types/system';

export const UnresolvedErrorsBanner = () => {
  const [unresolvedErrors, setUnresolvedErrors] = useState<SystemError[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const fetchUnresolvedErrors = async () => {
    const { data, error } = await supabase
      .from('system_errors')
      .select('*')
      .not('status', 'eq', 'resolved');

    if (error) {
      console.error('Error fetching unresolved errors:', error);
      setUnresolvedErrors([]);
    } else {
      setUnresolvedErrors(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUnresolvedErrors();

    const channel = supabase
      .channel('public:system_errors')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_errors' },
        (payload) => {
          console.log('Real-time update on system_errors:', payload);
          fetchUnresolvedErrors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading || unresolvedErrors.length === 0 || !isVisible) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6 relative">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Cảnh báo Hệ thống</AlertTitle>
      <AlertDescription>
        Hiện có {unresolvedErrors.length} lỗi chưa được giải quyết. Vui lòng kiểm tra và xử lý.
        <Link to="/error-monitoring">
          <Button variant="link" className="p-0 h-auto ml-2 text-white font-bold">
            Xem chi tiết
          </Button>
        </Link>
      </AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Đóng</span>
      </Button>
    </Alert>
  );
};