// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateTestEmailHTML = (username: string, provider: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Email từ Vietcombank</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🏦 Email từ Vietcombank</h1>
      </div>
      <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e40af;">Email Test Thành Công!</h2>
        <p>Đây là email được gửi trực tiếp từ email doanh nghiệp Vietcombank.</p>
        
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
          <h3 style="color: #1e40af; margin-top: 0;">📊 Thông tin email:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Người test:</strong> ${username}</li>
            <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
            <li><strong>Provider:</strong> ${provider === 'outlook' ? 'Outlook SMTP (EmailJS)' : 'Resend API'}</li>
            <li><strong>Email gửi:</strong> dongnv.hvu@vietcombank.com.vn</li>
            <li><strong>Phương thức:</strong> ${provider === 'outlook' ? 'EmailJS + Outlook SMTP' : 'API'}</li>
          </ul>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="color: #16a34a; margin-top: 0;">✅ Chức năng đã kiểm tra:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>✅ Kết nối Supabase Edge Function</li>
            <li>✅ ${provider === 'outlook' ? 'EmailJS + Outlook SMTP' : 'Kết nối Resend API'}</li>
            <li>✅ ${provider === 'outlook' ? 'Xác thực App Password' : 'Sử dụng API Key'}</li>
            <li>✅ Template email HTML</li>
            <li>✅ Gửi email thành công</li>
          </ul>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;"><strong>Lưu ý:</strong> Email này được gửi trực tiếp từ hệ thống quản lý tài sản nội bộ của Vietcombank.</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        <p><strong>Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)</strong></p>
        <p>Hệ thống Quản lý Tài sản Nội bộ</p>
        <p>Liên hệ: dongnv.hvu@vietcombank.com.vn</p>
        <p>Thời gian gửi: ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    </body>
    </html>
  `
}

// EmailJS implementation for Outlook SMTP
const sendViaEmailJS = async (recipients: string[], subject: string, emailHTML: string) => {
  // @ts-ignore
  const outlookEmail = Deno.env.get('OUTLOOK_EMAIL')
  // @ts-ignore
  const outlookPassword = Deno.env.get('OUTLOOK_APP_PASSWORD')

  if (!outlookEmail || !outlookPassword) {
    throw new Error('Outlook SMTP credentials not configured. Please set OUTLOOK_EMAIL and OUTLOOK_APP_PASSWORD.')
  }

  console.log('📧 Sending via EmailJS + Outlook SMTP...')
  console.log('📧 From:', outlookEmail)
  console.log('📧 To:', recipients.join(', '))

  // EmailJS API call
  const emailJSPayload = {
    service_id: 'outlook_smtp_service', // You'll need to configure this in EmailJS
    template_id: 'custom_html_template', // You'll need to create this template
    user_id: 'your_emailjs_user_id', // Your EmailJS user ID
    template_params: {
      from_email: outlookEmail,
      to_email: recipients.join(','),
      subject: subject,
      html_content: emailHTML,
      from_name: 'Đồng Nguyễn - Vietcombank'
    },
    accessToken: 'your_emailjs_access_token' // Your EmailJS access token
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailJSPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS API error: ${response.status} - ${errorText}`);
    }

    const result = await response.text();
    console.log('✅ EmailJS response:', result);

    return {
      messageId: `emailjs-${Date.now()}@vietcombank.com.vn`,
      status: 'sent',
      provider: 'emailjs-outlook',
      from: outlookEmail,
      to: recipients,
      timestamp: new Date().toISOString(),
      service: 'EmailJS + Outlook SMTP'
    };

  } catch (error) {
    console.error('❌ EmailJS error:', error);
    throw new Error(`EmailJS failed: ${error.message}`);
  }
}

// SMTP2GO implementation (Alternative)
const sendViaSMTP2GO = async (recipients: string[], subject: string, emailHTML: string) => {
  // @ts-ignore
  const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY')
  // @ts-ignore
  const outlookEmail = Deno.env.get('OUTLOOK_EMAIL')

  if (!smtp2goApiKey || !outlookEmail) {
    throw new Error('SMTP2GO credentials not configured. Please set SMTP2GO_API_KEY and OUTLOOK_EMAIL.')
  }

  console.log('📧 Sending via SMTP2GO...')
  console.log('📧 From:', outlookEmail)

  const smtp2goPayload = {
    api_key: smtp2goApiKey,
    to: recipients,
    sender: outlookEmail,
    subject: subject,
    html_body: emailHTML,
    text_body: 'Email từ hệ thống Vietcombank', // Fallback text
    custom_headers: [
      {
        header: 'Reply-To',
        value: outlookEmail
      }
    ]
  };

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smtp2goPayload)
    });

    const result = await response.json();

    if (!response.ok || result.data?.error) {
      throw new Error(`SMTP2GO API error: ${result.data?.error || 'Unknown error'}`);
    }

    console.log('✅ SMTP2GO response:', result);

    return {
      messageId: result.data?.email_id || `smtp2go-${Date.now()}`,
      status: 'sent',
      provider: 'smtp2go',
      from: outlookEmail,
      to: recipients,
      timestamp: new Date().toISOString(),
      service: 'SMTP2GO'
    };

  } catch (error) {
    console.error('❌ SMTP2GO error:', error);
    throw new Error(`SMTP2GO failed: ${error.message}`);
  }
}

// Resend API implementation (fallback)
const sendViaResend = async (recipients: string[], subject: string, emailHTML: string) => {
  // @ts-ignore
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

  console.log('📧 Sending via Resend API (fallback)...')
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Hệ thống Tài sản <taisan@caremylife.me>',
      to: recipients,
      subject: subject,
      html: emailHTML,
    }),
  })

  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(`Resend API error: ${result.message || 'Unknown error'}`)
  }

  return result
}

serve(async (req) => {
  console.log('🚀 Edge Function called:', req.method, req.url)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    let requestBody
    try {
      const bodyText = await req.text()
      console.log('📝 Raw request body length:', bodyText.length)
      
      if (!bodyText || bodyText.trim() === '') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Request body is empty'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      requestBody = JSON.parse(bodyText)
      console.log('✅ Request parsed - Provider:', requestBody.provider)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const { to, subject, html, type, data, provider = 'outlook' } = requestBody

    // Handle API check
    if (type === 'api_check') {
      console.log('🔍 Performing API check...')
      // @ts-ignore
      const resendKey = Deno.env.get('RESEND_API_KEY')
      // @ts-ignore
      const outlookEmail = Deno.env.get('OUTLOOK_EMAIL')
      // @ts-ignore
      const outlookPass = Deno.env.get('OUTLOOK_APP_PASSWORD')
      // @ts-ignore
      const smtp2goKey = Deno.env.get('SMTP2GO_API_KEY')

      return new Response(JSON.stringify({
        success: true,
        message: 'Email providers status checked',
        providers: {
          outlook: { 
            configured: !!(outlookEmail && outlookPass),
            email: outlookEmail || 'Not configured',
            status: (outlookEmail && outlookPass) ? 'Ready - EmailJS + Outlook SMTP' : 'Missing credentials',
            isDefault: true,
            method: 'EmailJS or SMTP2GO'
          },
          resend: { 
            configured: !!resendKey,
            status: resendKey ? 'Ready - Fallback only' : 'Not configured',
            isDefault: false
          }
        },
        defaultProvider: 'outlook',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Validate required fields
    if (!to || !subject) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: to, subject'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Generate email HTML
    let emailHTML = html
    if (!emailHTML && type === 'test') {
      emailHTML = generateTestEmailHTML(data?.username || 'N/A', provider)
    }
    
    if (!emailHTML) {
      emailHTML = '<p>Nội dung email từ hệ thống Vietcombank</p>'
    }

    const recipients = Array.isArray(to) ? to : [to]
    console.log(`📧 Sending email via ${provider}:`)
    console.log(`- Recipients: ${recipients.join(', ')}`)
    console.log(`- Subject: ${subject}`)

    // Send email based on provider
    try {
      let result
      
      if (provider === 'resend') {
        console.log('📧 Using Resend API (fallback only)...')
        result = await sendViaResend(recipients, subject, emailHTML)
        
        return new Response(JSON.stringify({
          success: true,
          data: result,
          message: 'Email sent via Resend API (fallback method)',
          provider: 'resend',
          from: 'taisan@caremylife.me'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
        
      } else {
        // Try EmailJS first, then SMTP2GO, then Resend as fallback
        console.log('📧 Attempting to send from Vietcombank email...')
        
        try {
          // Try EmailJS first
          console.log('📧 Trying EmailJS...')
          result = await sendViaEmailJS(recipients, subject, emailHTML)
          
          return new Response(JSON.stringify({
            success: true,
            data: result,
            message: 'Email sent successfully from dongnv.hvu@vietcombank.com.vn via EmailJS',
            provider: 'outlook',
            actualProvider: 'emailjs',
            from: 'dongnv.hvu@vietcombank.com.vn'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          })
          
        } catch (emailJSError) {
          console.log('📧 EmailJS failed, trying SMTP2GO...')
          
          try {
            result = await sendViaSMTP2GO(recipients, subject, emailHTML)
            
            return new Response(JSON.stringify({
              success: true,
              data: result,
              message: 'Email sent successfully from dongnv.hvu@vietcombank.com.vn via SMTP2GO',
              provider: 'outlook',
              actualProvider: 'smtp2go',
              from: 'dongnv.hvu@vietcombank.com.vn'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            })
            
          } catch (smtp2goError) {
            console.log('📧 SMTP2GO failed, falling back to Resend...')
            
            result = await sendViaResend(recipients, subject, emailHTML)
            
            return new Response(JSON.stringify({
              success: true,
              data: result,
              message: 'Email sent via Resend (all Vietcombank methods failed)',
              provider: 'resend',
              originalProvider: 'outlook',
              fallback: true,
              errors: {
                emailjs: emailJSError.message,
                smtp2go: smtp2goError.message
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            })
          }
        }
      }

    } catch (sendError) {
      console.error(`❌ All email methods failed:`, sendError)
      
      return new Response(JSON.stringify({
        success: false,
        error: `All email providers failed: ${sendError.message}`,
        provider: provider
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})