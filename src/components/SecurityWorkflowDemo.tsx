import React, { useState } from 'react';
import { Shield, User, UserCheck, Lock, Unlock, Key, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SecurityWorkflowDemo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState<'user' | 'admin'>('user');

  const userWorkflow = [
    {
      step: 1,
      title: "Đăng nhập",
      icon: <User className="w-5 h-5" />,
      description: "Người dùng nhập tên đăng nhập và mật khẩu",
      details: [
        "Hệ thống kiểm tra thông tin đăng nhập",
        "Xác thực với bcrypt hash",
        "Kiểm tra trạng thái tài khoản"
      ],
      status: "success"
    },
    {
      step: 2,
      title: "Xác thực thành công",
      icon: <CheckCircle className="w-5 h-5" />,
      description: "Tạo JWT token và cho phép truy cập",
      details: [
        "Tạo JWT token với thời gian hết hạn",
        "Lưu thông tin phiên làm việc",
        "Chuyển hướng đến trang chính"
      ],
      status: "success"
    },
    {
      step: 3,
      title: "Đổi mật khẩu",
      icon: <Key className="w-5 h-5" />,
      description: "Người dùng có thể đổi mật khẩu an toàn",
      details: [
        "Xác thực mật khẩu hiện tại",
        "Kiểm tra độ mạnh mật khẩu mới",
        "Mã hóa và lưu mật khẩu mới"
      ],
      status: "info"
    }
  ];

  const failureWorkflow = [
    {
      step: 1,
      title: "Đăng nhập thất bại",
      icon: <AlertTriangle className="w-5 h-5" />,
      description: "Sai tên đăng nhập hoặc mật khẩu",
      details: [
        "Ghi nhận lần thất bại",
        "Tăng counter failed_login_attempts",
        "Hiển thị thông báo lỗi"
      ],
      status: "warning"
    },
    {
      step: 2,
      title: "Thất bại lần 3",
      icon: <Lock className="w-5 h-5" />,
      description: "Tài khoản bị khóa tự động",
      details: [
        "Cập nhật account_status = 'locked'",
        "Ghi nhận thời gian khóa",
        "Hiển thị thông báo tài khoản bị khóa"
      ],
      status: "error"
    },
    {
      step: 3,
      title: "Mở khóa",
      icon: <Unlock className="w-5 h-5" />,
      description: "Admin mở khóa hoặc tự động sau 24h",
      details: [
        "Admin có thể mở khóa ngay",
        "Hoặc tự động mở khóa sau 24 giờ",
        "Reset counter về 0"
      ],
      status: "success"
    }
  ];

  const adminWorkflow = [
    {
      step: 1,
      title: "Tìm kiếm tài khoản",
      icon: <User className="w-5 h-5" />,
      description: "Admin tìm kiếm tài khoản cần quản lý",
      details: [
        "Nhập tên đăng nhập",
        "Hiển thị thông tin chi tiết",
        "Xem trạng thái và lịch sử"
      ],
      status: "info"
    },
    {
      step: 2,
      title: "Kiểm tra trạng thái",
      icon: <Shield className="w-5 h-5" />,
      description: "Xem chi tiết trạng thái bảo mật",
      details: [
        "Số lần đăng nhập thất bại",
        "Thời gian khóa tài khoản",
        "Lịch sử hoạt động"
      ],
      status: "info"
    },
    {
      step: 3,
      title: "Thực hiện hành động",
      icon: <UserCheck className="w-5 h-5" />,
      description: "Mở khóa hoặc reset tài khoản",
      details: [
        "Mở khóa tài khoản bị khóa",
        "Reset số lần thất bại",
        "Cập nhật trạng thái"
      ],
      status: "success"
    }
  ];

  const getWorkflow = () => {
    if (userType === 'admin') return adminWorkflow;
    return currentStep <= 3 ? userWorkflow : failureWorkflow;
  };

  const getStepStatus = (step: number, status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Demo luồng bảo mật</h1>
          <p className="text-gray-600">Minh họa cách hoạt động của hệ thống bảo mật</p>
        </div>
      </div>

      <Tabs defaultValue="user-flow" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="user-flow">Luồng người dùng</TabsTrigger>
          <TabsTrigger value="failure-flow">Luồng thất bại</TabsTrigger>
          <TabsTrigger value="admin-flow">Luồng admin</TabsTrigger>
        </TabsList>

        <TabsContent value="user-flow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-green-600" />
                <span>Luồng đăng nhập thành công</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userWorkflow.map((step, index) => (
                  <div key={step.step} className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStepStatus(step.step, step.status)}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{step.title}</h3>
                        <Badge variant="outline">Bước {step.step}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{step.description}</p>
                      <ul className="text-sm text-gray-500 space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {index < userWorkflow.length - 1 && (
                      <ArrowRight className="w-5 h-5 text-gray-400 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failure-flow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Luồng đăng nhập thất bại và khóa tài khoản</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Sau 3 lần đăng nhập thất bại, tài khoản sẽ bị khóa tự động để bảo vệ khỏi tấn công brute force.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {failureWorkflow.map((step, index) => (
                  <div key={step.step} className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStepStatus(step.step, step.status)}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{step.title}</h3>
                        <Badge variant="outline">Bước {step.step}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{step.description}</p>
                      <ul className="text-sm text-gray-500 space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {index < failureWorkflow.length - 1 && (
                      <ArrowRight className="w-5 h-5 text-gray-400 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin-flow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Luồng quản lý tài khoản của Admin</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Admin có quyền quản lý tất cả tài khoản, mở khóa và reset trạng thái bảo mật.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {adminWorkflow.map((step, index) => (
                  <div key={step.step} className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStepStatus(step.step, step.status)}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{step.title}</h3>
                        <Badge variant="outline">Bước {step.step}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{step.description}</p>
                      <ul className="text-sm text-gray-500 space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {index < adminWorkflow.length - 1 && (
                      <ArrowRight className="w-5 h-5 text-gray-400 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Features Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tính năng bảo mật đã triển khai</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Mã hóa mật khẩu</h3>
              </div>
              <p className="text-sm text-green-700">Bcrypt với salt ngẫu nhiên</p>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">JWT Authentication</h3>
              </div>
              <p className="text-sm text-blue-700">Token bảo mật với thời gian hết hạn</p>
            </div>

            <div className="p-4 border rounded-lg bg-yellow-50">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Rate Limiting</h3>
              </div>
              <p className="text-sm text-yellow-700">Chống tấn công brute force</p>
            </div>

            <div className="p-4 border rounded-lg bg-purple-50">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">Account Lockout</h3>
              </div>
              <p className="text-sm text-purple-700">Khóa tự động sau 3 lần thất bại</p>
            </div>

            <div className="p-4 border rounded-lg bg-indigo-50">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-indigo-800">Admin Tools</h3>
              </div>
              <p className="text-sm text-indigo-700">Quản lý tài khoản toàn diện</p>
            </div>

            <div className="p-4 border rounded-lg bg-pink-50">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-pink-600" />
                <h3 className="font-semibold text-pink-800">Security Logging</h3>
              </div>
              <p className="text-sm text-pink-700">Ghi log tất cả hoạt động</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}