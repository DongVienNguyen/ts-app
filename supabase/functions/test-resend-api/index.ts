// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Global type declarations for Deno environment
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

// Type declaration for Resend
interface ResendEmail {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}

interface ResendResponse {
  id?: string;
  error?: {
    message: string;
  };
}

interface ResendClient {
  emails: {
    send(data: ResendEmail): Promise<ResendResponse>;
  };
}

// @ts-ignore
const { Resend } = await import("npm:resend@2.0.0");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Testing Resend API directly...');
    
    // Use the provided API key
    const apiKey = 're_XfoPgfXP_CeNdATrbvEXHT7HatRCHenxn';
    const resend = new Resend(apiKey) as ResendClient;
    
    console.log('🔑 Using API key:', apiKey.substring(0, 10) + '...');
    
    const emailData: ResendEmail = {
      from: "Hệ thống Tài sản <taisan@caremylife.me>",
      to: "ngviendong@gmail.com",
      subject: "🧪 Test Email từ Hệ thống Quản lý Tài sản",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🧪 Test Email Thành Công!</h1>
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #16a34a;">✅ Resend API hoạt động bình thường</h2>
            <p>Email này được gửi để test chức năng gửi email của hệ thống.</p>
            
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">📊 Thông tin test:</h3>
              <ul>
                <li><strong>API Key:</strong> re_XfoPgfXP_CeNdATrbvEXHT7HatRCHenxn</li>
                <li><strong>Email đích:</strong> ngviendong@gmail.com</li>
                <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
                <li><strong>Trạng thái:</strong> ✅ Thành công</li>
              </ul>
            </div>
            
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #15803d; margin-top: 0;">🔧 Các chức năng đã test:</h3>
              <ul>
                <li>✅ Kết nối Supabase Edge Function</li>
                <li>✅ Kết nối Resend API</li>
                <li>✅ Template email HTML</li>
                <li>✅ Gửi email đến ngviendong@gmail.com</li>
                <li>✅ API Key: re_XfoPgfXP_CeNdATrbvEXHT7HatRCHenxn</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Email này được gửi tự động từ Hệ thống Quản lý Tài sản.<br>
              Nếu bạn nhận được email này, chức năng gửi email đang hoạt động bình thường.
            </p>
          </div>
        </div>
      `
    };

    console.log("📧 Sending test email to ngviendong@gmail.com...");

    const emailResponse = await resend.emails.send(emailData);

    console.log("📧 Resend API response:", emailResponse);

    if (emailResponse.error) {
      console.error("❌ Resend API error details:", emailResponse.error);
      throw new Error(`Resend API error: ${emailResponse.error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: emailResponse,
      message: "Test email sent successfully to ngviendong@gmail.com",
      apiKey: apiKey.substring(0, 10) + '...',
      recipient: "ngviendong@gmail.com"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in test email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString(),
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);