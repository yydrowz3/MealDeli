# Cart 与 Checkout 详细设计

## 1. 职责与非目标

Checkout 模块拥有 Dish 定制、单餐厅 Cart、versioned localStorage、地址确认、模拟支付和 Customer 下单。服务端继续负责 Dish/option 真实性和最终总价。

不负责：Catalog 查询、订单历史/追踪、真实支付、优惠、税、取消、服务端 Cart 或跨设备同步。

## 2. 依赖与公共出口

依赖 Design System、Catalog read model、Identity address/session atom、Apollo createOrder port、Jotai、TanStack Form、Zod。

```ts
export type CartChoiceSnapshot = {
  choiceId: string;
  name: string;
  extraMinor: number;
};
export type CartOptionSnapshot = {
  optionId: string;
  name: string;
  choices: readonly CartChoiceSnapshot[];
};
export type CartLine = {
  lineId: string;
  dishId: string;
  dishName: string;
  basePriceMinor: number;
  image: string | null;
  options: readonly CartOptionSnapshot[];
  quantity: number;
};
export type CartState = {
  version: 1;
  restaurant: { id: string; name: string } | null;
  lines: readonly CartLine[];
};

export const cartAtom: Atom<CartState>;
export const cartCountAtom: Atom<number>;
export const cartTotalMinorAtom: Atom<number>;
export const addCartLineAtom: WritableAtom<null, [AddCartLineInput], AddCartLineResult>;
export const changeCartQuantityAtom: WritableAtom<null, [ChangeQuantityInput], void>;
export const removeCartLineAtom: WritableAtom<null, [string], void>;
export const clearCartAtom: WritableAtom<null, [], void>;
export function createCartTestStore(options?: CartTestStoreOptions): JotaiStore;
export function DishCustomizer(props: { dish: Dish; onAdd: (line: CartLine) => void }): JSX.Element;
export function CartDrawer(): JSX.Element;
export function CheckoutPage(): JSX.Element;
```

Cart 不公开任意 setter，只公开 `addLine`、`changeQuantity`、`removeLine`、`replaceRestaurantCart`、`clear` 和 selectors。

## 3. 建议目录

```text
src/modules/checkout/
├── api/checkout.graphql
├── api/order-command-repository.ts
├── model/cart-schema.ts
├── model/cart-atoms.ts
├── model/cart-selectors.ts
├── model/dish-selection.ts
├── model/money-input.ts
├── forms/dish-customizer-form-options.ts
├── forms/checkout-form-options.ts
├── components/dish-customizer.tsx
├── components/cart-drawer.tsx
├── components/cart-summary.tsx
├── components/address-editor.tsx
├── pages/checkout-page.tsx
├── testing/cart-atoms.ts
├── testing/handlers.ts
└── index.ts
```

## 4. Cart 持久化

- key 固定 `mealdeli.cart.v1`。
- `cartAtom` 使用 `atomWithStorage` 且设置 `getOnInit: true`，在纯客户端 Vite 应用首次读取时同步恢复 Cart；只保存 `CartState`，不保存 modal/loading/error、TanStack Form state 或 action。
- 使用自定义 `createValidatedCartStorage(storage)`：读取时先 JSON parse，再用 Zod 校验；失败/未知 version 删除并恢复空 Cart。
- Identity logout 时由 Platform composition 执行 `store.set(clearCartAtom)` 并删除 key。
- 测试用 Jotai `createStore()` + memory storage；不得依赖 default store 或真实全局 localStorage。

### 4.1 单餐厅规则

- 空 Cart 可直接加入 Dish 并设置 restaurant。
- 同 restaurant 的相同 Dish+相同 choice ID 集合合并 quantity；不同 options 形成新 line。
- 新 restaurant 的 Dish 由 `addCartLineAtom` 返回 `REQUIRES_REPLACEMENT_CONFIRMATION`，atom 不自行清空。
- 用户确认 `Start new cart` 后 transactionally 替换 restaurant 与第一行。
- 只浏览其他餐厅不改变 Cart。

### 4.2 派生金额

```text
unitMinor = basePriceMinor + sum(all choice.extraMinor)
lineTotalMinor = unitMinor × quantity
cartTotalMinor = sum(lineTotalMinor)
```

所有输入必须为 safe integer，quantity 1–99。derived atoms/selector 只计算数字，不把格式化字符串写入 cart atom。

## 5. Dish 定制

Dish customizer 使用 TanStack Form，`DishSelectionSchema` 以 Catalog Dish 为约束：

- 每个 option 最多出现一次。
- selected choice 必须属于 option 且不重复。
- count 必须处于 min/max。
- min=0 可不提交该 option。
- quantity 1–99。

UI：单选、可取消单选或多选由 min/max 推导。动态 options 使用 TanStack Form field arrays；Zod schema 作为 submit validator。`Add {quantity} to cart · {total}` 使用 `form.Subscribe` 读取 values/canSubmit，提交错误时聚焦首个 option group。关闭未提交定制时销毁 form instance，不写 Jotai。

`lineId` 由 dish ID 与规范化 option/choice ID + UUID 生成；合并判断使用确定性 selection key，不使用显示 name。

## 6. Checkout 进入条件

route loader 顺序：

1. CUSTOMER + verified gate。
2. hydrate Cart。
3. 空 Cart 显示专属 empty，不 redirect loop。
4. 读取 Identity address。
5. 按 restaurant ID refetch Catalog detail，校验 Dish/option 仍存在。

不存在项标记为 invalid，显示 `Some items are no longer available.`；用户必须删除/重新配置，不能直接下单。服务端仍做最终校验。

## 7. 地址与模拟支付

- Checkout/address 使用 TanStack Form；address Zod schema 为 trim 后至少 1、最多 500，并在 blur/submit 执行。
- 保存地址调用 Identity 的 profile command port；成功更新 SessionUser。
- Order 模型不保存地址快照，Checkout 不把地址塞入 `createOrder`。
- Payment 区只显示 `Demo payment`、`No card is required.`。
- 汇总：Subtotal=Total，Delivery `$0.00`，文案 `No delivery fee in this demo.`。

## 8. createOrder

### 8.1 Input mapping

```ts
type CreateOrderPayload = {
  restaurantId: string;
  items: Array<{
    dishId: string;
    quantity: number;
    options?: Array<{ optionId: string; choiceIds: string[] }>;
  }>;
};
```

只提交 IDs 和 quantity，不提交客户端价格/name。line 顺序按 Cart 顺序稳定生成。

### 8.2 提交流程

1. submit handler 从 Jotai store snapshot 当前 Cart revision；TanStack Form 设置 `isSubmitting`。
2. 禁用修改、返回重复提交和 Pay button。
3. 调用 `createOrder`；不做乐观 Order cache 写入。
4. success 且有 orderId：清 Cart、删除 storage、调用注入的 `onOrderCreated(orderId)` 导航。
5. business/network error：恢复 Cart 与按钮，显示页面内错误。
6. transport 超时：先通过 Orders refetch 最近订单/幂等策略确认；当前 API 无 idempotency key，因此前端不得自动重试 mutation，只允许用户确认后手动重试。

后续可扩展 client request ID，但本详细设计不改变 Order schema。

## 9. 错误映射

| Backend/condition | UI |
| --- | --- |
| Dish/option invalid | 标记 Cart item，要求 reconfigure/remove |
| Restaurant missing | `This restaurant is no longer available.` |
| Empty/invalid address | 字段错误，禁止提交 |
| Session expired | Platform 处理，Cart 在确认 logout/expired 时清除 |
| Network before response | 保留 Cart，不自动重试 |
| Create success | 清 Cart，进入 order detail |

## 10. 独立测试

- Zod hydration：合法 v1、损坏 JSON、未知 version、非法 cents/quantity。
- Jotai atoms：add/merge/remove/quantity、derived totals、跨餐厅确认前无 mutation、logout clear、不同 store 隔离。
- TanStack Dish form：field arrays、min/max、重复 choice、价格、首错 focus、提交后才写 atom。
- Cart drawer：empty、line editing、USD summary、mobile action。
- TanStack Checkout form：empty Cart、缺地址、地址保存、invalid item、`isSubmitting` 防重复提交。
- createOrder mapping 不包含 price/name，success 清理，error 保留，timeout 不自动 retry。
- 测试 inject Jotai store、memory storage、fixed UUID、fake Catalog detail、fake Identity 和 MSW mutation；每例新建 TanStack Form instance。

## 11. 验收标准

- Cart 可脱离真实 Catalog API 通过 Dish fixture 独立测试。
- 刷新保留 Cart，logout/成功下单清理，损坏数据安全丢弃。
- 单餐厅规则不会在用户确认前清空任何商品。
- 客户端金额只用于展示，最终订单完全服从服务端计算。
- Checkout 只通过 `orderId` 与 Orders 模块衔接。
