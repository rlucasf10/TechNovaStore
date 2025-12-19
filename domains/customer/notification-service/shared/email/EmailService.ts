import nodemailer, { Transporter } from 'nodemailer';
import { EmailConfig, EmailTemplate } from '../types/index';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter: Transporter;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    });
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    try {
      const mailOptions = {
        from: this.config.from,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to, messageId: result.messageId });
    } catch (error) {
      logger.error('Failed to send email', { to, error: error instanceof Error ? error.message : error });
      throw new Error(`Email delivery failed: ${error}`);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed', { error: error instanceof Error ? error.message : error });
      return false;
    }
  }
}