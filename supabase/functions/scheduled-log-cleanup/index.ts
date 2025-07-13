// @ts-nocheck
// This file is a Supabase Edge Function, designed to run in a Deno environment.
// It uses Deno-specific imports and global objects that are not recognized by a standard Node.js TypeScript setup.
// Type checking for this file is disabled to prevent compile-time errors in the local development environment.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupPolicy {
  table_name: string;
  retention_days: number;
}

serve(async (_req) => {
  if (_req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Sử dụng service_role key để có toàn quyền truy cập
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Lấy tất cả các chính sách dọn dẹp đang được bật
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('log_cleanup_policies')
      .select('table_name, retention_days')
      .eq('is_enabled', true);

    if (policiesError) throw policiesError;

    if (!policies || policies.length === 0) {
      return new Response(JSON.stringify({ message: "Không có chính sách dọn dẹp nào được kích hoạt." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const cleanupResults = [];

    // 2. Lặp qua từng chính sách và thực hiện xóa
    for (const policy of policies) {
      const { table_name, retention_days } = policy;
      
      // Tính toán ngày giới hạn
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retention_days);
      
      console.log(`Đang xử lý bảng: ${table_name}, xóa các bản ghi cũ hơn ${cutoffDate.toISOString()}`);

      // Thực hiện xóa các bản ghi có 'created_at' cũ hơn ngày giới hạn
      // Giả định rằng tất cả các bảng log đều có cột 'created_at'
      const { data, error: deleteError } = await supabaseAdmin
        .from(table_name)
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select(); // .select() để trả về số lượng bản ghi đã xóa

      if (deleteError) {
        console.error(`Lỗi khi xóa bảng ${table_name}:`, deleteError);
        cleanupResults.push({ table: table_name, status: 'Lỗi', message: deleteError.message, count: 0 });
      } else {
        const deletedCount = data ? data.length : 0;
        console.log(`Đã xóa ${deletedCount} bản ghi từ bảng ${table_name}.`);
        cleanupResults.push({ table: table_name, status: 'Thành công', count: deletedCount });
      }
    }

    return new Response(JSON.stringify({ 
      message: "Quá trình dọn dẹp log đã hoàn tất.",
      results: cleanupResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Lỗi nghiêm trọng trong quá trình dọn dẹp log:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})