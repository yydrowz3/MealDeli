# Owner Restaurant 与 Menu 最小任务

## 来源与依赖

- 需求：[`03-owner.md`](../proposals/03-owner.md) 的首次使用、餐厅、菜单、设置、订单操作和提醒章节。
- 设计：[`08-owner-restaurant-menu.md`](../detailed-designs/08-owner-restaurant-menu.md)。
- 依赖：Design System、Identity role/user、Media、Catalog、Orders、Jotai、TanStack Form、Zod。
- 现状：后端已有 role-guarded Restaurant/Dish CRUD 与 owner 查询；前端 Owner Management 模块尚不存在，相关 API 测试当前无法运行。

## 实现任务

### 餐厅上下文与接口

- [x] 后端已提供 `myRestaurants`、`myRestaurant` 及 Restaurant/Dish create/edit/delete GraphQL surface，并对 mutation/query 使用 OWNER role guard；API 构建通过。
- [x] 建立 Owner repository、稳定 form/domain types 和最小公共出口，只引用 Catalog/Orders 公共类型。
- [x] 用 `mealdeli.owner.restaurant.v1` 实现只存 ID 的 selection atom；URL 优先，其次合法 storage，最后第一家餐厅。
- [x] 查询后清理已删除/越权 selection，删除当前餐厅后选择下一家或 null，logout 删除 storage。

### Restaurant 与 Menu

- [x] 用 TanStack Form/Zod 实现创建餐厅的 name/category/address/image；成功选择新餐厅并跳转 overview。
- [x] 实现编辑餐厅；Category 只读，isDirty 阻止误离开，成功后按服务端值 reset。
- [x] 实现 Danger zone 删除确认、cache/list/selection 清理和安全后端约束错误；不得级联破坏历史订单。
- [x] 实现 decimal string 到 cents 的严格 parser，拒绝负数、多于两位小数和溢出。
- [x] 用 nested field arrays 实现 Dish option/choice builder，校验至少一个 choice 及 `0 ≤ min ≤ max ≤ choices.length`。
- [x] 编辑时保留服务端 option/choice ID；新行只用独立 UI key，不伪造 API UUID、不以 index 作 React key。
- [x] 实现 Menu/Dish create/edit/delete；成功后 refetch 当前 `myRestaurant`，不乐观猜测新 option ID。
- [x] 实现 Restaurants list、首次使用 empty、overview、menu 与 settings 页面及 1280px/375px 布局。

### Orders 与提醒

- [x] 复用 Orders 实现 PENDING→COOKING、COOKING→WAITING 两个 Owner action，失败 refetch 且不乐观推进。
- [x] 实现 pending notifier 的按 ID 去重、badge、持久 Toast、View action 与进入 COOKING/关闭/卸载时清理。
- [x] 断线使用 Orders banner，重连通过 PENDING refetch 校准 badge；不播放声音或申请 Notification API。

## 测试与验收

- [x] 覆盖 selection URL/storage/list 优先级、删除、logout 和 store 隔离。
- [x] 覆盖 Restaurant 表单校验、图片适配、create/edit/delete、dirty block 与重复提交。
- [x] 覆盖 money parser、Dish nested arrays、min/max、稳定 ID、错误焦点和 CRUD refetch。
- [x] 覆盖五态 action policy 及 notifier 去重、Toast 生命周期、disconnect/refetch。
- [x] API build 和类型检查通过，并核对 Restaurant/Dish ownership guard、成功与失败路径的 GraphQL/service 契约证据；API Jest 不作为本轮门禁。

## 完成条件

以上所有任务均为 `[x]`，且多餐厅上下文确定、Category 不可由 Owner 管理、Order 状态不形成第二份状态后，才可在 [`progress.md`](./progress.md) 勾选本模块。
