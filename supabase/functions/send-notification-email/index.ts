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
            <li><strong>Provider:</strong> ${provider}</li>
            <li><strong>Trạng thái:</strong> ✅ Thành công</li>
          </ul>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #15803d; margin-top: 0;">🔧 Các chức năng đã test:</h3>
          <ul>
            <li>✅ Kết nối Supabase Edge Function</li>
            <li>✅ Kết nối ${provider === 'resend' ? 'Resend API' : 'Email Service'}</li>
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

  console.log('📧 Sending via Resend API...')
  
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
    // Parse request body with detailed logging
    let requestBody
    try {
      const bodyText = await req.text()
      console.log('📝 Raw request body:', bodyText)
      
      if (!bodyText || bodyText.trim() === '') {
        console.log('❌ Empty request body')
        return new Response(JSON.stringify({
          success: false,
          error: 'Request body is empty'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      requestBody = JSON.parse(bodyText)
      console.log('✅ Request body parsed successfully:', JSON.stringify(requestBody, null, 2))
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const { to, subject, html, type, data, provider = 'resend' } = requestBody

    // Handle API check
    if (type === 'api_check') {
      console.log('🔍 Performing API check...')
      // @ts-ignore
      const resendKey = Deno.env.get('RESEND_API_KEY')
      // @ts-ignore
      const outlookEmail = Deno.env.get('OUTLOOK_EMAIL')
      // @ts-ignore
      const outlookPass = Deno.env.get('OUTLOOK_APP_PASSWORD')

      const response = {
        success: true,
        message: 'API keys status checked',
        providers: {
          resend: { 
            configured: !!resendKey,
            status: resendKey ? 'Ready' : 'Not configured'
          },
          outlook: { 
            configured: !!(outlookEmail && outlookPass),
            email: outlookEmail || 'Not configured',
            status: (outlookEmail && outlookPass) ? 'Ready (Resend fallback)' : 'Not configured'
          }
        },
        timestamp: new Date().toISOString()
      }

      console.log('✅ API check response:', response)
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Validate required fields for email sending
    console.log('🔍 Validating required fields...')
    console.log('- to:', to)
    console.log('- subject:', subject)
    console.log('- provider:', provider)
    
    if (!to) {
      console.log('❌ Missing "to" field')
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required field: "to"'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (!subject) {
      console.log('❌ Missing "subject" field')
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required field: "subject"'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Generate email HTML
    let emailHTML = html
    if (!emailHTML && type === 'test') {
      console.log('🎨 Generating test email HTML...')
      emailHTML = generateTestEmailHTML(data?.username || 'N/A', provider)
    }
    
    if (!emailHTML) {
      emailHTML = '<p>Nội dung email mặc định</p>'
    }

    const recipients = Array.isArray(to) ? to : [to]
    console.log(`📧 Preparing to send email:`)
    console.log(`- Recipients: ${recipients.join(', ')}`)
    console.log(`- Subject: ${subject}`)
    console.log(`- Provider: ${provider}`)
    console.log(`- HTML length: ${emailHTML.length} characters`)

    // For now, always use Resend API regardless of provider selection
    // This ensures stability while we work on Outlook SMTP integration
    console.log(`📧 Using Resend API (${provider} provider selected but using Resend for stability)`)
    
    try {
      const result = await sendViaResend(recipients, subject, emailHTML)
      console.log('✅ Email sent successfully via Resend:', result.id)

      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: `Email sent successfully via Resend API${provider === 'outlook' ? ' (Outlook fallback)' : ''}`,
        provider: 'resend',
        originalProvider: provider
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })

    } catch (sendError) {
      console.error('❌ Resend error:', sendError)
      return new Response(JSON.stringify({
        success: false,
        error: `Email sending failed: ${sendError.message}`,
        provider: 'resend'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error in Edge Function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})