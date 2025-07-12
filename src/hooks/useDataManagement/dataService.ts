import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import type { LoadDataParams, SaveDataParams, DeleteDataParams, BulkDeleteDataParams } from './types';

const ITEMS_PER_PAGE = 20;

export const dataService = {
  async loadData({ selectedEntity, user, page = 1, search = '', sortColumn, sortDirection, filters = {} }: LoadDataParams) {
    if (!selectedEntity || !user || user.role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    const config = entityConfig[selectedEntity];
    if (!config) {
      throw new Error(`Entity config not found for: ${selectedEntity}`);
    }

    let query = supabase.from(config.entity as any).select('*', { count: 'exact' });

    // Add advanced filters
    for (const key in filters) {
      const value = filters[key];
      if (value === null || value === undefined || value === '') continue;

      if (key.endsWith('_start')) {
        const fieldName = key.replace('_start', '');
        query = query.gte(fieldName, value);
      } else if (key.endsWith('_end')) {
        const fieldName = key.replace('_end', '');
        query = query.lte(fieldName, value);
      } else {
        const fieldConfig = config.fields.find(f => f.key === key);
        if (fieldConfig) {
          if (fieldConfig.type === 'boolean') {
            query = query.eq(key, value === 'true');
          } else {
            query = query.ilike(key, `%${value}%`);
          }
        }
      }
    }
    
    // Add global search filter
    if (search.trim()) {
      const textFields = config.fields.filter(f => 
        f.filterable && (f.type === 'text' || f.type === 'textarea' || f.type === 'number')
      ).map(f => f.key);
      
      if (textFields.length > 0) {
        const searchConditions = textFields.map(field => 
          `${field}::text.ilike.%${search}%`
        ).join(',');
        query = query.or(searchConditions);
      }
    }
    
    // Add sorting
    if (sortColumn && sortDirection) {
      const isValidColumn = config.fields.some(f => f.key === sortColumn);
      if (isValidColumn) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
      }
    } else {
      const hasCreatedAt = config.fields.some(f => f.key === 'created_at');
      if (hasCreatedAt) {
        query = query.order('created_at', { ascending: false });
      } else if (config.fields.some(f => f.key === 'id')) {
        query = query.order('id', { ascending: false });
      }
    }

    // Add pagination
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data: result, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      data: result || [],
      count: count || 0
    };
  },

  async saveData({ selectedEntity, formData, editingItem, user }: SaveDataParams) {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    const config = entityConfig[selectedEntity];
    
    for (const field of config.fields.filter(f => f.required)) {
      if (!formData[field.key]) {
        throw new Error(`Vui lòng điền ${field.label}`);
      }
    }
    
    const submitData: { [key: string]: any } = { ...formData };

    config.fields.filter(f => f.type === 'boolean').forEach(field => {
      if (submitData[field.key] !== undefined && submitData[field.key] !== null) {
        submitData[field.key] = String(submitData[field.key]).toLowerCase() === 'true';
      }
    });

    Object.keys(submitData).forEach(key => {
      if (key !== 'password' && (submitData[key] === '' || submitData[key] === null)) {
        delete submitData[key];
      }
    });

    if (selectedEntity === 'staff') {
      if (editingItem) {
        if (submitData.password === '') {
          delete submitData.password;
        }
      } else {
        if (!submitData.password) {
          submitData.password = '123456';
        }
      }
    }

    if (editingItem) {
      delete submitData.id;
      const { error } = await supabase
        .from(config.entity as any)
        .update(submitData)
        .eq('id', editingItem.id);
      
      if (error) throw error;
      return { success: true, message: "Cập nhật thành công" };
    } else {
      const { error } = await supabase
        .from(config.entity as any)
        .insert([submitData]);
      
      if (error) throw error;
      return { success: true, message: "Thêm mới thành công" };
    }
  },

  async deleteData({ selectedEntity, item, user }: DeleteDataParams) {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    const config = entityConfig[selectedEntity];
    const { error } = await supabase
      .from(config.entity as any)
      .delete()
      .eq('id', item.id);
    
    if (error) throw error;
    return { success: true, message: "Xóa thành công" };
  },

  async bulkDeleteData({ selectedEntity, ids, user }: BulkDeleteDataParams) {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized access');
    }
    if (!ids || ids.length === 0) {
      throw new Error('No items selected for deletion.');
    }

    const config = entityConfig[selectedEntity];
    const { error } = await supabase
      .from(config.entity as any)
      .delete()
      .in('id', ids);
    
    if (error) throw error;
    return { success: true, message: `Đã xóa thành công ${ids.length} bản ghi.` };
  },

  async toggleStaffLock(staff: any, user: any) {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    const newStatus = staff.account_status === 'active' ? 'locked' : 'active';
    const { error } = await supabase
      .from('staff')
      .update({ 
        account_status: newStatus, 
        failed_login_attempts: 0, 
        locked_at: newStatus === 'locked' ? new Date().toISOString() : null 
      })
      .eq('id', staff.id);
    
    if (error) throw error;
    return { 
      success: true, 
      message: `Đã ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} tài khoản` 
    };
  },

  async bulkDeleteTransactions(startDate: string, endDate: string, user: any) {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    if (!startDate || !endDate) {
      throw new Error('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.');
    }

    const { error } = await supabase
      .from('asset_transactions')
      .delete()
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (error) throw error;
    return { 
      success: true, 
      message: `Đã xóa thành công các giao dịch từ ${startDate} đến ${endDate}.` 
    };
  }
};