export const ORDER_STATUSES = ["PENDING", "COOKING", "WAITING", "PICKED", "DELIVERED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderRole = "CUSTOMER" | "OWNER" | "COURIER";

export type OrderItemOptionChoice = Readonly<{
  choiceId: string;
  name: string;
  extraMinor: number;
}>;

export type OrderItemOption = Readonly<{
  optionId: string;
  name: string;
  choices: readonly OrderItemOptionChoice[];
}>;

export type OrderItem = Readonly<{
  id: string;
  position: number;
  dishId: string;
  dishName: string;
  quantity: number;
  selectedOptions: readonly OrderItemOption[];
  lineTotalMinor: number;
}>;

export type RestaurantSummary = Readonly<{
  id: string;
  name: string;
  address: string;
  image: string | null;
}>;

export type Order = Readonly<{
  id: string;
  customerId: string;
  courierId: string | null;
  restaurantId: string;
  restaurant: RestaurantSummary | null;
  status: OrderStatus;
  totalMinor: number;
  createdAt: string;
  updatedAt: string;
  items: readonly OrderItem[];
}>;

export type OrderRealtimeEvent = Omit<Order, "restaurant" | "items"> &
  Readonly<{
    restaurant?: RestaurantSummary | null;
    items?: readonly OrderItem[] | null;
  }>;

export type OrderDetailResult =
  | Readonly<{ kind: "found"; order: Order }>
  | Readonly<{ kind: "not-found" }>;

export type OrdersDiagnostic = (
  message: string,
  details?: Readonly<Record<string, unknown>>,
) => void;
