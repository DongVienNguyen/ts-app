import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Shield, Activity, BarChart3, Bell, Users, UserCog } from 'lucide-react';

export function SecurityDocumentation() {
  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Tài liệu này cung cấp thông tin chi tiết về các tính năng bảo mật được triển khai trong hệ thống.
      </p>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Giám sát Thời gian thực</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              Tab "Thời gian thực" cung cấp một cái nhìn trực tiếp về các hoạt động bảo mật đang diễn ra. Nó sử dụng một kênh đăng ký (subscription) với Supabase để nhận các sự kiện bảo mật ngay khi chúng xảy ra. Các số liệu chính như kết nối đang hoạt động, sự kiện gần đây và mức độ đe dọa được cập nhật liên tục. Dòng hoạt động trực tiếp hiển thị chi tiết từng sự kiện, giúp quản trị viên có thể phản ứng nhanh chóng với các mối đe dọa tiềm ẩn.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-6">
          <AccordionTrigger>
            <div className="flex items-center space-x-2">
              <UserCog className="w-4 h-4" />
              <span>Quản lý Người dùng & Tác vụ Bảo mật</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              Tab "Test" đã được nâng cấp thành một bảng điều khiển tác vụ bảo mật. Ngoài việc mô phỏng các sự kiện để kiểm tra hệ thống, quản trị viên giờ đây có thể thực hiện các hành động quản trị thực sự.
              <br/><br/>
              <strong>Khóa/Mở khóa Tài khoản:</strong> Quản trị viên có thể khóa hoặc mở khóa tài khoản người dùng ngay lập tức bằng cách nhập tên người dùng và chọn hành động tương ứng. Các hành động này được thực hiện thông qua một Supabase Edge Function an toàn, yêu cầu quyền admin để thực thi. Mọi hành động khóa/mở khóa đều được ghi lại trong bảng `security_events` để phục vụ cho việc kiểm tra và giám sát.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Ghi nhật ký Sự kiện Bảo mật</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              Mọi hoạt động quan trọng liên quan đến bảo mật đều được ghi lại trong bảng `security_events` của Supabase. Điều này bao gồm các lần đăng nhập thành công và thất bại, các hoạt động đáng ngờ, thay đổi mật khẩu, và các hành động quản trị như khóa/mở khóa tài khoản. Việc ghi nhật ký này rất quan trọng cho việc kiểm tra, phân tích sau sự cố và tuân thủ các quy định.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Phân tích Mối đe dọa</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              Các biểu đồ phân tích mối đe dọa trong cả tab "Thời gian thực" và "Tổng hợp" giúp trực quan hóa xu hướng của các sự kiện bảo mật theo thời gian. Dữ liệu từ bảng `security_events` được tổng hợp theo ngày để hiển thị số lượng đăng nhập thành công, thất bại và các hoạt động đáng ngờ. Điều này giúp quản trị viên dễ dàng xác định các mẫu bất thường, chẳng hạn như sự gia tăng đột ngột các lần đăng nhập thất bại, có thể chỉ ra một cuộc tấn công brute-force.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Hệ thống Cảnh báo</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              Hệ thống cảnh báo được thiết kế để thông báo ngay lập tức cho quản trị viên về các sự kiện quan trọng. Hiện tại, hệ thống sử dụng thông báo toast (pop-up) trên giao diện người dùng. Tab "Test" cho phép mô phỏng các sự kiện và gửi thông báo kiểm tra để đảm bảo hệ thống hoạt động chính xác. Trong tương lai, hệ thống này có thể được mở rộng để gửi cảnh báo qua email hoặc các kênh khác.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5">
          <AccordionTrigger>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Phân quyền Người dùng (RBAC)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              Hệ thống sử dụng cơ chế kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC). Trang giám sát bảo mật này chỉ có thể được truy cập bởi người dùng có vai trò 'admin'. Việc kiểm tra quyền được thực hiện ở cả phía client và phía máy chủ (thông qua Edge Functions), đảm bảo rằng chỉ những người dùng được ủy quyền mới có thể xem và tương tác với các tính năng bảo mật nhạy cảm.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}