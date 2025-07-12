import { supabase } from '@/integrations/supabase/client';
import { entityConfig, TableName } from '@/config/entityConfig';
import { FilterState } from './types';
import { AuthenticatedStaff } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 20;

interface LoadDataParams {
  selectedEntity: TableName;
  page: number;
  searchTerm: string;
  filters: Record<string, FilterState>;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
}

interface SaveDataParams {
  selectedEntity: TableName;
  formData: any;
  editingItem: any | null;
  user: AuthenticatedStaff;
}

interface DeleteDataParams {
  selectedEntity: TableName;
  item: any;
  user: AuthenticatedStaff;
}

interface BulkDeleteDataParams {
  selectedEntity: TableName;
  ids: string[];
  user: AuthenticatedStaff;
}

interface ToggleStaffLockParams {
  staffId: string;
  currentStatus: string;
  user: AuthenticatedStaff;
}

interface BulkDeleteTransactionsParams {
  startDate: string;
  endDate: string;
  user: AuthenticatedStaff;
}

export const dataService = {
  loadData: async ({
    selectedEntity,
    page,
    searchTerm,
    filters,
    sortColumn,
    sortDirection,
  }: LoadDataParams) => {
    const config = entityConfig[selectedEntity];
    if (!config) {
      throw new Error(`Configuration for entity ${selectedEntity} not found.`);
    }

    let query = supabase.from(selectedEntity).select('*', { count: 'exact' });

    // Apply search term
    if (searchTerm) {
      const searchFields = config.fields.filter(f => f.type === 'text' || f.type === 'email').map(f => f.key);
      if (searchFields.length > 0) {
        const searchConditions = searchFields.map(field => `${field}.ilike.%${searchTerm}%`).join(',');
        query = query.or(searchConditions);
      }
    }

    // Apply filters
    for (const key in filters) {
      const filterState = filters[key];
      const value = filterState.value;
      const operator = filterState.operator;

      if (value !== undefined && value !== null && value !== '') {
        switch (operator) {
          case 'ilike':
            query = query.ilike(key, `%${value}%`);
            break;
          case 'eq':
            query = query.eq(key, value);
            break;
          case 'gte':
            query = query.gte(key, value);
            break;
          case 'lte':
            query = query.lte(key, value);
            break;
          case 'gt':
            query = query.gt(key, value);
            break;
          case 'lt':
            query = query.lt(key, value);
            break;
          case 'is': // For boolean/null checks
            query = query.is(key, value);
            break;
          case 'in': // For multi-select (not implemented yet, but good to have)
            query = query.in(key, value);
            break;
          default:
            // Fallback to default behavior if operator is not recognized
            query = query.eq(key, value);
            break;
        }
      }
    }

    // Apply sorting
    if (sortColumn) {
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
    }

    // Apply pagination
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching data:', error);
      throw error;
    }

    return { data, count: count || 0 };
  },

  saveData: async ({ selectedEntity, formData, editingItem, user }: SaveDataParams) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Chỉ quản trị viên mới có quyền thực hiện thao tác này.');
    }

    let result;
    if (editingItem) {
      // Update existing item
      result = await supabase
        .from(selectedEntity)
        .update(formData)
        .eq('id', editingItem.id);
    } else {
      // Insert new item
      result = await supabase
        .from(selectedEntity)
        .insert(formData);
    }

    if (result.error) {
      console.error('Error saving data:', result.error);
      throw new Error(`Không thể lưu bản ghi: ${result.error.message}`);
    }

    return { message: `Đã lưu bản ghi thành công.` };
  },

  deleteData: async ({ selectedEntity, item, user }: DeleteDataParams) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Chỉ quản trị viên mới có quyền thực hiện thao tác này.');
    }

    const { error } = await supabase
      .from(selectedEntity)
      .delete()
      .eq('id', item.id);

    if (error) {
      console.error('Error deleting data:', error);
      throw new Error(`Không thể xóa bản ghi: ${error.message}`);
    }

    return { message: `Đã xóa bản ghi thành công.` };
  },

  bulkDeleteData: async ({ selectedEntity, ids, user }: BulkDeleteDataParams) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Chỉ quản trị viên mới có quyền thực hiện thao tác này.');
    }

    const { error } = await supabase
      .from(selectedEntity)
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error bulk deleting data:', error);
      throw new Error(`Không thể xóa các bản ghi đã chọn: ${error.message}`);
    }

    return { message: `Đã xóa thành công ${ids.length} bản ghi.` };
  },

  toggleStaffLock: async ({ staffId, currentStatus, user }: ToggleStaffLockParams) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Chỉ quản trị viên mới có quyền thực hiện thao tác này.');
    }

    const newStatus = currentStatus === 'locked' ? 'active' : 'locked';
    const { error } = await supabase
      .from('staff')
      .update({ account_status: newStatus })
      .eq('id', staffId);

    if (error) {
      console.error('Error toggling staff lock:', error);
      throw new Error(`Không thể thay đổi trạng thái tài khoản: ${error.message}`);
    }

    return { message: `Đã ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} tài khoản thành công.` };
  },

  bulkDeleteTransactions: async ({ startDate, endDate, user }: BulkDeleteTransactionsParams) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Chỉ quản trị viên mới có quyền thực hiện thao tác này.');
    }

    if (!startDate || !endDate) {
      throw new Error('Vui lòng cung cấp cả ngày bắt đầu và ngày kết thúc.');
    }

    const { count, error: countError } = await supabase
      .from('asset_transactions')
      .select('*', { count: 'exact', head: true })
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (countError) {
      console.error('Error counting transactions:', countError);
      throw new Error(`Không thể đếm số lượng giao dịch: ${countError.message}`);
    }

    if (count === 0) {
      return { message: 'Không có giao dịch nào để xóa trong khoảng thời gian đã chọn.' };
    }

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa ${count} giao dịch từ ${startDate} đến ${endDate}? Thao tác này không thể hoàn tác.`);
    if (!confirmDelete) {
      throw new Error('Thao tác xóa đã bị hủy.');
    }

    const { error } = await supabase
      .from('asset_transactions')
      .delete()
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (error) {
      console.error('Error bulk deleting transactions:', error);
      throw new Error(`Không thể xóa giao dịch hàng loạt: ${error.message}`);
    }

    return { message: `Đã xóa thành công ${count} giao dịch.` };
  }
};