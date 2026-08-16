# Catalog Discovery 详细设计

## 1. 职责与非目标

Catalog 模块拥有 Customer 的 Category、Restaurant listing/search/detail 和只读 Dish menu。它提供稳定 read model 给 Checkout 与 Owner Management 复用。

不负责：Restaurant/Dish 写操作、Cart、Dish 选项选择、订单、评分、ETA、营业状态或真实配送费。

## 2. 依赖与公共出口

依赖 Design System、Media 的只读图片展示能力、TanStack Form 和 Zod。

```ts
export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  restaurantCount: number;
};

export type RestaurantSummary = {
  id: string;
  name: string;
  address: string;
  image: string | null;
  category: Pick<CategorySummary, "id" | "name" | "slug">;
  promotedUntil: string | null;
};

export type DishOptionChoice = { id: string; name: string; extraMinor: number };
export type DishOption = {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  choices: readonly DishOptionChoice[];
};
export type Dish = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  priceMinor: number;
  image: string | null;
  options: readonly DishOption[];
};

export type RestaurantDetail = RestaurantSummary & { dishes: readonly Dish[] };
```

公共页面出口：`RestaurantDiscoveryPage`、`RestaurantMenuPage`。Checkout 只能导入上述只读类型/fixture builders，不导入 Catalog 页面。

## 3. 建议目录

```text
src/modules/catalog/
├── api/catalog.graphql
├── api/catalog-repository.ts
├── api/cache-policies.ts
├── model/types.ts
├── model/search-params.ts
├── forms/search-form-options.ts
├── components/category-strip.tsx
├── components/restaurant-card.tsx
├── components/dish-card.tsx
├── pages/restaurant-discovery-page.tsx
├── pages/restaurant-menu-page.tsx
├── testing/fixtures.ts
├── testing/handlers.ts
└── index.ts
```

## 4. GraphQL fragments 与 operations

模块拥有：`allCategory`、`restaurants`、`category`、`searchRestaurant`、`restaurant`。

Fragments：

- `CatalogCategorySummary`
- `CatalogRestaurantCard`
- `CatalogDishOption`
- `CatalogDish`
- `CatalogRestaurantDetail`

operation 只请求页面需要的字段。GraphQL response 经 adapter 校验关键 integer/ID 并映射为 domain type；`restaurantCount` nullable 时显示 0，但 adapter 不修改服务端实体。

## 5. URL 状态与查询选择

Discovery search params 使用 Zod：

```ts
type CatalogSearch = {
  query?: string;
  category?: string;
  page: number;
};
```

- `query` 与 `category` 互斥；新选择会清除另一项并重置 page=1。
- query trim 后为空则删除参数。
- page 非正整数时规范化为 1。
- Search bar 使用 TanStack Form 单字段表单；Zod Standard Schema 负责 trim/长度约束。query 使用 300ms debounce，但输入立即更新 `field.state.value`；URL/API 只在 debounce 后更新。
- URL 变化（浏览器后退、清除条件）通过 `form.reset({ query })` 同步表单，URL 仍是已提交筛选的唯一来源；搜索值不进入 Jotai。
- default 使用 `restaurants`；query 用 `searchRestaurant`；category 用 `category`。

## 6. Apollo Cache

- `Category`、`Restaurant`、`Dish` 使用默认 `id` normalization。
- 三个分页 field 按 query/category 参数区分 cache key；page 结果不自动拼成无限列表。
- 当前 UI 使用 numbered pagination，因此 repository 返回 `{ items, page, totalPages, totalResults }`。
- mutation 后由 Owner 模块按 entity ID 更新或 refetch；Catalog 不引用 Owner mutation。
- `promotedUntil` 每次进入/重新聚焦 discovery 时可采用 cache-and-network，避免过期 Promotion 长期显示。

## 7. 页面与组件

### 7.1 Discovery

- 地址提示从 Identity 只读 selector 由 route composition 作为 prop 注入；Catalog 不依赖 Identity。
- Category strip：`All` + service categories。
- Restaurant card 只显示图片、name、category、address、有效 `Promoted`。
- 不显示 rating、ETA、distance、delivery fee、open status。
- promoted restaurants 按 API 顺序显示；不在多个 section 重复实体。

### 7.2 Menu

- Hero、name、category、address、Promotion badge 和统一 `Menu`。
- Dish card 显示基础价格；有 extra choice 时可显示 `From`。
- 点击 Dish 触发由 Checkout 注入的 `onSelectDish(dish)`；Catalog 本身不打开业务定制 store。
- 桌面 Cart sidebar/mobile Cart bar 由 Checkout slot 注入。

## 8. 状态与错误

| 状态 | Discovery | Detail |
| --- | --- | --- |
| loading | Category + card skeleton | hero + 6 Dish skeleton |
| empty | query/category 专属文案 | `This restaurant hasn’t added a menu yet.` |
| not found | 不适用 | `Restaurant not found` |
| network error | 保留 search params + retry | 保留 shell + retry |
| stale cache | 显示现有内容并局部 refreshing | 同左 |

分页变更时保留上页内容至新请求返回，并把焦点移到列表标题，而不是页面顶部。

## 9. 独立测试

- search param Zod：非法 page、空 query、query/category 互斥。
- TanStack search form：default value、debounce、URL reset、submit/clear 与 field error。
- adapter：nullable category/image、Dish option、integer cents。
- repository 根据状态选择正确 operation/variables。
- cache：不同 query/category/page 不互相覆盖。
- Discovery loading/empty/error/pagination/debounce/Promotion expiry。
- Restaurant card 确认不出现 rating/ETA 等虚构字段。
- Menu not-found、empty、Dish select callback 和 keyboard activation。

MSW handlers 提供默认、search、category、empty、error 和 malformed response 场景。时间相关 Promotion 测试使用固定 `now`。

## 10. 验收标准

- Catalog 可在 fake address prop 和 fake `onSelectDish` 下独立运行。
- URL 是筛选/分页唯一来源，刷新和后退可恢复。
- 所有价格为 cents，所有卡片只展示 API 可支持字段。
- Checkout/Owner 只从 Catalog 公共出口复用 read model，不深层导入。
