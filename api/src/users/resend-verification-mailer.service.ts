import { EnvironmentVariables } from '@/config/environment.variables';
import {
  SendVerificationEmailCommand,
  VerificationMailer,
} from '@/users/verification-mailer.port';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RESEND_EMAILS_ENDPOINT = 'https://api.resend.com/emails';

@Injectable()
export class ResendVerificationMailer implements VerificationMailer {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async send(command: SendVerificationEmailCommand): Promise<void> {
    const verificationUrl = new URL(
      this.config.get('FRONTEND_VERIFY_EMAIL_URL', { infer: true }),
    );
    verificationUrl.searchParams.set('token', command.rawToken);

    const response = await fetch(RESEND_EMAILS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.get('RESEND_API_KEY', {
          infer: true,
        })}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': command.deliveryKey,
      },
      body: JSON.stringify({
        from: this.config.get('RESEND_FROM', { infer: true }),
        to: [command.recipientEmail],
        subject: 'Verify your MealRelay email',
        text:
          'Verify your MealRelay email by opening this link: ' +
          verificationUrl.toString(),
      }),
      signal: AbortSignal.timeout(
        this.config.get('RESEND_TIMEOUT_MS', { infer: true }),
      ),
    }).catch((error: unknown) => {
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new Error('Resend request timed out.');
      }
      throw error;
    });

    if (!response.ok) {
      throw new Error(`Resend returned status ${response.status}.`);
    }
  }
}
