import { useRef, useEffect, useCallback } from 'react';

interface SoundOptions {
  frequency?: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
}

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext once when the component mounts
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported or failed to initialize:', error);
      }
    }

    // Clean up AudioContext when the component unmounts
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error('Error closing AudioContext:', e));
        audioContextRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback((options?: SoundOptions) => {
    if (!audioContextRef.current) {
      console.warn('AudioContext not available. Cannot play sound.');
      return;
    }

    try {
      const context = audioContextRef.current;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.setValueAtTime(options?.frequency || 440, context.currentTime);
      oscillator.type = options?.type || 'sine';

      gainNode.gain.setValueAtTime(options?.gain || 0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + (options?.duration || 0.5));

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + (options?.duration || 0.5));
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, []);

  return { playSound };
}