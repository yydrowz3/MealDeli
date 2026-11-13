export const VERIFICATION_MAILER = Symbol('VERIFICATION_MAILER');

export interface SendVerificationEmailCommand {
  recipientEmail: string;
  rawToken: string;
  deliveryKey: string;
}

export interface VerificationMailer {
  send(command: SendVerificationEmailCommand): Promise<void>;
}
