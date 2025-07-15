import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { AdminEmailSettings } from '@/components/admin/AdminEmailSettings';
import { PWATestPanel } from '@/components/PWATestPanel';
import PushNotificationTester from '@/components/PushNotificationTester';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, TestTube, Bell, Settings, Smartphone, Zap } from 'lucide-react';

export function AdminToolsPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Công cụ Quản trị</h2>
        <p className="text-gray-600">Quản lý và kiểm tra các chức năng hệ thống</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Email System</p>
                <p className="text-xs text-blue-700">Resend API</p>
              </div>
              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Push Notifications</p>
                <p className="text-xs text-purple-700">VAPID Enabled</p>
              </div>
              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
                Ready
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">PWA Features</p>
                <p className="text-xs text-green-700">Offline Support</p>
              </div>
              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
                Enabled
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tools */}
      <Accordion type="single" collapsible className="w-full" defaultValue="push-notifications">
        {/* Push Notifications */}
        <AccordionItem value="push-notifications" className="border rounded-lg mb-4">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-lg">Thông báo Đẩy</span>
                  <p className="text-sm text-gray-600 mt-1">Kiểm tra và quản lý push notifications</p>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Zap className="h-3 w-3 mr-1" />
                  Real-time
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <TestTube className="h-3 w-3 mr-1" />
                  Test
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <PushNotificationTester />
          </AccordionContent>
        </AccordionItem>

        {/* Email Management */}
        <AccordionItem value="email-management" className="border rounded-lg mb-4">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-lg">Quản lý Email</span>
                  <p className="text-sm text-gray-600 mt-1">Cài đặt, kiểm tra và quản lý hệ thống email</p>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Settings className="h-3 w-3 mr-1" />
                  Config
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <TestTube className="h-3 w-3 mr-1" />
                  Test
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <AdminEmailSettings />
          </AccordionContent>
        </AccordionItem>

        {/* PWA Features */}
        <AccordionItem value="pwa-features" className="border rounded-lg mb-4">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-lg">PWA & Mobile</span>
                  <p className="text-sm text-gray-600 mt-1">Kiểm tra tính năng Progressive Web App</p>
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <TestTube className="h-3 w-3 mr-1" />
                  Test
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <PWATestPanel />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium mb-1">Hệ thống Quản lý Tài sản - CRC</p>
            <p>Các công cụ quản trị giúp kiểm tra và duy trì hoạt động ổn định của hệ thống</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}