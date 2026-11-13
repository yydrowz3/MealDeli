# 阶段 5：订单与并发

> 当前状态审计、Catalog 前置收口门禁、文件级实施顺序和完整目标代码见 [05-orders-concurrency-implementation.md](./05-orders-concurrency-implementation.md)。

## 目标

交付可信服务端计价、原子订单创建、显式状态机、基于角色和所有权的读取/修改，以及多个 Delivery 用户同时抢单时只有一个成功的并发保证。

## 外部契约

重点覆盖：

- `createOrder`
- `getOrder`
- `getOrders`
- `editOrder`
- `takeOrder`
- `OrderStatus`
- 订单 fragment 中客户、餐厅、司机、items、options、total 等字段

实时 `pendingOrders`、`cookedOrders`、`orderUpdates` 的传输在阶段 6 完成；本阶段先产生可测试的领域事件事实。

## 状态机

| 当前状态 | 操作者 | 动作 | 下一状态/结果 |
| --- | --- | --- | --- |
| 新订单 | Client | 创建 | `Pending` |
| `Pending` | 所属餐厅 Owner | 开始制作 | `Cooking` |
| `Cooking` | 所属餐厅 Owner | 制作完成 | `Cooked` |
| `Cooked` 且无 driver | Delivery | 抢单 | 状态仍为 `Cooked`，原子设置 driver |
| `Cooked` 且为该 driver | Delivery | 取餐 | `PickedUp` |
| `PickedUp` 且为该 driver | Delivery | 送达 | `Delivered` |

任何跳级、回退、错误角色、错误餐厅 Owner、非该订单 driver 或 Client 编辑都必须失败。应用服务同时检查 actor、资源关系和 current state。

## 数据模型与快照

### Order

- `id`
- `customerId`
- `restaurantId`
- nullable `driverId`
- `status`
- `total`（可靠货币表示）
- timestamps
- 可选 idempotency key/version

### OrderItem

订单必须保留购买时事实，不能只关联可变 Dish：

- 原 Dish ID（可选保留外键或普通引用）
- dish name snapshot
- base price snapshot
- selected options snapshot
- line total snapshot
- quantity（若契约支持；否则明确为 1）

历史订单不能因 Dish 名称、价格或 option definition 后续变化而改变。

## 服务端计价

1. 客户端只提交 dish ID、option/choice 标识和数量，不提交可信价格。
2. 事务内加载属于目标 Restaurant 的所有 Dish；批量查询避免每 item 一次查询。
3. 使用严格 domain parser 校验 option definition。
4. 验证每个选择确实属于该 Dish，处理 required、重复、未知和多选规则。
5. 用整数最小货币单位或明确 Decimal 规则计算 line total 和 order total。
6. 将名称、单价、选择与总价作为快照写入 OrderItem。

旧实现把 choice 的匹配名称与 option 名称混用，这一行为必须用测试显式纠正，不能机械迁移。

## 事务与事件

创建订单在一个短事务中完成：

1. 读取可信菜单数据。
2. 计算价格。
3. 创建 Order。
4. 创建全部 OrderItems/snapshots。
5. 提交。
6. 提交成功后发布 `OrderCreated/PendingOrderAvailable` 领域事件。

事务内部不发送 WebSocket、邮件或其他网络请求。若 commit 之后进程崩溃会造成事件丢失，在阶段 6 根据真实可靠性需求评估 outbox；首版通过事件端口明确这个边界。

## 并发策略

### 抢单

使用单条条件更新/compare-and-set，而不是“先查 driver 再保存”：

```text
UPDATE order
SET driver_id = :driverId
WHERE id = :orderId
  AND status = 'Cooked'
  AND driver_id IS NULL
```

受影响行数为 1 才表示成功；0 需要区分 not found、状态不允许或已被抢，但客户端信息不应泄露不必要细节。数据库层还应有与模型一致的约束/索引。

### 状态转换

状态更新使用 `WHERE id/currentStatus/owner-or-driver` 的条件更新或事务锁定，防止两个请求基于同一旧状态相互覆盖。明确 isolation level 和 retry 条件；只对可识别的 serialization/deadlock 错误做有限、带抖动重试。

### 幂等

- 对订单创建评估客户端 idempotency key；如加入输入，在目标 schema 和后端契约测试中固定，并把旧前端适配记录到阶段 9。
- 数据库对 `(customerId, idempotencyKey)` 建唯一约束。
- 同 key、同 payload 返回原结果；同 key、不同 payload 返回 conflict。
- 状态命令可按当前状态自然幂等或明确拒绝，行为必须记录并测试。

## 授权与查询

- Client 只能读取自己的订单。
- Owner 只能读取其餐厅订单。
- Delivery 只能读取已分配给自己的订单；可抢的 cooked-order 列表通过专门查询/订阅暴露最少字段。
- 查询条件本身带 actor 范围，避免先加载完整对象再仅靠内存判断。
- GraphQL relation field resolver 也要遵守相同授权，不能通过嵌套字段绕过顶层检查。

## 建议 PR 顺序

1. Order/OrderItem schema、状态 enum、migration 与状态机纯函数测试。
2. 计价 domain service、option 校验和 property/table-driven tests。
3. 原子 createOrder transaction、价格快照与 PostgreSQL integration tests。
4. getOrder/getOrders 的 actor-scoped queries 和 GraphQL e2e。
5. Owner/Delivery 状态转换的条件更新和拒绝路径。
6. takeOrder compare-and-set 与真正重叠的并发测试。
7. idempotency、提交后事件端口和完整契约回归。

## 测试矩阵

| 类别 | 必测行为 |
| --- | --- |
| 计价 | base、extra、choice、重复/未知 option、Dish 不属于餐厅、价格舍入 |
| 快照 | 菜品改价/删除后历史订单 total 与名称不变 |
| 事务 | 任一 item 非法时不创建 Order 或孤立 OrderItem |
| 状态机 | 每条合法边和全部非法跳转 |
| 授权 | 错误 Client、Owner、Driver 读取/修改均失败 |
| 抢单 | 两个独立 DB 请求重叠执行，恰好一个成功 |
| 状态竞态 | 两个状态命令不能丢失更新或产生非法最终状态 |
| 幂等 | 同 key 重试不重复下单，不同 payload 冲突 |
| 事件 | commit 失败不发布；commit 成功只发布预期事实 |

并发测试必须使用真实 PostgreSQL 和同步屏障/并行请求确保重叠；连续调用两次不构成竞态测试。

## 验收标准

- [ ] 订单价格完全来自服务端可信菜单数据。
- [ ] OrderItem 保存足够快照，历史订单不随目录变化。
- [ ] 所有状态转换由显式状态机约束。
- [ ] role、ownership、current state 三者均在应用服务验证。
- [ ] 抢单通过原子条件更新实现，真实并发测试恰好一个成功。
- [ ] 多写创建在一个事务内，外部事件只在 commit 后发布。
- [ ] 查询不会通过顶层或嵌套 relation 泄露其他用户订单。
- [ ] 完成包含 ACID、isolation、lost update 和 exactly-once 讨论的 learning note。

## 面试复盘重点

- compare-and-set 与悲观锁/Serializable transaction 的取舍。
- 为什么顺序重复测试不能证明并发安全。
- 订单价格快照与当前 Dish 外键分别解决什么问题。
- 数据库约束、事务 isolation 和应用状态机的职责边界。
- 幂等与 exactly-once 的区别。

## 参考

- [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [NestJS testing](https://docs.nestjs.com/fundamentals/testing)
