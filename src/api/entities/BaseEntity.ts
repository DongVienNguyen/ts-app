import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export class BaseEntity<T extends keyof Database['public']['Tables']> {
  protected tableName: T;

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  async list(orderBy?: string, limit?: number): Promise<any[]> {
    let query = supabase.from(this.tableName).select('*');
    if (orderBy) {
      const [column, direction] = orderBy.startsWith('-') ? [orderBy.substring(1), 'desc'] : [orderBy, 'asc'];
      query = query.order(column as any, { ascending: direction === 'asc' });
    }
    if (limit) {
      query = query.limit(limit);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Failed to list ${String(this.tableName)}: ${error.message}`);
    return data as any[];
  }

  async filter(filters: Partial<Database['public']['Tables'][T]['Row']>): Promise<any[]> {
    let query = supabase.from(this.tableName).select('*');
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        query = query.eq(key as any, (filters as any)[key]);
      }
    }
    const { data, error } = await query;
    if (error) throw new Error(`Failed to filter ${String(this.tableName)}: ${error.message}`);
    return data as any[];
  }

  async create(payload: Database['public']['Tables'][T]['Insert']): Promise<any> {
    const { data, error } = await supabase.from(this.tableName).insert(payload as any).select().single();
    if (error) throw new Error(`Failed to create ${String(this.tableName)}: ${error.message}`);
    return data as any;
  }

  async update(id: string, payload: Database['public']['Tables'][T]['Update']): Promise<any> {
    const { data, error } = await supabase.from(this.tableName).update(payload as any).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update ${String(this.tableName)}: ${error.message}`);
    return data as any;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);
    if (error) throw new Error(`Failed to delete ${String(this.tableName)}: ${error.message}`);
  }
}