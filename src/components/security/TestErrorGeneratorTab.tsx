import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';
import { captureError, SystemError } from '@/utils/errorTracking';
import { RefreshCw, Trash2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSeverityColor } from '@/utils/errorTracking';
import { SmartPagination } from '@/components/SmartPagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Mock user agents for testing
const mockUserAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.109 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.109 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Android 10; Mobile; rv:109.0) Gecko/115.0 Firefox/115.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko", // IE
  "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Mobile Safari/537.36",
];

type Severity = 'low' | 'medium' | 'high' | 'critical';

export function TestErrorGeneratorTab() {
  const { user } = useSecureAuth();
  const queryClient = useQueryClient();

  const [errorType, setErrorType] = useState('API_ERROR');
  const [errorMessage, setErrorMessage] = useState('Simulated error message.');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [functionName, setFunctionName] = useState('testFunction');

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedError, setSelectedError] = useState<SystemError | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const fetchErrors = async (page: number, search: string) => {
    let query = supabase.from('system_errors').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`error_type.ilike.%${search}%,error_message.ilike.%${search}%,function_name.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

    if (error) throw error;
    return { data, count };
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['system_errors', currentPage, debouncedSearchTerm],
    queryFn: () => fetchErrors(currentPage, debouncedSearchTerm),
    placeholderData: (previousData) => previousData,
  });

  const handleCreateTestError = async () => {
    try {
      await captureError(new Error(errorMessage), {
        functionName: functionName,
        severity: severity,
        userId: user?.username || 'test_admin',
        errorType: errorType, // Truyền errorType trực tiếp
        additionalData: {
          simulated: true,
        },
      });
      toast.success('Đã tạo lỗi test thành công!');
      refetch();
    } catch (error) {
      console.error('Error creating test error:', error);
      toast.error('Không thể tạo lỗi test.');
    }
  };

  const handleCreateRandomTestErrors = async (count: number = 10) => {
    const promise = async () => {
      for (let i = 0; i < count; i++) {
        const randomUserAgent = mockUserAgents[Math.floor(Math.random() * mockUserAgents.length)];
        const randomErrorType = ['API_ERROR', 'DB_ERROR', 'UI_ERROR', 'NETWORK_ERROR'][Math.floor(Math.random() * 4)];
        const randomSeverity = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as Severity;
        const randomMessage = `Simulated random error ${i + 1} from ${randomUserAgent.split(' ')[0]}.`;

        await captureError(new Error(randomMessage), {
          functionName: `randomFunction${i}`,
          severity: randomSeverity,
          userId: `random_user_${Math.floor(Math.random() * 100)}`,
          errorType: randomErrorType,
          additionalData: {
            simulated: true,
            userAgent: randomUserAgent,
          },
        });
        // Add a small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };

    toast.promise(promise(), {
      loading: `Đang tạo ${count} lỗi test ngẫu nhiên...`,
      success: () => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['error_monitoring_data'] });
        return `Đã tạo ${count} lỗi test ngẫu nhiên thành công!`;
      },
      error: (err: any) => {
        console.error('Error creating random test errors:', err);
        return 'Không thể tạo lỗi test ngẫu nhiên.';
      },
    });
  };

  const handleDeleteAllErrors = async () => {
    const promise = async () => {
      const { error } = await supabase.from('system_errors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    };

    toast.promise(promise(), {
      loading: 'Đang xóa tất cả lỗi...',
      success: () => {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['error_monitoring_data'] });
        return 'Đã xóa tất cả lỗi thành công!';
      },
      error: (err: any) => {
        console.error('Error deleting all errors:', err);
        return 'Không thể xóa tất cả lỗi.';
      },
    });
  };

  const handleRowClick = (error: SystemError) => {
    setSelectedError(error);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tạo Lỗi Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="errorType">Loại Lỗi</Label>
              <Select value={errorType} onValueChange={setErrorType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại lỗi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="API_ERROR">Lỗi API</SelectItem>
                  <SelectItem value="DB_ERROR">Lỗi Database</SelectItem>
                  <SelectItem value="UI_ERROR">Lỗi UI</SelectItem>
                  <SelectItem value="NETWORK_ERROR">Lỗi Mạng</SelectItem>
                  <SelectItem value="CRITICAL_ERROR">Lỗi Nghiêm Trọng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severity">Mức độ Nghiêm trọng</Label>
              <Select value={severity} onValueChange={(value) => setSeverity(value as Severity)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="critical">Nghiêm trọng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="errorMessage">Tin nhắn Lỗi</Label>
            <Input
              id="errorMessage"
              placeholder="Nhập tin nhắn lỗi"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="functionName">Tên Hàm (tùy chọn)</Label>
            <Input
              id="functionName"
              placeholder="e.g., handleLogin"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={handleCreateTestError} className="w-full">
              <PlusCircle className="w-4 h-4 mr-2" />
              Tạo Lỗi Test
            </Button>
            <Button onClick={() => handleCreateRandomTestErrors(5)} className="w-full" variant="outline">
              <PlusCircle className="w-4 h-4 mr-2" />
              Tạo 5 Lỗi Ngẫu Nhiên
            </Button>
            <Button onClick={handleDeleteAllErrors} className="w-full" variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa Tất Cả Lỗi
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Logs Lỗi Hệ thống</CardTitle>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Tìm kiếm theo loại lỗi, tin nhắn, tên hàm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại Lỗi</TableHead>
                  <TableHead>Tin nhắn</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead>Tên Hàm</TableHead>
                  <TableHead>Người dùng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Đang tải lỗi...
                    </TableCell>
                  </TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Không tìm thấy lỗi nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((error) => (
                    <TableRow key={error.id} onClick={() => handleRowClick(error)} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>{format(new Date(error.created_at!), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                      <TableCell>{error.error_type}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{error.error_message}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                          {error.severity}
                        </span>
                      </TableCell>
                      <TableCell>{error.function_name || 'N/A'}</TableCell>
                      <TableCell>{error.user_id || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {data && data.count !== undefined && (
            <SmartPagination
              totalCount={data.count || 0}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Chi tiết Lỗi</DialogTitle>
            <DialogDescription>Thông tin chi tiết về lỗi hệ thống.</DialogDescription>
          </DialogHeader>
          {selectedError && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">ID:</Label>
                <span className="col-span-3 font-mono text-xs">{selectedError.id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Thời gian:</Label>
                <span className="col-span-3">{format(new Date(selectedError.created_at!), 'dd/MM/yyyy HH:mm:ss')}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Loại Lỗi:</Label>
                <span className="col-span-3">{selectedError.error_type}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tin nhắn:</Label>
                <span className="col-span-3">{selectedError.error_message}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Mức độ:</Label>
                <span className={`col-span-3 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedError.severity)}`}>
                  {selectedError.severity}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tên Hàm:</Label>
                <span className="col-span-3">{selectedError.function_name || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Người dùng:</Label>
                <span className="col-span-3">{selectedError.user_id || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">URL:</Label>
                <span className="col-span-3 break-all">{selectedError.request_url || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">User Agent:</Label>
                <span className="col-span-3 break-all">{selectedError.user_agent || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Stack Trace:</Label>
                <Textarea readOnly value={selectedError.error_stack || 'N/A'} className="col-span-3 font-mono text-xs h-32" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Dữ liệu bổ sung:</Label>
                <Textarea readOnly value={selectedError.error_data ? JSON.stringify(selectedError.error_data, null, 2) : 'N/A'} className="col-span-3 font-mono text-xs h-32" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}