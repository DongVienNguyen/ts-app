import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RealTimeStatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
}

export function RealTimeStatusIndicator({ status }: RealTimeStatusIndicatorProps) {
  let icon;
  let text;
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" | null | undefined = "default";

  switch (status) {
    case 'connected':
      icon = <Wifi className="h-4 w-4 text-green-500" />;
      text = 'Real-time: Đã kết nối';
      variant = 'success';
      break;
    case 'disconnected':
      icon = <WifiOff className="h-4 w-4 text-red-500" />;
      text = 'Real-time: Mất kết nối';
      variant = 'destructive';
      break;
    case 'connecting':
      icon = <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      text = 'Real-time: Đang kết nối...';
      variant = 'secondary';
      break;
    case 'error':
      icon = <WifiOff className="h-4 w-4 text-red-500" />;
      text = 'Real-time: Lỗi kết nối';
      variant = 'destructive';
      break;
    default:
      icon = <WifiOff className="h-4 w-4 text-gray-500" />;
      text = 'Real-time: Không rõ';
      variant = 'outline';
  }

  return (
    <Badge variant={variant} className="flex items-center space-x-1 px-2 py-1 text-xs">
      {icon}
      <span>{text}</span>
    </Badge>
  );
}