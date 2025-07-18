import type { Database } from '@/integrations/supabase/types';
import { z } from 'zod';

export type TableName = keyof Database['public']['Tables'];

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'password' | 'email';
  options?: string[];
  required?: boolean;
  defaultValue?: any;
  filterable?: boolean;
  schema?: z.ZodTypeAny;
}

// Define and export the EntityConfig interface
export interface EntityConfig {
  entity: TableName;
  name: string;
  primaryKey: string;
  fields: FieldConfig[];
}

export const entityConfig: Record<string, EntityConfig> = {
  asset_transactions: {
    entity: 'asset_transactions',
    name: 'Giao dịch tài sản',
    primaryKey: 'id',
    fields: [
      { key: 'staff_code', label: 'Mã nhân viên', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Mã nhân viên là bắt buộc") },
      { key: 'transaction_date', label: 'Ngày giao dịch', type: 'date', required: true, filterable: true, schema: z.any().refine(val => val, { message: "Ngày giao dịch là bắt buộc" }) },
      { key: 'parts_day', label: 'Ca', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Ca là bắt buộc") },
      { key: 'room', label: 'Phòng', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Phòng là bắt buộc") },
      { key: 'transaction_type', label: 'Loại giao dịch', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Loại giao dịch là bắt buộc") },
      { key: 'asset_year', label: 'Năm TS', type: 'number', required: true, filterable: true, schema: z.coerce.number().min(1900, "Năm không hợp lệ") },
      { key: 'asset_code', label: 'Mã TS', type: 'number', required: true, filterable: true, schema: z.coerce.number().min(1, "Mã TS là bắt buộc") },
      { key: 'note', label: 'Ghi chú', type: 'textarea', schema: z.string().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', schema: z.any().optional().nullable() },
    ],
  },
  notifications: {
    entity: 'notifications',
    name: 'Thông báo',
    primaryKey: 'id',
    fields: [
      { key: 'recipient_username', label: 'Người nhận', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Người nhận là bắt buộc") },
      { key: 'title', label: 'Tiêu đề', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tiêu đề là bắt buộc") },
      { key: 'message', label: 'Nội dung', type: 'textarea', schema: z.string().optional().nullable() },
      { key: 'notification_type', label: 'Loại thông báo', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Loại thông báo là bắt buộc") },
      { key: 'is_read', label: 'Đã đọc', type: 'boolean', options: ['true', 'false'], filterable: true, schema: z.boolean().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
    ],
  },
  asset_reminders: {
    entity: 'asset_reminders',
    name: 'Nhắc nhở tài sản',
    primaryKey: 'id',
    fields: [
      { key: 'ten_ts', label: 'Tên tài sản', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên tài sản là bắt buộc") },
      { key: 'ngay_den_han', label: 'Ngày đến hạn', type: 'date', required: true, filterable: true, schema: z.any().refine(val => val, { message: "Ngày đến hạn là bắt buộc" }) },
      { key: 'cbqln', label: 'CB QLN', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'cbkh', label: 'CB KH', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'], filterable: true, schema: z.boolean().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
    ],
  },
  crc_reminders: {
    entity: 'crc_reminders',
    name: 'Nhắc nhở CRC',
    primaryKey: 'id',
    fields: [
      { key: 'loai_bt_crc', label: 'Loại BT CRC', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Loại BT CRC là bắt buộc") },
      { key: 'ngay_thuc_hien', label: 'Ngày thực hiện', type: 'date', required: true, filterable: true, schema: z.any().refine(val => val, { message: "Ngày thực hiện là bắt buộc" }) },
      { key: 'ldpcrc', label: 'LDP CRC', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'cbcrc', label: 'CB CRC', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'quycrc', label: 'Quy CRC', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'], filterable: true, schema: z.boolean().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
    ],
  },
  other_assets: {
    entity: 'other_assets',
    name: 'Tài sản khác',
    primaryKey: 'id',
    fields: [
      { key: 'name', label: 'Tên tài sản', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên tài sản là bắt buộc") },
      { key: 'deposit_date', label: 'Ngày gửi', type: 'date', filterable: true, schema: z.any().optional().nullable() },
      { key: 'depositor', label: 'Người gửi', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'deposit_receiver', label: 'Người nhận gửi', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'withdrawal_date', label: 'Ngày rút', type: 'date', filterable: true, schema: z.any().optional().nullable() },
      { key: 'withdrawal_deliverer', label: 'Người giao rút', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'withdrawal_receiver', label: 'Người nhận rút', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'notes', label: 'Ghi chú', type: 'textarea', schema: z.string().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', schema: z.any().optional().nullable() },
      { key: 'updated_at', label: 'Ngày cập nhật', type: 'date', schema: z.any().optional().nullable() },
    ],
  },
  cbqln: {
    entity: 'cbqln',
    name: 'CB QLN',
    primaryKey: 'id',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên nhân viên là bắt buộc") },
      { key: 'email', label: 'Email', type: 'email', required: true, filterable: true, schema: z.string().email("Email không hợp lệ") },
    ],
  },
  cbkh: {
    entity: 'cbkh',
    name: 'CB KH',
    primaryKey: 'id',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên nhân viên là bắt buộc") },
      { key: 'email', label: 'Email', type: 'email', required: true, filterable: true, schema: z.string().email("Email không hợp lệ") },
    ],
  },
  ldpcrc: {
    entity: 'ldpcrc',
    name: 'LDP CRC',
    primaryKey: 'id',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên nhân viên là bắt buộc") },
      { key: 'email', label: 'Email', type: 'email', required: true, filterable: true, schema: z.string().email("Email không hợp lệ") },
    ],
  },
  cbcrc: {
    entity: 'cbcrc',
    name: 'CB CRC',
    primaryKey: 'id',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên nhân viên là bắt buộc") },
      { key: 'email', label: 'Email', type: 'email', required: true, filterable: true, schema: z.string().email("Email không hợp lệ") },
    ],
  },
  quycrc: {
    entity: 'quycrc',
    name: 'Quy CRC',
    primaryKey: 'id',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên nhân viên là bắt buộc") },
      { key: 'email', label: 'Email', type: 'email', required: true, filterable: true, schema: z.string().email("Email không hợp lệ") },
    ],
  },
  sent_asset_reminders: {
    entity: 'sent_asset_reminders',
    name: 'Nhắc nhở tài sản đã gửi',
    primaryKey: 'id',
    fields: [
      { key: 'ten_ts', label: 'Tên tài sản', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên tài sản là bắt buộc") },
      { key: 'ngay_den_han', label: 'Ngày đến hạn', type: 'date', required: true, filterable: true, schema: z.any().refine(val => val, { message: "Ngày đến hạn là bắt buộc" }) },
      { key: 'cbqln', label: 'CB QLN', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'cbkh', label: 'CB KH', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'], filterable: true, schema: z.boolean().optional().nullable() },
      { key: 'sent_date', label: 'Ngày gửi', type: 'date', required: true, filterable: true, schema: z.any().refine(val => val, { message: "Ngày gửi là bắt buộc" }) },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', schema: z.any().optional().nullable() },
    ],
  },
  sent_crc_reminders: {
    entity: 'sent_crc_reminders',
    name: 'Nhắc nhở CRC đã gửi',
    primaryKey: 'id',
    fields: [
      { key: 'loai_bt_crc', label: 'Loại BT CRC', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Loại BT CRC là bắt buộc") },
      { key: 'ngay_thuc_hien', label: 'Ngày thực hiện', type: 'date', required: true, filterable: true, schema: z.any().refine(val => val, { message: "Ngày thực hiện là bắt buộc" }) },
      { key: 'ldpcrc', label: 'LDP CRC', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'cbcrc', label: 'CB CRC', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'quycrc', label: 'Quy CRC', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'], filterable: true, schema: z.boolean().optional().nullable() },
      { key: 'sent_date', label: 'Ngày gửi', type: 'date', required: true, filterable: true, schema: z.any().refine(val => val, { message: "Ngày gửi là bắt buộc" }) },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', schema: z.any().optional().nullable() },
    ],
  },
  asset_history_archive: {
    entity: 'asset_history_archive',
    name: 'Lịch sử tài sản',
    primaryKey: 'id',
    fields: [
      { key: 'original_asset_id', label: 'ID tài sản gốc', type: 'text', required: true, schema: z.string().min(1, "ID là bắt buộc") },
      { key: 'asset_name', label: 'Tên tài sản', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên tài sản là bắt buộc") },
      { key: 'change_type', label: 'Loại thay đổi', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Loại thay đổi là bắt buộc") },
      { key: 'changed_by', label: 'Người thay đổi', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Người thay đổi là bắt buộc") },
      { key: 'change_reason', label: 'Lý do thay đổi', type: 'textarea', schema: z.string().optional().nullable() },
      { key: 'created_at', label: 'Thời gian tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
    ],
  },
  staff: {
    entity: 'staff',
    name: 'Nhân viên',
    primaryKey: 'id',
    fields: [
      { key: 'username', label: 'Tên đăng nhập', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên đăng nhập là bắt buộc") },
      { key: 'password', label: 'Mật khẩu', type: 'password', required: true, schema: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự") },
      { key: 'staff_name', label: 'Tên nhân viên', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'role', label: 'Vai trò', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'department', label: 'Phòng ban', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'account_status', label: 'Trạng thái tài khoản', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'email', label: 'Email', type: 'email', filterable: true, schema: z.string().email("Email không hợp lệ").optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', schema: z.any().optional().nullable() },
      { key: 'updated_at', label: 'Ngày cập nhật', type: 'date', schema: z.any().optional().nullable() },
    ],
  },
  push_subscriptions: {
    entity: 'push_subscriptions',
    name: 'Đăng ký Push',
    primaryKey: 'id',
    fields: [
      { key: 'id', label: 'ID', type: 'text', required: true, schema: z.string().min(1, "ID là bắt buộc") },
      { key: 'username', label: 'Tên người dùng', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên người dùng là bắt buộc") },
      { key: 'subscription', label: 'Thông tin đăng ký', type: 'textarea', required: true, schema: z.any() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
    ],
  },
  security_events: {
    entity: 'security_events',
    name: 'Sự kiện bảo mật',
    primaryKey: 'id',
    fields: [
      { key: 'id', label: 'ID', type: 'text', required: true, schema: z.string().min(1, "ID là bắt buộc") },
      { key: 'event_type', label: 'Loại sự kiện', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Loại sự kiện là bắt buộc") },
      { key: 'username', label: 'Tên người dùng', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'event_data', label: 'Dữ liệu sự kiện', type: 'textarea', schema: z.any().optional().nullable() },
      { key: 'user_agent', label: 'User Agent', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'ip_address', label: 'Địa chỉ IP', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
    ],
  },
  system_status: {
    entity: 'system_status',
    name: 'Trạng thái hệ thống',
    primaryKey: 'id',
    fields: [
      { key: 'id', label: 'ID', type: 'text', required: true, schema: z.string().min(1, "ID là bắt buộc") },
      { key: 'service_name', label: 'Tên dịch vụ', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên dịch vụ là bắt buộc") },
      { key: 'status', label: 'Trạng thái', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Trạng thái là bắt buộc") },
      { key: 'response_time_ms', label: 'Thời gian phản hồi (ms)', type: 'number', filterable: true, schema: z.coerce.number().optional().nullable() },
      { key: 'error_rate', label: 'Tỷ lệ lỗi', type: 'number', filterable: true, schema: z.coerce.number().optional().nullable() },
      { key: 'uptime_percentage', label: 'Thời gian hoạt động (%)', type: 'number', filterable: true, schema: z.coerce.number().optional().nullable() },
      { key: 'last_check', label: 'Kiểm tra lần cuối', type: 'date', filterable: true, schema: z.any().optional().nullable() },
      { key: 'status_data', label: 'Dữ liệu trạng thái', type: 'textarea', schema: z.any().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
    ],
  },
  system_errors: {
    entity: 'system_errors',
    name: 'Lỗi hệ thống',
    primaryKey: 'id',
    fields: [
      { key: 'id', label: 'ID', type: 'text', required: true, schema: z.string().min(1, "ID là bắt buộc") },
      { key: 'error_type', label: 'Loại lỗi', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Loại lỗi là bắt buộc") },
      { key: 'error_message', label: 'Thông báo lỗi', type: 'textarea', required: true, schema: z.string().min(1, "Thông báo lỗi là bắt buộc") },
      { key: 'error_stack', label: 'Stack Trace', type: 'textarea', schema: z.string().optional().nullable() },
      { key: 'function_name', label: 'Tên hàm', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'user_id', label: 'ID người dùng', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'request_url', label: 'URL yêu cầu', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'user_agent', label: 'User Agent', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'ip_address', label: 'Địa chỉ IP', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'severity', label: 'Mức độ nghiêm trọng', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'status', label: 'Trạng thái', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'error_data', label: 'Dữ liệu lỗi', type: 'textarea', schema: z.any().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
      { key: 'resolved_at', label: 'Ngày giải quyết', type: 'date', filterable: true, schema: z.any().optional().nullable() },
      { key: 'resolved_by', label: 'Người giải quyết', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'resolution_notes', label: 'Ghi chú giải quyết', type: 'textarea', schema: z.string().optional().nullable() },
      { key: 'assigned_to', label: 'Giao cho', type: 'text', filterable: true, schema: z.string().optional().nullable() },
    ],
  },
  system_alerts: {
    entity: 'system_alerts',
    name: 'Cảnh báo hệ thống',
    primaryKey: 'id',
    fields: [
      { key: 'id', label: 'ID', type: 'text', required: true, schema: z.string().min(1, "ID là bắt buộc") },
      { key: 'alert_id', label: 'ID cảnh báo', type: 'text', required: true, filterable: true, schema: z.string().min(1, "ID cảnh báo là bắt buộc") },
      { key: 'rule_id', label: 'ID quy tắc', type: 'text', required: true, filterable: true, schema: z.string().min(1, "ID quy tắc là bắt buộc") },
      { key: 'rule_name', label: 'Tên quy tắc', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên quy tắc là bắt buộc") },
      { key: 'metric', label: 'Chỉ số', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Chỉ số là bắt buộc") },
      { key: 'current_value', label: 'Giá trị hiện tại', type: 'number', required: true, filterable: true, schema: z.coerce.number() },
      { key: 'threshold', label: 'Ngưỡng', type: 'number', required: true, filterable: true, schema: z.coerce.number() },
      { key: 'severity', label: 'Mức độ nghiêm trọng', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Mức độ nghiêm trọng là bắt buộc") },
      { key: 'message', label: 'Thông báo', type: 'textarea', required: true, schema: z.string().min(1, "Thông báo là bắt buộc") },
      { key: 'acknowledged', label: 'Đã xác nhận', type: 'boolean', options: ['true', 'false'], filterable: true, schema: z.boolean().optional().nullable() },
      { key: 'acknowledged_by', label: 'Người xác nhận', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'acknowledged_at', label: 'Thời gian xác nhận', type: 'date', filterable: true, schema: z.any().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
      { key: 'updated_at', label: 'Ngày cập nhật', type: 'date', filterable: true, schema: z.any().optional().nullable() },
    ],
  },
  system_metrics: {
    entity: 'system_metrics',
    name: 'Chỉ số hệ thống',
    primaryKey: 'id',
    fields: [
      { key: 'id', label: 'ID', type: 'text', required: true, schema: z.string().min(1, "ID là bắt buộc") },
      { key: 'metric_type', label: 'Loại chỉ số', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Loại chỉ số là bắt buộc") },
      { key: 'metric_name', label: 'Tên chỉ số', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên chỉ số là bắt buộc") },
      { key: 'metric_value', label: 'Giá trị chỉ số', type: 'number', required: true, filterable: true, schema: z.coerce.number() },
      { key: 'metric_unit', label: 'Đơn vị chỉ số', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'additional_data', label: 'Dữ liệu bổ sung', type: 'textarea', schema: z.any().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
    ],
  },
  user_sessions: {
    entity: 'user_sessions',
    name: 'Phiên người dùng',
    primaryKey: 'id',
    fields: [
      { key: 'id', label: 'ID', type: 'text', required: true, schema: z.string().min(1, "ID là bắt buộc") },
      { key: 'username', label: 'Tên người dùng', type: 'text', required: true, filterable: true, schema: z.string().min(1, "Tên người dùng là bắt buộc") },
      { key: 'session_start', label: 'Bắt đầu phiên', type: 'date', filterable: true, schema: z.any().optional().nullable() },
      { key: 'session_end', label: 'Kết thúc phiên', type: 'date', filterable: true, schema: z.any().optional().nullable() },
      { key: 'duration_minutes', label: 'Thời lượng (phút)', type: 'number', filterable: true, schema: z.coerce.number().optional().nullable() },
      { key: 'pages_visited', label: 'Số trang đã truy cập', type: 'number', filterable: true, schema: z.coerce.number().optional().nullable() },
      { key: 'actions_performed', label: 'Số hành động đã thực hiện', type: 'number', filterable: true, schema: z.coerce.number().optional().nullable() },
      { key: 'ip_address', label: 'Địa chỉ IP', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'user_agent', label: 'User Agent', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'device_type', label: 'Loại thiết bị', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'browser_name', label: 'Trình duyệt', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'os_name', label: 'Hệ điều hành', type: 'text', filterable: true, schema: z.string().optional().nullable() },
      { key: 'session_data', label: 'Dữ liệu phiên', type: 'textarea', schema: z.any().optional().nullable() },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true, schema: z.any().optional().nullable() },
      { key: 'updated_at', label: 'Ngày cập nhật', type: 'date', filterable: true, schema: z.any().optional().nullable() },
    ],
  },
};