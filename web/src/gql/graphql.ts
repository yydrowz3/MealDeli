/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type CategoryInput = {
  page?: number;
  slug: string;
};

export type CreateDishChoiceInput = {
  extraMinor: number;
  name: string;
};

export type CreateDishInput = {
  description: string;
  image?: string | null | undefined;
  name: string;
  options?: Array<CreateDishOptionInput> | null | undefined;
  priceMinor: number;
  restaurantId: string;
};

export type CreateDishOptionInput = {
  choices: Array<CreateDishChoiceInput>;
  maxSelections: number;
  minSelections: number;
  name: string;
};

export type CreateOrderInput = {
  items: Array<CreateOrderItemInput>;
  restaurantId: string;
};

export type CreateOrderItemInput = {
  dishId: string;
  options?: Array<CreateOrderItemOptionInput> | null | undefined;
  quantity: number;
};

export type CreateOrderItemOptionInput = {
  choiceIds: Array<string>;
  optionId: string;
};

export type CreatePaymentInput = {
  restaurantId: string;
  transactionId: string;
};

export type CreateRestaurantInput = {
  address: string;
  categoryId: string;
  image?: string | null | undefined;
  name: string;
};

export type DeleteDishInput = {
  dishId: string;
};

export type DeleteRestaurantInput = {
  restaurantId: string;
};

export type EditDishChoiceInput = {
  extraMinor: number;
  id?: string | null | undefined;
  name: string;
};

export type EditDishInput = {
  description?: string | null | undefined;
  dishId: string;
  image?: string | null | undefined;
  name?: string | null | undefined;
  options?: Array<EditDishOptionInput> | null | undefined;
  priceMinor?: number | null | undefined;
};

export type EditDishOptionInput = {
  choices: Array<EditDishChoiceInput>;
  id?: string | null | undefined;
  maxSelections: number;
  minSelections: number;
  name: string;
};

export type EditOrderInput = {
  id: string;
  status: OrderStatus;
};

export type EditProfileInput = {
  address?: string | null | undefined;
  email?: string | null | undefined;
  image?: string | null | undefined;
  name?: string | null | undefined;
  password?: string | null | undefined;
};

export type EditRestaurantInput = {
  address?: string | null | undefined;
  image?: string | null | undefined;
  name?: string | null | undefined;
  restaurantId: string;
};

export type GetOrderInput = {
  id: string;
};

export type GetOrdersInput = {
  status?: OrderStatus | null | undefined;
};

export type MyRestaurantInput = {
  id: string;
};

export type OrderStatus = "COOKING" | "DELIVERED" | "PENDING" | "PICKED" | "WAITING";

export type OrderUpdatesInput = {
  id: string;
};

export type ResendVerificationInput = {
  email: string;
};

export type RestaurantInput = {
  restaurantId: string;
};

export type RestaurantsInput = {
  page?: number;
};

export type SearchRestaurantInput = {
  page?: number;
  query: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  email: string;
  name: string;
  password: string;
  role?: UserRole | null | undefined;
};

export type TakeOrderInput = {
  id: string;
};

export type UserRole = "COURIER" | "CUSTOMER" | "OWNER";

export type VerifyEmailInput = {
  token: string;
};

export type CatalogCategorySummaryFragment = {
  __typename: "Category";
  id: string;
  name: string;
  slug: string;
  image: string | null;
  restaurantCount: number | null;
} & { " $fragmentName"?: "CatalogCategorySummaryFragment" };

export type CatalogRestaurantCardFragment = {
  __typename: "Restaurant";
  id: string;
  name: string;
  address: string;
  image: string | null;
  promotedUntil: unknown;
  categoryId: string;
  category: { __typename: "Category"; id: string; name: string; slug: string } | null;
} & { " $fragmentName"?: "CatalogRestaurantCardFragment" };

export type CatalogDishOptionFragment = {
  __typename: "DishOption";
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  choices: Array<{ __typename: "DishChoice"; id: string; name: string; extraMinor: number }>;
} & { " $fragmentName"?: "CatalogDishOptionFragment" };

export type CatalogDishFragment = {
  __typename: "Dish";
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  priceMinor: number;
  image: string | null;
  options: Array<
    { __typename: "DishOption" } & {
      " $fragmentRefs"?: { CatalogDishOptionFragment: CatalogDishOptionFragment };
    }
  >;
} & { " $fragmentName"?: "CatalogDishFragment" };

export type CatalogRestaurantDetailFragment = ({
  __typename: "Restaurant";
  dishes: Array<
    { __typename: "Dish" } & { " $fragmentRefs"?: { CatalogDishFragment: CatalogDishFragment } }
  > | null;
} & { " $fragmentRefs"?: { CatalogRestaurantCardFragment: CatalogRestaurantCardFragment } }) & {
  " $fragmentName"?: "CatalogRestaurantDetailFragment";
};

export type CatalogAllCategoriesQueryVariables = Exact<{ [key: string]: never }>;

export type CatalogAllCategoriesQuery = {
  allCategory: {
    __typename: "AllCategoriesOutput";
    ok: boolean;
    error: string | null;
    categories: Array<
      { __typename: "Category" } & {
        " $fragmentRefs"?: { CatalogCategorySummaryFragment: CatalogCategorySummaryFragment };
      }
    > | null;
  };
};

export type CatalogRestaurantsQueryVariables = Exact<{
  input: RestaurantsInput;
}>;

export type CatalogRestaurantsQuery = {
  restaurants: {
    __typename: "RestaurantsOutput";
    ok: boolean;
    error: string | null;
    totalPages: number | null;
    totalResults: number | null;
    restaurants: Array<
      { __typename: "Restaurant" } & {
        " $fragmentRefs"?: { CatalogRestaurantCardFragment: CatalogRestaurantCardFragment };
      }
    > | null;
  };
};

export type CatalogCategoryQueryVariables = Exact<{
  input: CategoryInput;
}>;

export type CatalogCategoryQuery = {
  category: {
    __typename: "CategoryOutput";
    ok: boolean;
    error: string | null;
    totalPages: number | null;
    totalResults: number | null;
    restaurants: Array<
      { __typename: "Restaurant" } & {
        " $fragmentRefs"?: { CatalogRestaurantCardFragment: CatalogRestaurantCardFragment };
      }
    > | null;
  };
};

export type CatalogSearchRestaurantsQueryVariables = Exact<{
  input: SearchRestaurantInput;
}>;

export type CatalogSearchRestaurantsQuery = {
  searchRestaurant: {
    __typename: "SearchRestaurantOutput";
    ok: boolean;
    error: string | null;
    totalPages: number | null;
    totalResults: number | null;
    restaurants: Array<
      { __typename: "Restaurant" } & {
        " $fragmentRefs"?: { CatalogRestaurantCardFragment: CatalogRestaurantCardFragment };
      }
    > | null;
  };
};

export type CatalogRestaurantQueryVariables = Exact<{
  input: RestaurantInput;
}>;

export type CatalogRestaurantQuery = {
  restaurant: {
    __typename: "RestaurantOutput";
    ok: boolean;
    error: string | null;
    restaurant:
      | ({ __typename: "Restaurant" } & {
          " $fragmentRefs"?: { CatalogRestaurantDetailFragment: CatalogRestaurantDetailFragment };
        })
      | null;
  };
};

export type CheckoutCreateOrderMutationVariables = Exact<{
  input: CreateOrderInput;
}>;

export type CheckoutCreateOrderMutation = {
  createOrder: {
    __typename: "CreateOrderOutput";
    ok: boolean;
    error: string | null;
    orderId: string | null;
  };
};

export type CourierOrderFragment = {
  __typename: "Order";
  id: string;
  customerId: string;
  courierId: string | null;
  restaurantId: string;
  status: OrderStatus;
  totalMinor: number;
  createdAt: unknown;
  updatedAt: unknown;
  restaurant: {
    __typename: "Restaurant";
    id: string;
    name: string;
    address: string;
    image: string | null;
  } | null;
  items: Array<{
    __typename: "OrderItem";
    id: string;
    position: number;
    dishId: string;
    dishName: string;
    quantity: number;
    lineTotalMinor: number;
    selectedOptions: Array<{
      __typename: "OrderItemOption";
      optionId: string;
      name: string;
      choices: Array<{
        __typename: "OrderItemOptionChoice";
        choiceId: string;
        name: string;
        extraMinor: number;
      }>;
    }>;
  }> | null;
} & { " $fragmentName"?: "CourierOrderFragment" };

export type CourierAvailableOrdersQueryVariables = Exact<{ [key: string]: never }>;

export type CourierAvailableOrdersQuery = {
  availableOrders: {
    __typename: "GetOrdersOutput";
    ok: boolean;
    error: string | null;
    orders: Array<
      { __typename: "Order" } & {
        " $fragmentRefs"?: { CourierOrderFragment: CourierOrderFragment };
      }
    > | null;
  };
};

export type CourierTakeOrderMutationVariables = Exact<{
  input: TakeOrderInput;
}>;

export type CourierTakeOrderMutation = {
  takeOrder: { __typename: "TakeOrderOutput"; ok: boolean; error: string | null };
};

export type IdentitySessionUserFragment = {
  __typename: "User";
  id: string;
  email: string;
  name: string;
  role: UserRole;
  verifiedAt: unknown;
  address: string | null;
  image: string | null;
} & { " $fragmentName"?: "IdentitySessionUserFragment" };

export type IdentitySignInMutationVariables = Exact<{
  input: SignInInput;
}>;

export type IdentitySignInMutation = {
  signIn: {
    __typename: "SignInOutput";
    ok: boolean;
    error: string | null;
    accessToken: string | null;
  };
};

export type IdentitySignUpMutationVariables = Exact<{
  input: SignUpInput;
}>;

export type IdentitySignUpMutation = {
  signUp: { __typename: "SignUpOutput"; ok: boolean; error: string | null };
};

export type IdentitySignOutMutationVariables = Exact<{ [key: string]: never }>;

export type IdentitySignOutMutation = {
  signOut: { __typename: "SignOutOutput"; ok: boolean; error: string | null };
};

export type IdentityRefreshAccessTokenMutationVariables = Exact<{ [key: string]: never }>;

export type IdentityRefreshAccessTokenMutation = {
  refreshAccessToken: {
    __typename: "RefreshAccessTokenOutput";
    ok: boolean;
    error: string | null;
    accessToken: string | null;
  };
};

export type IdentityMeQueryVariables = Exact<{ [key: string]: never }>;

export type IdentityMeQuery = {
  me: { __typename: "User" } & {
    " $fragmentRefs"?: { IdentitySessionUserFragment: IdentitySessionUserFragment };
  };
};

export type IdentityVerifyEmailMutationVariables = Exact<{
  input: VerifyEmailInput;
}>;

export type IdentityVerifyEmailMutation = {
  verifyEmail: { __typename: "VerifyEmailOutput"; ok: boolean; error: string | null };
};

export type IdentityResendVerificationMutationVariables = Exact<{
  input: ResendVerificationInput;
}>;

export type IdentityResendVerificationMutation = {
  resendVerification: { __typename: "ResendVerificationOutput"; ok: boolean; error: string | null };
};

export type IdentityEditProfileMutationVariables = Exact<{
  input: EditProfileInput;
}>;

export type IdentityEditProfileMutation = {
  editProfile: { __typename: "EditProfileOutput"; ok: boolean; error: string | null };
};

export type OrdersRestaurantFragment = {
  __typename: "Restaurant";
  id: string;
  name: string;
  address: string;
  image: string | null;
} & { " $fragmentName"?: "OrdersRestaurantFragment" };

export type OrdersItemFragment = {
  __typename: "OrderItem";
  id: string;
  position: number;
  dishId: string;
  dishName: string;
  quantity: number;
  lineTotalMinor: number;
  selectedOptions: Array<{
    __typename: "OrderItemOption";
    optionId: string;
    name: string;
    choices: Array<{
      __typename: "OrderItemOptionChoice";
      choiceId: string;
      name: string;
      extraMinor: number;
    }>;
  }>;
} & { " $fragmentName"?: "OrdersItemFragment" };

export type OrdersSummaryFragment = {
  __typename: "Order";
  id: string;
  customerId: string;
  courierId: string | null;
  restaurantId: string;
  status: OrderStatus;
  totalMinor: number;
  createdAt: unknown;
  updatedAt: unknown;
  restaurant:
    | ({ __typename: "Restaurant" } & {
        " $fragmentRefs"?: { OrdersRestaurantFragment: OrdersRestaurantFragment };
      })
    | null;
  items: Array<
    { __typename: "OrderItem" } & { " $fragmentRefs"?: { OrdersItemFragment: OrdersItemFragment } }
  > | null;
} & { " $fragmentName"?: "OrdersSummaryFragment" };

export type OrdersDetailFragment = ({ __typename: "Order" } & {
  " $fragmentRefs"?: { OrdersSummaryFragment: OrdersSummaryFragment };
}) & { " $fragmentName"?: "OrdersDetailFragment" };

export type OrdersGetOrdersQueryVariables = Exact<{
  input: GetOrdersInput;
}>;

export type OrdersGetOrdersQuery = {
  getOrders: {
    __typename: "GetOrdersOutput";
    ok: boolean;
    error: string | null;
    orders: Array<
      { __typename: "Order" } & {
        " $fragmentRefs"?: { OrdersSummaryFragment: OrdersSummaryFragment };
      }
    > | null;
  };
};

export type OrdersGetOrderQueryVariables = Exact<{
  input: GetOrderInput;
}>;

export type OrdersGetOrderQuery = {
  getOrder: {
    __typename: "GetOrderOutput";
    ok: boolean;
    error: string | null;
    order:
      | ({ __typename: "Order" } & {
          " $fragmentRefs"?: { OrdersDetailFragment: OrdersDetailFragment };
        })
      | null;
  };
};

export type OrdersEditOrderMutationVariables = Exact<{
  input: EditOrderInput;
}>;

export type OrdersEditOrderMutation = {
  editOrder: { __typename: "EditOrderOutput"; ok: boolean; error: string | null };
};

export type OrdersOrderUpdatesSubscriptionVariables = Exact<{
  input: OrderUpdatesInput;
}>;

export type OrdersOrderUpdatesSubscription = {
  orderUpdates: { __typename: "Order" } & {
    " $fragmentRefs"?: { OrdersDetailFragment: OrdersDetailFragment };
  };
};

export type OrdersPendingOrdersSubscriptionVariables = Exact<{ [key: string]: never }>;

export type OrdersPendingOrdersSubscription = {
  pendingOrders: { __typename: "Order" } & {
    " $fragmentRefs"?: { OrdersDetailFragment: OrdersDetailFragment };
  };
};

export type OrdersCookedOrdersSubscriptionVariables = Exact<{ [key: string]: never }>;

export type OrdersCookedOrdersSubscription = {
  cookedOrders: { __typename: "Order" } & {
    " $fragmentRefs"?: { OrdersDetailFragment: OrdersDetailFragment };
  };
};

export type OwnerInsightsPromotionRestaurantFragment = {
  __typename: "Restaurant";
  id: string;
  name: string;
  promotedUntil: unknown;
} & { " $fragmentName"?: "OwnerInsightsPromotionRestaurantFragment" };

export type OwnerInsightsPromotionRestaurantQueryVariables = Exact<{
  input: MyRestaurantInput;
}>;

export type OwnerInsightsPromotionRestaurantQuery = {
  myRestaurant: {
    __typename: "MyRestaurantOutput";
    ok: boolean;
    error: string | null;
    restaurant:
      | ({ __typename: "Restaurant" } & {
          " $fragmentRefs"?: {
            OwnerInsightsPromotionRestaurantFragment: OwnerInsightsPromotionRestaurantFragment;
          };
        })
      | null;
  };
};

export type OwnerInsightsPromotionHistoryQueryVariables = Exact<{ [key: string]: never }>;

export type OwnerInsightsPromotionHistoryQuery = {
  getPayments: {
    __typename: "GetPaymentsOutput";
    ok: boolean;
    error: string | null;
    payments: Array<{
      __typename: "Payment";
      id: string;
      transactionId: string;
      ownerId: string;
      restaurantId: string;
      createdAt: unknown;
      updatedAt: unknown;
    }> | null;
  };
  myRestaurants: {
    __typename: "MyRestaurantsOutput";
    ok: boolean;
    error: string | null;
    restaurants: Array<{ __typename: "Restaurant"; id: string; name: string }> | null;
  };
};

export type OwnerInsightsCreatePromotionMutationVariables = Exact<{
  input: CreatePaymentInput;
}>;

export type OwnerInsightsCreatePromotionMutation = {
  createPayment: { __typename: "CreatePaymentOutput"; ok: boolean; error: string | null };
};

export type OwnerManagementDishOptionFragment = {
  __typename: "DishOption";
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  choices: Array<{ __typename: "DishChoice"; id: string; name: string; extraMinor: number }>;
} & { " $fragmentName"?: "OwnerManagementDishOptionFragment" };

export type OwnerManagementDishFragment = {
  __typename: "Dish";
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  priceMinor: number;
  image: string | null;
  createdAt: unknown;
  updatedAt: unknown;
  options: Array<
    { __typename: "DishOption" } & {
      " $fragmentRefs"?: { OwnerManagementDishOptionFragment: OwnerManagementDishOptionFragment };
    }
  >;
} & { " $fragmentName"?: "OwnerManagementDishFragment" };

export type OwnerManagementRestaurantFragment = {
  __typename: "Restaurant";
  id: string;
  name: string;
  address: string;
  image: string | null;
  promotedUntil: unknown;
  categoryId: string;
  createdAt: unknown;
  updatedAt: unknown;
  category: { __typename: "Category"; id: string; name: string; slug: string } | null;
  dishes: Array<
    { __typename: "Dish" } & {
      " $fragmentRefs"?: { OwnerManagementDishFragment: OwnerManagementDishFragment };
    }
  > | null;
} & { " $fragmentName"?: "OwnerManagementRestaurantFragment" };

export type OwnerManagementMyRestaurantsQueryVariables = Exact<{ [key: string]: never }>;

export type OwnerManagementMyRestaurantsQuery = {
  myRestaurants: {
    __typename: "MyRestaurantsOutput";
    ok: boolean;
    error: string | null;
    restaurants: Array<
      { __typename: "Restaurant" } & {
        " $fragmentRefs"?: { OwnerManagementRestaurantFragment: OwnerManagementRestaurantFragment };
      }
    > | null;
  };
};

export type OwnerManagementMyRestaurantQueryVariables = Exact<{
  input: MyRestaurantInput;
}>;

export type OwnerManagementMyRestaurantQuery = {
  myRestaurant: {
    __typename: "MyRestaurantOutput";
    ok: boolean;
    error: string | null;
    restaurant:
      | ({ __typename: "Restaurant" } & {
          " $fragmentRefs"?: {
            OwnerManagementRestaurantFragment: OwnerManagementRestaurantFragment;
          };
        })
      | null;
  };
};

export type OwnerManagementCreateRestaurantMutationVariables = Exact<{
  input: CreateRestaurantInput;
}>;

export type OwnerManagementCreateRestaurantMutation = {
  createRestaurant: {
    __typename: "CreateRestaurantOutput";
    ok: boolean;
    error: string | null;
    restaurantId: string | null;
  };
};

export type OwnerManagementEditRestaurantMutationVariables = Exact<{
  input: EditRestaurantInput;
}>;

export type OwnerManagementEditRestaurantMutation = {
  editRestaurant: { __typename: "EditRestaurantOutput"; ok: boolean; error: string | null };
};

export type OwnerManagementDeleteRestaurantMutationVariables = Exact<{
  input: DeleteRestaurantInput;
}>;

export type OwnerManagementDeleteRestaurantMutation = {
  deleteRestaurant: { __typename: "DeleteRestaurantOutput"; ok: boolean; error: string | null };
};

export type OwnerManagementCreateDishMutationVariables = Exact<{
  input: CreateDishInput;
}>;

export type OwnerManagementCreateDishMutation = {
  createDish: { __typename: "CreateDishOutput"; ok: boolean; error: string | null };
};

export type OwnerManagementEditDishMutationVariables = Exact<{
  input: EditDishInput;
}>;

export type OwnerManagementEditDishMutation = {
  editDish: { __typename: "EditDishOutput"; ok: boolean; error: string | null };
};

export type OwnerManagementDeleteDishMutationVariables = Exact<{
  input: DeleteDishInput;
}>;

export type OwnerManagementDeleteDishMutation = {
  deleteDish: { __typename: "DeleteDishOutput"; ok: boolean; error: string | null };
};

export const CatalogCategorySummaryFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogCategorySummary" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Category" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "slug" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantCount" } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogCategorySummaryFragment, unknown>;
export const CatalogRestaurantCardFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogRestaurantCard" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
          { kind: "Field", name: { kind: "Name", value: "categoryId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "category" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "slug" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogRestaurantCardFragment, unknown>;
export const CatalogDishOptionFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogDishOption" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "DishOption" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "minSelections" } },
          { kind: "Field", name: { kind: "Name", value: "maxSelections" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "choices" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogDishOptionFragment, unknown>;
export const CatalogDishFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogDish" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Dish" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "priceMinor" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "options" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "CatalogDishOption" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogDishOption" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "DishOption" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "minSelections" } },
          { kind: "Field", name: { kind: "Name", value: "maxSelections" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "choices" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogDishFragment, unknown>;
export const CatalogRestaurantDetailFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogRestaurantDetail" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "FragmentSpread", name: { kind: "Name", value: "CatalogRestaurantCard" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "dishes" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "CatalogDish" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogDishOption" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "DishOption" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "minSelections" } },
          { kind: "Field", name: { kind: "Name", value: "maxSelections" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "choices" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogRestaurantCard" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
          { kind: "Field", name: { kind: "Name", value: "categoryId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "category" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "slug" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogDish" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Dish" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "priceMinor" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "options" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "CatalogDishOption" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogRestaurantDetailFragment, unknown>;
export const CourierOrderFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CourierOrder" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "customerId" } },
          { kind: "Field", name: { kind: "Name", value: "courierId" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          { kind: "Field", name: { kind: "Name", value: "status" } },
          { kind: "Field", name: { kind: "Name", value: "totalMinor" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurant" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "address" } },
                { kind: "Field", name: { kind: "Name", value: "image" } },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "items" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "position" } },
                { kind: "Field", name: { kind: "Name", value: "dishId" } },
                { kind: "Field", name: { kind: "Name", value: "dishName" } },
                { kind: "Field", name: { kind: "Name", value: "quantity" } },
                { kind: "Field", name: { kind: "Name", value: "lineTotalMinor" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "selectedOptions" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "optionId" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "choices" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "choiceId" } },
                            { kind: "Field", name: { kind: "Name", value: "name" } },
                            { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CourierOrderFragment, unknown>;
export const IdentitySessionUserFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "IdentitySessionUser" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "User" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "email" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "role" } },
          { kind: "Field", name: { kind: "Name", value: "verifiedAt" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<IdentitySessionUserFragment, unknown>;
export const OrdersRestaurantFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<OrdersRestaurantFragment, unknown>;
export const OrdersItemFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersItem" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "OrderItem" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "position" } },
          { kind: "Field", name: { kind: "Name", value: "dishId" } },
          { kind: "Field", name: { kind: "Name", value: "dishName" } },
          { kind: "Field", name: { kind: "Name", value: "quantity" } },
          { kind: "Field", name: { kind: "Name", value: "lineTotalMinor" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "selectedOptions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "optionId" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "choices" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "choiceId" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<OrdersItemFragment, unknown>;
export const OrdersSummaryFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersSummary" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "customerId" } },
          { kind: "Field", name: { kind: "Name", value: "courierId" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurant" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersRestaurant" } },
              ],
            },
          },
          { kind: "Field", name: { kind: "Name", value: "status" } },
          { kind: "Field", name: { kind: "Name", value: "totalMinor" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "items" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersItem" } }],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersItem" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "OrderItem" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "position" } },
          { kind: "Field", name: { kind: "Name", value: "dishId" } },
          { kind: "Field", name: { kind: "Name", value: "dishName" } },
          { kind: "Field", name: { kind: "Name", value: "quantity" } },
          { kind: "Field", name: { kind: "Name", value: "lineTotalMinor" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "selectedOptions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "optionId" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "choices" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "choiceId" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<OrdersSummaryFragment, unknown>;
export const OrdersDetailFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersDetail" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersSummary" } }],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersItem" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "OrderItem" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "position" } },
          { kind: "Field", name: { kind: "Name", value: "dishId" } },
          { kind: "Field", name: { kind: "Name", value: "dishName" } },
          { kind: "Field", name: { kind: "Name", value: "quantity" } },
          { kind: "Field", name: { kind: "Name", value: "lineTotalMinor" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "selectedOptions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "optionId" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "choices" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "choiceId" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersSummary" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "customerId" } },
          { kind: "Field", name: { kind: "Name", value: "courierId" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurant" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersRestaurant" } },
              ],
            },
          },
          { kind: "Field", name: { kind: "Name", value: "status" } },
          { kind: "Field", name: { kind: "Name", value: "totalMinor" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "items" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersItem" } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<OrdersDetailFragment, unknown>;
export const OwnerInsightsPromotionRestaurantFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerInsightsPromotionRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<OwnerInsightsPromotionRestaurantFragment, unknown>;
export const OwnerManagementDishOptionFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementDishOption" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "DishOption" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "minSelections" } },
          { kind: "Field", name: { kind: "Name", value: "maxSelections" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "choices" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<OwnerManagementDishOptionFragment, unknown>;
export const OwnerManagementDishFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementDish" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Dish" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "priceMinor" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "options" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "FragmentSpread",
                  name: { kind: "Name", value: "OwnerManagementDishOption" },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementDishOption" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "DishOption" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "minSelections" } },
          { kind: "Field", name: { kind: "Name", value: "maxSelections" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "choices" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<OwnerManagementDishFragment, unknown>;
export const OwnerManagementRestaurantFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
          { kind: "Field", name: { kind: "Name", value: "categoryId" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "category" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "slug" } },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "dishes" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OwnerManagementDish" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementDishOption" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "DishOption" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "minSelections" } },
          { kind: "Field", name: { kind: "Name", value: "maxSelections" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "choices" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementDish" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Dish" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "priceMinor" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "options" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "FragmentSpread",
                  name: { kind: "Name", value: "OwnerManagementDishOption" },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<OwnerManagementRestaurantFragment, unknown>;
export const CatalogAllCategoriesDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "CatalogAllCategories" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "allCategory" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "categories" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "FragmentSpread",
                        name: { kind: "Name", value: "CatalogCategorySummary" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogCategorySummary" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Category" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "slug" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantCount" } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogAllCategoriesQuery, CatalogAllCategoriesQueryVariables>;
export const CatalogRestaurantsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "CatalogRestaurants" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "RestaurantsInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurants" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                { kind: "Field", name: { kind: "Name", value: "totalPages" } },
                { kind: "Field", name: { kind: "Name", value: "totalResults" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "restaurants" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "FragmentSpread",
                        name: { kind: "Name", value: "CatalogRestaurantCard" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogRestaurantCard" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
          { kind: "Field", name: { kind: "Name", value: "categoryId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "category" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "slug" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogRestaurantsQuery, CatalogRestaurantsQueryVariables>;
export const CatalogCategoryDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "CatalogCategory" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CategoryInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "category" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                { kind: "Field", name: { kind: "Name", value: "totalPages" } },
                { kind: "Field", name: { kind: "Name", value: "totalResults" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "restaurants" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "FragmentSpread",
                        name: { kind: "Name", value: "CatalogRestaurantCard" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogRestaurantCard" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
          { kind: "Field", name: { kind: "Name", value: "categoryId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "category" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "slug" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogCategoryQuery, CatalogCategoryQueryVariables>;
export const CatalogSearchRestaurantsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "CatalogSearchRestaurants" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "SearchRestaurantInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "searchRestaurant" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                { kind: "Field", name: { kind: "Name", value: "totalPages" } },
                { kind: "Field", name: { kind: "Name", value: "totalResults" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "restaurants" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "FragmentSpread",
                        name: { kind: "Name", value: "CatalogRestaurantCard" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogRestaurantCard" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
          { kind: "Field", name: { kind: "Name", value: "categoryId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "category" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "slug" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogSearchRestaurantsQuery, CatalogSearchRestaurantsQueryVariables>;
export const CatalogRestaurantDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "CatalogRestaurant" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "RestaurantInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurant" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "restaurant" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "FragmentSpread",
                        name: { kind: "Name", value: "CatalogRestaurantDetail" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogRestaurantCard" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
          { kind: "Field", name: { kind: "Name", value: "categoryId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "category" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "slug" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogDishOption" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "DishOption" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "minSelections" } },
          { kind: "Field", name: { kind: "Name", value: "maxSelections" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "choices" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogDish" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Dish" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "priceMinor" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "options" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "CatalogDishOption" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CatalogRestaurantDetail" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "FragmentSpread", name: { kind: "Name", value: "CatalogRestaurantCard" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "dishes" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "CatalogDish" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogRestaurantQuery, CatalogRestaurantQueryVariables>;
export const CheckoutCreateOrderDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CheckoutCreateOrder" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CreateOrderInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createOrder" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                { kind: "Field", name: { kind: "Name", value: "orderId" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CheckoutCreateOrderMutation, CheckoutCreateOrderMutationVariables>;
export const CourierAvailableOrdersDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "CourierAvailableOrders" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "availableOrders" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "orders" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "FragmentSpread", name: { kind: "Name", value: "CourierOrder" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "CourierOrder" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "customerId" } },
          { kind: "Field", name: { kind: "Name", value: "courierId" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          { kind: "Field", name: { kind: "Name", value: "status" } },
          { kind: "Field", name: { kind: "Name", value: "totalMinor" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurant" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "address" } },
                { kind: "Field", name: { kind: "Name", value: "image" } },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "items" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "position" } },
                { kind: "Field", name: { kind: "Name", value: "dishId" } },
                { kind: "Field", name: { kind: "Name", value: "dishName" } },
                { kind: "Field", name: { kind: "Name", value: "quantity" } },
                { kind: "Field", name: { kind: "Name", value: "lineTotalMinor" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "selectedOptions" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "optionId" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "choices" },
                        selectionSet: {
                          kind: "SelectionSet",
                          selections: [
                            { kind: "Field", name: { kind: "Name", value: "choiceId" } },
                            { kind: "Field", name: { kind: "Name", value: "name" } },
                            { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CourierAvailableOrdersQuery, CourierAvailableOrdersQueryVariables>;
export const CourierTakeOrderDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CourierTakeOrder" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "TakeOrderInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "takeOrder" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CourierTakeOrderMutation, CourierTakeOrderMutationVariables>;
export const IdentitySignInDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "IdentitySignIn" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "SignInInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "signIn" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                { kind: "Field", name: { kind: "Name", value: "accessToken" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<IdentitySignInMutation, IdentitySignInMutationVariables>;
export const IdentitySignUpDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "IdentitySignUp" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "SignUpInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "signUp" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<IdentitySignUpMutation, IdentitySignUpMutationVariables>;
export const IdentitySignOutDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "IdentitySignOut" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "signOut" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<IdentitySignOutMutation, IdentitySignOutMutationVariables>;
export const IdentityRefreshAccessTokenDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "IdentityRefreshAccessToken" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "refreshAccessToken" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                { kind: "Field", name: { kind: "Name", value: "accessToken" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  IdentityRefreshAccessTokenMutation,
  IdentityRefreshAccessTokenMutationVariables
>;
export const IdentityMeDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "IdentityMe" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "me" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "IdentitySessionUser" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "IdentitySessionUser" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "User" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "email" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "role" } },
          { kind: "Field", name: { kind: "Name", value: "verifiedAt" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<IdentityMeQuery, IdentityMeQueryVariables>;
export const IdentityVerifyEmailDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "IdentityVerifyEmail" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "VerifyEmailInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "verifyEmail" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<IdentityVerifyEmailMutation, IdentityVerifyEmailMutationVariables>;
export const IdentityResendVerificationDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "IdentityResendVerification" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ResendVerificationInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "resendVerification" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  IdentityResendVerificationMutation,
  IdentityResendVerificationMutationVariables
>;
export const IdentityEditProfileDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "IdentityEditProfile" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "EditProfileInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "editProfile" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<IdentityEditProfileMutation, IdentityEditProfileMutationVariables>;
export const OrdersGetOrdersDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "OrdersGetOrders" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "GetOrdersInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "getOrders" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "orders" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersSummary" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersItem" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "OrderItem" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "position" } },
          { kind: "Field", name: { kind: "Name", value: "dishId" } },
          { kind: "Field", name: { kind: "Name", value: "dishName" } },
          { kind: "Field", name: { kind: "Name", value: "quantity" } },
          { kind: "Field", name: { kind: "Name", value: "lineTotalMinor" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "selectedOptions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "optionId" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "choices" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "choiceId" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersSummary" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "customerId" } },
          { kind: "Field", name: { kind: "Name", value: "courierId" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurant" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersRestaurant" } },
              ],
            },
          },
          { kind: "Field", name: { kind: "Name", value: "status" } },
          { kind: "Field", name: { kind: "Name", value: "totalMinor" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "items" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersItem" } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<OrdersGetOrdersQuery, OrdersGetOrdersQueryVariables>;
export const OrdersGetOrderDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "OrdersGetOrder" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "GetOrderInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "getOrder" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "order" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersDetail" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersItem" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "OrderItem" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "position" } },
          { kind: "Field", name: { kind: "Name", value: "dishId" } },
          { kind: "Field", name: { kind: "Name", value: "dishName" } },
          { kind: "Field", name: { kind: "Name", value: "quantity" } },
          { kind: "Field", name: { kind: "Name", value: "lineTotalMinor" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "selectedOptions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "optionId" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "choices" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "choiceId" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersSummary" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "customerId" } },
          { kind: "Field", name: { kind: "Name", value: "courierId" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurant" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersRestaurant" } },
              ],
            },
          },
          { kind: "Field", name: { kind: "Name", value: "status" } },
          { kind: "Field", name: { kind: "Name", value: "totalMinor" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "items" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersItem" } }],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersDetail" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersSummary" } }],
      },
    },
  ],
} as unknown as DocumentNode<OrdersGetOrderQuery, OrdersGetOrderQueryVariables>;
export const OrdersEditOrderDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "OrdersEditOrder" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "EditOrderInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "editOrder" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<OrdersEditOrderMutation, OrdersEditOrderMutationVariables>;
export const OrdersOrderUpdatesDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "subscription",
      name: { kind: "Name", value: "OrdersOrderUpdates" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "OrderUpdatesInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "orderUpdates" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersDetail" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersItem" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "OrderItem" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "position" } },
          { kind: "Field", name: { kind: "Name", value: "dishId" } },
          { kind: "Field", name: { kind: "Name", value: "dishName" } },
          { kind: "Field", name: { kind: "Name", value: "quantity" } },
          { kind: "Field", name: { kind: "Name", value: "lineTotalMinor" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "selectedOptions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "optionId" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "choices" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "choiceId" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersSummary" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "customerId" } },
          { kind: "Field", name: { kind: "Name", value: "courierId" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurant" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersRestaurant" } },
              ],
            },
          },
          { kind: "Field", name: { kind: "Name", value: "status" } },
          { kind: "Field", name: { kind: "Name", value: "totalMinor" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "items" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersItem" } }],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersDetail" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersSummary" } }],
      },
    },
  ],
} as unknown as DocumentNode<
  OrdersOrderUpdatesSubscription,
  OrdersOrderUpdatesSubscriptionVariables
>;
export const OrdersPendingOrdersDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "subscription",
      name: { kind: "Name", value: "OrdersPendingOrders" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "pendingOrders" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersDetail" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersItem" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "OrderItem" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "position" } },
          { kind: "Field", name: { kind: "Name", value: "dishId" } },
          { kind: "Field", name: { kind: "Name", value: "dishName" } },
          { kind: "Field", name: { kind: "Name", value: "quantity" } },
          { kind: "Field", name: { kind: "Name", value: "lineTotalMinor" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "selectedOptions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "optionId" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "choices" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "choiceId" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersSummary" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "customerId" } },
          { kind: "Field", name: { kind: "Name", value: "courierId" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurant" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersRestaurant" } },
              ],
            },
          },
          { kind: "Field", name: { kind: "Name", value: "status" } },
          { kind: "Field", name: { kind: "Name", value: "totalMinor" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "items" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersItem" } }],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersDetail" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersSummary" } }],
      },
    },
  ],
} as unknown as DocumentNode<
  OrdersPendingOrdersSubscription,
  OrdersPendingOrdersSubscriptionVariables
>;
export const OrdersCookedOrdersDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "subscription",
      name: { kind: "Name", value: "OrdersCookedOrders" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "cookedOrders" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersDetail" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersItem" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "OrderItem" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "position" } },
          { kind: "Field", name: { kind: "Name", value: "dishId" } },
          { kind: "Field", name: { kind: "Name", value: "dishName" } },
          { kind: "Field", name: { kind: "Name", value: "quantity" } },
          { kind: "Field", name: { kind: "Name", value: "lineTotalMinor" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "selectedOptions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "optionId" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "choices" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "choiceId" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersSummary" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "customerId" } },
          { kind: "Field", name: { kind: "Name", value: "courierId" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "restaurant" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OrdersRestaurant" } },
              ],
            },
          },
          { kind: "Field", name: { kind: "Name", value: "status" } },
          { kind: "Field", name: { kind: "Name", value: "totalMinor" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "items" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersItem" } }],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OrdersDetail" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Order" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [{ kind: "FragmentSpread", name: { kind: "Name", value: "OrdersSummary" } }],
      },
    },
  ],
} as unknown as DocumentNode<
  OrdersCookedOrdersSubscription,
  OrdersCookedOrdersSubscriptionVariables
>;
export const OwnerInsightsPromotionRestaurantDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "OwnerInsightsPromotionRestaurant" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "MyRestaurantInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "myRestaurant" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "restaurant" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "FragmentSpread",
                        name: { kind: "Name", value: "OwnerInsightsPromotionRestaurant" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerInsightsPromotionRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerInsightsPromotionRestaurantQuery,
  OwnerInsightsPromotionRestaurantQueryVariables
>;
export const OwnerInsightsPromotionHistoryDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "OwnerInsightsPromotionHistory" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "getPayments" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "payments" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "transactionId" } },
                      { kind: "Field", name: { kind: "Name", value: "ownerId" } },
                      { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
                      { kind: "Field", name: { kind: "Name", value: "createdAt" } },
                      { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "myRestaurants" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "restaurants" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "id" } },
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerInsightsPromotionHistoryQuery,
  OwnerInsightsPromotionHistoryQueryVariables
>;
export const OwnerInsightsCreatePromotionDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "OwnerInsightsCreatePromotion" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CreatePaymentInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createPayment" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerInsightsCreatePromotionMutation,
  OwnerInsightsCreatePromotionMutationVariables
>;
export const OwnerManagementMyRestaurantsDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "OwnerManagementMyRestaurants" },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "myRestaurants" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "restaurants" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "FragmentSpread",
                        name: { kind: "Name", value: "OwnerManagementRestaurant" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementDishOption" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "DishOption" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "minSelections" } },
          { kind: "Field", name: { kind: "Name", value: "maxSelections" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "choices" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementDish" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Dish" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "priceMinor" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "options" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "FragmentSpread",
                  name: { kind: "Name", value: "OwnerManagementDishOption" },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
          { kind: "Field", name: { kind: "Name", value: "categoryId" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "category" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "slug" } },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "dishes" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OwnerManagementDish" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerManagementMyRestaurantsQuery,
  OwnerManagementMyRestaurantsQueryVariables
>;
export const OwnerManagementMyRestaurantDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "OwnerManagementMyRestaurant" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "MyRestaurantInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "myRestaurant" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "restaurant" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "FragmentSpread",
                        name: { kind: "Name", value: "OwnerManagementRestaurant" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementDishOption" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "DishOption" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "minSelections" } },
          { kind: "Field", name: { kind: "Name", value: "maxSelections" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "choices" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "extraMinor" } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementDish" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Dish" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "priceMinor" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "options" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "FragmentSpread",
                  name: { kind: "Name", value: "OwnerManagementDishOption" },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "OwnerManagementRestaurant" },
      typeCondition: { kind: "NamedType", name: { kind: "Name", value: "Restaurant" } },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "name" } },
          { kind: "Field", name: { kind: "Name", value: "address" } },
          { kind: "Field", name: { kind: "Name", value: "image" } },
          { kind: "Field", name: { kind: "Name", value: "promotedUntil" } },
          { kind: "Field", name: { kind: "Name", value: "categoryId" } },
          { kind: "Field", name: { kind: "Name", value: "createdAt" } },
          { kind: "Field", name: { kind: "Name", value: "updatedAt" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "category" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "slug" } },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "dishes" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "FragmentSpread", name: { kind: "Name", value: "OwnerManagementDish" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerManagementMyRestaurantQuery,
  OwnerManagementMyRestaurantQueryVariables
>;
export const OwnerManagementCreateRestaurantDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "OwnerManagementCreateRestaurant" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CreateRestaurantInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createRestaurant" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
                { kind: "Field", name: { kind: "Name", value: "restaurantId" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerManagementCreateRestaurantMutation,
  OwnerManagementCreateRestaurantMutationVariables
>;
export const OwnerManagementEditRestaurantDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "OwnerManagementEditRestaurant" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "EditRestaurantInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "editRestaurant" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerManagementEditRestaurantMutation,
  OwnerManagementEditRestaurantMutationVariables
>;
export const OwnerManagementDeleteRestaurantDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "OwnerManagementDeleteRestaurant" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "DeleteRestaurantInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "deleteRestaurant" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerManagementDeleteRestaurantMutation,
  OwnerManagementDeleteRestaurantMutationVariables
>;
export const OwnerManagementCreateDishDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "OwnerManagementCreateDish" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "CreateDishInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "createDish" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerManagementCreateDishMutation,
  OwnerManagementCreateDishMutationVariables
>;
export const OwnerManagementEditDishDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "OwnerManagementEditDish" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "EditDishInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "editDish" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerManagementEditDishMutation,
  OwnerManagementEditDishMutationVariables
>;
export const OwnerManagementDeleteDishDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "OwnerManagementDeleteDish" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "input" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "DeleteDishInput" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: { kind: "Name", value: "deleteDish" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: { kind: "Variable", name: { kind: "Name", value: "input" } },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "ok" } },
                { kind: "Field", name: { kind: "Name", value: "error" } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  OwnerManagementDeleteDishMutation,
  OwnerManagementDeleteDishMutationVariables
>;
