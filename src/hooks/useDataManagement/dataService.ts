import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import type { LoadDataParams, SaveDataParams, DeleteDataParams } from './types';

const ITEMS_PER_PAGE = 20;

export const dataService = {
  async loadData({ selectedEntity, user, page = 1, search = '', sortColumn, sortDirection }: LoadDataParams) {
    if (!selectedEntity || !user || user.role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    const config = entityConfig[selectedEntity];
    if (!config) {
      throw new Error(`Entity config not found for: ${selectedEntity}`);
    }

    let query = supabase.from(config.entity as any).select('*', { count: 'exact' });
    
    // Add search filter
    if (search.trim()) {
      const textFields = config.fields.filter(f => 
        !f.type || f.type === 'text' || f.type === 'textarea'
      ).map(f => f.key);
      
      if (textFields.length > 0) {
        const searchConditions = textFields.map(field => 
          `${field}.ilike.%${search}%`
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
      } else {
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
    
    // Validate required fields
    for (const field of config.fields.filter(f => f.required)) {
      if (!formData[field.key]) {
        throw new Error(`Vui lòng điền ${field.label}`);
      }
    }
    
    const submitData: { [key: string]: any } = { ...formData };

    // Handle boolean fields
    config.fields.filter(f => f.type === 'boolean').forEach(field => {
      if (submitData[field.key] !== undefined && submitData[field.key] !== null) {
        submitData[field.key] = submitData[field.key] === 'true';
      }
    });

    // Clean empty values
    Object.keys(submitData).forEach(key => {
      if (key !== 'password' && (submitData[key] === '' || submitData[key] === null)) {
        delete submitData[key];
      }
    });

    // Handle staff password
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