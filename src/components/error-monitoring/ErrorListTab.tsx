import { useState } from 'react';
import { CheckCircle, Eye, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SystemError } from '@/utils/errorTracking';
import { ErrorFilters, ErrorFilters as ErrorFiltersComponent } from './ErrorFilters';
import { ErrorDetailsModal } from './ErrorDetailsModal';

interface ErrorListTabProps {
  recentErrors: SystemError[];
  isLoading: boolean;
  getSeverityColor: (severity: string | undefined) => string;
  onRefresh: () => void;
}

export function ErrorListTab({ recentErrors, isLoading, getSeverityColor, onRefresh }: ErrorListTabProps) {
  const [filters, setFilters] = useState<ErrorFilters>({});
  const [selectedError, setSelectedError] = useState<SystemError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Apply filters to errors
  const filteredErrors = recentErrors.filter(error => {
    if (filters.severity && error.severity !== filters.severity) return false;
    if (filters.status && error.status !== filters.status) return false;
    if (filters.errorType && error.error_type !== filters.errorType) return false;
    
    if (filters.dateRange) {
      const errorDate = new Date(error.created_at!);
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filters.dateRange) {
        case '1h':
          cutoffDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      if (errorDate < cutoffDate) return false;
    }
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        error.error_message.toLowerCase().includes(searchLower) ||
        error.error_type.toLowerCase().includes(searchLower) ||
        (error.function_name && error.function_name.toLowerCase().includes(searchLower)) ||
        (error.user_id && error.user_id.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const handleViewDetails = (error: SystemError) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedError(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <ErrorFiltersComponent
        onFiltersChange={setFilters}
        totalErrors={recentErrors.length}
        filteredErrors={filteredErrors.length}
      />

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách Lỗi</span>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredErrors.length > 0 ? (
            <div className="space-y-3">
              {filteredErrors.map((error) => (
                <div key={error.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getSeverityColor(error.severity)}>
                          {error.severity?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                        <Badge variant="outline">{error.error_type}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(error.created_at!).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {error.error_message}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {error.function_name && (
                          <span>Chức năng: {error.function_name}</span>
                        )}
                        {error.user_id && (
                          <span>Người dùng: {error.user_id}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant={error.status === 'resolved' ? 'default' : 'destructive'}>
                        {error.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(error)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {Object.keys(filters).length > 0 ? (
                <>
                  <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Không tìm thấy lỗi nào phù hợp với bộ lọc</p>
                </>
              ) : (
                <>
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Không có lỗi nào được ghi nhận</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Details Modal */}
      <ErrorDetailsModal
        error={selectedError}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onErrorUpdated={onRefresh}
      />
    </div>
  );
}