import type { RequestedOrderItem } from './order-selection';
import { createHash } from 'node:crypto';

export function createOrderRequestHash(
  restaurantId: string,
  items: readonly RequestedOrderItem[],
): string {
  const canonicalItems = items
    .map((item) => ({
      dishId: item.dishId,
      options: item.options
        .map((option) => ({
          name: option.nameKey,
          choice: option.choiceKey,
        }))
        .sort((left, right) => compareText(left.name, right.name)),
    }))
    .sort((left, right) => compareText(left.dishId, right.dishId));

  const canonicalRequest = JSON.stringify({
    restaurantId,
    items: canonicalItems,
  });

  return createHash('sha256').update(canonicalRequest, 'utf8').digest('hex');
}

function compareText(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}
