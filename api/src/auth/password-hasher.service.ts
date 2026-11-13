import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

@Injectable()
export class PasswordHasherService {
  private readonly dummyHash = argon2.hash(randomBytes(32), {
    type: argon2.argon2id,
  });

  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  verify(passwordHash: string, candidate: string): Promise<boolean> {
    return argon2.verify(passwordHash, candidate);
  }

  async verifyOrDummy(
    passwordHash: string | null,
    candidate: string,
  ): Promise<boolean> {
    const comparisonHash = passwordHash ?? (await this.dummyHash);
    const matches = await argon2.verify(comparisonHash, candidate);
    return passwordHash !== null && matches;
  }
}
