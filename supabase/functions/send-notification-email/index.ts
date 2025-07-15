// @ts-ignore
/// <reference types="https://deno.land/x/deno@v1.28.0/lib/deno.d.ts" />

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
  // @ts-ignore
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Tài sản - CRC <taisan@caremylife.me>'

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not configured')
    throw new Error('RESEND_API_KEY not configured')
  }

  // @ts-ignore
  if (!Deno.env.get('RESEND_FROM_EMAIL')) {
    console.warn('⚠️ RESEND_FROM_EMAIL is not set in project secrets. Using default value. This may fail if the domain is not verified in your Resend account.')
  }

  console.log('📧 === EMAIL SENDING DEBUG INFO ===')
  console.log(`📧 From: ${fromEmail}`)
  console.log('📧 To Recipients:', recipients)
  console.log('📧 Recipients Count:', recipients.length)
  console.log('📧 Subject:', subject)
  console.log('📧 HTML Length:', bodyHTML.length)
  console.log('📧 API Key Present:', !!resendApiKey)
  console.log('📧 API Key Length:', resendApiKey ? resendApiKey.length : 0)
  
  const emailPayload = {
    from: fromEmail,
    to: recipients,
    subject: subject,
    html: bodyHTML,
  }
  
  console.log('📧 Email Payload:', JSON.stringify(emailPayload, null, 2))
  
  try {
    console.log('📧 Calling Resend API...')
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    console.log('📧 Resend API Response Status:', response.status)
    console.log('📧 Resend API Response Headers:', Object.fromEntries(response.headers.entries()))
    
    const result = await response.json()
    console.log('📧 Resend API Response Body:', JSON.stringify(result, null, 2))
    
    if (!response.ok) {
      console.error('❌ Resend API Error Details:')
      console.error('❌ Status:', response.status)
      console.error('❌ Status Text:', response.statusText)
      console.error('❌ Response:', result)
      throw new Error(`Resend API error (${response.status}): ${result.message || JSON.stringify(result)}`)
    }

    console.log('✅ Email sent successfully via Resend')
    return result

  } catch (fetchError: any) {
    console.error('❌ Fetch Error:', fetchError)
    console.error('❌ Fetch Error Message:', fetchError.message)
    console.error('❌ Fetch Error Stack:', fetchError.stack)
    throw fetchError
  }
}

// @ts-ignore
serve(async (req) => {
  console.log('🚀 === EDGE FUNCTION START ===')
  console.log('🚀 Method:', req.method)
  console.log('🚀 URL:', req.url)
  console.log('🚀 Headers:', Object.fromEntries(req.headers.entries()))
  
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
      console.log('📝 Raw request body preview:', bodyText.substring(0, 500))
      
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
      console.log('✅ Request parsed successfully')
      console.log('📝 Request keys:', Object.keys(requestBody))
      console.log('📝 Request body:', JSON.stringify(requestBody, null, 2))
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
    console.log('📋 === REQUEST PARAMETERS ===')
    console.log('📋 To:', to)
    console.log('📋 Subject:', subject)
    console.log('📋 Type:', type)
    console.log('📋 Has HTML:', !!html)
    console.log('📋 Has Data:', !!data)

    // Handle API check
    if (type === 'api_check') {
      console.log('🔍 Performing API check...')
      // @ts-ignore
      const resendKey = Deno.env.get('RESEND_API_KEY')
      // @ts-ignore
      const fromEmailCheck = Deno.env.get('RESEND_FROM_EMAIL') || 'Tài sản - CRC <taisan@caremylife.me>'

      return new Response(JSON.stringify({
        success: true,
        message: 'Email service status checked',
        service: {
          configured: !!resendKey,
          status: resendKey ? 'Ready' : 'Not configured',
          from: fromEmailCheck
        },
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Validate required fields
    if (!to || !subject) {
      console.error('❌ Missing required fields')
      console.error('❌ To present:', !!to)
      console.error('❌ Subject present:', !!subject)
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
    console.log('📧 === EMAIL PREPARATION ===')
    console.log('📧 Recipients Array:', recipients)
    console.log('📧 Recipients Count:', recipients.length)
    console.log('📧 Subject:', subject)
    console.log('📧 HTML Length:', finalHtml.length)

    // Send email
    try {
      console.log('📧 Starting email send process...')
      const result = await sendEmailViaResend(recipients, subject, finalHtml)
      console.log('✅ === EMAIL SENT SUCCESSFULLY ===')
      console.log('✅ Result:', result)
      
      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: 'Email sent successfully',
        from: 'Tài sản - CRC <taisan@caremylife.me>',
        to: recipients,
        debug: {
          recipientsCount: recipients.length,
          htmlLength: finalHtml.length,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })

    } catch (sendError: any) {
      console.error('❌ === EMAIL SEND ERROR ===')
      console.error('❌ Error:', sendError)
      console.error('❌ Error Message:', sendError.message)
      console.error('❌ Error Stack:', sendError.stack)
      
      return new Response(JSON.stringify({
        success: false,
        error: `Email send failed: ${sendError.message}`,
        details: {
          errorType: sendError.constructor.name,
          errorMessage: sendError.message,
          recipients: recipients,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

  } catch (error: any) {
    console.error('❌ === UNEXPECTED ERROR ===')
    console.error('❌ Error:', error)
    console.error('❌ Error Message:', error.message)
    console.error('❌ Error Stack:', error.stack)
    
    return new Response(JSON.stringify({
      success: false,
      error: `Unexpected error: ${error.message}`,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})