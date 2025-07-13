// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
// @ts-ignore
import nodemailer from "npm:nodemailer@6.9.14";

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
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
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

const resend = new Resend(Deno.env.get("RESEND_API_KEY")) as ResendClient;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to?: string | string[];
  subject?: string;
  html?: string;
  type?: string;
  data?: any;
  provider?: 'resend' | 'outlook';
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
}

const generateEmailHTML = (type: string, data: any, subject: string): string => {
  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Hệ thống Quản lý Tài sản</h1>
      </div>
      <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
  `;

  const footerStyle = `
      </div>
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
        <p>Email này được gửi tự động từ Hệ thống Quản lý Tài sản</p>
        <p>Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    </div>
  `;

  switch (type) {
    case 'test':
      return baseStyle + `
        <h2 style="color: #16a34a;">🧪 Test Email Function</h2>
        <p>Đây là email test để kiểm tra chức năng gửi email của hệ thống.</p>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">📊 Thông tin test:</h3>
          <ul>
            <li><strong>Người test:</strong> ${data?.username || 'N/A'}</li>
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
            <li>✅ Gửi email thành công</li>
          </ul>
        </div>
      ` + footerStyle;

    case 'error_report':
      return baseStyle + `
        <h2 style="color: #dc2626;">🚨 Báo cáo lỗi hệ thống</h2>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
          <h3 style="color: #dc2626; margin-top: 0;">${data?.title || subject}</h3>
          <p><strong>Mô tả:</strong> ${data?.description || 'Không có mô tả'}</p>
          ${data?.stepsToReproduce ? `<p><strong>Các bước tái hiện:</strong> ${data.stepsToReproduce}</p>` : ''}
          ${data?.expectedResult ? `<p><strong>Kết quả mong đợi:</strong> ${data.expectedResult}</p>` : ''}
          ${data?.actualResult ? `<p><strong>Kết quả thực tế:</strong> ${data.actualResult}</p>` : ''}
        </div>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <h4 style="margin-top: 0;">Thông tin người báo cáo:</h4>
          <ul>
            <li><strong>Tên:</strong> ${data?.reporterName || 'N/A'}</li>
            <li><strong>Email:</strong> ${data?.reporterEmail || 'N/A'}</li>
            <li><strong>URL:</strong> ${data?.url || 'N/A'}</li>
            <li><strong>User Agent:</strong> ${data?.userAgent || 'N/A'}</li>
          </ul>
        </div>
      ` + footerStyle;

    case 'transaction_confirmation':
      return baseStyle + `
        <h2 style="color: ${data?.isSuccess ? '#16a34a' : '#dc2626'};">
          ${data?.isSuccess ? '✅' : '❌'} ${subject}
        </h2>
        <div style="background-color: ${data?.isSuccess ? '#f0fdf4' : '#fef2f2'}; padding: 15px; border-radius: 8px;">
          <p><strong>Người thực hiện:</strong> ${data?.username || 'N/A'}</p>
          <p><strong>Số lượng giao dịch:</strong> ${data?.transactions?.length || 0}</p>
          <p><strong>Trạng thái:</strong> ${data?.isSuccess ? 'Thành công' : 'Thất bại'}</p>
        </div>
        
        ${data?.transactions?.length > 0 ? `
        <div style="margin-top: 15px;">
          <h4>Chi tiết giao dịch:</h4>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Mã tài sản</th>
                <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Loại giao dịch</th>
                <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Phòng</th>
              </tr>
            </thead>
            <tbody>
              ${data.transactions.map((t: any) => `
                <tr>
                  <td style="border: 1px solid #e5e7eb; padding: 8px;">${t.asset_year}/${t.asset_code}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px;">${t.transaction_type}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 8px;">${t.room}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      ` + footerStyle;

    case 'asset_notification':
      return baseStyle + `
        <h2 style="color: #0369a1;">📋 Thông báo tài sản</h2>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px;">
          ${data?.content || 'Nội dung thông báo'}
        </div>
      ` + footerStyle;

    default:
      return baseStyle + `
        <h2 style="color: #374151;">${subject}</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          ${data?.content || 'Nội dung email'}
        </div>
      ` + footerStyle;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const requestBody = await req.json();
    console.log('📧 Email request received:', JSON.stringify(requestBody, null, 2));

    const { to, subject, html, type, data, attachments, provider: providerOverride }: EmailRequest = requestBody;

    // Handle API check request first (doesn't need to/subject)
    if (type === 'api_check') {
      const resendApiKeyExists = !!Deno.env.get("RESEND_API_KEY");
      const outlookEmailExists = !!Deno.env.get("OUTLOOK_EMAIL");
      const outlookPasswordExists = !!Deno.env.get("OUTLOOK_APP_PASSWORD");

      return new Response(JSON.stringify({
        success: true,
        message: "API keys status checked.",
        providers: {
          resend: { configured: resendApiKeyExists },
          outlook: { configured: outlookEmailExists && outlookPasswordExists }
        },
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // For all other requests, validate required fields
    if (!to || !subject) {
      throw new Error("Missing required fields: 'to' and 'subject'");
    }

    let provider = providerOverride;
    if (!provider) {
      const { data: config } = await supabaseAdmin
        .from('system_config')
        .select('value')
        .eq('key', 'email_provider')
        .single();
      provider = config?.value || 'resend';
    }
    
    console.log(`📧 Using email provider: ${provider}`);

    let emailHTML = html;
    if (!emailHTML && type) {
      emailHTML = generateEmailHTML(type, data, subject);
    }
    if (!emailHTML) {
      emailHTML = `<p>Nội dung email.</p>`;
    }

    const recipients = Array.isArray(to) ? to : [to];

    if (provider === 'outlook') {
      const outlookEmail = Deno.env.get("OUTLOOK_EMAIL");
      const outlookPassword = Deno.env.get("OUTLOOK_APP_PASSWORD");

      if (!outlookEmail || !outlookPassword) {
        throw new Error("Outlook credentials are not configured in Supabase secrets.");
      }

      const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
          user: outlookEmail,
          pass: outlookPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const mailOptions = {
        from: `"Hệ thống Tài sản" <${outlookEmail}>`,
        to: recipients,
        subject: subject,
        html: emailHTML,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          encoding: 'base64'
        }))
      };

      console.log("📧 Sending email via Outlook...");
      const info = await transporter.sendMail(mailOptions);
      console.log("📧 Outlook send response:", info);

      return new Response(JSON.stringify({
        success: true,
        data: info,
        message: "Email sent successfully via Outlook",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } else { // Default to Resend
      if (!Deno.env.get("RESEND_API_KEY")) {
        throw new Error("RESEND_API_KEY not configured");
      }

      const emailData: ResendEmail = {
        from: "Hệ thống Tài sản <taisan@caremylife.me>",
        to: recipients,
        subject: subject,
        html: emailHTML,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
        }))
      };

      console.log("📧 Sending email via Resend...");
      const emailResponse = await resend.emails.send(emailData);

      if (emailResponse.error) {
        throw new Error(`Resend API error: ${emailResponse.error.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        data: emailResponse,
        message: "Email sent successfully via Resend",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  } catch (error: any) {
    console.error("❌ Error in Edge Function handler:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);