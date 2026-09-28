import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private defaultFrom: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('email.resendApiKey');
    this.defaultFrom = this.config.get<string>('email.fromAddress') || 'SMSGate <onboarding@resend.dev>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email provider initialized.');
    } else {
      this.logger.warn('RESEND_API_KEY is not configured. Outgoing emails will be logged to console.');
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const from = options.from || this.defaultFrom;
    const to = Array.isArray(options.to) ? options.to : [options.to];

    if (!this.resend) {
      this.logger.log(`[MOCK EMAIL] From: ${from} | To: ${to.join(', ')} | Subject: ${options.subject}`);
      return { success: true, id: 'mock-email-id' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        this.logger.error(`Failed to send email via Resend: ${error.message}`);
        return { success: false, error: error.message };
      }

      this.logger.log(`Email successfully dispatched via Resend: ${data?.id} to ${to.join(', ')}`);
      return { success: true, id: data?.id };
    } catch (err: any) {
      this.logger.error(`Exception during email dispatch: ${err.message}`, err.stack);
      return { success: false, error: err.message };
    }
  }

  /**
   * Helper to send low balance warning email with clean HTML styling
   */
  async sendLowBalanceEmail(to: string, name: string, balance: number, threshold: number, role: string) {
    const subject = `⚠️ Alert: Your SMSGate Credit Balance is Low (${balance} credits remaining)`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #111827; margin: 0; font-size: 24px;">SMSGate Platform Alert</h2>
        </div>
        <div style="padding: 20px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; margin-bottom: 24px;">
          <h3 style="color: #991b1b; margin-top: 0; margin-bottom: 8px;">Low Credit Balance Warning</h3>
          <p style="color: #7f1d1d; margin: 0; line-height: 1.5;">
            Hello <strong>${name}</strong>, your account credit balance has dropped below your notification threshold.
          </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Account Type:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; text-transform: uppercase;">${role}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Current Balance:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 700; color: #dc2626; font-size: 18px;">${balance} Credits</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Notification Threshold:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600;">${threshold} Credits</td>
          </tr>
        </table>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          To ensure uninterrupted SMS dispatching for your active campaigns and API requests, please top up your account balance immediately.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="https://smsgate.lk" style="background-color: #4f6ef7; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Top Up Credits Now
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          This is an automated system alert from SMSGate Infrastructure.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }
}
