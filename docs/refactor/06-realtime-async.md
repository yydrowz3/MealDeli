# 阶段 6：实时与异步工作

> 本文件描述阶段目标。2026-08-09 的实际仓库审计、阶段 5 收口门禁、依赖兼容修正、全部手写代码与验证矩阵见 [Orders 收口与 Realtime/Async implementation 蓝图](./06-realtime-async-implementation.md)。

## 目标

在订单事务已经可靠的基础上，交付经过认证和授权的 `graphql-ws` 订阅，并把领域事件放到可替换端口后；现有邮件已经位于 adapter port 且在 commit 后调用，本阶段不把 secret-bearing verification command 搬到易丢的进程内事件。先完成简单可靠核心，再根据多实例/可靠投递需求决定是否加入 Redis、BullMQ 或 transactional outbox。

## 外部契约

目标 API 通过 `ws://localhost:3000/graphql` 和 `graphql-ws` 提供：

- `pendingOrders`：只发送给对应 Restaurant Owner。
- `cookedOrders`：向 COURIER 发送不含客户 PII/订单明细的最小可抢订单 offer。
- `orderUpdates(input)`：只发送给有权查看该订单的参与者。
- `Authorization` connection parameter 中的 `Bearer <JWT>`。

订阅 payload、字段、nullability 和过滤规则应与 HTTP 查询使用相同授权策略。

## 设计原则

1. 领域代码发布业务事实，不依赖 GraphQL PubSub 类。
2. 只发布已经 commit 的状态。
3. 认证发生在 WebSocket 连接/订阅建立时，授权在每个订阅及事件过滤时继续执行。
4. 事件 payload 只包含必要 ID/事实；消费者按需读取最新、授权后的数据。
5. 断线、取消订阅和 app shutdown 必须清理 listener/iterator。
6. 首版 delivery guarantee 必须诚实描述，不能把内存事件称为可靠消息。

## 事件模型

建议领域事件：

```text
OrderCreated
OrderStatusChanged
OrderClaimed
UserVerificationRequested
UserEmailChanged
PromotionActivated       # 阶段 7
PromotionExpired         # 阶段 7
```

本次 Level 1 实施只落地前三个 Order 事件。User 事件是未来 durable delivery 候选，不能携带 raw verification token；Promotion 事件属于阶段 7。

每个事件至少包含：

- `eventId`
- `occurredAt`
- aggregate ID
- 对应状态变化的最小 metadata
- correlation/request ID（如果由请求触发）

不要把完整 User/Order persistence record 放入事件，避免 password/internal 字段泄露和 schema 耦合。

## 端口与适配器

```text
Application service
  └─ DomainEventPublisher port
       ├─ InMemoryEventBus adapter       # 单实例开发/首版
       ├─ GraphQLSubscription adapter
       └─ Durable/shared adapter          # 有明确需求时：Redis/BullMQ/outbox

Async handler
  └─ Mailer port
       ├─ FakeMailer                      # 测试
       └─ Resend adapter                  # 当前生产配置
```

事件发布端口应能在测试中记录事件及发布时机。外部邮件端口需要 timeout、可分类错误和安全日志，不允许真实网络调用进入单元/e2e。

## GraphQL WebSocket 认证

- 使用 `graphql-ws`，不引入 deprecated `subscriptions-transport-ws` 或旧 `installSubscriptionHandlers` 流程。
- 在握手中读取名为 `Authorization` 的 connection parameter，严格解析 `Bearer <JWT>` 并验证签名、过期时间和 claims；不读取 `x-jwt`。
- 将最小 principal 放入 typed WS context，不保存原 token 到长期日志或事件。
- 缺失/无效/过期 token 拒绝连接或订阅，行为保持一致并有 client 测试。
- token 在长连接期间过期的策略要明确：立即断开、下一事件检查或规定最大连接寿命。
- HTTP 与 WS 使用同一 token verifier，避免认证逻辑分叉。

## 订阅授权与过滤

### pendingOrders

- 仅 OWNER 可订阅。
- 事件中的 restaurant ID 必须属于该 principal。
- 即使 owner 关系在订阅建立后改变，事件交付前仍应按当前授权策略验证。

### cookedOrders

- 仅 COURIER 可订阅。
- 只发送 `COOKED` 且未分配 courier 的订单；未抢单 feed 使用不含客户 PII/明细的最小 offer。
- 事件送达不代表抢单成功，最终归属仍由阶段 5 的数据库 compare-and-set 决定。

### orderUpdates

- 建立订阅前验证订单存在且当前 principal 可查看。
- 每次事件按 order ID 过滤，并防止嵌套字段泄露。
- 订单参与者关系变化后重新评估授权。

过滤函数中的数据库查询可能形成热点，应先测量，再决定把授权 metadata 放入事件或批量加载。

## 投递可靠性分层

### Level 1：进程内事件总线

适用于单实例学习/开发：实现最简单，但进程退出会丢消息，多实例之间不可见。必须通过接口隔离并在文档中标明限制。

### Level 2：共享 Pub/Sub 或队列

当需要多 API 实例时，使用共享 transport。Pub/Sub 适合在线实时通知但离线会丢；队列适合可重试后台任务但不是直接广播所有订阅的替代品。

### Level 3：Transactional outbox

只有在“数据库 commit 成功后事件不可丢”成为具体需求时加入。Order 事务同时写 outbox row，worker claim/publish/mark；消费者仍需幂等。必须测试重复投递、worker 崩溃、重试和清理成本。

不要在首个订阅 PR 同时引入所有层级。

## 邮件可靠异步化（当前延后）

现有验证邮件已经通过 Mailer port 在 commit 后调用，并有 provider idempotency key 与 timeout。当前不把 raw verification token 放入易丢的内存事件。只有出现可靠重试、可观察失败状态或 dead-letter 的实际需求后，才设计 secret persistence、transient/permanent error、有限退避和 durable queue/outbox，并单独评审安全边界。

## 建议 PR 顺序

1. 定义事件类型、publisher port、recording fake 和提交后发布测试。
2. 加入 `graphql-ws` 配置、typed context 和真实 client handshake tests。
3. `pendingOrders`、`cookedOrders`、`orderUpdates` 的角色/ownership/filter 测试。
4. listener cleanup、断线、重连和 graceful shutdown。
5. 审计现有 Mailer port/timeout/commit boundary；不在首个订阅 PR 中队列化邮件。
6. 基于实测部署需求决定共享 transport/outbox；需要时单独 ADR/PR。

## 测试矩阵

| 边界 | 必测行为 |
| --- | --- |
| WS 认证 | 合法、缺失、伪造、过期 token；HTTP/WS verifier 一致 |
| 角色 | `CUSTOMER` 不能订阅 `OWNER`/`COURIER` feed |
| 所有权 | `OWNER` A 收不到 `OWNER` B 的 pending order |
| 订单参与者 | 非 customer/owner/courier 收不到 `orderUpdates` |
| 竞态 | 两个 `COURIER` 都可能看到 cooked 事件，但只有一个 `takeOrder` 成功 |
| 事务 | DB commit 失败不发布；commit 后发布正确 event ID |
| 生命周期 | 取消/断线释放 iterator；app close 无 open handle |
| 邮件（后续可靠队列切片） | success/timeout、transient retry、permanent failure、secret 清洗 |
| 共享/outbox（如实现） | 重复投递、worker 崩溃、重新 claim、消费者幂等 |

## 验收标准

- [ ] 使用真实 `graphql-ws` 测试客户端和标准 bearer connection parameter 成功连接，并证明 `x-jwt` 被拒绝；浏览器前端迁移延后到阶段 9。
- [ ] 三类订单订阅按 role、ownership 和 order ID 正确过滤。
- [ ] HTTP 查询与订阅字段使用相同授权语义。
- [ ] 领域服务不直接依赖 GraphQL PubSub 或邮件 SDK。
- [ ] 事件只在 commit 后发布，失败事务不产生通知。
- [ ] 断线、取消和 shutdown 不遗留 listener/open handle。
- [ ] 当前投递保证和单实例/多实例限制写入 learning note。
- [ ] 只有在实际需要时才通过 ADR 引入 Redis/BullMQ/outbox。

## 面试复盘重点

- WebSocket 握手认证与每条事件授权为什么都需要。
- Pub/Sub、queue 和 outbox 解决的不是同一个问题。
- commit 后直接 publish 的崩溃窗口是什么。
- at-most-once、at-least-once 与 exactly-once myth。
- 多实例下进程内 PubSub 为什么失效。

## 参考

- [NestJS GraphQL subscriptions](https://docs.nestjs.com/graphql/subscriptions)
- [NestJS queues](https://docs.nestjs.com/techniques/queues)
- [NestJS events](https://docs.nestjs.com/techniques/events)
- [graphql-ws documentation](https://the-guild.dev/graphql/ws/docs)
