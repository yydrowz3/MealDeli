import { UserRole as PrismaUserRole } from '@/generated/prisma/enums';
import { UserRole } from '@/users/user-role.enum';
import { PublicUserRecord } from '@/users/user.persistence';
import { SafeUser } from '@/users/user.types';

export interface RegisterCommand {
  email: string;
  password: string;
  role: UserRole;
}

export interface ChangeEmailCommand {
  newEmail: string;
  currentPassword: string;
}

export interface ChangePasswordCommand {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailCommand {
  token: string;
}

export function toSafeUser(user: PublicUserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: toPublicUserRole(user.role),
    emailVerified: user.verifiedAt !== null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toPublicUserRole(role: PrismaUserRole): UserRole {
  switch (role) {
    case PrismaUserRole.CUSTOMER:
      return UserRole.CUSTOMER;
    case PrismaUserRole.OWNER:
      return UserRole.OWNER;
    case PrismaUserRole.COURIER:
      return UserRole.COURIER;
  }
}

export function toPrismaUserRole(role: UserRole): PrismaUserRole {
  switch (role) {
    case UserRole.CUSTOMER:
      return PrismaUserRole.CUSTOMER;
    case UserRole.OWNER:
      return PrismaUserRole.OWNER;
    case UserRole.COURIER:
      return PrismaUserRole.COURIER;
  }
}
