import { UserRole } from '../users/enums/role.enum';
import { OrderStatus } from './enums/status.enum';

const nextStatus: Readonly<Partial<Record<OrderStatus, OrderStatus>>> = {
  [OrderStatus.PENDING]: OrderStatus.COOKING,
  [OrderStatus.COOKING]: OrderStatus.WAITING,
  [OrderStatus.WAITING]: OrderStatus.PICKED,
  [OrderStatus.PICKED]: OrderStatus.DELIVERED,
};

const roleTargets: Readonly<Partial<Record<UserRole, readonly OrderStatus[]>>> =
  {
    [UserRole.OWNER]: [OrderStatus.COOKING, OrderStatus.WAITING],
    [UserRole.COURIER]: [OrderStatus.PICKED, OrderStatus.DELIVERED],
  };

export function isAdjacentOrderTransition(
  current: OrderStatus,
  target: OrderStatus,
): boolean {
  return nextStatus[current] === target;
}

export function canRoleTransitionOrder(
  role: UserRole,
  current: OrderStatus,
  target: OrderStatus,
): boolean {
  return (
    isAdjacentOrderTransition(current, target) &&
    (roleTargets[role]?.includes(target) ?? false)
  );
}
