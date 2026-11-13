import { PrismaService } from '@/prisma/prisma.service';
import { UserRole as PrismaUserRole } from '@/generated/prisma/client';
import { Injectable } from '@nestjs/common';
import {
  PUBLIC_USER_SELECT,
  PublicUserRecord,
  USER_CREDENTIALS_SELECT,
  UserCredentialsRecord,
} from '@/users/user.persistence';

export interface CreateUserRecord {
  email: string;
  passwordHash: string;
  role: PrismaUserRole;
  tokenHash: string;
  expiresAt: Date;
}

export interface ReplaceVerificationRecord {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithVerification(input: CreateUserRecord): Promise<PublicUserRecord> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        emailVerification: {
          create: {
            tokenHash: input.tokenHash,
            expiresAt: input.expiresAt,
          },
        },
      },
      select: PUBLIC_USER_SELECT,
    });
  }

  findSafeById(userId: string): Promise<PublicUserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });
  }

  findCredentialsById(userId: string): Promise<UserCredentialsRecord | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_CREDENTIALS_SELECT,
    });
  }

  updateEmailWithVerification(input: {
    userId: string;
    expectedUpdatedAt: Date;
    email: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PublicUserRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.update({
        where: {
          id: input.userId,
          updatedAt: input.expectedUpdatedAt,
        },
        data: {
          email: input.email,
          verifiedAt: null,
        },
        select: PUBLIC_USER_SELECT,
      });

      await transaction.emailVerification.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        },
        update: {
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          createdAt: new Date(),
        },
      });

      return user;
    });
  }

  updatePassword(input: {
    userId: string;
    expectedUpdatedAt: Date;
    passwordHash: string;
  }): Promise<PublicUserRecord> {
    return this.prisma.user.update({
      where: {
        id: input.userId,
        updatedAt: input.expectedUpdatedAt,
      },
      data: { passwordHash: input.passwordHash },
      select: PUBLIC_USER_SELECT,
    });
  }

  replaceVerification(
    input: ReplaceVerificationRecord,
  ): Promise<PublicUserRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUniqueOrThrow({
        where: { id: input.userId },
        select: PUBLIC_USER_SELECT,
      });

      await transaction.emailVerification.upsert({
        where: { userId: input.userId },
        create: input,
        update: {
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          createdAt: new Date(),
        },
      });

      return user;
    });
  }

  consumeVerification(
    tokenHash: string,
    now: Date,
  ): Promise<PublicUserRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      const verification = await transaction.emailVerification.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
        },
      });
      if (!verification || verification.expiresAt <= now) {
        if (verification) {
          await transaction.emailVerification.deleteMany({
            where: { id: verification.id },
          });
        }
        return null;
      }
      const consumed = await transaction.emailVerification.deleteMany({
        where: {
          id: verification.id,
          tokenHash,
          expiresAt: { gt: now },
        },
      });

      if (consumed.count !== 1) {
        return null;
      }

      return transaction.user.update({
        where: { id: verification.userId },
        data: { verifiedAt: now },
        select: PUBLIC_USER_SELECT,
      });
    });
  }
}
