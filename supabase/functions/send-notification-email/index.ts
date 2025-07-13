// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateTestEmailHTML = (username: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email từ Vietcombank</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🏦 Ngân hàng TMCP Ngoại thương Việt Nam</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Vietcombank - Hệ thống Quản lý Tài sản</p>
      </div>
      <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e40af;">Email Test Thành Công!</h2>
        <p>Đây là email được gửi từ hệ thống quản lý tài sản nội bộ của Vietcombank.</p>
        
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
          <h3 style="color: #1e40af; margin-top: 0;">📊 Thông tin email:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Người test:</strong> ${username}</li>
            <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
            <li><strong>Provider:</strong> Resend API</li>
            <li><strong>Trạng thái:</strong> Gửi thành công</li>
          </ul>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="color: #16a34a; margin-top: 0;">✅ Chức năng đã kiểm tra:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>✅ Kết nối Supabase Edge Function</li>
            <li>✅ Resend API Integration</li>
            <li>✅ Email Template HTML</li>
            <li>✅ Vietcombank Branding</li>
            <li>✅ Gửi email thành công</li>
          </ul>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        <p><strong>Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)</strong></p>
        <p>Hệ thống Quản lý Tài sản Nội bộ</p>
        <p>Liên hệ hỗ trợ: dongnv.hvu@vietcombank.com.vn</p>
        <p>Thời gian gửi: ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    </body>
    </html>
  `
}

// Send email via Resend API
const sendEmail = async (recipients: string[], subject: string, emailHTML: string) => {
  // @ts-ignore
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

  console.log('📧 Sending via Resend API...')
  console.log('📧 From: Vietcombank Tài sản <taisan@caremylife.me>')
  console.log('📧 To:', recipients.join(', '))
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Vietcombank Tài sản <taisan@caremylife.me>',
      to: recipients,
      subject: subject,
      html: emailHTML,
      reply_to: 'dongnv.hvu@vietcombank.com.vn',
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
      console.log('✅ Request parsed successfully')
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

    const { to, subject, html, type, data } = requestBody

    // Handle API check
    if (type === 'api_check') {
      console.log('🔍 Performing API check...')
      // @ts-ignore
      const resendKey = Deno.env.get('RESEND_API_KEY')

      return new Response(JSON.stringify({
        success: true,
        message: 'Email provider status checked',
        providers: {
          resend: { 
            configured: !!resendKey,
            status: resendKey ? 'Ready' : 'Not configured',
            from: 'Vietcombank Tài sản <taisan@caremylife.me>',
            reply_to: 'dongnv.hvu@vietcombank.com.vn'
          }
        },
        provider: 'resend',
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
      emailHTML = generateTestEmailHTML(data?.username || 'N/A')
    }
    
    if (!emailHTML) {
      emailHTML = '<p>Nội dung email từ hệ thống Vietcombank</p>'
    }

    const recipients = Array.isArray(to) ? to : [to]
    console.log(`📧 Sending email to: ${recipients.join(', ')}`)
    console.log(`📧 Subject: ${subject}`)

    // Send email
    try {
      const result = await sendEmail(recipients, subject, emailHTML)
      
      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: 'Email sent successfully via Resend API',
        provider: 'resend',
        from: 'Vietcombank Tài sản <taisan@caremylife.me>',
        reply_to: 'dongnv.hvu@vietcombank.com.vn'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })

    } catch (sendError) {
      console.error('❌ Send error:', sendError)
      
      return new Response(JSON.stringify({
        success: false,
        error: sendError.message,
        provider: 'resend'
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