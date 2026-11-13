import { UserRole } from '@/users/user-role.enum';

export interface AuthenticatedPrincipal {
  userId: string;
  role: UserRole;
}

export interface AuthenticatedSession {
  principal: AuthenticatedPrincipal;
  expiresAtEpochSeconds: number;
}
