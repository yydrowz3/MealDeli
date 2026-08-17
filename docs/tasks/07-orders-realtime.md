# Orders 与 Realtime 最小任务

## 来源与依赖

- 需求：[`00-overview.md`](../proposals/00-overview.md) 的五态模型，以及 [`02-customer.md`](../proposals/02-customer.md)、[`03-owner.md`](../proposals/03-owner.md)、[`04-courier.md`](../proposals/04-courier.md) 的订单列表、详情和实时更新。
- 设计：[`07-orders-realtime.md`](../detailed-designs/07-orders-realtime.md)。
- 依赖：Design System、Platform Apollo/GraphQL transport；不得依赖 Checkout、Owner 或 Courier。
- 现状：后端已有五态 enum、查询、编辑、接单及三种 subscription surface，但状态转换校验和部分 PubSub payload 不符合设计；前端 Orders 模块尚不存在。

## 实现任务

### Read model 与状态机

- [x] 后端 schema 已使用 `PENDING → COOKING → WAITING → PICKED → DELIVERED` 五个状态，并提供 get/list/edit/subscription 基础接口；API 构建通过。
- [x] 定义稳定 Order/Item/Option domain type、状态 rank、label、timeline 和相邻 transition；角色权限不复制基础状态机。
- [x] 共置带 `Orders` 前缀的 fragments/operations，并通过 adapter 排序 items/list、保留 nullable restaurant、降级非法 option snapshot。
- [x] 实现 Customer/Owner/Courier list projection 与 not-found/forbidden 统一映射。
- [x] 实现 Apollo merge：同 ID、拒绝倒序/旧事件、保留已有非空关联，并允许 authoritative refetch 纠错。

### 实时与后端修正

- [x] 实现可注入 subscription adapter 和 connection state；断线保留已知数据，重连后 refetch，不重复 Toast。
- [x] 修正 `cookedOrders` publish key 为 schema 同名字段，并保证 payload 是更新后的 WAITING Order。
- [x] 修正 `takeOrder` 事件为更新后的 PICKED Order，包含真实 courierId、customerId、restaurantId 与 ownerId。
- [x] 保留 Owner pending 的 owner filter、去重插入和重连查询校准。
- [x] 在后端强制校验相邻状态转换及 Owner/Courier 权限，禁止回退、跳级和未分配 Courier 完成订单。
- [x] 将单实例进程内 PubSub 限制写入部署说明，避免误认为事件可跨 API 实例传播。

### 共享页面

- [x] 实现 role-aware OrdersPage 的 Current/Past、Owner filters、Courier Active/Completed 及 loading/empty/error。
- [x] 实现 OrderDetailPage、共享 items/summary/timeline/status badge，并通过 action slot 注入 Owner/Courier 操作。
- [x] Customer 新状态只显示一次非持久 Toast；非法/倒序事件只记录开发诊断，不推进 UI。

## 测试与验收

- [x] 覆盖状态 rank/transition、三角色 projection、adapter 排序/nullable/option snapshot。
- [x] 覆盖 cache 新事件、重复、倒序、null association 与 reconnect authoritative refetch。
- [x] 用 controllable async iterable 覆盖连接、断线、重连、dispose，不启动真实 WS。
- [x] 覆盖三角色列表、详情五态 timeline、not-found 和 action slot。
- [x] API build 和类型检查通过，并核对 cooked/take payload、owner filter、非法转换和 assignment 校验的 schema/resolver/service 契约证据；API Jest 不作为本轮门禁。

## 完成条件

以上所有任务均为 `[x]`，且所有角色共享同一状态模型、事件不能导致状态回退、重连可纠错后，才可在 [`progress.md`](./progress.md) 勾选本模块。
