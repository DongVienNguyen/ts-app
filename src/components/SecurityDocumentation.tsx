import React from 'react';
import { Shield, Lock, Users, Key, AlertTriangle, CheckCircle, Info, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SecurityDocumentation() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Tài liệu bảo mật</h1>
          <p className="text-gray-600">Hướng dẫn chi tiết về các tính năng bảo mật của hệ thống</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="password-reset">Đổi mật khẩu</TabsTrigger>
          <TabsTrigger value="account-lockout">Khóa tài khoản</TabsTrigger>
          <TabsTrigger value="admin-guide">Hướng dẫn Admin</TabsTrigger>
          <TabsTrigger value="troubleshooting">Xử lý sự cố</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Tổng quan hệ thống bảo mật</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Hệ thống được trang bị các tính năng bảo mật tiên tiến để bảo vệ dữ liệu và tài khoản người dùng.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold">Mã hóa mật khẩu</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Sử dụng bcrypt để mã hóa mật khẩu với salt ngẫu nhiên
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold">Xác thực JWT</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Token JWT với thời gian hết hạn và chữ ký bảo mật
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <h3 className="font-semibold">Rate Limiting</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Giới hạn số lần thử đăng nhập để chống brute force
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold">Quản lý tài khoản</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Khóa tự động và công cụ quản lý cho admin
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Luồng bảo mật</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Đăng nhập</h4>
                    <p className="text-sm text-gray-600">Kiểm tra thông tin đăng nhập và trạng thái tài khoản</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Xác thực</h4>
                    <p className="text-sm text-gray-600">Tạo JWT token và lưu thông tin phiên làm việc</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-yellow-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Giám sát</h4>
                    <p className="text-sm text-gray-600">Theo dõi hoạt động và ghi log bảo mật</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-red-600">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Bảo vệ</h4>
                    <p className="text-sm text-gray-600">Khóa tài khoản khi phát hiện hoạt động đáng ngờ</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password-reset" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Hướng dẫn đổi mật khẩu</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Tính năng đổi mật khẩu được bảo mật bằng Edge Functions và yêu cầu xác thực mật khẩu hiện tại.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Các bước thực hiện:</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Badge variant="outline">1</Badge>
                    <div>
                      <h4 className="font-medium">Truy cập tính năng</h4>
                      <p className="text-sm text-gray-600">
                        Nhấn vào avatar → "Đổi mật khẩu" hoặc truy cập trực tiếp /reset-password
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Badge variant="outline">2</Badge>
                    <div>
                      <h4 className="font-medium">Nhập thông tin</h4>
                      <ul className="text-sm text-gray-600 list-disc list-inside ml-4">
                        <li>Mật khẩu hiện tại (bắt buộc)</li>
                        <li>Mật khẩu mới (ít nhất 6 ký tự)</li>
                        <li>Xác nhận mật khẩu mới</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Badge variant="outline">3</Badge>
                    <div>
                      <h4 className="font-medium">Xác nhận</h4>
                      <p className="text-sm text-gray-600">
                        Hệ thống sẽ kiểm tra mật khẩu hiện tại và cập nhật mật khẩu mới
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Yêu cầu mật khẩu:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Ít nhất 6 ký tự</li>
                    <li>• Khác với mật khẩu hiện tại</li>
                    <li>• Nên kết hợp chữ cái, số và ký tự đặc biệt</li>
                    <li>• Tránh sử dụng thông tin cá nhân dễ đoán</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bảo mật Edge Function</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Xử lý server-side với bcrypt</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Rate limiting: 3 lần/10 phút</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Ghi log tất cả hoạt động</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Xác thực JWT token</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account-lockout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Cơ chế khóa tài khoản</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Tài khoản sẽ bị khóa tự động sau 3 lần đăng nhập thất bại liên tiếp.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Quy trình khóa tài khoản:</h3>
                
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50">
                    <h4 className="font-medium text-yellow-800">Lần thất bại 1-2</h4>
                    <p className="text-sm text-yellow-700">
                      Hệ thống ghi nhận và cảnh báo người dùng
                    </p>
                  </div>

                  <div className="p-3 border-l-4 border-red-400 bg-red-50">
                    <h4 className="font-medium text-red-800">Lần thất bại thứ 3</h4>
                    <p className="text-sm text-red-700">
                      Tài khoản bị khóa tự động, không thể đăng nhập
                    </p>
                  </div>

                  <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                    <h4 className="font-medium text-blue-800">Sau 24 giờ</h4>
                    <p className="text-sm text-blue-700">
                      Tài khoản tự động mở khóa, có thể đăng nhập lại
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Thông tin được lưu trữ:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Số lần đăng nhập thất bại</li>
                    <li>• Thời gian lần thất bại cuối cùng</li>
                    <li>• Thời gian khóa tài khoản</li>
                    <li>• Trạng thái tài khoản (active/locked)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Xử lý khi tài khoản bị khóa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Đối với người dùng:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Chờ 24 giờ để tài khoản tự động mở khóa</li>
                  <li>• Liên hệ Admin để được hỗ trợ ngay lập tức</li>
                  <li>• Kiểm tra lại thông tin đăng nhập</li>
                  <li>• Đảm bảo không có lỗi gõ phím</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Đối với Admin:</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Sử dụng tab "Tài khoản" trong Quản lý dữ liệu</li>
                  <li>• Tìm kiếm tài khoản bị khóa</li>
                  <li>• Nhấn "Mở khóa tài khoản" để mở khóa ngay</li>
                  <li>• Theo dõi log bảo mật để phát hiện bất thường</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin-guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Hướng dẫn dành cho Admin</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Admin có quyền quản lý tất cả tài khoản và truy cập các công cụ bảo mật nâng cao.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Truy cập công cụ quản lý:</h3>
                
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Quản lý dữ liệu → Tab "Tài khoản"</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Công cụ chính để quản lý tài khoản người dùng
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Test Bảo mật</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Kiểm tra và test các tính năng bảo mật
                    </p>
                  </div>
                </div>

                <h3 className="font-semibold">Chức năng chính:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Tìm kiếm tài khoản</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Nhập tên đăng nhập</li>
                      <li>• Xem thông tin chi tiết</li>
                      <li>• Kiểm tra trạng thái</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Mở khóa tài khoản</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Mở khóa ngay lập tức</li>
                      <li>• Reset số lần thất bại</li>
                      <li>• Cập nhật trạng thái</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Theo dõi bảo mật</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Xem lịch sử đăng nhập</li>
                      <li>• Phát hiện bất thường</li>
                      <li>• Ghi log hoạt động</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Quản lý người dùng</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Tạo tài khoản mới</li>
                      <li>• Cập nhật thông tin</li>
                      <li>• Phân quyền truy cập</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quy trình xử lý sự cố</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border-l-4 border-red-400 bg-red-50">
                  <h4 className="font-medium text-red-800">Tài khoản bị khóa</h4>
                  <ol className="text-sm text-red-700 mt-2 space-y-1">
                    <li>1. Xác minh danh tính người dùng</li>
                    <li>2. Kiểm tra log bảo mật</li>
                    <li>3. Mở khóa tài khoản nếu hợp lệ</li>
                    <li>4. Hướng dẫn người dùng đổi mật khẩu</li>
                  </ol>
                </div>

                <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50">
                  <h4 className="font-medium text-yellow-800">Quên mật khẩu</h4>
                  <ol className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>1. Xác minh danh tính người dùng</li>
                    <li>2. Reset mật khẩu về mặc định</li>
                    <li>3. Thông báo mật khẩu mới cho người dùng</li>
                    <li>4. Yêu cầu đổi mật khẩu ngay lập tức</li>
                  </ol>
                </div>

                <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                  <h4 className="font-medium text-blue-800">Hoạt động đáng ngờ</h4>
                  <ol className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>1. Kiểm tra log chi tiết</li>
                    <li>2. Khóa tài khoản tạm thời</li>
                    <li>3. Liên hệ người dùng xác minh</li>
                    <li>4. Thực hiện biện pháp bảo mật bổ sung</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Xử lý sự cố thường gặp</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-red-600 mb-2">❌ Không thể đăng nhập</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nguyên nhân:</strong></p>
                    <ul className="list-disc list-inside ml-4 text-gray-600">
                      <li>Sai tên đăng nhập hoặc mật khẩu</li>
                      <li>Tài khoản bị khóa</li>
                      <li>Lỗi kết nối mạng</li>
                    </ul>
                    <p><strong>Giải pháp:</strong></p>
                    <ul className="list-disc list-inside ml-4 text-gray-600">
                      <li>Kiểm tra lại thông tin đăng nhập</li>
                      <li>Liên hệ Admin nếu tài khoản bị khóa</li>
                      <li>Thử lại sau vài phút</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-yellow-600 mb-2">⚠️ Không thể đổi mật khẩu</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nguyên nhân:</strong></p>
                    <ul className="list-disc list-inside ml-4 text-gray-600">
                      <li>Mật khẩu hiện tại không đúng</li>
                      <li>Mật khẩu mới không đáp ứng yêu cầu</li>
                      <li>Đã vượt quá giới hạn thử</li>
                    </ul>
                    <p><strong>Giải pháp:</strong></p>
                    <ul className="list-disc list-inside ml-4 text-gray-600">
                      <li>Xác minh mật khẩu hiện tại</li>
                      <li>Đảm bảo mật khẩu mới có ít nhất 6 ký tự</li>
                      <li>Chờ 10 phút trước khi thử lại</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-blue-600 mb-2">ℹ️ Tài khoản bị khóa</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nguyên nhân:</strong></p>
                    <ul className="list-disc list-inside ml-4 text-gray-600">
                      <li>Đăng nhập sai 3 lần liên tiếp</li>
                      <li>Hoạt động đáng ngờ được phát hiện</li>
                      <li>Admin khóa tài khoản</li>
                    </ul>
                    <p><strong>Giải pháp:</strong></p>
                    <ul className="list-disc list-inside ml-4 text-gray-600">
                      <li>Chờ 24 giờ để tự động mở khóa</li>
                      <li>Liên hệ Admin để mở khóa ngay</li>
                      <li>Đổi mật khẩu sau khi mở khóa</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-green-600 mb-2">✅ Phiên làm việc hết hạn</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nguyên nhân:</strong></p>
                    <ul className="list-disc list-inside ml-4 text-gray-600">
                      <li>Token JWT đã hết hạn</li>
                      <li>Không hoạt động trong thời gian dài</li>
                      <li>Lỗi xác thực</li>
                    </ul>
                    <p><strong>Giải pháp:</strong></p>
                    <ul className="list-disc list-inside ml-4 text-gray-600">
                      <li>Đăng nhập lại</li>
                      <li>Xóa cache trình duyệt</li>
                      <li>Kiểm tra kết nối mạng</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liên hệ hỗ trợ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">Hỗ trợ kỹ thuật</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Liên hệ Admin hệ thống để được hỗ trợ về các vấn đề kỹ thuật và bảo mật
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">Báo cáo sự cố</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Báo cáo ngay lập tức nếu phát hiện hoạt động bất thường hoặc lỗ hổng bảo mật
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}