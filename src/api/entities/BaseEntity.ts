import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export class BaseEntity<T extends string> {
  protected tableName: T;

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  async list(orderBy?: string, limit?: number): Promise<any[]> {
    let query = supabase.from(this.tableName as any).select('*'); // Changed to 'as any'
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

  async filter(filters: Record<string, any>): Promise<any[]> {
    let query = supabase.from(this.tableName as any).select('*'); // Changed to 'as any'
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        query = query.eq(key as any, (filters as any)[key]);
      }
    }
    const { data, error } = await query;
    if (error) throw new Error(`Failed to filter ${String(this.tableName)}: ${error.message}`);
    return data as any[];
  }

  async create(payload: Record<string, any>): Promise<any> {
    const { data, error } = await supabase.from(this.tableName as any).insert(payload as any).select().single(); // Changed to 'as any'
    if (error) throw new Error(`Failed to create ${String(this.tableName)}: ${error.message}`);
    return data as any;
  }

  async update(id: string, payload: Record<string, any>): Promise<any> {
    const { data, error } = await supabase.from(this.tableName as any).update(payload as any).eq('id', id).select().single(); // Changed to 'as any'
    if (error) throw new Error(`Failed to update ${String(this.tableName)}: ${error.message}`);
    return data as any;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName as any).delete().eq('id', id); // Changed to 'as any'
    if (error) throw new Error(`Failed to delete ${String(this.tableName)}: ${error.message}`);
  }
}