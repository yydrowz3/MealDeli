# Owner Restaurant 与 Menu 详细设计

## 1. 职责与非目标

Owner Management 模块拥有多餐厅选择、Restaurant create/edit/delete、Restaurant overview、Menu/Dish CRUD、option builder、Owner order queue 和新订单页面内提醒。

不负责：全局 Category CRUD、7 天 analytics、Promotion、Order 状态机、图片上传实现或 Customer Catalog 页面。

## 2. 依赖与公共出口

依赖 Design System、Identity role/user ID atom、Media uploader、Catalog read model、Orders read model/repository、Jotai、TanStack Form、Zod。

```ts
export type OwnerRestaurantSelection = {
  selectedRestaurantId: string | null;
};

export type DishDraft = {
  name: string;
  description: string;
  priceMinor: number;
  image: string | null;
  options: readonly DishOptionDraft[];
};

export const selectedOwnerRestaurantIdAtom: Atom<string | null>;
export const setSelectedOwnerRestaurantAtom: WritableAtom<null, [string | null], void>;
export function createOwnerSelectionTestStore(options?: SelectionTestStoreOptions): JotaiStore;
export function OwnerRestaurantsPage(): JSX.Element;
export function OwnerRestaurantOverviewPage(props: { restaurantId: string }): JSX.Element;
export function OwnerMenuPage(props: { restaurantId: string }): JSX.Element;
export function OwnerOrdersAction(props: { order: Order }): JSX.Element | null;
```

模块不重新导出完整 Catalog/Order 类型，只在自己的 public props 中引用对方公共 type。

## 3. 建议目录

```text
src/modules/owner-management/
├── api/owner-management.graphql
├── api/owner-repository.ts
├── api/cache-updates.ts
├── model/selection-atoms.ts
├── model/restaurant-form-schema.ts
├── model/dish-form-schema.ts
├── model/option-builder.ts
├── forms/restaurant-form-options.ts
├── forms/dish-form-options.ts
├── components/restaurant-selector.tsx
├── components/restaurant-form.tsx
├── components/dish-form.tsx
├── components/option-builder.tsx
├── components/new-order-notifier.tsx
├── pages/restaurants-page.tsx
├── pages/restaurant-overview-page.tsx
├── pages/menu-page.tsx
├── pages/settings-page.tsx
├── testing/fixtures.ts
├── testing/handlers.ts
└── index.ts
```

## 4. GraphQL operations

模块拥有 `myRestaurants`、`myRestaurant`、`createRestaurant`、`editRestaurant`、`deleteRestaurant`、`createDish`、`editDish`、`deleteDish`。Category options 使用 Catalog 的 allCategory repository，不调用 Category mutation。

Owner fragments 与 Catalog fragments 可通过 fragment composition 复用，但 write response 必须返回/随后 refetch 足够字段更新 normalized cache。

Repository 校验 current user role=OWNER 只是客户端快速失败；真正权限由后端 `@Roles(OWNER)` 与 ownerId 检查保证。

## 5. Restaurant selection atoms

- `selectedOwnerRestaurantIdAtom` 使用 `atomWithStorage` 且设置 `getOnInit: true`；localStorage key `mealdeli.owner.restaurant.v1`，只存 restaurant ID。
- URL `$restaurantId` 优先；其次已保存且仍属于 Owner 的 ID；最后第一家餐厅；无餐厅为 null。
- `myRestaurants` 返回后验证选择，非法/已删 ID 清除。
- logout 清除 key。
- Dashboard 可注入 `All restaurants` 语义，但 atom 内不以 magic ID 保存 all；使用 page-local filter null。

测试 factory 使用 Jotai `createStore()` 和 memory storage，避免 default store/singleton 共享状态。

## 6. Restaurant 表单

### 6.1 Create

Restaurant form 使用 TanStack Form；`RestaurantDraftSchema` 作为 Zod Standard Schema validator：name trim 非空、categoryId UUID、address trim 非空、image URL/null。图片由 Media 先上传，再通过 image field 的 `handleChange` 写入 form。

成功：写入/Refetch `myRestaurants`，写 selected restaurant atom 为新 ID，跳 `/restaurants/$restaurantId`。提交按钮使用 `form.Subscribe` 的 `isSubmitting` 禁止重复创建。

### 6.2 Edit

当前 API 只允许 name/address/image，Category 只读显示 `Category can’t be changed.`。使用 TanStack Form `isDirty` 驱动浏览器/route block；保存成功用服务端值 `form.reset()` 清 dirty。

### 6.3 Delete

独立 Danger zone，确认文案包含不可撤销。成功后：

- 从 Apollo Owner list 移除实体。
- 若为 selected，选择下一家或 null。
- 清与该 restaurant 相关的页面 cache；历史 Order entity 仍保留其快照/nullable restaurant 处理。
- 返回 `/restaurants`。

后端约束拒绝时显示 server message 的安全映射，不强行前端级联删除订单。

## 7. Menu 与 Dish

### 7.1 Price

表单输入用 decimal string，纯函数解析为 cents：只允许最多两位小数、≥0、在 safe integer 内。不得使用浮点乘法后直接 round 隐藏非法精度。

### 7.2 Option builder

```ts
type DishChoiceDraft = { id?: string; name: string; extraMinor: number };
type DishOptionDraft = {
  id?: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  choices: DishChoiceDraft[];
};
```

规则：至少 1 choice；0 ≤ min ≤ max ≤ choices.length；choice name 非空；extraMinor ≥0。编辑时保留 API 稳定 ID；新 option/choice 不生成伪 API UUID，省略 ID 交给后端生成。

Option/Choice 使用 TanStack Form nested field arrays；每个 builder row 使用独立 UI key 字段，不能以数组 index 作为 React key。array push/remove 通过 field API；Zod 在 blur/submit 校验跨字段 min/max。reorder 不在首版范围。

### 7.3 CRUD cache

- Create/Edit success 后 refetch current `myRestaurant`，以服务端 options/IDs 为准。
- Delete success 从当前 menu 移除，并保持历史 order items 不变。
- 不做乐观 options 更新，避免 ID/validation 与服务端不一致。

## 8. Owner Overview 与 Orders

Overview 组合：Restaurant summary、Dish count、active Order count、recent Orders 和 quick actions。计算依赖 Catalog/Orders 公共数据，不在模块内再发重复 GraphQL operation。

Owner Order action policy：

| Status | Action | Mutation |
| --- | --- | --- |
| PENDING | `Start preparing` | COOKING |
| COOKING | `Mark ready for pickup` | WAITING |
| WAITING/PICKED/DELIVERED | 只读 | none |

成功后由 Orders cache/订阅处理，不进行自定义第二份 order atom。

## 9. 新订单提醒

`NewOrderNotifier` 订阅 Orders 的 owner pending port：

- 新 ID 插入 Apollo list，pending badge +1。
- 持久 Toast：`New order from {restaurant}`，action `View order`。
- 当 order 进入 COOKING、Toast 手动关闭或组件销毁时移除。
- 同一 order ID 不重复 Toast/badge。
- 断线只显示 Orders connection banner；重连 refetch 并以 PENDING 查询校准 badge。
- 不播放声音、不申请 Notification API。

## 10. 错误处理

- 所有 `$restaurantId` 先校验 ownership；不存在/越权统一 `Restaurant not found`。
- 图片上传失败不丢其他 form 字段，可无图继续。
- Dish option server validation 映射到 form summary；未知错误保留 draft。
- 状态 mutation 失败 refetch Order，不乐观推进。
- 创建成功但 route navigation 失败仍能通过 Restaurant list 找到实体。

## 11. 独立测试

- Jotai selection atoms：URL/localStorage/list precedence、删除 selected、logout、不同 store 隔离。
- TanStack Restaurant form：Zod onBlur/onSubmit、create/edit/delete、Category 只读、`isDirty` route block、`isSubmitting`。
- Money parser：0、两位、小数过多、负数、溢出。
- TanStack Dish/Option form：nested field arrays、min/max、稳定 IDs、add/remove、错误 focus。
- Menu CRUD cache/refetch、历史 Order fixture 不变化。
- Owner action policy 五态。
- Pending notifier：dedupe、badge、Toast lifecycle、disconnect/refetch。
- 后端已有 Restaurant/Dish service/resolver 权限和 success/failure 单元测试继续扩充。

模块测试注入 fake MediaUploader、CatalogRepository、OrderRepository/Subscription，禁止真实文件/WS/API。

## 12. 验收标准

- 多餐厅上下文在 URL、刷新和删除后确定且无 magic ID。
- Owner 无法从 UI 创建/编辑全局 Category。
- Dish options 的 min/max、ID 和 cents 在前后端一致。
- 新订单提醒与 Order cache 使用同一实体，不形成第二份业务状态。
- Owner Management 可在 fake Catalog/Orders/Media 下独立测试。
