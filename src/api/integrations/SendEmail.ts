import { sendEmail } from '@/services/emailService';
import { EmailOptions, EmailResponse } from '@/services/emailService';

export const SendEmail = async (options: Omit<EmailOptions, 'html'> & { body: string, from_name: string }): Promise<EmailResponse> => {
  // Construct HTML from body and from_name, similar to sendAssetNotificationEmail
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${options.subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">📋 ${options.from_name}</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Thông báo từ hệ thống</p>
      </div>
      <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <div style="white-space: pre-wrap; line-height: 1.6;">${options.body}</div>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        <p><strong>${options.from_name}</strong></p>
        <p>Thời gian gửi: ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    </body>
    </html>
  `;
  return sendEmail({
    to: options.to,
    subject: options.subject,
    html: htmlContent,
    type: 'general_notification', // Or a more specific type if needed
    data: options.data
  });
};