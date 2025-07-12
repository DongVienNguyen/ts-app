import type { Database } from '@/integrations/supabase/types';

export type TableName = keyof Database['public']['Tables'];

export interface EntityConfig {
  entity: TableName;
  name: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean';
    options?: string[];
    required?: boolean;
    defaultValue?: any; // Added defaultValue property
  }>;
}

export const entityConfig: Record<string, EntityConfig> = {
  asset_transactions: {
    entity: 'asset_transactions',
    name: 'Giao dịch tài sản',
    fields: [
      { key: 'staff_code', label: 'Mã nhân viên', type: 'text', required: true },
      { key: 'transaction_date', label: 'Ngày giao dịch', type: 'date', required: true },
      { key: 'parts_day', label: 'Ca', type: 'text', required: true },
      { key: 'room', label: 'Phòng', type: 'text', required: true },
      { key: 'transaction_type', label: 'Loại giao dịch', type: 'text', required: true },
      { key: 'asset_year', label: 'Năm TS', type: 'number', required: true },
      { key: 'asset_code', label: 'Mã TS', type: 'number', required: true },
      { key: 'note', label: 'Ghi chú', type: 'textarea' },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
    ],
  },
  notifications: {
    entity: 'notifications',
    name: 'Thông báo',
    fields: [
      { key: 'recipient_username', label: 'Người nhận', type: 'text', required: true },
      { key: 'title', label: 'Tiêu đề', type: 'text', required: true },
      { key: 'message', label: 'Nội dung', type: 'textarea', required: true },
      { key: 'notification_type', label: 'Loại thông báo', type: 'text', required: true },
      { key: 'is_read', label: 'Đã đọc', type: 'boolean', options: ['true', 'false'] },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
    ],
  },
  asset_reminders: {
    entity: 'asset_reminders',
    name: 'Nhắc nhở tài sản',
    fields: [
      { key: 'ten_ts', label: 'Tên tài sản', type: 'text', required: true },
      { key: 'ngay_den_han', label: 'Ngày đến hạn', type: 'date', required: true },
      { key: 'cbqln', label: 'CB QLN', type: 'text' },
      { key: 'cbkh', label: 'CB KH', type: 'text' },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'] },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
    ],
  },
  crc_reminders: {
    entity: 'crc_reminders',
    name: 'Nhắc nhở CRC',
    fields: [
      { key: 'loai_bt_crc', label: 'Loại BT CRC', type: 'text', required: true },
      { key: 'ngay_thuc_hien', label: 'Ngày thực hiện', type: 'date', required: true },
      { key: 'ldpcrc', label: 'LDP CRC', type: 'text' },
      { key: 'cbcrc', label: 'CB CRC', type: 'text' },
      { key: 'quycrc', label: 'Quy CRC', type: 'text' },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'] },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
    ],
  },
  other_assets: {
    entity: 'other_assets',
    name: 'Tài sản khác',
    fields: [
      { key: 'name', label: 'Tên tài sản', type: 'text', required: true },
      { key: 'deposit_date', label: 'Ngày gửi', type: 'date' },
      { key: 'depositor', label: 'Người gửi', type: 'text' },
      { key: 'deposit_receiver', label: 'Người nhận gửi', type: 'text' },
      { key: 'withdrawal_date', label: 'Ngày rút', type: 'date' },
      { key: 'withdrawal_deliverer', label: 'Người giao rút', type: 'text' },
      { key: 'withdrawal_receiver', label: 'Người nhận rút', type: 'text' },
      { key: 'notes', label: 'Ghi chú', type: 'textarea' },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
      { key: 'updated_at', label: 'Ngày cập nhật', type: 'date' },
    ],
  },
  cbqln: {
    entity: 'cbqln',
    name: 'CB QLN',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
    ],
  },
  cbkh: {
    entity: 'cbkh',
    name: 'CB KH',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
    ],
  },
  ldpcrc: {
    entity: 'ldpcrc',
    name: 'LDP CRC',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
    ],
  },
  cbcrc: {
    entity: 'cbcrc',
    name: 'CB CRC',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
    ],
  },
  quycrc: {
    entity: 'quycrc',
    name: 'Quy CRC',
    fields: [
      { key: 'ten_nv', label: 'Tên nhân viên', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
    ],
  },
  sent_asset_reminders: {
    entity: 'sent_asset_reminders',
    name: 'Nhắc nhở tài sản đã gửi',
    fields: [
      { key: 'ten_ts', label: 'Tên tài sản', type: 'text', required: true },
      { key: 'ngay_den_han', label: 'Ngày đến hạn', type: 'date', required: true },
      { key: 'cbqln', label: 'CB QLN', type: 'text' },
      { key: 'cbkh', label: 'CB KH', type: 'text' },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'] },
      { key: 'sent_date', label: 'Ngày gửi', type: 'date', required: true },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
    ],
  },
  sent_crc_reminders: {
    entity: 'sent_crc_reminders',
    name: 'Nhắc nhở CRC đã gửi',
    fields: [
      { key: 'loai_bt_crc', label: 'Loại BT CRC', type: 'text', required: true },
      { key: 'ngay_thuc_hien', label: 'Ngày thực hiện', type: 'date', required: true },
      { key: 'ldpcrc', label: 'LDP CRC', type: 'text' },
      { key: 'cbcrc', label: 'CB CRC', type: 'text' },
      { key: 'quycrc', label: 'Quy CRC', type: 'text' },
      { key: 'is_sent', label: 'Đã gửi', type: 'boolean', options: ['true', 'false'] },
      { key: 'sent_date', label: 'Ngày gửi', type: 'date', required: true },
      { key: 'created_at', label: 'Ngày tạo', type: 'date' },
    ],
  },
  asset_history_archive: {
    entity: 'asset_history_archive',
    name: 'Lịch sử tài sản',
    fields: [
      { key: 'original_asset_id', label: 'ID tài sản gốc', type: 'text', required: true },
      { key: 'asset_name', label: 'Tên tài sản', type: 'text', required: true },
      { key: 'change_type', label: 'Loại thay đổi', type: 'text', required: true },
      { key: 'changed_by', label: 'Người thay đổi', type: 'text', required: true },
      { key: 'change_reason', label: 'Lý do thay đổi', type: 'textarea' },
      { key: 'created_at', label: 'Thời gian tạo', type: 'date' },
    ],
  },
};