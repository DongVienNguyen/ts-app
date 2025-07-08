import React from 'react';
import { Shield, CheckCircle, Clock, AlertTriangle, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function SecurityImplementationSummary() {
  const features = [
    {
      category: "Authentication & Authorization",
      items: [
        { name: "JWT Token Authentication", status: "completed", priority: "high" },
        { name: "Bcrypt Password Hashing", status: "completed", priority: "high" },
        { name: "Session Management", status: "completed", priority: "high" },
        { name: "Role-based Access Control", status: "completed", priority: "medium" },
      ]
    },
    {
      category: "Password Security",
      items: [
        { name: "Secure Password Reset", status: "completed", priority: "high" },
        { name: "Password Strength Validation", status: "completed", priority: "medium" },
        { name: "Current Password Verification", status: "completed", priority: "high" },
        { name: "Password History Prevention", status: "partial", priority: "low" },
      ]
    },
    {
      category: "Account Protection",
      items: [
        { name: "Account Lockout Mechanism", status: "completed", priority: "high" },
        { name: "Failed Login Tracking", status: "completed", priority: "high" },
        { name: "Auto-unlock Timer", status: "completed", priority: "medium" },
        { name: "Admin Manual Unlock", status: "completed", priority: "medium" },
      ]
    },
    {
      category: "Rate Limiting & Monitoring",
      items: [
        { name: "Login Rate Limiting", status: "completed", priority: "high" },
        { name: "Password Reset Rate Limiting", status: "completed", priority: "medium" },
        { name: "Security Event Logging", status: "completed", priority: "medium" },
        { name: "Real-time Monitoring", status: "partial", priority: "low" },
      ]
    },
    {
      category: "Admin Tools",
      items: [
        { name: "Account Management Interface", status: "completed", priority: "high" },
        { name: "Security Testing Tools", status: "completed", priority: "medium" },
        { name: "Account Status Checking", status: "completed", priority: "medium" },
        { name: "Bulk Account Operations", status: "partial", priority: "low" },
      ]
    },
    {
      category: "User Experience",
      items: [
        { name: "Clear Error Messages", status: "completed", priority: "high" },
        { name: "Account Locked Guidance", status: "completed", priority: "medium" },
        { name: "Password Reset UI", status: "completed", priority: "high" },
        { name: "Security Documentation", status: "completed", priority: "medium" },
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Một phần</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">Chờ xử lý</Badge>;
      default:
        return <Badge variant="outline">Chưa bắt đầu</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Star className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const totalItems = features.reduce((sum, category) => sum + category.items.length, 0);
  const completedItems = features.reduce((sum, category) => 
    sum + category.items.filter(item => item.status === 'completed').length, 0
  );
  const partialItems = features.reduce((sum, category) => 
    sum + category.items.filter(item => item.status === 'partial').length, 0
  );

  const completionPercentage = Math.round((completedItems / totalItems) * 100);
  const partialPercentage = Math.round((partialItems / totalItems) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Tổng kết triển khai bảo mật</h1>
          <p className="text-gray-600">Báo cáo chi tiết về tình trạng triển khai các tính năng bảo mật</p>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ tổng thể</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Hoàn thành</span>
            <span className="text-sm text-gray-600">{completedItems}/{totalItems} tính năng</span>
          </div>
          <Progress value={completionPercentage} className="h-3" />
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedItems}</div>
              <div className="text-sm text-green-700">Hoàn thành</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{partialItems}</div>
              <div className="text-sm text-yellow-700">Một phần</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
              <div className="text-sm text-blue-700">Tỷ lệ hoàn thành</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {features.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="text-lg">{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(item.priority)}
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Chỉ số bảo mật</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">Mã hóa mật khẩu</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-gray-600">Lần thử tối đa</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">24h</div>
              <div className="text-sm text-gray-600">Thời gian khóa</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">JWT</div>
              <div className="text-sm text-gray-600">Xác thực token</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Khuyến nghị cải tiến</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Password History</h4>
                <p className="text-sm text-blue-700">
                  Triển khai tính năng ngăn chặn sử dụng lại mật khẩu cũ
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Real-time Monitoring</h4>
                <p className="text-sm text-yellow-700">
                  Thêm dashboard theo dõi hoạt động bảo mật thời gian thực
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Bulk Operations</h4>
                <p className="text-sm text-green-700">
                  Phát triển công cụ quản lý hàng loạt tài khoản cho admin
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="w-6 h-6" />
            <span>Triển khai thành công</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-green-700">
            <p className="font-medium">
              🎉 Hệ thống bảo mật đã được triển khai thành công với {completionPercentage}% tính năng hoàn thành!
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>✅ Xác thực và phân quyền hoàn chỉnh</li>
              <li>✅ Bảo vệ mật khẩu và tài khoản mạnh mẽ</li>
              <li>✅ Công cụ quản lý admin đầy đủ</li>
              <li>✅ Giao diện người dùng thân thiện</li>
              <li>✅ Tài liệu hướng dẫn chi tiết</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}