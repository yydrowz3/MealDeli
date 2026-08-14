import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailsService {
  private readonly resend: Resend;
  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.get<string>('RESEND_API_KEY') || '',
    );
  }
  async sendEmail(to: string, subject: string, html: string) {
    const { data, error } = await this.resend.emails.send({
      from:
        this.configService.get<string>('RESEND_EMAIL_FROM') ||
        'Resend <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async sendVerificationEmail(email: string, token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const subject = 'Verify your email';

    const html = `
    <h1>Verify your email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href="${verificationUrl}">Verify email</a>
    <p>This link expires in one hour.</p>
  `;

    return this.sendEmail(email, subject, html);
  }
}
