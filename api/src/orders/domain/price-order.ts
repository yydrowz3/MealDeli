import { CatalogInputError } from '@/catalog/domain/catalog-input.error';
import {
  type MenuOptionDefinition,
  parseMenuOptionDefinitions,
} from '@/catalog/domain/menu-option-definition';
import {
  type RequestedOrderItem,
  type SelectedOrderOptionSnapshot,
  selectionKey,
} from './order-selection';
import { ExpectedOrderError, OrderMutationError } from './order-result';

const MAX_GRAPHQL_INT = 2_147_483_647;

export interface OrderableDish {
  id: string;
  name: string;
  priceMinor: number;
  options: unknown;
}

export interface PricedOrderItem {
  dishId: string;
  dishName: string;
  basePriceMinor: number;
  selectedOptions: SelectedOrderOptionSnapshot[];
  optionsExtraMinor: number;
  lineTotalMinor: number;
}

export interface PricedOrder {
  items: PricedOrderItem[];
  totalMinor: number;
}

export class PersistedCatalogPricingError extends Error {
  constructor(readonly dishId: string) {
    super(`Invalid persisted menu options for dish ${dishId}.`);
    this.name = PersistedCatalogPricingError.name;
  }
}

export function priceOrder(
  requestedItems: readonly RequestedOrderItem[],
  dishes: readonly OrderableDish[],
): PricedOrder {
  const dishesById = new Map(dishes.map((dish) => [dish.id, dish]));
  let totalMinor = 0;

  const items = requestedItems.map((requestedItem): PricedOrderItem => {
    const dish = dishesById.get(requestedItem.dishId);
    if (!dish) {
      throw new ExpectedOrderError(OrderMutationError.ResourceUnavailable);
    }

    let definitions: MenuOptionDefinition[];
    try {
      definitions = parseMenuOptionDefinitions(dish.options);
    } catch (error) {
      if (error instanceof CatalogInputError) {
        throw new PersistedCatalogPricingError(dish.id);
      }
      throw error;
    }

    const definitionsByName = new Map(
      definitions.map((definition) => [
        selectionKey(definition.name),
        definition,
      ]),
    );
    let optionsExtraMinor = 0;

    const selectedOptions = requestedItem.options.map(
      (requested): SelectedOrderOptionSnapshot => {
        const definition = definitionsByName.get(requested.nameKey);
        if (!definition) {
          throw new ExpectedOrderError(OrderMutationError.InvalidSelection);
        }

        if (definition.choices !== undefined) {
          if (requested.choiceKey === null) {
            throw new ExpectedOrderError(OrderMutationError.InvalidSelection);
          }

          const choice = definition.choices.find(
            (candidate) => selectionKey(candidate.name) === requested.choiceKey,
          );
          if (!choice) {
            throw new ExpectedOrderError(OrderMutationError.InvalidSelection);
          }

          optionsExtraMinor = safeMoneyAdd(
            optionsExtraMinor,
            choice.extraMinor,
          );
          return {
            name: definition.name,
            choice: choice.name,
            extraMinor: choice.extraMinor,
          };
        }

        if (requested.choice !== null) {
          throw new ExpectedOrderError(OrderMutationError.InvalidSelection);
        }

        optionsExtraMinor = safeMoneyAdd(
          optionsExtraMinor,
          definition.extraMinor,
        );
        return {
          name: definition.name,
          choice: null,
          extraMinor: definition.extraMinor,
        };
      },
    );

    const lineTotalMinor = safeMoneyAdd(dish.priceMinor, optionsExtraMinor);
    totalMinor = safeMoneyAdd(totalMinor, lineTotalMinor);

    return {
      dishId: dish.id,
      dishName: dish.name,
      basePriceMinor: dish.priceMinor,
      selectedOptions,
      optionsExtraMinor,
      lineTotalMinor,
    };
  });

  return { items, totalMinor };
}

function safeMoneyAdd(left: number, right: number): number {
  const total = left + right;
  if (!Number.isSafeInteger(total) || total < 0 || total > MAX_GRAPHQL_INT) {
    throw new ExpectedOrderError(OrderMutationError.InvalidSelection);
  }
  return total;
}
