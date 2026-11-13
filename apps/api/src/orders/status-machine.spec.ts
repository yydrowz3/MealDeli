import { describe, expect, it } from 'vitest';
import { OrderStatus } from './enums/status.enum';
import { UserRole } from '../users/enums/role.enum';
import {
  canRoleTransitionOrder,
  isAdjacentOrderTransition,
} from './status-machine';

const steps = [
  OrderStatus.PENDING,
  OrderStatus.COOKING,
  OrderStatus.WAITING,
  OrderStatus.PICKED,
  OrderStatus.DELIVERED,
];
const transitions = steps.flatMap((current, index) =>
  steps.map((target) => ({
    current,
    target,
    adjacent: steps[index + 1] === target,
  })),
);

describe('order state machine', () => {
  it.each(transitions)(
    '$current -> $target has adjacency $adjacent',
    ({ current, target, adjacent }) => {
      expect(isAdjacentOrderTransition(current, target)).toBe(adjacent);
    },
  );
  it.each(
    Object.values(UserRole).flatMap((role) =>
      transitions.map((t) => ({ role, ...t })),
    ),
  )(
    '$role transition $current -> $target',
    ({ role, current, target, adjacent }) => {
      const allowedTargets: OrderStatus[] =
        role === UserRole.OWNER
          ? [OrderStatus.COOKING, OrderStatus.WAITING]
          : role === UserRole.COURIER
            ? [OrderStatus.PICKED, OrderStatus.DELIVERED]
            : [];
      expect(canRoleTransitionOrder(role, current, target)).toBe(
        adjacent && allowedTargets.includes(target),
      );
    },
  );
});
