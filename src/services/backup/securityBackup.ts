import { supabase } from '@/integrations/supabase/client';
import { startTiming, endTiming } from '@/utils/performanceMonitor';
import { SecurityBackupData } from './types';

export class SecurityBackup {
  private static readonly SECURITY_TABLES = [
    'security_events', 
    'user_sessions', 
    'system_errors'
  ];

  static async createSecurityBackup(): Promise<SecurityBackupData> {
    startTiming('security-backup');
    
    console.log('🔒 Creating security backup...');
    
    const securityData: SecurityBackupData = {
      timestamp: new Date().toISOString(),
      tables: {},
      summary: {
        totalEvents: 0,
        totalSessions: 0,
        totalErrors: 0
      }
    };

    for (const table of SecurityBackup.SECURITY_TABLES) {
      try {
        console.log(`🔒 Backing up security table: ${table}`);
        
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);
        
        if (error) {
          console.warn(`⚠️ Failed to backup security table ${table}:`, error);
          securityData.tables[table] = [];
        } else {
          const tableData = data || [];
          securityData.tables[table] = tableData;
          
          switch (table) {
            case 'security_events':
              securityData.summary.totalEvents = tableData.length;
              break;
            case 'user_sessions':
              securityData.summary.totalSessions = tableData.length;
              break;
            case 'system_errors':
              securityData.summary.totalErrors = tableData.length;
              break;
          }
        }
      } catch (error) {
        console.warn(`❌ Failed to backup security table ${table}:`, error);
        securityData.tables[table] = [];
      }
    }

    console.log('✅ Security backup completed:', securityData.summary);
    endTiming('security-backup');
    return securityData;
  }

  static getSecuritySummary(securityData: SecurityBackupData): {
    totalEvents: number;
    totalSessions: number;
    totalErrors: number;
    totalRecords: number;
    tables: string[];
  } {
    const totalRecords = Object.values(securityData.tables).reduce(
      (sum, tableData) => sum + (Array.isArray(tableData) ? tableData.length : 0), 
      0
    );
    
    return {
      ...securityData.summary,
      totalRecords,
      tables: Object.keys(securityData.tables)
    };
  }

  static validateSecurityData(securityData: any): boolean {
    try {
      if (!securityData || !securityData.timestamp || !securityData.tables || !securityData.summary) {
        return false;
      }
      
      for (const table of SecurityBackup.SECURITY_TABLES) {
        if (!(table in securityData.tables)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Security data validation failed:', error);
      return false;
    }
  }
}