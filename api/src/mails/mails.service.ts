import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class MailsService {
  private readonly resend: Resend;
  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>("RESEND_API_KEY") || "");
  }
  async sendEmail(to: string, subject: string, html: string) {
    const { data, error } = await this.resend.emails.send({
      from: this.configService.get<string>("RESEND_EMAIL_FROM") || "Resend <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async sendVerificationEmail(email: string, code: string) {
    const subject = "Verify your email";
    const html = `
        <h1>Verify your email</h1>
        <p>Your verification code is:</p>
        <strong>${code}</strong>
    `;

    return this.sendEmail(email, subject, html);
  }
}
