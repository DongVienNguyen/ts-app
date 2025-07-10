import { Shield, Lock, Users, AlertTriangle, CheckCircle, Key } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function SecurityFeaturesSummary() {
  const features = [
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Secure Password Reset",
      description: "Edge function-based password reset with bcrypt validation",
      status: "implemented",
      details: [
        "Current password verification",
        "New password validation",
        "Automatic password hashing",
        "Rate limiting protection"
      ]
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Account Lockout Protection",
      description: "Automatic account locking after failed login attempts",
      status: "implemented",
      details: [
        "3 failed attempts trigger lock",
        "24-hour auto-unlock timer",
        "Real-time status checking",
        "Admin manual unlock"
      ]
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Admin Account Management",
      description: "Administrative tools for account management",
      status: "implemented",
      details: [
        "Account search and status check",
        "Manual account unlock",
        "Failed attempt reset",
        "Account status monitoring"
      ]
    },
    {
      icon: <Key className="w-5 h-5" />,
      title: "Secure Authentication",
      description: "JWT-based authentication with security logging",
      status: "implemented",
      details: [
        "Input sanitization",
        "Rate limiting",
        "Security event logging",
        "Session validation"
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented':
        return <Badge variant="default" className="bg-green-100 text-green-800">Đã triển khai</Badge>;
      case 'pending':
        return <Badge variant="secondary">Đang phát triển</Badge>;
      default:
        return <Badge variant="outline">Chưa bắt đầu</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Tính năng bảo mật</h1>
          <p className="text-gray-600">Tổng quan các tính năng bảo mật đã được triển khai</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {feature.icon}
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                {getStatusBadge(feature.status)}
              </div>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feature.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span>Hướng dẫn sử dụng</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Đối với người dùng:</h3>
            <ul className="space-y-1 text-sm text-gray-600 ml-4">
              <li>• Sử dụng menu "Đổi mật khẩu" để thay đổi mật khẩu</li>
              <li>• Liên hệ Admin nếu tài khoản bị khóa</li>
              <li>• Mật khẩu phải có ít nhất 6 ký tự</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Đối với Admin:</h3>
            <ul className="space-y-1 text-sm text-gray-600 ml-4">
              <li>• Sử dụng tab "Tài khoản" trong Quản lý dữ liệu</li>
              <li>• Có thể mở khóa tài khoản bị khóa</li>
              <li>• Theo dõi trạng thái đăng nhập của người dùng</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}