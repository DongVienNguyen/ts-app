import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { AdminEmailSettings } from '@/components/admin/AdminEmailSettings';
import { PWATestPanel } from '@/components/PWATestPanel';
import PushNotificationTester from '@/components/PushNotificationTester';
import { Mail, TestTube, Bell } from 'lucide-react';

export function AdminToolsPanel() {
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="email-settings">
      <AccordionItem value="email-settings">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Cài đặt & Kiểm tra Email</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <AdminEmailSettings />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="pwa-tester">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <TestTube className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Kiểm tra PWA</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <PWATestPanel />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="push-tester">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Kiểm tra Thông báo Đẩy</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <PushNotificationTester />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}