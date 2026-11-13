import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { UserRole } from '@/users/user-role.enum';
import { OrderStatus } from './order-status';

export interface OrderTransition {
  from: OrderStatus;
  to: OrderStatus;
}

export function requestedTransition(
  principal: AuthenticatedPrincipal,
  target: OrderStatus,
): OrderTransition | null {
  if (principal.role === UserRole.OWNER) {
    switch (target) {
      case OrderStatus.COOKING:
        return { from: OrderStatus.PENDING, to: OrderStatus.COOKING };
      case OrderStatus.COOKED:
        return { from: OrderStatus.COOKING, to: OrderStatus.COOKED };
      default:
        return null;
    }
  }

  if (principal.role === UserRole.COURIER) {
    switch (target) {
      case OrderStatus.PICKED_UP:
        return { from: OrderStatus.COOKED, to: OrderStatus.PICKED_UP };
      case OrderStatus.DELIVERED:
        return { from: OrderStatus.PICKED_UP, to: OrderStatus.DELIVERED };
      default:
        return null;
    }
  }

  return null;
}
