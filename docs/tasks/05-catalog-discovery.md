# Catalog Discovery 最小任务

## 来源与依赖

- 需求：[`02-customer.md`](../proposals/02-customer.md) 的餐厅发现、分类、搜索、分页与菜单章节。
- 设计：[`05-catalog-discovery.md`](../detailed-designs/05-catalog-discovery.md)。
- 依赖：Design System、Media 只读图片能力、TanStack Form、Zod；地址与 Dish 选择行为由 composition 注入。
- 现状：后端已有 `allCategory`、`restaurants`、`category`、`searchRestaurant`、`restaurant` 查询；前端 Catalog 模块尚不存在。

## 实现任务

### Read model 与 API

- [x] 所需五个只读 GraphQL 查询已存在并可通过 API 构建，Customer 浏览无需新增 Catalog mutation。
- [x] 定义 Category、Restaurant、Dish、Option 的稳定只读 domain type，金额统一映射为 integer cents。
- [x] 共置带 `Catalog` 前缀的 fragments/operations，并通过 codegen TypedDocumentNode 使用生成类型。
- [x] 实现 adapter 对 nullable image/category/count、ID、integer 和 Dish option 的校验与安全降级。
- [x] 实现分页 repository 与 Apollo field policy，按 query/category/page 隔离 cache，不拼接成无限列表。

### URL、表单与页面

- [x] 用 Zod 解析 `query`、`category`、`page`；query/category 互斥，空 query 删除，非法 page 归一为 1。
- [x] 用 TanStack Form 实现搜索栏和 300ms debounce；URL 是已提交筛选的唯一来源，后退时 reset 表单。
- [x] 实现 Discovery 的地址提示、All/category strip、Restaurant card、Promotion 标记和 numbered pagination。
- [x] 实现 loading、筛选专属 empty、network error、stale cache refreshing，并在翻页后把焦点移到列表标题。
- [x] 实现 Restaurant Menu 的 hero、统一菜单、Dish card、not-found/empty/error 和注入式 Dish select callback/Cart slot。
- [x] 确保页面不展示 rating、ETA、distance、delivery fee、open status 等无数据来源内容。

## 测试与验收

- [x] 覆盖 URL schema、互斥筛选、search debounce、浏览器后退和表单 reset。
- [x] 覆盖 adapter、operation/variables 选择、分页 cache 隔离和固定时间下 Promotion 过期。
- [x] 覆盖 Discovery/Menu 的 loading、empty、error、not-found、pagination 和键盘激活。
- [x] 证明 Catalog 可在 fake address 与 fake `onSelectDish` 下独立运行，Checkout/Owner 只导入公共 read model。

## 完成条件

以上所有任务均为 `[x]`，且 URL 可在刷新/后退后恢复、卡片只显示服务端可支持字段后，才可在 [`progress.md`](./progress.md) 勾选本模块。
