import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SystemError } from '@/utils/errorTracking';

interface ErrorListTabProps {
  recentErrors: SystemError[];
  isLoading: boolean;
  getSeverityColor: (severity: string) => string;
}

export function ErrorListTab({ recentErrors, isLoading, getSeverityColor }: ErrorListTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lỗi Gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : recentErrors.length > 0 ? (
          <div className="space-y-3">
            {recentErrors.map((error) => (
              <div key={error.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getSeverityColor(error.severity)}>
                        {error.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{error.error_type}</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(error.created_at!).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      {error.error_message}
                    </h4>
                    {error.function_name && (
                      <p className="text-sm text-gray-600">
                        Chức năng: {error.function_name}
                      </p>
                    )}
                    {error.user_id && (
                      <p className="text-sm text-gray-600">
                        Người dùng: {error.user_id}
                      </p>
                    )}
                  </div>
                  <Badge variant={error.status === 'resolved' ? 'default' : 'destructive'}>
                    {error.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Không có lỗi nào được ghi nhận</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}