import { RefreshCw } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex justify-center py-8">
      <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
    </div>
  );
}