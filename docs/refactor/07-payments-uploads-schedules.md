# 阶段 7：支付、上传与调度

## 目标

安全地接入三个 HTTP/后台边界：经过供应商验证且幂等的支付事件、限制严格的文件上传，以及七天餐厅推广的激活/过期。所有供应商 SDK 位于可注入适配器后，外部 I/O 不进入数据库事务。

## 7A. 支付与推广

### 当前风险

旧流程接受客户端 `transactionId` 后直接创建 Payment 并激活推广，没有验证供应商事件真实性，也无法安全处理重复请求。这个行为不应原样兼容。

### 推荐流程

1. Owner 在已认证 GraphQL mutation 中为自己的 Restaurant 发起推广购买/checkout。
2. 服务端创建内部 purchase intent，并把可信 restaurant/user metadata 传给支付供应商。
3. 供应商向 HTTP Webhook 发送事件。
4. Controller 在解析业务 payload 前使用 raw body、签名 header、时间戳和配置 secret 验签。
5. 应用服务使用 `providerEventId` 唯一约束实现幂等。
6. 在短数据库事务中记录 verified payment event、payment 与 promotion activation。
7. commit 后发布 `PromotionActivated`。

如果暂时保留 `createPayment` GraphQL 名称，它只能确认/查询已被供应商验证的状态，不能信任客户端 transaction ID 激活推广。更清晰的目标契约变化应在本切片通过 schema、后端测试和文档固定，前端适配记录到阶段 9。

### 数据模型

建议区分：

- `PaymentAttempt` 或 checkout intent：用户发起的购买意图。
- `PaymentEvent`：供应商事件，`providerEventId` 唯一，保存处理状态和非敏感摘要。
- `Payment`：已验证的业务支付事实，关联 Owner/Restaurant、金额、币种和 provider reference。
- `Restaurant.promotedUntil`：推广的真实截止时间。

GraphQL `isPromoted` 推荐按 `promotedUntil > now` 计算，避免 scheduler 延迟时错误展示。调度任务仍负责清理过期字段/缓存和发布事件。

### 七天规则

- 激活时间使用注入的 Clock 和 UTC。
- 明确重复购买是从 `max(now, currentPromotedUntil)` 延长七天，还是从 now 重置；选定行为写入测试。
- payment、promotion update 和 event record 在同一事务。
- 同一 provider event 重放返回已有结果，不重复延长。
- amount、currency、restaurant metadata 必须与服务端期望一致。

### Webhook 安全

- 使用供应商官方签名算法与容忍时间窗口。
- 原始 body 不能被通用 JSON parser 改写后再验签。
- 拒绝缺失签名、过期时间戳、错误 secret、未知 event type 和 metadata 不匹配。
- 返回码策略支持供应商重试，又不泄露内部细节。
- secret、完整 card/payment payload 不写日志；只记录 event ID、类型、处理结果和 request ID。

## 7B. 安全上传

当前状态审计、7A 前置收口、目标 HTTP 契约、逐文件完整代码和验证矩阵见 [阶段 7A 收口与阶段 7B 安全图片上传实施蓝图](./07-secure-upload-implementation.md)。

### 外部契约

- `POST /uploads`
- multipart field `file`
- 成功至少返回 `{ ok: true, url }`

失败时返回安全 error；不需要维持旧实现的公共 fallback 图片 URL。历史前端依赖只作为阶段 9 的适配证据，不约束目标上传契约。

### 校验与存储

- 验证文件存在、单文件数量、最大字节数。
- MIME allowlist 只是第一层，同时检查 magic bytes/实际类型。
- 限制图片尺寸/像素数，防止 decompression bomb；需要时重新编码并去除 metadata。
- 对象 key 使用服务端 UUID/随机值和允许的扩展名，不拼接 `originalname`。
- bucket、public/private policy 和 URL 生成由 Storage port/adapter 管理。
- 设置 provider timeout，失败不返回伪成功 URL。
- 若 DB 记录和对象存储需要协调，采用补偿删除/异步清理，不把网络上传放进 DB transaction。

### 上传授权

- 明确哪些角色可以上传、上传用于何种资源。
- Owner 上传餐厅图片后，在更新 Restaurant 时仍检查 ownership。
- 避免通用上传端点成为任意文件托管服务；对象前缀、类型和引用生命周期需受控。
- 限流和请求体大小限制同时作用在反向代理和应用层。

## 7C. 调度与过期

### 过期逻辑

- 定时任务批量选择 `promotedUntil <= now` 的 Restaurant。
- 使用单条/批次条件更新，不使用未 await 的 async `forEach`。
- 任务可重复运行：已过期记录再次处理不产生副作用。
- 发布 `PromotionExpired` 只针对本次实际发生的转换。
- 失效首页/分类缓存，使 promoted 排序及时更新。

### 多实例安全

最低要求是条件更新确保多个实例不会重复改变状态。需要严格单次副作用时，可选择：

- PostgreSQL advisory lock；
- job row claim/`SKIP LOCKED`；
- 共享 scheduler/queue；
- outbox 事件幂等消费。

先根据部署模型选择最简单方案，并记录锁失效、实例崩溃和重试行为。业务读取以 `promotedUntil` 为真相，因此 scheduler 暂时延迟不会错误延长推广。

## 供应商端口

```text
PaymentProvider
  - createCheckout(...)
  - verifyWebhook(rawBody, headers)

ObjectStorage
  - putObject(key, bytes, contentType)
  - deleteObject(key)
  - getPublicUrl(key)

Clock
  - now()
```

测试使用 fake provider、in-memory/recording storage 和 fixed clock，不访问真实网络。

## 建议 PR 顺序

1. Promotion/PaymentEvent schema、Clock、七天领域规则和 migration tests。
2. PaymentProvider port、raw-body Webhook、签名失败测试。
3. provider event 唯一约束、payment/promotion transaction 和重放测试。
4. 旧 `createPayment` 与目标支付契约差异记录，并加入阶段 9 前端适配清单。
5. ObjectStorage port、上传限制和 HTTP e2e。
6. 幂等 promotion expiry job、多实例条件更新和缓存失效。
7. provider timeout、结构化日志、故障恢复和阶段契约回归。

## 测试矩阵

| 领域 | 必测行为 |
| --- | --- |
| Webhook | 正确签名、错误签名、旧时间戳、未知事件、raw body 被修改 |
| 幂等 | 同 provider event 顺序/并发重放只创建一次 Payment、只延长一次 |
| 金额 | currency/amount/restaurant metadata 不匹配拒绝 |
| 推广 | fixed clock 下恰好七天、连续购买规则、UTC 边界 |
| 上传 | 无文件、超大、伪 MIME、恶意名称、多文件、provider timeout |
| 授权 | 非 Owner 上传/绑定、Owner A 修改 Owner B 餐厅图片失败 |
| 调度 | 批量过期、重复运行、多实例重叠、只发布实际转换事件 |
| 外部失败 | storage/payment timeout 不留下伪成功业务状态 |

## 验收标准

- [ ] 只有验签成功且业务字段匹配的事件可以激活推广。
- [ ] provider event 有唯一约束，顺序与并发重复请求均幂等。
- [ ] 七天规则由 fixed clock 测试，不依赖墙上时钟。
- [ ] `isPromoted` 在 scheduler 延迟时仍反映真实截止时间。
- [ ] 上传校验实际内容、大小和生成 key，且 SDK 位于适配器内。
- [ ] 外部 I/O 不在数据库 transaction 中。
- [ ] expiry job 可重入、多实例安全并正确失效缓存。
- [ ] 完成 Webhook、upload attack 和 scheduling failure modes 的 learning note。

## 面试复盘重点

- Webhook signature 与用户 JWT 解决的不同问题。
- 数据库 unique constraint 如何实现幂等消费。
- 为什么外部 I/O 不应放进交互式事务。
- DB 与对象存储无法原子提交时怎样补偿。
- 多实例 cron 与业务时间真相如何解耦。

## 参考

- [NestJS file upload](https://docs.nestjs.com/techniques/file-upload)
- [NestJS task scheduling](https://docs.nestjs.com/techniques/task-scheduling)
- [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- 选定支付与存储供应商后，必须补充其官方 Webhook 签名和上传安全文档。
