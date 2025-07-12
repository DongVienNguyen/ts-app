import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { SystemError } from '@/utils/errorTracking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js'; // Import RealtimeChannel type

interface RealTimeErrorFeedProps {
  onNewError?: (error: SystemError) => void;
}

export function RealTimeErrorFeed({ onNewError }: RealTimeErrorFeedProps) {
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentErrors, setRecentErrors] = useState<SystemError[]>([]);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    let subscription: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      if (!isActive) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ Cannot start real-time error feed: not authenticated');
        setIsActive(false);
        return;
      }

      subscription = supabase
        .channel('system_errors')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'system_errors'
          },
          (payload) => {
            const newError = payload.new as SystemError;
            
            // Add to recent errors list
            setRecentErrors(prev => [newError, ...prev.slice(0, 9)]);
            setErrorCount(prev => prev + 1);
            
            // Play sound notification
            if (soundEnabled && newError.severity) {
              playNotificationSound(newError.severity);
            }
            
            // Show toast notification
            toast(
              `Lỗi ${newError.severity || 'unknown'}: ${newError.error_message}`,
              {
                description: `Loại: ${newError.error_type}`,
                duration: 5000,
              }
            );
            
            // Call callback if provided
            if (onNewError) {
              onNewError(newError);
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
        subscription = null;
      }
    };
  }, [isActive, soundEnabled, onNewError, supabase]); // Add supabase to dependencies

  const playNotificationSound = (severity: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different severities
      const frequency = severity === 'critical' ? 800 : 
                       severity === 'high' ? 600 : 
                       severity === 'medium' ? 400 : 300;
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const getSeverityColor = (severity: string | undefined) => {
    if (!severity) return 'text-gray-600 bg-gray-100';
    
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const clearFeed = () => {
    setRecentErrors([]);
    setErrorCount(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Theo dõi Thời gian Thực</span>
            {errorCount > 0 && (
              <Badge variant="destructive">{errorCount}</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <VolumeX className="w-4 h-4" />
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                disabled={!isActive}
              />
              <Volume2 className="w-4 h-4" />
            </div>
            <Button
              variant={isActive ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Dừng
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Bắt đầu
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isActive ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nhấn "Bắt đầu" để theo dõi lỗi thời gian thực</p>
          </div>
        ) : recentErrors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-pulse">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Đang theo dõi lỗi mới...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {recentErrors.length} lỗi gần đây
              </span>
              <Button variant="ghost" size="sm" onClick={clearFeed}>
                Xóa
              </Button>
            </div>
            
            {recentErrors.map((error, index) => (
              <div 
                key={`${error.id}-${index}`} 
                className={`border rounded-lg p-3 ${index === 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'} transition-all duration-500`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getSeverityColor(error.severity)}>
                        {error.severity?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                      <Badge variant="outline">{error.error_type}</Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(error.created_at!).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {error.error_message}
                    </p>
                    {error.function_name && (
                      <p className="text-xs text-gray-600 mt-1">
                        Chức năng: {error.function_name}
                      </p>
                    )}
                  </div>
                  {index === 0 && (
                    <div className="ml-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}