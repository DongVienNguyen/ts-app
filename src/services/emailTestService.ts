import { testEmailFunction } from './emailService';

export async function performEmailTest(username: string): Promise<{ success: boolean; error?: string }> {
  console.log('=== EMAIL TEST SERVICE START ===');
  console.log('Username:', username);
  
  try {
    console.log('🔍 Checking admin email configuration...');
    
    // Import supabase here to check admin email
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: adminData, error: adminError } = await supabase
      .from('staff')
      .select('email, staff_name')
      .eq('role', 'admin')
      .limit(1);

    console.log('📧 Admin query result:', { adminData, adminError });

    if (adminError) {
      console.error('❌ Error getting admin email:', adminError);
      return { success: false, error: `Lỗi truy vấn admin email: ${adminError.message}` };
    }

    if (!adminData || adminData.length === 0) {
      console.error('❌ No admin user found');
      return { success: false, error: 'Không tìm thấy tài khoản admin' };
    }

    if (!adminData[0].email) {
      console.error('❌ Admin email not configured');
      return { success: false, error: 'Email admin chưa được cấu hình' };
    }

    console.log('✅ Admin email found:', adminData[0].email);
    console.log('📧 Calling testEmailFunction with username:', username);
    
    const result = await testEmailFunction(username);
    
    console.log('📧 Test email result:', result);
    console.log('=== EMAIL TEST SERVICE END ===');
    
    return result;
  } catch (error: any) {
    console.error('❌ Exception in email test service:', error);
    console.log('=== EMAIL TEST SERVICE END (ERROR) ===');
    return { 
      success: false, 
      error: `Lỗi hệ thống: ${error.message}` 
    };
  }
}