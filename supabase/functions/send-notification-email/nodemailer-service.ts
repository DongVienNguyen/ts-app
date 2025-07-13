// Nodemailer service implementation
export const sendViaNodemailerService = async (recipients: string[], subject: string, emailHTML: string) => {
  // @ts-ignore
  const outlookEmail = Deno.env.get('OUTLOOK_EMAIL')
  // @ts-ignore
  const outlookPassword = Deno.env.get('OUTLOOK_APP_PASSWORD')
  // @ts-ignore
  const nodemailerServiceUrl = Deno.env.get('NODEMAILER_SERVICE_URL') // Your external service URL

  if (!outlookEmail || !outlookPassword) {
    throw new Error('Outlook SMTP credentials not configured')
  }

  if (!nodemailerServiceUrl) {
    throw new Error('Nodemailer service URL not configured')
  }

  console.log('📧 Sending via external Nodemailer service...')

  const payload = {
    smtp: {
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: outlookEmail,
        pass: outlookPassword
      }
    },
    email: {
      from: `"Đồng Nguyễn - Vietcombank" <${outlookEmail}>`,
      to: recipients,
      subject: subject,
      html: emailHTML
    }
  };

  try {
    const response = await fetch(nodemailerServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer your-service-token` // Optional security
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nodemailer service error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Nodemailer service response:', result);

    return {
      messageId: result.messageId || `nodemailer-${Date.now()}`,
      status: 'sent',
      provider: 'nodemailer-outlook',
      from: outlookEmail,
      to: recipients,
      timestamp: new Date().toISOString(),
      service: 'External Nodemailer + Outlook SMTP'
    };

  } catch (error) {
    console.error('❌ Nodemailer service error:', error);
    throw new Error(`Nodemailer service failed: ${error.message}`);
  }
}