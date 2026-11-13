import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { UserRole } from '@/users/user-role.enum';
import { ForbiddenException } from '@nestjs/common';

export function assertOwner(principal: AuthenticatedPrincipal): void {
  if (principal.role !== UserRole.OWNER) {
    throw new ForbiddenException('Insufficient role.');
  }
}
