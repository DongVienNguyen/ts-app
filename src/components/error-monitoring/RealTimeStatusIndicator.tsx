import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RealTimeStatusIndicatorProps {
  status: 'connecting' | 'connected' | 'error';
}

export const RealTimeStatusIndicator: React.FC<RealTimeStatusIndicatorProps> = ({ status }) => {
  const statusConfig = {
    connecting: {
      text: 'Đang kết nối...',
      tooltip: 'Đang thiết lập kết nối thời gian thực với máy chủ.',
      className: 'bg-yellow-500 animate-pulse',
    },
    connected: {
      text: 'Đã kết nối',
      tooltip: 'Bạn đang nhận dữ liệu lỗi và cảnh báo trong thời gian thực.',
      className: 'bg-green-500',
    },
    error: {
      text: 'Mất kết nối',
      tooltip: 'Không thể kết nối thời gian thực. Dữ liệu có thể không được cập nhật.',
      className: 'bg-red-500',
    },
  };

  const { text, tooltip, className } = statusConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground cursor-default">
            <span className={cn('h-2 w-2 rounded-full', className)}></span>
            <span>{text}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};