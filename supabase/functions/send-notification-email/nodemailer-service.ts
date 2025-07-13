// Nodemailer service for Outlook SMTP
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}

// Outlook SMTP configuration
export const getOutlookConfig = (email: string, appPassword: string): EmailConfig => ({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: email,
    pass: appPassword,
  },
});

// Send email via Nodemailer (simulated for Edge Functions)
export const sendViaNodemailer = async (
  recipients: string[],
  subject: string,
  emailHTML: string,
  fromEmail: string,
  appPassword: string
) => {
  console.log('📧 Sending via Outlook SMTP (Nodemailer simulation)...');
  console.log('📧 From:', fromEmail);
  console.log('📧 To:', recipients.join(', '));
  console.log('📧 SMTP Host: smtp-mail.outlook.com:587');

  // Since we can't use actual Nodemailer in Edge Functions,
  // we'll use fetch to call a third-party SMTP service or API
  
  // For now, we'll simulate the SMTP call
  // In production, you might want to use a service like SendGrid, Mailgun, etc.
  
  const emailData = {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: fromEmail,
      pass: appPassword,
    },
    from: `Đồng Nguyễn - Vietcombank <${fromEmail}>`,
    to: recipients,
    subject: subject,
    html: emailHTML,
  };

  console.log('📤 SMTP Configuration:', {
    host: emailData.host,
    port: emailData.port,
    user: emailData.auth.user,
    from: emailData.from,
    to: emailData.to,
  });

  // Since Edge Functions don't support Nodemailer directly,
  // we'll throw an error to indicate this limitation
  throw new Error('Nodemailer not supported in Edge Functions. Use Resend API instead.');
};