import { PrismaService } from '@/prisma/prisma.service';
import {
  USER_CREDENTIALS_SELECT,
  UserCredentialsRecord,
} from '@/users/user.persistence';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByNormalizedEmail(email: string): Promise<UserCredentialsRecord | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: USER_CREDENTIALS_SELECT,
    });
  }
}
