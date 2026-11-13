import { EnvironmentVariables } from '@/config/environment.variables';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';

export interface IssuedVerificationToken {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class VerificationTokenService {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  issue(now = new Date()): IssuedVerificationToken {
    const rawToken = randomBytes(32).toString('base64url');
    const ttlSeconds = this.config.get('EMAIL_VERIFICATION_TTL_SECONDS', {
      infer: true,
    });
    return {
      rawToken,
      tokenHash: this.hash(rawToken),
      expiresAt: new Date(now.getTime() + ttlSeconds * 1_000),
    };
  }

  hash(rawToken: string): string {
    return createHash('sha256').update(rawToken, 'utf-8').digest('hex');
  }
}
