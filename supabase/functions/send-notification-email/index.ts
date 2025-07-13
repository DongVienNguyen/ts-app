// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to?: string | string[]
  subject?: string
  html?: string
  type?: string
  data?: any
  provider?: 'resend' | 'outlook'
}

const generateTestEmailHTML = (username: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🧪 Test Email Function</h1>
      </div>
      <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #16a34a;">Email Test Thành Công!</h2>
        <p>Đây là email test để kiểm tra chức năng gửi email của hệ thống.</p>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">📊 Thông tin test:</h3>
          <ul>
            <li><strong>Người test:</strong> ${username}</li>
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
      </div>
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
        <p>Email này được gửi tự động từ Hệ thống Quản lý Tài sản</p>
        <p>Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    </body>
    </html>
  `
}

const sendViaResend = async (recipients: string[], subject: string, emailHTML: string) => {
  // @ts-ignore
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('📧 Email function started')
    
    // Parse request body
    let body: EmailRequest
    try {
      body = await req.json()
      console.log('📧 Request parsed:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('❌ Parse error:', parseError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const { to, subject, html, type, data, provider = 'resend' } = body

    // Handle API check
    if (type === 'api_check') {
      console.log('🔍 API check requested')
      // @ts-ignore
      const resendKey = Deno.env.get('RESEND_API_KEY')
      // @ts-ignore
      const outlookEmail = Deno.env.get('OUTLOOK_EMAIL')
      // @ts-ignore
      const outlookPass = Deno.env.get('OUTLOOK_APP_PASSWORD')

      return new Response(JSON.stringify({
        success: true,
        message: 'API keys checked',
        providers: {
          resend: { configured: !!resendKey },
          outlook: { configured: !!(outlookEmail && outlookPass) }
        },
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
        error: 'Missing required fields: to and subject'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Generate email HTML
    let emailHTML = html
    if (!emailHTML && type === 'test') {
      emailHTML = generateTestEmailHTML(data?.username || 'Unknown User')
    }
    if (!emailHTML) {
      emailHTML = '<p>Default email content</p>'
    }

    const recipients = Array.isArray(to) ? to : [to]
    console.log(`📧 Sending to: ${recipients.join(', ')} via ${provider}`)

    // For now, only support Resend via fetch API
    if (provider === 'outlook') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Outlook provider temporarily disabled. Please use Resend.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Use Resend via fetch API
    console.log('📧 Using Resend via fetch API...')
    
    try {
      const result = await sendViaResend(recipients, subject, emailHTML)
      console.log('✅ Resend success:', result.id)

      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: 'Email sent via Resend'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })

    } catch (resendError) {
      console.error('❌ Resend error:', resendError)
      return new Response(JSON.stringify({
        success: false,
        error: `Resend error: ${resendError.message}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})