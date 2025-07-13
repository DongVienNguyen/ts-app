// @ts-ignore
/// <reference types="https://deno.land/x/deno_types/index.d.ts" />

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Type declarations for Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Type declarations for nodemailer
interface NodemailerTransporter {
  sendMail(options: any): Promise<any>;
}

interface NodemailerModule {
  default: {
    createTransport(config: any): NodemailerTransporter;
  };
}

// Type declarations for Resend
interface ResendEmail {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}

interface ResendResponse {
  data?: { id: string };
  error?: { message: string };
}

interface ResendClient {
  emails: {
    send(data: ResendEmail): Promise<ResendResponse>;
  };
}

interface ResendModule {
  Resend: new (apiKey: string) => ResendClient;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  if (type === 'test') {
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
    ` + footerStyle;
  }

  return baseStyle + `
    <h2 style="color: #374151;">${subject}</h2>
    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
      ${data?.content || 'Nội dung email'}
    </div>
  ` + footerStyle;
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Email function called');
    
    // Parse request body
    let requestBody: EmailRequest;
    try {
      requestBody = await req.json();
      console.log('📧 Request body parsed:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const { to, subject, html, type, data, provider = 'resend' } = requestBody;

    // Handle API check request
    if (type === 'api_check') {
      console.log('🔍 Performing API check...');
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
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Validate required fields for email sending
    if (!to || !subject) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields: 'to' and 'subject'"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Generate email HTML
    let emailHTML = html;
    if (!emailHTML && type) {
      emailHTML = generateEmailHTML(type, data, subject);
    }
    if (!emailHTML) {
      emailHTML = `<p>Nội dung email.</p>`;
    }

    const recipients = Array.isArray(to) ? to : [to];
    console.log(`📧 Sending email to: ${recipients.join(', ')}`);
    console.log(`📧 Using provider: ${provider}`);

    if (provider === 'outlook') {
      // Use Outlook/Nodemailer
      console.log('📧 Using Outlook provider...');
      
      const outlookEmail = Deno.env.get("OUTLOOK_EMAIL");
      const outlookPassword = Deno.env.get("OUTLOOK_APP_PASSWORD");

      if (!outlookEmail || !outlookPassword) {
        return new Response(JSON.stringify({
          success: false,
          error: "Outlook credentials are not configured"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      try {
        // @ts-ignore
        const nodemailer = await import("npm:nodemailer@6.9.14") as NodemailerModule;
        
        const transporter = nodemailer.default.createTransport({
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
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Outlook email sent:", info.messageId);

        return new Response(JSON.stringify({
          success: true,
          data: { messageId: info.messageId },
          message: "Email sent successfully via Outlook"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });

      } catch (outlookError: any) {
        console.error('❌ Outlook error:', outlookError);
        return new Response(JSON.stringify({
          success: false,
          error: `Outlook error: ${outlookError.message}`
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

    } else {
      // Use Resend (default)
      console.log('📧 Using Resend provider...');
      
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return new Response(JSON.stringify({
          success: false,
          error: "RESEND_API_KEY not configured"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      try {
        // @ts-ignore
        const { Resend } = await import("npm:resend@2.0.0") as ResendModule;
        const resend = new Resend(resendApiKey);

        const emailData: ResendEmail = {
          from: "Hệ thống Tài sản <taisan@caremylife.me>",
          to: recipients,
          subject: subject,
          html: emailHTML,
        };

        const emailResponse = await resend.emails.send(emailData);

        if (emailResponse.error) {
          console.error('❌ Resend error:', emailResponse.error);
          return new Response(JSON.stringify({
            success: false,
            error: `Resend error: ${emailResponse.error.message}`
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        console.log("✅ Resend email sent:", emailResponse.data?.id);

        return new Response(JSON.stringify({
          success: true,
          data: emailResponse.data,
          message: "Email sent successfully via Resend"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });

      } catch (resendError: any) {
        console.error('❌ Resend error:', resendError);
        return new Response(JSON.stringify({
          success: false,
          error: `Resend error: ${resendError.message}`
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      stack: error.stack
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});