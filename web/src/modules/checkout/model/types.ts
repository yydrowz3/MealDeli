export const CART_STORAGE_KEY = "mealdeli.cart.v1";

export type CartChoiceSnapshot = Readonly<{
  choiceId: string;
  name: string;
  extraMinor: number;
}>;

export type CartOptionSnapshot = Readonly<{
  optionId: string;
  name: string;
  choices: readonly CartChoiceSnapshot[];
}>;

export type CartLine = Readonly<{
  lineId: string;
  dishId: string;
  dishName: string;
  basePriceMinor: number;
  image: string | null;
  options: readonly CartOptionSnapshot[];
  quantity: number;
}>;

export type CartRestaurant = Readonly<{ id: string; name: string }>;

export type CartState = Readonly<{
  version: 1;
  restaurant: CartRestaurant | null;
  lines: readonly CartLine[];
}>;

export type AddCartLineInput = Readonly<{
  restaurant: CartRestaurant;
  line: CartLine;
}>;

export type AddCartLineResult =
  | Readonly<{ kind: "ADDED" | "MERGED" }>
  | Readonly<{
      kind: "REQUIRES_REPLACEMENT_CONFIRMATION";
      currentRestaurant: CartRestaurant;
      nextRestaurant: CartRestaurant;
    }>
  | Readonly<{ kind: "QUANTITY_LIMIT" }>;

export type ChangeQuantityInput = Readonly<{ lineId: string; quantity: number }>;

export type CreateOrderPayload = Readonly<{
  restaurantId: string;
  items: readonly Readonly<{
    dishId: string;
    quantity: number;
    options?: readonly Readonly<{ optionId: string; choiceIds: readonly string[] }>[];
  }>[];
}>;

export type CreateOrderResult =
  | Readonly<{ kind: "success"; orderId: string }>
  | Readonly<{ kind: "business-error"; message: string }>
  | Readonly<{ kind: "network-error"; message: string }>
  | Readonly<{ kind: "timeout"; message: string }>;

export interface OrderCommandRepository {
  create(payload: CreateOrderPayload): Promise<CreateOrderResult>;
}

export type CheckoutSubmitResult =
  | Readonly<{ kind: "success"; orderId: string; reconciled: boolean }>
  | Readonly<{ kind: "empty-cart" }>
  | Readonly<{ kind: "cart-changed" }>
  | Readonly<{ kind: "error"; message: string }>
  | Readonly<{ kind: "timeout-unresolved"; message: string }>;
