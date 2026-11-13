import { Prisma } from '@/generated/prisma/client';

export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

export const USER_CREDENTIALS_SELECT = {
  ...PUBLIC_USER_SELECT,
  passwordHash: true,
} as const satisfies Prisma.UserSelect;

export type PublicUserRecord = Prisma.UserGetPayload<{
  select: typeof PUBLIC_USER_SELECT;
}>;

export type UserCredentialsRecord = Prisma.UserGetPayload<{
  select: typeof USER_CREDENTIALS_SELECT;
}>;
