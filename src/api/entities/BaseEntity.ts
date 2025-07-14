import { supabase } from '@/integrations/supabase/client';

export class BaseEntity<T extends string> {
  protected tableName: T;

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  async list(orderBy?: string, limit?: number): Promise<any[]> {
    // Ép kiểu toàn bộ kết quả của supabase.from() thành any
    let query = (supabase.from(this.tableName as any) as any).select('*');
    if (orderBy) {
      const [column, direction] = orderBy.startsWith('-') ? [orderBy.substring(1), 'desc'] : [orderBy, 'asc'];
      query = query.order(column, { ascending: direction === 'asc' });
    }
    if (limit) {
      query = query.limit(limit);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Failed to list ${String(this.tableName)}: ${error.message}`);
    return data as any[];
  }

  async filter(filters: Record<string, any>): Promise<any[]> {
    // Ép kiểu toàn bộ kết quả của supabase.from() thành any
    let query = (supabase.from(this.tableName as any) as any).select('*');
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        query = query.eq(key, filters[key]);
      }
    }
    const { data, error } = await query;
    if (error) throw new Error(`Failed to filter ${String(this.tableName)}: ${error.message}`);
    return data as any[];
  }

  async create(payload: Record<string, any>): Promise<any> {
    // Ép kiểu toàn bộ kết quả của supabase.from() thành any
    const { data, error } = await (supabase.from(this.tableName as any) as any).insert(payload).select().single();
    if (error) throw new Error(`Failed to create ${String(this.tableName)}: ${error.message}`);
    return data as any;
  }

  async update(id: string, payload: Record<string, any>): Promise<any> {
    // Ép kiểu toàn bộ kết quả của supabase.from() thành any
    const { data, error } = await (supabase.from(this.tableName as any) as any).update(payload).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update ${String(this.tableName)}: ${error.message}`);
    return data as any;
  }

  async delete(id: string): Promise<void> {
    // Ép kiểu toàn bộ kết quả của supabase.from() thành any
    const { error } = await (supabase.from(this.tableName as any) as any).delete().eq('id', id);
    if (error) throw new Error(`Failed to delete ${String(this.tableName)}: ${error.message}`);
  }
}