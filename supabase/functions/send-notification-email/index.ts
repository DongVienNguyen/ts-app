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
  const fromEmail = 'onboarding@resend.dev'

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not configured')
    throw new Error('RESEND_API_KEY not configured')
  }
  
  const emailPayload = {
    from: fromEmail,
    to: recipients,
    subject: subject,
    html: bodyHTML,
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`Resend API error (${response.status}): ${result.message || JSON.stringify(result)}`)
    }

    return result

  } catch (fetchError: any) {
    throw fetchError
  }
}

// @ts-ignore
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let requestBody: any
    try {
      requestBody = await req.json()
    } catch (parseError: any) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid JSON in request body: ${parseError.message}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const { to, subject, html, type, data } = requestBody

    if (type === 'api_check') {
      // @ts-ignore
      const resendKey = Deno.env.get('RESEND_API_KEY')
      const fromEmailCheck = 'onboarding@resend.dev'

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

    if (!to || !subject) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: to, subject'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    let finalHtml = html
    if (!finalHtml && type === 'test') {
      finalHtml = generateTestEmailHTML(data?.username || 'N/A')
    }
    
    if (!finalHtml) {
      finalHtml = '<p>Nội dung email từ hệ thống Tài sản - CRC</p>'
    }

    const recipients = Array.isArray(to) ? to : [to]

    try {
      const result = await sendEmailViaResend(recipients, subject, finalHtml)
      
      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: 'Email sent successfully',
        from: 'onboarding@resend.dev',
        to: recipients,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })

    } catch (sendError: any) {
      return new Response(JSON.stringify({
        success: false,
        error: `Email send failed: ${sendError.message}`,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: `Unexpected error: ${error.message}`,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})