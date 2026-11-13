export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: unknown; output: unknown; }
};

export type AllCategoriesOutput = {
  __typename: 'AllCategoriesOutput';
  categories: Maybe<Array<Category>>;
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type Category = {
  __typename: 'Category';
  coverImg: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  restaurantCount: Scalars['Int']['output'];
  restaurants: Array<Restaurant>;
  slug: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type CategoryInput = {
  page?: Scalars['Int']['input'];
  slug: Scalars['String']['input'];
};

export type CategoryOutput = {
  __typename: 'CategoryOutput';
  category: Maybe<Category>;
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  restaurants: Maybe<Array<Restaurant>>;
  totalPages: Maybe<Scalars['Int']['output']>;
  totalResults: Maybe<Scalars['Int']['output']>;
};

export type CreateAccountInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role: UserRole;
};

export type CreateAccountOutput = {
  __typename: 'CreateAccountOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type CreateDishInput = {
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  options?: InputMaybe<Array<DishOptionInputType>>;
  price: Scalars['Float']['input'];
  restaurantId: Scalars['Int']['input'];
};

export type CreateDishOutput = {
  __typename: 'CreateDishOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type CreateOrderInput = {
  items: Array<CreateOrderItemInput>;
  restaurantId: Scalars['Int']['input'];
};

export type CreateOrderItemInput = {
  dishId: Scalars['Int']['input'];
  options?: InputMaybe<Array<OrderItemOptionInputType>>;
};

export type CreateOrderOutput = {
  __typename: 'CreateOrderOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  orderId: Maybe<Scalars['Int']['output']>;
};

export type CreatePaymentInput = {
  restaurantId: Scalars['Int']['input'];
  transactionId: Scalars['String']['input'];
};

export type CreatePaymentOutput = {
  __typename: 'CreatePaymentOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type CreateRestaurantInput = {
  address: Scalars['String']['input'];
  categoryName: Scalars['String']['input'];
  coverImg: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type CreateRestaurantOutput = {
  __typename: 'CreateRestaurantOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  restaurantId: Maybe<Scalars['Int']['output']>;
};

export type DeleteDishInput = {
  dishId: Scalars['Int']['input'];
};

export type DeleteDishOutput = {
  __typename: 'DeleteDishOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type DeleteRestaurantInput = {
  restaurantId: Scalars['Float']['input'];
};

export type DeleteRestaurantOutput = {
  __typename: 'DeleteRestaurantOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type Dish = {
  __typename: 'Dish';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  options: Maybe<Array<DishOption>>;
  photo: Maybe<Scalars['String']['output']>;
  price: Scalars['Float']['output'];
  restaurant: Restaurant;
  updatedAt: Scalars['DateTime']['output'];
};

export type DishChoice = {
  __typename: 'DishChoice';
  extra: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
};

export type DishChoiceInputType = {
  extra?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
};

export type DishOption = {
  __typename: 'DishOption';
  choices: Maybe<Array<DishChoice>>;
  extra: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
};

export type DishOptionInputType = {
  choices?: InputMaybe<Array<DishChoiceInputType>>;
  extra?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
};

export type EditDishInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  dishId: Scalars['Int']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Array<DishOptionInputType>>;
  price?: InputMaybe<Scalars['Float']['input']>;
};

export type EditDishOutput = {
  __typename: 'EditDishOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type EditOrderInput = {
  id: Scalars['Float']['input'];
  status: OrderStatus;
};

export type EditOrderOutput = {
  __typename: 'EditOrderOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type EditProfileInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
};

export type EditProfileOutput = {
  __typename: 'EditProfileOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type EditRestaurantInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  categoryName?: InputMaybe<Scalars['String']['input']>;
  coverImg?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  restaurantId: Scalars['Float']['input'];
};

export type EditRestaurantOutput = {
  __typename: 'EditRestaurantOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type GetOrderInput = {
  id: Scalars['Float']['input'];
};

export type GetOrderOutput = {
  __typename: 'GetOrderOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  order: Maybe<Order>;
};

export type GetOrdersInput = {
  status?: InputMaybe<OrderStatus>;
};

export type GetOrdersOutput = {
  __typename: 'GetOrdersOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  orders: Maybe<Array<Order>>;
};

export type GetPaymentsOutput = {
  __typename: 'GetPaymentsOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  payments: Maybe<Array<Payment>>;
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type LoginOutput = {
  __typename: 'LoginOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  token: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename: 'Mutation';
  createAccount: CreateAccountOutput;
  createDish: CreateDishOutput;
  createOrder: CreateOrderOutput;
  createPayment: CreatePaymentOutput;
  createRestaurant: CreateRestaurantOutput;
  deleteDish: DeleteDishOutput;
  deleteRestaurant: DeleteRestaurantOutput;
  editDish: EditDishOutput;
  editOrder: EditOrderOutput;
  editProfile: EditProfileOutput;
  editRestaurant: EditRestaurantOutput;
  login: LoginOutput;
  takeOrder: TakeOrderOutput;
  verifyEmail: VerifyEmailOutput;
};


export type MutationCreateAccountArgs = {
  input: CreateAccountInput;
};


export type MutationCreateDishArgs = {
  input: CreateDishInput;
};


export type MutationCreateOrderArgs = {
  input: CreateOrderInput;
};


export type MutationCreatePaymentArgs = {
  input: CreatePaymentInput;
};


export type MutationCreateRestaurantArgs = {
  input: CreateRestaurantInput;
};


export type MutationDeleteDishArgs = {
  input: DeleteDishInput;
};


export type MutationDeleteRestaurantArgs = {
  input: DeleteRestaurantInput;
};


export type MutationEditDishArgs = {
  input: EditDishInput;
};


export type MutationEditOrderArgs = {
  input: EditOrderInput;
};


export type MutationEditProfileArgs = {
  input: EditProfileInput;
};


export type MutationEditRestaurantArgs = {
  input: EditRestaurantInput;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationTakeOrderArgs = {
  input: TakeOrderInput;
};


export type MutationVerifyEmailArgs = {
  input: VerifyEmailInput;
};

export type MyRestaurantInput = {
  id: Scalars['Float']['input'];
};

export type MyRestaurantOutput = {
  __typename: 'MyRestaurantOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  restaurant: Maybe<Restaurant>;
};

export type MyRestaurantsOutput = {
  __typename: 'MyRestaurantsOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  restaurants: Maybe<Array<Restaurant>>;
};

export type Order = {
  __typename: 'Order';
  createdAt: Scalars['DateTime']['output'];
  customer: Maybe<User>;
  driver: Maybe<User>;
  id: Scalars['Float']['output'];
  items: Array<OrderItem>;
  restaurant: Maybe<Restaurant>;
  status: OrderStatus;
  total: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type OrderItem = {
  __typename: 'OrderItem';
  createdAt: Scalars['DateTime']['output'];
  dish: Dish;
  id: Scalars['Float']['output'];
  options: Maybe<Array<OrderItemOption>>;
  updatedAt: Scalars['DateTime']['output'];
};

export type OrderItemOption = {
  __typename: 'OrderItemOption';
  choice: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type OrderItemOptionInputType = {
  choice?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export enum OrderStatus {
  Cooked = 'Cooked',
  Cooking = 'Cooking',
  Delivered = 'Delivered',
  Pending = 'Pending',
  PickedUp = 'PickedUp'
}

export type OrderUpdatesInput = {
  id: Scalars['Float']['input'];
};

export type Payment = {
  __typename: 'Payment';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Float']['output'];
  restaurant: Restaurant;
  restaurantId: Scalars['Int']['output'];
  transactionId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
};

export type Query = {
  __typename: 'Query';
  allCategories: AllCategoriesOutput;
  category: CategoryOutput;
  getOrder: GetOrderOutput;
  getOrders: GetOrdersOutput;
  getPayments: GetPaymentsOutput;
  me: User;
  myRestaurant: MyRestaurantOutput;
  myRestaurants: MyRestaurantsOutput;
  restaurant: RestaurantOutput;
  restaurants: RestaurantsOutput;
  searchRestaurant: SearchRestaurantOutput;
  userProfile: UserProfileOutput;
};


export type QueryCategoryArgs = {
  input: CategoryInput;
};


export type QueryGetOrderArgs = {
  input: GetOrderInput;
};


export type QueryGetOrdersArgs = {
  input: GetOrdersInput;
};


export type QueryMyRestaurantArgs = {
  input: MyRestaurantInput;
};


export type QueryRestaurantArgs = {
  input: RestaurantInput;
};


export type QueryRestaurantsArgs = {
  input: RestaurantsInput;
};


export type QuerySearchRestaurantArgs = {
  input: SearchRestaurantInput;
};


export type QueryUserProfileArgs = {
  userId: Scalars['Float']['input'];
};

export type Restaurant = {
  __typename: 'Restaurant';
  address: Scalars['String']['output'];
  category: Maybe<Category>;
  coverImg: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Float']['output'];
  isPromoted: Scalars['Boolean']['output'];
  menu: Array<Dish>;
  name: Scalars['String']['output'];
  orders: Array<Order>;
  owner: User;
  promotedUntil: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type RestaurantInput = {
  restaurantId: Scalars['Int']['input'];
};

export type RestaurantOutput = {
  __typename: 'RestaurantOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  restaurant: Maybe<Restaurant>;
};

export type RestaurantsInput = {
  page?: Scalars['Int']['input'];
};

export type RestaurantsOutput = {
  __typename: 'RestaurantsOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  results: Maybe<Array<Restaurant>>;
  totalPages: Maybe<Scalars['Int']['output']>;
  totalResults: Maybe<Scalars['Int']['output']>;
};

export type SearchRestaurantInput = {
  page?: Scalars['Int']['input'];
  query: Scalars['String']['input'];
};

export type SearchRestaurantOutput = {
  __typename: 'SearchRestaurantOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  restaurants: Maybe<Array<Restaurant>>;
  totalPages: Maybe<Scalars['Int']['output']>;
  totalResults: Maybe<Scalars['Int']['output']>;
};

export type Subscription = {
  __typename: 'Subscription';
  cookedOrders: Order;
  orderUpdates: Order;
  pendingOrders: Order;
};


export type SubscriptionOrderUpdatesArgs = {
  input: OrderUpdatesInput;
};

export type TakeOrderInput = {
  id: Scalars['Float']['input'];
};

export type TakeOrderOutput = {
  __typename: 'TakeOrderOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type User = {
  __typename: 'User';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['Float']['output'];
  orders: Array<Order>;
  password: Scalars['String']['output'];
  payments: Array<Payment>;
  restaurants: Array<Restaurant>;
  rides: Array<Order>;
  role: UserRole;
  updatedAt: Scalars['DateTime']['output'];
  verified: Scalars['Boolean']['output'];
};

export type UserProfileOutput = {
  __typename: 'UserProfileOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
  user: Maybe<User>;
};

export enum UserRole {
  Client = 'Client',
  Delivery = 'Delivery',
  Owner = 'Owner'
}

export type VerifyEmailInput = {
  code: Scalars['String']['input'];
};

export type VerifyEmailOutput = {
  __typename: 'VerifyEmailOutput';
  error: Maybe<Scalars['String']['output']>;
  ok: Scalars['Boolean']['output'];
};

export type RestaurantPartsFragment = { __typename: 'Restaurant', id: number, name: string, coverImg: string, address: string, isPromoted: boolean, category: { __typename: 'Category', name: string } | null };

export type CategoryPartsFragment = { __typename: 'Category', id: number, name: string, coverImg: string | null, slug: string, restaurantCount: number };

export type DishPartsFragment = { __typename: 'Dish', id: number, name: string, price: number, photo: string | null, description: string, options: Array<{ __typename: 'DishOption', name: string, extra: number | null, choices: Array<{ __typename: 'DishChoice', name: string, extra: number | null }> | null }> | null };

export type OrderPartsFragment = { __typename: 'Order', id: number, createdAt: unknown, total: number | null };

export type FullOrderPartsFragment = { __typename: 'Order', id: number, status: OrderStatus, total: number | null, driver: { __typename: 'User', email: string } | null, customer: { __typename: 'User', email: string } | null, restaurant: { __typename: 'Restaurant', name: string } | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { __typename: 'User', id: number, email: string, role: UserRole, verified: boolean } };

export type CategoryQueryVariables = Exact<{
  input: CategoryInput;
}>;


export type CategoryQuery = { category: { __typename: 'CategoryOutput', ok: boolean, error: string | null, totalPages: number | null, totalResults: number | null, restaurants: Array<{ __typename: 'Restaurant', id: number, name: string, coverImg: string, address: string, isPromoted: boolean, category: { __typename: 'Category', name: string } | null }> | null, category: { __typename: 'Category', id: number, name: string, coverImg: string | null, slug: string, restaurantCount: number } | null } };

export type RestaurantQueryVariables = Exact<{
  input: RestaurantInput;
}>;


export type RestaurantQuery = { restaurant: { __typename: 'RestaurantOutput', ok: boolean, error: string | null, restaurant: { __typename: 'Restaurant', id: number, name: string, coverImg: string, address: string, isPromoted: boolean, menu: Array<{ __typename: 'Dish', id: number, name: string, price: number, photo: string | null, description: string, options: Array<{ __typename: 'DishOption', name: string, extra: number | null, choices: Array<{ __typename: 'DishChoice', name: string, extra: number | null }> | null }> | null }>, category: { __typename: 'Category', name: string } | null } | null } };

export type CreateOrderMutationVariables = Exact<{
  input: CreateOrderInput;
}>;


export type CreateOrderMutation = { createOrder: { __typename: 'CreateOrderOutput', ok: boolean, error: string | null, orderId: number | null } };

export type RestaurantsPageQueryVariables = Exact<{
  input: RestaurantsInput;
}>;


export type RestaurantsPageQuery = { allCategories: { __typename: 'AllCategoriesOutput', ok: boolean, error: string | null, categories: Array<{ __typename: 'Category', id: number, name: string, coverImg: string | null, slug: string, restaurantCount: number }> | null }, restaurants: { __typename: 'RestaurantsOutput', ok: boolean, error: string | null, totalPages: number | null, totalResults: number | null, results: Array<{ __typename: 'Restaurant', id: number, name: string, coverImg: string, address: string, isPromoted: boolean, category: { __typename: 'Category', name: string } | null }> | null } };

export type SearchRestaurantQueryVariables = Exact<{
  input: SearchRestaurantInput;
}>;


export type SearchRestaurantQuery = { searchRestaurant: { __typename: 'SearchRestaurantOutput', ok: boolean, error: string | null, totalPages: number | null, totalResults: number | null, restaurants: Array<{ __typename: 'Restaurant', id: number, name: string, coverImg: string, address: string, isPromoted: boolean, category: { __typename: 'Category', name: string } | null }> | null } };

export type CreateAccountMutationVariables = Exact<{
  createAccountInput: CreateAccountInput;
}>;


export type CreateAccountMutation = { createAccount: { __typename: 'CreateAccountOutput', ok: boolean, error: string | null } };

export type CookedOrdersSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type CookedOrdersSubscription = { cookedOrders: { __typename: 'Order', id: number, status: OrderStatus, total: number | null, driver: { __typename: 'User', email: string } | null, customer: { __typename: 'User', email: string } | null, restaurant: { __typename: 'Restaurant', name: string } | null } };

export type TakeOrderMutationVariables = Exact<{
  input: TakeOrderInput;
}>;


export type TakeOrderMutation = { takeOrder: { __typename: 'TakeOrderOutput', ok: boolean, error: string | null } };

export type LoginMutationVariables = Exact<{
  loginInput: LoginInput;
}>;


export type LoginMutation = { login: { __typename: 'LoginOutput', ok: boolean, token: string | null, error: string | null } };

export type GetOrderQueryVariables = Exact<{
  input: GetOrderInput;
}>;


export type GetOrderQuery = { getOrder: { __typename: 'GetOrderOutput', ok: boolean, error: string | null, order: { __typename: 'Order', id: number, status: OrderStatus, total: number | null, driver: { __typename: 'User', email: string } | null, customer: { __typename: 'User', email: string } | null, restaurant: { __typename: 'Restaurant', name: string } | null } | null } };

export type OrderUpdatesSubscriptionVariables = Exact<{
  input: OrderUpdatesInput;
}>;


export type OrderUpdatesSubscription = { orderUpdates: { __typename: 'Order', id: number, status: OrderStatus, total: number | null, driver: { __typename: 'User', email: string } | null, customer: { __typename: 'User', email: string } | null, restaurant: { __typename: 'Restaurant', name: string } | null } };

export type EditOrderMutationVariables = Exact<{
  input: EditOrderInput;
}>;


export type EditOrderMutation = { editOrder: { __typename: 'EditOrderOutput', ok: boolean, error: string | null } };

export type CreateDishMutationVariables = Exact<{
  input: CreateDishInput;
}>;


export type CreateDishMutation = { createDish: { __typename: 'CreateDishOutput', ok: boolean, error: string | null } };

export type MyRestaurantQueryVariables = Exact<{
  input: MyRestaurantInput;
}>;


export type MyRestaurantQuery = { myRestaurant: { __typename: 'MyRestaurantOutput', ok: boolean, error: string | null, restaurant: { __typename: 'Restaurant', id: number, name: string, coverImg: string, address: string, isPromoted: boolean, menu: Array<{ __typename: 'Dish', id: number, name: string, price: number, photo: string | null, description: string, options: Array<{ __typename: 'DishOption', name: string, extra: number | null, choices: Array<{ __typename: 'DishChoice', name: string, extra: number | null }> | null }> | null }>, orders: Array<{ __typename: 'Order', id: number, createdAt: unknown, total: number | null }>, category: { __typename: 'Category', name: string } | null } | null } };

export type CreateRestaurantMutationVariables = Exact<{
  input: CreateRestaurantInput;
}>;


export type CreateRestaurantMutation = { createRestaurant: { __typename: 'CreateRestaurantOutput', error: string | null, ok: boolean, restaurantId: number | null } };

export type MyRestaurantsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyRestaurantsQuery = { myRestaurants: { __typename: 'MyRestaurantsOutput', ok: boolean, error: string | null, restaurants: Array<{ __typename: 'Restaurant', id: number, name: string, coverImg: string, address: string, isPromoted: boolean, category: { __typename: 'Category', name: string } | null }> | null } };

export type CreatePaymentMutationVariables = Exact<{
  input: CreatePaymentInput;
}>;


export type CreatePaymentMutation = { createPayment: { __typename: 'CreatePaymentOutput', ok: boolean, error: string | null } };

export type PendingOrdersSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PendingOrdersSubscription = { pendingOrders: { __typename: 'Order', id: number, status: OrderStatus, total: number | null, driver: { __typename: 'User', email: string } | null, customer: { __typename: 'User', email: string } | null, restaurant: { __typename: 'Restaurant', name: string } | null } };

export type VerifyEmailMutationVariables = Exact<{
  input: VerifyEmailInput;
}>;


export type VerifyEmailMutation = { verifyEmail: { __typename: 'VerifyEmailOutput', ok: boolean, error: string | null } };

export type VerifiedUserFragment = { __typename: 'User', verified: boolean };

export type EditProfileMutationVariables = Exact<{
  input: EditProfileInput;
}>;


export type EditProfileMutation = { editProfile: { __typename: 'EditProfileOutput', ok: boolean, error: string | null } };

export type EditedUserFragment = { __typename: 'User', verified: boolean, email: string };
