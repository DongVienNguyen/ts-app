import { startTiming, endTiming } from '@/utils/performanceMonitor';
import { FunctionsBackupData } from './types';

export class FunctionsBackup {
  private static readonly EDGE_FUNCTIONS = [
    'send-notification-email',
    'login-user', 
    'create-admin-user',
    'test-resend-api',
    'send-push-notification',
    'check-account-status',
    'reset-password',
    'analyze-asset-image'
  ];

  static async createFunctionsBackup(): Promise<FunctionsBackupData> {
    startTiming('functions-backup');
    
    console.log('🔧 Creating functions backup...');
    
    const functionsData: FunctionsBackupData = {
      functions: [...FunctionsBackup.EDGE_FUNCTIONS],
      timestamp: new Date().toISOString(),
      count: FunctionsBackup.EDGE_FUNCTIONS.length,
      description: 'Supabase Edge Functions metadata and configuration'
    };
    
    console.log(`✅ Functions backup created: ${functionsData.count} functions`);
    endTiming('functions-backup');
    return functionsData;
  }

  static validateFunctionsData(functionsData: any): boolean {
    try {
      return !!(
        functionsData &&
        functionsData.functions &&
        Array.isArray(functionsData.functions) &&
        functionsData.timestamp &&
        functionsData.count &&
        functionsData.description
      );
    } catch (error) {
      console.error('❌ Functions data validation failed:', error);
      return false;
    }
  }
}