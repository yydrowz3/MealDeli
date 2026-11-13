import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { UserRole } from '@/users/user-role.enum';
import { ForbiddenException } from '@nestjs/common';

export function assertCustomer(principal: AuthenticatedPrincipal): void {
  if (principal.role !== UserRole.CUSTOMER) {
    throw new ForbiddenException('Insufficient role.');
  }
}

export function assertOwner(principal: AuthenticatedPrincipal): void {
  if (principal.role !== UserRole.OWNER) {
    throw new ForbiddenException('Insufficient role.');
  }
}

export function assertOrderEditor(principal: AuthenticatedPrincipal): void {
  if (
    principal.role !== UserRole.OWNER &&
    principal.role !== UserRole.COURIER
  ) {
    throw new ForbiddenException('Insufficient role.');
  }
}

export function assertCourier(principal: AuthenticatedPrincipal): void {
  if (principal.role !== UserRole.COURIER) {
    throw new ForbiddenException('Insufficient role.');
  }
}

export function assertOrderViewer(principal: AuthenticatedPrincipal): void {
  if (
    principal.role !== UserRole.CUSTOMER &&
    principal.role !== UserRole.OWNER &&
    principal.role !== UserRole.COURIER
  ) {
    throw new ForbiddenException('Insufficient role.');
  }
}
