// @ts-ignore
/// <reference types="https://deno.land/x/deno@v1.28.0/lib/deno.d.ts" />

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FROM_EMAIL = 'Tài sản - CRC <onboarding@resend.dev>';

const generateTestEmailHTML = (username: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email từ Hệ thống Tài sản - CRC</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">📋 Hệ thống Quản lý Tài sản - CRC</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Tài sản - CRC - Hệ thống Quản lý Nội bộ</p>
      </div>
      <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e40af;">Email Test Thành Công!</h2>
        <p>Đây là email được gửi từ hệ thống quản lý tài sản nội bộ.</p>
        
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
          <h3 style="color: #1e40af; margin-top: 0;">📊 Thông tin email:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Người test:</strong> ${username}</li>
            <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
            <li><strong>Trạng thái:</strong> Gửi thành công</li>
          </ul>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="color: #16a34a; margin-top: 0;">✅ Chức năng đã kiểm tra:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>✅ Kết nối Supabase Edge Function</li>
            <li>✅ Email API Integration</li>
            <li>✅ Email Template HTML</li>
            <li>✅ Hệ thống Tài sản - CRC</li>
            <li>✅ Gửi email thành công</li>
          </ul>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        <p><strong>Hệ thống Quản lý Tài sản - CRC</strong></p>
        <p>Hệ thống Quản lý Tài sản Nội bộ</p>
        <p>Thời gian gửi: ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    </body>
    </html>
  `
}

// Send email via Resend API
const sendEmailViaResend = async (recipients: string[], subject: string, bodyHTML: string) => {
  // @ts-ignore
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

  console.log('📧 Sending email via Resend...')
  console.log(`📧 From: ${FROM_EMAIL}`)
  console.log('📧 To:', recipients.join(', '))
  console.log('📧 Subject:', subject)
  
  const emailPayload = {
    from: FROM_EMAIL,
    to: recipients,
    subject: subject,
    html: bodyHTML,
  }
  
  console.log('📧 Email payload prepared')
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  })

  console.log('📧 Resend API response status:', response.status)
  
  const result = await response.json()
  console.log('📧 Resend API response:', result)
  
  if (!response.ok) {
    throw new Error(`Resend API error (${response.status}): ${result.message || JSON.stringify(result)}`)
  }

  return result
}

// @ts-ignore
serve(async (req) => {
  console.log('🚀 Edge Function started:', req.method, req.url)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    let requestBody: any
    try {
      const bodyText = await req.text()
      console.log('📝 Raw request body length:', bodyText.length)
      console.log('📝 Raw request body preview:', bodyText.substring(0, 200))
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('❌ Request body is empty')
        return new Response(JSON.stringify({
          success: false,
          error: 'Request body is empty'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      requestBody = JSON.parse(bodyText)
      console.log('✅ Request parsed successfully:', Object.keys(requestBody))
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError)
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid JSON in request body: ${parseError.message}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const { to, subject, html, type, data } = requestBody
    console.log('📋 Request parameters:', { to, subject, type, hasHtml: !!html, hasData: !!data })

    // Handle API check
    if (type === 'api_check') {
      console.log('🔍 Performing API check...')
      // @ts-ignore
      const resendKey = Deno.env.get('RESEND_API_KEY')

      return new Response(JSON.stringify({
        success: true,
        message: 'Email service status checked',
        service: {
          configured: !!resendKey,
          status: resendKey ? 'Ready' : 'Not configured',
          from: FROM_EMAIL
        },
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Validate required fields
    if (!to || !subject) {
      console.error('❌ Missing required fields:', { to: !!to, subject: !!subject })
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: to, subject'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Generate email HTML
    let finalHtml = html
    if (!finalHtml && type === 'test') {
      console.log('📝 Generating test email HTML...')
      finalHtml = generateTestEmailHTML(data?.username || 'N/A')
    }
    
    if (!finalHtml) {
      console.log('📝 Using default email HTML...')
      finalHtml = '<p>Nội dung email từ hệ thống Tài sản - CRC</p>'
    }

    const recipients = Array.isArray(to) ? to : [to]
    console.log(`📧 Preparing to send email to: ${recipients.join(', ')}`)
    console.log(`📧 Subject: ${subject}`)
    console.log(`📧 HTML length: ${finalHtml.length}`)

    // Send email
    try {
      const result = await sendEmailViaResend(recipients, subject, finalHtml)
      console.log('✅ Email sent successfully:', result)
      
      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: 'Email sent successfully',
        from: FROM_EMAIL
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })

    } catch (sendError: any) {
      console.error('❌ Send error:', sendError)
      
      return new Response(JSON.stringify({
        success: false,
        error: `Email send failed: ${sendError.message}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    console.error('❌ Error stack:', error.stack)
    
    return new Response(JSON.stringify({
      success: false,
      error: `Unexpected error: ${error.message}`,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})