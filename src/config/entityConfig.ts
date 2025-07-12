import type { Database } from '@/integrations/supabase/types';

export type TableName = keyof Database['public']['Tables'];

export interface FieldConfig { // Exported FieldConfig
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'password'; // Added 'password' type
  options?: string[];
  required?: boolean;
  defaultValue?: any;
  filterable?: boolean;
}

export interface EntityConfig {
  entity: TableName;
  name: string;
  fields: FieldConfig[]; // Use FieldConfig
  primaryKey?: string; // Added primaryKey
}

export const entityConfig: Record<string, EntityConfig> = {
  asset_transactions: {
    entity: 'asset_transactions',
    name: 'Giao dịch tài sản',
    primaryKey: 'id', // Assuming 'id' is the primary key
    fields: [
      { key: 'staff_code', label: 'Mã nhân viên', type: 'text', required: true, filterable: true },
      { key: 'transaction_date', label: 'Ngày giao dịch', type: 'date', required: true, filterable: true },
      { key: 'parts_day', label: 'Ca', type: 'text', required: true, filterable: true },
      { key: 'room', label: 'Phòng', type: 'text', required: true, filterable: true },
      { key: 'transaction_type', label: 'Loại giao dịch', type: 'text', required: true, filterable: true },
      { key: 'asset_year', label: 'Năm TS', type: 'number', required: true, filterable: true },
      { key: 'asset_code', label: 'Mã TS', type: 'number', required: true, filterable: true },
      { key: 'note', label: 'Ghi chú', type: 'textarea' },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
    ],
  },
  notifications: {
    entity: 'notifications',
    name: 'Thông báo',
    primaryKey: 'id',
    fields: [
      { key: 'recipient_username', label: 'Người nhận', type: 'text', required: true, filterable: true },
      { key: 'title', label: 'Tiêu đề', type: 'text', required: true, filterable: true },
      { key: 'message', label: 'Nội dung', type: 'textarea' },
      { key: 'notification_type', label: 'Loại thông báo', type: 'text', required: true, filterable: true },
      { key: 'is_read', label: 'Đã đọc', type: 'boolean', options: ['true', 'false'], filterable: true },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true },
    ],
  },
  asset_reminders: {
    entity: 'asset_reminders',
    name: 'Nhắc nhở tài sản',
    primaryKey: 'id',
    fields: [
      { key: 'ten_ts', label: 'Tên tài sản', type: 'text', required: true, filterable: true },
      { key: 'ngay_den_han', label: 'Ngày đến hạn', type: 'date', required: true, filterable: true },
      { key: 'cbqln', label: 'CB QLN', type: 'text', filterable: true },
      { key: 'cbkh', label: 'CB KH', type: 'text', filterable: true },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'], filterable: true },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true },
    ],
  },
  crc_reminders: {
    entity: 'crc_reminders',
    name: 'Nhắc nhở CRC',
    primaryKey: 'id',
    fields: [
      { key: 'loai_bt_crc', label: 'Loại BT CRC', type: 'text', required: true, filterable: true },
      { key: 'ngay_thuc_hien', label: 'Ngày thực hiện', type: 'date', required: true, filterable: true },
      { key: 'ldpcrc', label: 'LDP CRC', type: 'text', filterable: true },
      { key: 'cbcrc', label: 'CB CRC', type: 'text', filterable: true },
      { key: 'quycrc', label: 'Quy CRC', type: 'text', filterable: true },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'], filterable: true },
      { key: 'created_at', label: 'Ngày tạo', type: 'date', filterable: true },
    ],
  },
  other_assets: {
    entity: 'other_assets',
    name: 'Tài sản khác',
    primaryKey: 'id',
    fields: [
      { key: 'name', label: 'Tên tài sản', type: 'text', required: true, filterable: true },
      { key: 'deposit_date', label: 'Ngày gửi', type: 'date', filterable: true },
      { key: 'depositor', label: 'Người gửi', type: 'text', filterable: true },
      { key: 'deposit_receiver', label: 'Người nhận gửi', type: 'text', filterable: true },
      { key: 'withdrawal_date', label: 'Ngày rút', type: 'date', filterable: true },
      { key: 'withdrawal_deliverer', label: 'Người giao rút', type: 'text', filterable: true },
      { key: 'withdrawal_receiver', label: 'Người nhận rút', type: 'text', filterable: true },
      { key: 'notes', label: 'Ghi chú', type: 'textarea' },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
      { key: 'updated_at', label: 'Ngày cập nhật', type: 'date' },
    ],
  },
  cbqln: {
    entity: 'cbqln',
    name: 'CB QLN',
    primaryKey: 'id',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true, filterable: true },
      { key: 'email', label: 'Email', type: 'text', required: true, filterable: true },
    ],
  },
  cbkh: {
    entity: 'cbkh',
    name: 'CB KH',
    primaryKey: 'id',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true, filterable: true },
      { key: 'email', label: 'Email', type: 'text', required: true, filterable: true },
    ],
  },
  ldpcrc: {
    entity: 'ldpcrc',
    name: 'LDP CRC',
    primaryKey: 'id',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true, filterable: true },
      { key: 'email', label: 'Email', type: 'text', required: true, filterable: true },
    ],
  },
  cbcrc: {
    entity: 'cbcrc',
    name: 'CB CRC',
    primaryKey: 'id',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true, filterable: true },
      { key: 'email', label: 'Email', type: 'text', required: true, filterable: true },
    ],
  },
  quycrc: {
    entity: 'quycrc',
    name: 'Quy CRC',
    primaryKey: 'id',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true, filterable: true },
      { key: 'email', label: 'Email', type: 'text', required: true, filterable: true },
    ],
  },
  sent_asset_reminders: {
    entity: 'sent_asset_reminders',
    name: 'Nhắc nhở tài sản đã gửi',
    primaryKey: 'id',
    fields: [
      { key: 'ten_ts', label: 'Tên tài sản', type: 'text', required: true, filterable: true },
      { key: 'ngay_den_han', label: 'Ngày đến hạn', type: 'date', required: true, filterable: true },
      { key: 'cbqln', label: 'CB QLN', type: 'text', filterable: true },
      { key: 'cbkh', label: 'CB KH', type: 'text', filterable: true },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'], filterable: true },
      { key: 'sent_date', label: 'Ngày gửi', type: 'date', required: true, filterable: true },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
    ],
  },
  sent_crc_reminders: {
    entity: 'sent_crc_reminders',
    name: 'Nhắc nhở CRC đã gửi',
    primaryKey: 'id',
    fields: [
      { key: 'loai_bt_crc', label: 'Loại BT CRC', type: 'text', required: true, filterable: true },
      { key: 'ngay_thuc_hien', label: 'Ngày thực hiện', type: 'date', required: true, filterable: true },
      { key: 'ldpcrc', label: 'LDP CRC', type: 'text', filterable: true },
      { key: 'cbcrc', label: 'CB CRC', type: 'text', filterable: true },
      { key: 'quycrc', label: 'Quy CRC', type: 'text', filterable: true },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'], filterable: true },
      { key: 'sent_date', label: 'Ngày gửi', type: 'date', required: true, filterable: true },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
    ],
  },
  asset_history_archive: {
    entity: 'asset_history_archive',
    name: 'Lịch sử tài sản',
    primaryKey: 'id',
    fields: [
      { key: 'original_asset_id', label: 'ID tài sản gốc', type: 'text', required: true },
      { key: 'asset_name', label: 'Tên tài sản', type: 'text', required: true, filterable: true },
      { key: 'change_type', label: 'Loại thay đổi', type: 'text', required: true, filterable: true },
      { key: 'changed_by', label: 'Người thay đổi', type: 'text', required: true, filterable: true },
      { key: 'change_reason', label: 'Lý do thay đổi', type: 'textarea' },
      { key: 'created_at', label: 'Thời gian tạo', type: 'date', filterable: true },
    ],
  },
  staff: {
    entity: 'staff',
    name: 'Nhân viên',
    primaryKey: 'id',
    fields: [
      { key: 'username', label: 'Tên đăng nhập', type: 'text', required: true, filterable: true },
      { key: 'password', label: 'Mật khẩu', type: 'password', required: true }, // Changed to 'password'
      { key: 'staff_name', label: 'Tên nhân viên', type: 'text', filterable: true },
      { key: 'role', label: 'Vai trò', type: 'text', filterable: true },
      { key: 'department', label: 'Phòng ban', type: 'text', filterable: true },
      { key: 'account_status', label: 'Trạng thái tài khoản', type: 'text', filterable: true },
      { key: 'email', label: 'Email', type: 'text', filterable: true },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
      { key: 'updated_at', label: 'Ngày cập nhật', type: 'date' },
    ],
  },
};