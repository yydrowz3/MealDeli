# 阶段 8：生产就绪

## 目标

把已迁移的核心纵向切片变成可部署、可观察、可安全运维和可恢复的服务。所有措施以实际威胁、故障和测量为依据，不为展示技术名词引入无使用路径的组件。

## 1. 配置与启动

- 所有必需配置在启动时验证，生产忽略本地 `.env`。
- `.env.example` 只包含安全占位和解释，不含真实 secret。
- 记录 proxy/TLS termination 边界以及 `trust proxy` 策略。
- 启动顺序：配置验证 → logger/context → Prisma/必要依赖 → Nest listen → readiness true。
- 关闭顺序：readiness false → 停止接收新流量 → 等待在途请求/worker → 关闭 WS → 断开数据库。
- 为 SIGTERM/SIGINT 和超时强制退出写测试或可重复演练脚本。

## 2. Web 与 GraphQL 安全

### HTTP

- Helmet/安全 header，结合 GraphQL IDE 和上传需求调整 CSP。
- CORS 只允许明确前端 origin、method、标准 `Authorization` 和其他必要 headers。
- 限制 JSON、multipart body 大小和请求超时。
- 默认使用 TLS，由可信代理传递协议/客户端信息。
- JWT 位于显式 header 时记录 CSRF 风险模型；若将来使用 cookie，重新设计 SameSite/CSRF token。

### GraphQL

- 生产关闭 GraphiQL；introspection 是否关闭基于运维和客户端需要决定。
- query depth/complexity limit，按角色和目标 API 的已知操作/测量校准。
- 限制 aliases、batching、变量/字符串长度和分页上限。
- 对 login、verification、search、uploads 和 Webhook 设置合适限流。
- 避免 error stack、Prisma code、SQL 和内部路径进入 GraphQL extensions。
- schema artifact 作为评审产物，breaking change 在 CI 中显式失败。

### 依赖与 secret

- 自动依赖漏洞扫描并制定修复 SLA；升级仍需兼容性验证。
- 最小权限数据库账户，生产 migration 与 runtime 权限可分离。
- 定义 JWT/payment/storage/mail secret rotation 流程。
- 日志和 tracing attributes 统一清洗 token、password、verification code、Webhook signature 和个人数据。

## 3. 可观测性

### 结构化日志

每条请求/事件日志包含：

- timestamp、level、service/version、environment
- request/correlation ID
- transport 和 operation name/route
- authenticated user ID（允许时）与 role，不记录 token
- latency、outcome、safe error code
- provider/event/job ID（异步路径）

使用 Nest Logger adapter，不在业务代码散落 `console.log`。错误日志保留 cause chain，但对敏感参数做 redaction。

### Metrics

至少设计：

- HTTP/GraphQL request count、error rate、latency histogram
- DB query/transaction latency、pool saturation、timeout
- WS active connections、subscription count、disconnect/error
- order created/claimed/delivered 与 illegal transition count
- payment verified/rejected/duplicate
- upload size/failure
- job lag、retry、dead-letter/failed count

避免把 user ID、order ID 等高基数字段用作 metric label。

### Tracing

先保留 instrumentation seam 和 correlation ID。当需要跨 DB/queue/provider 定位延迟时接入 OpenTelemetry；明确采样、敏感属性和成本。没有 collector/查看流程时不要仅生成无人消费的 spans。

### 告警与 SLO

定义用户可感知指标，例如：

- GraphQL 核心操作可用率/延迟。
- 下单成功率。
- 抢单冲突率与异常失败率。
- Webhook 处理 lag。
- 邮件/job backlog。

告警基于持续错误预算/业务影响，而不是每个单次异常都呼叫人员。

## 4. 性能与容量

建立可重复基线场景：

- 餐厅首页/搜索分页。
- 餐厅详情含 Dish/options。
- 下单 transaction。
- 两个或更多 Delivery 竞争抢单。
- 长连接订阅和事件 fan-out。
- Webhook burst 与 promotion expiry batch。

记录数据规模、并发、硬件/容器资源、p50/p95/p99、吞吐、错误率、DB query count 和 pool 使用。先测量，再优化索引、select、DataLoader、缓存和 pool；每次只改变一个主要变量。

连接池配置必须结合实例数和 PostgreSQL 总连接上限：

```text
实例数 × 每实例最大连接 + migration/运维余量 <= PostgreSQL 安全上限
```

## 5. Health、可靠性与降级

- liveness 只检测进程能否继续运行。
- readiness 检查接流量必需依赖，失败时从负载均衡摘除。
- 外部 mail/storage/payment 不一定阻断整个 API readiness；对应功能通过 timeout、错误分类和有限重试降级。
- 重试只用于 transient 且幂等操作，指数退避加 jitter，设总时限。
- circuit breaker 只在持续供应商故障已被观测且能提供合理 fallback 时加入。
- graceful shutdown 包含 HTTP、WebSocket、worker 和 Prisma 连接池。

## 6. CI 质量门禁

建议 CI 阶段：

1. lockfile 校验与依赖安装。
2. Prisma format/validate/generate。
3. TypeScript typecheck。
4. non-fixing ESLint。
5. unit tests。
6. disposable PostgreSQL migration + integration tests。
7. Nest GraphQL/HTTP/WS e2e 与目标 API contract tests。
8. API build、container build 和基础漏洞扫描。
9. schema/migration diff artifact，以及阶段 9 所需的前端适配清单。

前端 Vitest/build/codegen diff 不属于当前后端生产就绪门禁；它们在阶段 9 基于稳定 API 启用。

CI 失败不能靠自动 `lint --fix` 掩盖；格式化修改在开发阶段显式执行并 review。

## 7. 部署与数据库 migration

- build artifact/container 不包含 `.env`、测试数据或开发 secret。
- 部署使用 `prisma migrate deploy` 应用已评审 migration。
- migration 采用 expand/contract：先加入兼容结构、部署双读/回填、切换、最后删除旧结构。
- 大表索引/回填评估锁和运行时间；需要时分批或使用 PostgreSQL 合适机制。
- API 启动不能偷偷运行 destructive migration。
- migration 失败时停止发布并保留诊断；优先 forward-fix，回退应用前确认 schema 仍向后兼容。

## 8. 备份与恢复

- 明确 PostgreSQL 自动备份、保留期、加密和恢复权限。
- 定期执行 restore drill，而不是只确认存在备份文件。
- 定义 RPO/RTO，并记录订单/支付数据的恢复优先级。
- 对象存储生命周期、孤立文件清理和删除恢复策略单独记录。
- 支付供应商事件可作为外部对账来源，但不能替代数据库备份。

## 9. 建议 PR 顺序

1. request context、结构化日志、error taxonomy 和 redaction。
2. security headers、CORS、body limits、GraphQL complexity 和 rate limits。
3. metrics 与 health/readiness 完善；建立 dashboard/告警最小集合。
4. graceful shutdown、provider timeout/retry 和 degraded-path tests。
5. CI disposable PostgreSQL、GraphQL/WS contract 和 build gates。
6. container/deploy migration、expand/contract 与操作手册。
7. baseline load tests、query/pool 优化和容量记录。
8. backup/restore drill、incident/rollback/forward-fix 演练。

## 10. 验收标准

- [ ] 生产日志结构化、可关联且不会记录 secrets。
- [ ] 核心请求、DB、WS、job 和 provider 有可用 metrics。
- [ ] Helmet、CORS、rate limit、body limit 和 GraphQL complexity 有配置与测试。
- [ ] liveness/readiness/graceful shutdown 语义经过故障测试。
- [ ] CI 从空 PostgreSQL 应用 migration 并运行 unit/integration/e2e/contract/build。
- [ ] 部署只使用 reviewed `migrate deploy`，有 expand/contract 与 forward-fix 方案。
- [ ] 关键场景有可重复性能基线，优化有前后数据。
- [ ] 备份恢复、secret rotation 和供应商故障有操作说明或演练证据。
- [ ] 完成 production readiness learning note 和必要 ADR。

## 11. 面试复盘重点

- liveness 与 readiness 为什么不能做成同一个检查。
- correlation ID、metrics 和 distributed tracing 各解决什么问题。
- query complexity 与 rate limiting 为什么要同时存在。
- zero-downtime migration 的 expand/contract 流程。
- connection pool 为什么必须考虑实例总数。
- rollback 与 forward-fix 在不可逆数据 migration 下如何选择。

## 参考

- [NestJS logging](https://docs.nestjs.com/techniques/logger)
- [NestJS Helmet](https://docs.nestjs.com/security/helmet)
- [NestJS CORS](https://docs.nestjs.com/security/cors)
- [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting)
- [NestJS health checks](https://docs.nestjs.com/recipes/terminus)
- [NestJS GraphQL query complexity](https://docs.nestjs.com/graphql/complexity)
- [Prisma connection pooling](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool)
