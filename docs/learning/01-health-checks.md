# Health checks：liveness 与 readiness

## 实现的用户与运维行为

- `GET /health/live` 只证明 MealRelay API 进程可以响应，不访问 PostgreSQL 或外部网站。
- `GET /health/ready` 使用 Terminus 的 `PrismaHealthIndicator` 检查 PostgreSQL；成功返回 HTTP 200，失败返回 HTTP 503。
- GraphQL `apiStatus` 提供最小 Query root，使当前 code-first Apollo 应用可以生成并评审 schema；它不替代基础设施使用的 HTTP health probes。

## 请求路径

```text
GET /health/live
  -> HealthController
  -> HealthCheckService
  -> ok

GET /health/ready
  -> HealthController
  -> HealthCheckService
  -> PrismaHealthIndicator (1 second timeout)
  -> PrismaService
  -> PostgreSQL SELECT 1
```

HealthModule 显式导入 PrismaModule，没有创建 request-scoped 或额外 Prisma Client。

## 决策与取舍

### 分离 liveness 和 readiness

liveness 不依赖数据库，因此运行期间 PostgreSQL 暂时故障不会把进程误判为死锁并触发重启风暴。readiness 包含数据库，因为 API 的核心业务需要 PostgreSQL，数据库不可用时实例不应继续接收业务流量。

### 使用 Terminus 内置 Prisma indicator

使用当前 `@nestjs/terminus` 提供的 `PrismaHealthIndicator`，而不是在 Controller 中复制查询、timeout 和 health result 映射。检查超时固定为一秒，响应不包含连接 URL、SQL 错误或凭据。

### 拒绝外部文档 ping

最初的 health 实现 ping `https://docs.nestjs.com`。该网站与 MealRelay 接流量的能力无关，网络或文档站故障会产生错误下线，因此已移除 `HttpHealthIndicator` 以及直接的 Axios 依赖。

### 当前限制

PrismaService 目前在 `onModuleInit` 中显式 `$connect()`。因此如果 PostgreSQL 在进程首次启动时不可用，Nest 可能在开始监听前就启动失败；现有 readiness 主要覆盖成功启动后的数据库故障。后续 Foundation 工作需要明确选择“启动失败”还是“进程启动但 readiness 为 down”，并用真实 PostgreSQL 故障测试固定语义。

## 失败与安全行为

- 数据库不可用时 `/health/ready` 返回 503 和通用的 `database: down`。
- 数据库异常 cause 不进入 HTTP response。
- `/health/live` 不执行 Prisma 查询。
- e2e 使用注入的 Prisma fake，不访问开发、共享或真实 PostgreSQL。
- 测试环境变量只使用本地占位值，不包含 secret。

## 自动测试证据

验证日期：2026-08-06。

```text
TypeScript typecheck: passed
ESLint (non-fixing): passed
Unit: 3 suites, 4 tests passed
E2E: 1 suite, 4 tests passed
Nest build: passed
```

覆盖范围：

- liveness 成功且不查询 PostgreSQL；
- readiness 数据库成功路径；
- readiness 数据库失败时 HTTP 503；
- 最小 GraphQL `apiStatus` 查询；
- Health Controller 的依赖组合和一秒 timeout；
- Nest app 正确关闭。

当前 e2e 使用 Prisma fake，尚未证明真实 PostgreSQL adapter、连接池或网络 timeout。Foundation 的 disposable PostgreSQL 建立后，应增加真实集成测试。

## 性能观察

- liveness 没有外部 I/O。
- readiness 每次执行一次轻量数据库 ping，timeout 为一秒。
- 目前没有高频 probe 的延迟/连接池测量。部署时应控制探测频率，避免 readiness 本身对连接池产生可见压力。

## 面试问题

### liveness 和 readiness 有什么区别？

- liveness 判断进程是否需要重启。
- readiness 判断实例是否应该接收新流量。
- 数据库故障通常影响 readiness，但不应直接影响 liveness。

### 为什么不 ping NestJS 文档网站？

- 它不是 MealRelay 的运行依赖。
- 将无关外部服务加入 readiness 会扩大故障域并产生错误摘流。

### 为什么数据库失败返回 503？

- 实例暂时无法完成依赖数据库的核心请求。
- 503 表示服务当前不可用，基础设施可以停止把新流量路由到该实例。

### 为什么 e2e 要覆盖数据库失败路径？

- 成功路径不能证明 HTTP status 和错误 payload 的降级语义。
- 失败测试也验证客户端不会收到数据库内部错误。

### 当前测试还缺少什么？

- disposable PostgreSQL 上的真实 Prisma ping；
- 数据库启动失败与运行中断线的区别；
- readiness timeout 和恢复后的重新变为 ready；
- graceful shutdown 与并发 probe 的行为。

## 官方参考

- [NestJS health checks](https://docs.nestjs.com/recipes/terminus)
- [NestJS testing](https://docs.nestjs.com/fundamentals/testing)
- [NestJS lifecycle events](https://docs.nestjs.com/fundamentals/lifecycle-events)
- [Prisma connection management](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management)
