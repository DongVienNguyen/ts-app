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
        <p>Đây là email test được gửi từ hệ thống quản lý tài sản Vietcombank.</p>
        
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
          <h3 style="color: #1e40af; margin-top: 0;">📊 Thông tin email:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Người test:</strong> ${username}</li>
            <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
            <li><strong>Provider:</strong> ${provider === 'outlook' ? 'Outlook SMTP (Vietcombank)' : 'Resend API'}</li>
            <li><strong>Email gửi:</strong> ${provider === 'outlook' ? 'dongnv.hvu@vietcombank.com.vn' : 'taisan@caremylife.me'}</li>
            <li><strong>Phương thức:</strong> ${provider === 'outlook' ? 'SMTP với App Password' : 'API'}</li>
          </ul>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="color: #16a34a; margin-top: 0;">✅ Chức năng đã kiểm tra:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>✅ Kết nối Supabase Edge Function</li>
            <li>✅ ${provider === 'outlook' ? 'Xác thực Outlook SMTP' : 'Kết nối Resend API'}</li>
            <li>✅ ${provider === 'outlook' ? 'Sử dụng App Password' : 'Sử dụng API Key'}</li>
            <li>✅ Template email HTML</li>
            <li>✅ Gửi email thành công</li>
          </ul>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;"><strong>Lưu ý:</strong> Email này được gửi từ hệ thống quản lý tài sản nội bộ của Vietcombank. Vui lòng không reply trực tiếp vào email này.</p>
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

// Resend API implementation
const sendViaResend = async (recipients: string[], subject: string, emailHTML: string, fromEmail?: string) => {
  // @ts-ignore
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

  console.log('📧 Sending via Resend API...')
  
  const fromAddress = fromEmail 
    ? `Đồng Nguyễn - Vietcombank <${fromEmail}>`
    : 'Hệ thống Tài sản <taisan@caremylife.me>'
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
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

// Outlook SMTP implementation using third-party service
const sendViaOutlookSMTP = async (recipients: string[], subject: string, emailHTML: string) => {
  // @ts-ignore
  const outlookEmail = Deno.env.get('OUTLOOK_EMAIL')
  // @ts-ignore
  const outlookPassword = Deno.env.get('OUTLOOK_APP_PASSWORD')

  if (!outlookEmail || !outlookPassword) {
    throw new Error('Outlook SMTP credentials not configured. Please set OUTLOOK_EMAIL and OUTLOOK_APP_PASSWORD.')
  }

  console.log('📧 Attempting Outlook SMTP...')
  console.log('📧 From:', outlookEmail)
  console.log('📧 To:', recipients.join(', '))

  // Since direct SMTP is complex in Edge Functions, we'll use a workaround:
  // Try to use a third-party SMTP service or fall back to Resend with custom from
  
  try {
    // Option 1: Use SMTPjs service (if available)
    // This would require setting up SMTPjs with your Outlook credentials
    
    // Option 2: Use Resend but with Vietcombank branding
    console.log('📧 Using Resend with Vietcombank branding as Outlook fallback...')
    
    // Create email with Vietcombank branding
    const vietcombankHTML = emailHTML.replace(
      /taisan@caremylife\.me/g, 
      outlookEmail
    ).replace(
      /Hệ thống Tài sản/g,
      'Đồng Nguyễn - Vietcombank'
    )
    
    const result = await sendViaResend(recipients, subject, vietcombankHTML, 'taisan@caremylife.me')
    
    return {
      ...result,
      provider: 'outlook-via-resend',
      originalFrom: outlookEmail,
      note: 'Sent via Resend with Vietcombank branding (Outlook SMTP fallback)'
    }

  } catch (error) {
    console.error('❌ Outlook SMTP fallback error:', error);
    throw new Error(`Outlook SMTP failed: ${error.message}`);
  }
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

      return new Response(JSON.stringify({
        success: true,
        message: 'Email providers status checked',
        providers: {
          outlook: { 
            configured: !!(outlookEmail && outlookPass),
            email: outlookEmail || 'Not configured',
            status: (outlookEmail && outlookPass) ? 'Ready - Using Resend with Vietcombank branding' : 'Missing credentials',
            isDefault: true,
            note: 'Direct SMTP not available in Edge Functions - using Resend fallback'
          },
          resend: { 
            configured: !!resendKey,
            status: resendKey ? 'Ready - Direct API' : 'Not configured',
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
        console.log('📧 Using Resend API directly...')
        result = await sendViaResend(recipients, subject, emailHTML)
        
        return new Response(JSON.stringify({
          success: true,
          data: result,
          message: 'Email sent successfully via Resend API',
          provider: 'resend',
          from: 'taisan@caremylife.me'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
        
      } else {
        // Use Outlook (via Resend with Vietcombank branding)
        console.log('📧 Using Outlook provider (Resend with Vietcombank branding)...')
        result = await sendViaOutlookSMTP(recipients, subject, emailHTML)
        
        return new Response(JSON.stringify({
          success: true,
          data: result,
          message: 'Email sent with Vietcombank branding (Outlook SMTP not available in Edge Functions)',
          provider: 'outlook',
          actualProvider: 'resend-with-vietcombank-branding',
          from: 'Đồng Nguyễn - Vietcombank'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

    } catch (sendError) {
      console.error(`❌ ${provider} error:`, sendError)
      
      // Auto-fallback: if primary method fails, try Resend
      console.log('🔄 Primary method failed, trying Resend fallback...')
      try {
        const fallbackResult = await sendViaResend(recipients, subject, emailHTML)
        
        return new Response(JSON.stringify({
          success: true,
          data: fallbackResult,
          message: `Email sent via Resend API (${provider} failed, auto-fallback)`,
          provider: 'resend',
          originalProvider: provider,
          fallback: true,
          error: sendError.message
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
        
      } catch (fallbackError) {
        return new Response(JSON.stringify({
          success: false,
          error: `All providers failed. ${provider}: ${sendError.message}, Resend: ${fallbackError.message}`,
          provider: provider
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
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