# MealRelay 项目难点、面试题与简历表达指南

本文用于把 MealRelay 的工程实践转化为可复盘、可追问、可举证的面试材料。内容以 `api/` 的实际实现为准，`backend/` 只作为旧系统行为来源，`docs/refactor/` 中尚未完成的设计不能提前写成已交付成果。

## 1. 使用原则

### 1.1 三种状态必须分开

| 状态 | 含义 | 面试和简历中的表达 |
| --- | --- | --- |
| 已实现 | 代码已落地，并有测试、schema、migration 或测量结果支撑 | 可以使用“实现、设计并落地、验证、优化” |
| 实现中 | 已有局部模型或脚手架，但纵向链路和验收门槛尚未闭环 | 使用“正在重构、已完成基础建模”，同时主动说明剩余工作 |
| 计划中 | 只存在阶段设计或旧系统参考代码 | 只能说“计划、目标方案、下一步”，不能说“已实现” |

面试回答优先使用以下结构：

1. 先说业务问题和约束。
2. 再说自己的方案及为什么这样选。
3. 给出代码、数据库约束、测试或测量证据。
4. 最后说明限制、替代方案和下一步。

### 1.2 当前事实边界（2026-08-06）

| 能力 | 当前状态 | 可引用证据 |
| --- | --- | --- |
| NestJS 11、Apollo code-first GraphQL 基础 | 已实现基础能力 | `api/src/app.module.ts`、生成的 `api/src/schema.gql` |
| Zod 启动配置校验 | 已实现并有单元测试 | `api/src/config/environment.variables.ts`、`api/src/config/validate-environment.spec.ts` |
| Prisma 7 PostgreSQL adapter 与应用级 Client 生命周期 | 已实现基础能力 | `api/src/prisma/prisma.service.ts` |
| liveness、readiness 与最小 GraphQL 查询 | 已实现并有单元/e2e 证据 | [`learning/01-health-checks.md`](./learning/01-health-checks.md) |
| User、EmailVerification 数据模型和身份 DTO | 初步建模，纵向链路未闭环 | `api/prisma/schema.prisma`、`api/src/users/` |
| 注册、登录、JWT、RBAC、邮箱验证 | 实现中/待完成 | [`refactor/03-identity-access.md`](./refactor/03-identity-access.md) |
| 餐厅、菜品、搜索和分页 | 计划中 | [`refactor/04-catalog-query.md`](./refactor/04-catalog-query.md) |
| 订单、服务端计价、状态机和并发抢单 | 计划中 | [`refactor/05-orders-concurrency.md`](./refactor/05-orders-concurrency.md) |
| `graphql-ws`、异步任务、支付、上传和调度 | 计划中 | [`refactor/06-realtime-async.md`](./refactor/06-realtime-async.md)、[`refactor/07-payments-uploads-schedules.md`](./refactor/07-payments-uploads-schedules.md) |
| 可观测性、CI、性能基线和生产部署 | 计划中 | [`refactor/08-production-readiness.md`](./refactor/08-production-readiness.md) |
| 新前端与目标 API 集成 | 延后 | [`refactor/09-frontend-integration.md`](./refactor/09-frontend-integration.md) |

因此，当前最适合把项目描述为“正在进行的后端重构与系统设计项目”，而不是“已经上线的完整外卖平台”。

## 2. 一分钟项目介绍

> MealRelay 是一个三角色外卖平台，包括顾客、商家和配送员。我正在把旧的 NestJS、TypeORM 后端按纵向切片重建为 NestJS 11、Apollo code-first GraphQL、Prisma 和 PostgreSQL 的模块化单体。重构重点不是机械搬运 CRUD，而是补齐标准 Bearer 认证、资源所有权、事务、订单状态机、并发抢单、服务端可信计价、订阅授权以及可测试性。当前已经落地 Zod 启动配置校验、Prisma 生命周期、GraphQL 基础和区分 liveness/readiness 的健康检查；身份、目录、订单及实时能力按阶段继续实现，每个阶段用 schema、数据库约束和自动化测试作为完成证据。

如果面试官只给 20 秒，可缩短为：

> 我在重构一个三角色外卖平台后端，技术栈是 NestJS、GraphQL、Prisma 和 PostgreSQL。项目重点是通过真实订单场景练习认证授权、事务与并发、实时事件和生产可观测性；目前基础设施已经完成，业务模块正按可测试的纵向切片迁移。

## 3. 项目最值得讲的难点

### 3.1 旧系统迁移时如何确定“正确行为”

难点不在复制代码，而在多个信息源互相冲突：旧 GraphQL schema、Resolver、数据库实体、前端 operation 和 README 可能表达不同假设，其中还包含密码字段暴露、`x-jwt`、字符串拼接搜索和未验签支付等问题。

本项目采用有优先级的证据链：

1. 新 `api/` 已通过测试的行为。
2. 明确的产品不变量、目标契约和当前标准。
3. 旧 `backend/` 的 schema、业务代码与测试。
4. `frontend/` 的历史调用方式。
5. README 等说明文字。

面试价值：这体现的是棕地系统重构、契约治理和风险控制，而不只是新建项目。可重点解释为什么安全修复可以有意打破错误的旧契约，以及为什么要通过 schema diff 和契约测试记录变化。

证据：[`refactor/01-contract-baseline.md`](./refactor/01-contract-baseline.md)。

### 3.2 GraphQL code-first 下的契约与数据泄露

GraphQL 的类型设计既是 API 契约，也是潜在的数据暴露面。若直接把 Prisma 或旧 TypeORM 实体作为输出类型，`passwordHash`、内部外键或不应公开的 relation 可能进入 schema；嵌套 relation 还可能绕过顶层查询的授权。

目标方案是：

- GraphQL DTO/API model、持久化模型和供应商 payload 分离。
- schema 由装饰器生成并稳定排序，生成物进入评审。
- `User` API model 从类型定义上就不存在密码字段，普通查询也不选择 hash。
- Resolver 保持薄，只负责 transport 映射；授权和业务不变量留在应用服务。
- 对嵌套字段单独考虑 ownership、N+1 和批量加载，不能只保护顶层 Query。

面试追问通常会落到“为什么 `@HideField()` 仍不够”“如何做 schema contract test”“GraphQL 为什么更容易出现 N+1”。

### 3.3 认证、角色与资源所有权必须分层

系统有 `CUSTOMER`、`OWNER`、`COURIER` 三种角色，但“角色正确”不等于“可以操作这个资源”。例如 `OWNER` 只能修改自己的餐厅，`COURIER` 只能更新自己已领取的订单；状态不合法时，即使角色和所有者都正确也必须拒绝。旧前端的 `Client`、`Owner`、`Delivery` 是待迁移的历史枚举值，不是目标 API 的兼容契约。

目标边界是：

- HTTP 只接受 `Authorization: Bearer <JWT>`，不保留旧 `x-jwt` fallback。
- JWT 验证产生最小 principal，不信任客户端传入的 `userId` 或 role。
- Guard 处理是否登录和粗粒度角色；应用服务再次校验 ownership 与当前领域状态。
- 密码 hash 只在认证查询中显式选择，token、密码和验证码不进入日志。
- 邮箱规范化后的唯一性由 PostgreSQL constraint 保证，而不是只做“先查再插”。

这里最重要的面试结论是：authentication 回答“你是谁”，role/authorization 回答“这类人能否做”，ownership/ABAC 回答“你能否操作这个具体对象”。

### 3.4 Prisma、PostgreSQL 与事务边界

Prisma Client 不能由每个 Resolver 创建，也不能在每次请求后断开。本项目使用 Nest 管理的单例 `PrismaService`，通过 Prisma 7 PostgreSQL driver adapter 建立连接，并绑定模块初始化与销毁生命周期。

真正困难的部分在后续多写业务：

- 注册用户与创建邮箱验证码必须原子完成。
- 修改邮箱、清除验证状态和替换验证码必须原子完成。
- 创建订单、订单项和价格快照必须在同一事务内。
- 支付事件去重与推广激活必须一致提交。

网络 I/O 不应放进数据库事务。正确顺序通常是“短事务提交业务状态，再发布事件或调用供应商”；如果要求可靠投递，则进一步使用可重试任务或 transactional outbox，而不是把事务长时间占住。

面试时要能解释 ACID、隔离级别、唯一约束与事务各自解决什么问题，以及为什么“代码里连续 `await` 两次写操作”不等于原子操作。

### 3.5 订单价格必须来自服务端可信数据

客户端只能提交菜品 ID、数量和所选 option，不能提交最终价格。服务端需要重新读取菜单定义、验证 option 是否属于该菜品、计算金额，并把菜品名称、基础价、option 价和最终单价保存为订单快照。

这样可以同时防止：

- 客户端篡改金额；
- 选择不存在或属于其他菜品的 option；
- 下单后菜单涨价导致历史订单金额变化；
- 浮点数计算造成不可解释的舍入误差。

实现后应使用整数最小货币单位或经过明确约束的 decimal，并测试重复 option、负数数量、过期菜品以及菜单更新后的历史订单。

### 3.6 订单状态机与并发抢单

订单不是任意更新的 status 字段，而是受操作者、当前状态和资源归属共同约束的状态机。典型路径为：

```text
Pending -> Cooking -> Cooked -> PickedUp -> Delivered
```

配送员抢单的竞态是项目最有价值的并发案例。两个请求都先读取“未分配”，再分别更新，会出现最后写入覆盖前一个配送员的 lost update。目标实现应使用带条件的原子更新，例如只有 `status = Cooked AND driver_id IS NULL` 才能设置配送员，并检查实际影响行数；真实 PostgreSQL 并发测试应证明恰好一个请求成功。

面试时不要只说“加事务”。事务本身不会自动消除业务竞态，还需要条件更新、行锁、合适的隔离级别、唯一约束或乐观版本字段，并说明为什么选其中一种。

### 3.7 实时事件必须在提交后发布

订单状态更新会触发 Owner、Delivery 或 Client 的实时订阅。如果在事务提交前发布事件，而事务随后失败，客户端会看到数据库中不存在的状态。

目标设计是：

- 领域服务依赖事件端口，不直接依赖 GraphQL `PubSub`。
- 事务成功后才发布事件。
- `graphql-ws` 连接使用标准 Bearer connection parameter，并在连接和订阅字段两层校验权限。
- `pendingOrders`、`cookedOrders`、`orderUpdates` 分别按角色、餐厅归属、配送归属和订单 ID 过滤。
- 明确进程内 Pub/Sub 只能支持单实例；多实例需要共享 transport，强可靠性再考虑 outbox。

可讨论的核心取舍是“低延迟实时通知”和“可靠事件投递”不是同一问题。WebSocket 也不提供 exactly-once；断线恢复、重放和幂等需要额外设计。

### 3.8 Webhook、上传与定时任务的安全边界

这三类接口都不能只实现成功路径：

- 支付 Webhook 要先验签，再以 provider event ID 建唯一约束，重复和并发投递都只能生效一次。
- 文件上传要校验存在性、大小、实际内容/MIME、随机生成 object key，不能信任 `originalname`。
- 七天推广用明确的 UTC 截止时间表达，读取时不能只依赖可能延迟的 cron 清理结果。
- 定时任务必须可重入；多实例同时执行时仍由条件更新或锁保证安全。
- SDK、timeout 和错误映射位于可注入 adapter 中，测试使用 fake，不能访问真实供应商。

这个难点适合回答“你如何处理不可信外部输入”“如何设计幂等”“定时任务漏跑怎么办”。

### 3.9 测试既验证分层，也验证真实数据库语义

目标测试金字塔不是简单追求覆盖率数字：

- 单元测试验证纯计算、状态机、策略和 provider 失败路径。
- Nest testing module 验证依赖注入、Guard、Resolver/Controller 边界。
- GraphQL/HTTP e2e 验证真实 transport、validation、错误和 schema。
- PostgreSQL 集成测试验证 constraint、transaction、isolation 和并发。
- `graphql-ws` 测试验证连接认证、事件过滤和断开清理。
- 契约测试验证 operation 和生成 schema，而不是只做整份快照。

当前 health e2e 使用 Prisma fake，能证明 HTTP 降级语义，但不能证明真实连接池和网络故障；这一限制应主动说明，并在 disposable PostgreSQL 基础设施完成后补齐。

### 3.10 健康检查与生产可观测性

`/health/live` 只判断进程能否响应，不访问 PostgreSQL；`/health/ready` 判断实例能否接收业务流量，因此会检查数据库，并在失败时返回 503。二者分开可以避免数据库短暂故障触发无意义的进程重启。

生产就绪还需要：request ID、结构化且脱敏的日志、延迟/错误率/连接池 metrics、trace seam、graceful shutdown、CORS/Helmet/rate limit/query complexity，以及 migration 和恢复策略。没有实际数据前不能在简历中写“性能提升 50%”；应先记录基线、数据集、命令和优化后的对比。

证据：[`learning/01-health-checks.md`](./learning/01-health-checks.md)、[`refactor/08-production-readiness.md`](./refactor/08-production-readiness.md)。

## 4. 面试高频问题与回答要点

### 4.1 项目和架构

#### Q1：为什么重构，而不是继续修改旧后端？

- 旧系统可以提供产品行为证据，但 persistence model、transport 和业务逻辑耦合，且存在密码暴露、非标准认证、原始 SQL 拼接、非事务多写等风险。
- 采用纵向切片可以让新旧行为逐步对照，每个切片都以可运行 API、migration 和测试收口，风险小于一次性重写。
- 不机械复制旧实体，避免把历史偶然设计固化到新架构。

#### Q2：为什么选择模块化单体，而不是微服务？

- 当前领域规模和团队规模没有证明拆分服务的收益。
- 订单、计价、用户和餐厅之间有强事务与查询关系，单体边界更容易保证一致性和本地调试。
- 通过模块、provider token 和事件端口保留未来拆分能力；在出现独立扩缩容、团队边界或故障隔离需求后再评估微服务。

#### Q3：一次 GraphQL 请求如何经过 NestJS？

- 请求先进入平台层和 middleware，再经过 guard、interceptor 前置、pipe、Resolver/应用服务，最后经过 interceptor 后置和 exception filter。
- GraphQL guard 需要通过 `GqlExecutionContext` 获取请求上下文。
- Resolver 应薄，输入校验、principal 转换后委托应用服务，避免直接写 Prisma workflow。

#### Q4：为什么使用 code-first GraphQL？

- TypeScript 类型、装饰器和 Resolver 更接近实现，适合 NestJS 的 DI 与模块体系。
- 生成 SDL 是需要评审的外部契约，不能因为 code-first 就忽略 schema diff。
- API model 必须与 Prisma model 分离，避免内部字段自动暴露。

### 4.2 数据库、事务与并发

#### Q5：为什么重复注册不能只“先查邮箱是否存在”？

- 两个并发请求可能都查不到，然后都插入，这是典型 check-then-act race。
- PostgreSQL unique constraint 才是最终一致性边界；应用层检查只用于更友好的早期错误。
- 服务层要把唯一约束冲突映射为稳定、安全的业务错误。

#### Q6：事务里为什么不调用邮件或支付 SDK？

- 网络调用不可控，会延长持锁时间、占用连接并增加死锁/timeout 风险。
- 外部系统也无法随数据库事务自动回滚。
- 先提交数据库，再通过可重试任务或 outbox 处理副作用，并让消费者幂等。

#### Q7：如何保证只有一个配送员抢到订单？

- 使用携带当前状态和 `driverId IS NULL` 条件的原子更新，并检查影响行数。
- 失败方得到明确 conflict，而不是覆盖胜者。
- 用真实 PostgreSQL 同时发起竞争请求，断言一个成功、一个失败且最终只有一个 driver。

#### Q8：事务和隔离级别是否足以解决所有并发问题？

- 不足。事务保证一组操作的原子性，隔离级别控制并发可见性，但业务条件仍需显式表达。
- 根据场景结合 conditional update、unique/check constraint、行锁或 optimistic version。
- 选择策略要考虑冲突频率、锁等待、重试成本和数据库支持。

#### Q9：订单为什么要保存价格快照？

- 菜单价格会变化，历史订单必须保持下单时金额和展示信息。
- 快照同时提供审计和退款依据。
- 下单时由服务端验证并计算，不能把客户端 total 当作可信数据。

### 4.3 安全与 API 边界

#### Q10：认证和授权有什么区别？

- 认证确认调用者身份；授权判断该身份是否允许执行动作。
- role 是粗粒度授权，ownership 和当前订单状态属于资源/属性级授权。
- Guard 可以提前拒绝，但应用服务仍必须守住领域边界。

#### Q11：为什么不兼容旧的 `x-jwt`？

- 目标 API 使用标准 `Authorization: Bearer`，便于代理、文档、中间件和安全工具按标准处理。
- 双 header fallback 会增加冲突、优先级和测试分支，延长不安全历史约定的生命周期。
- 前端改造集中到后续集成阶段，不在 API 中长期保留 shim。

#### Q12：只在 GraphQL 中隐藏 password 字段够吗？

- 不够。schema 不暴露只是第一层；普通数据库查询也不应选择 hash，mapper 和日志还要避免携带 secret。
- hash 只在登录校验路径中显式读取。
- 错误响应和结构化日志必须清洗 Authorization、密码和验证码。

#### Q13：CORS 能防止未授权请求或 CSRF 吗？

- CORS 是浏览器对跨源读取/发送的策略边界，不是服务端授权机制。
- Bearer token 仍需服务端验证；如果认证依赖自动携带的 cookie，还要单独评估 SameSite 和 CSRF token。
- 非浏览器客户端不受 CORS 保护。

#### Q14：如何防止 GraphQL API 被滥用？

- 对输入做 validation，限制分页和上传大小。
- 设置 query depth/complexity、rate limit 和请求体限制。
- 对 relation 使用批量加载或受控查询，避免 N+1 和任意数据遍历。
- 错误响应不泄露 stack、SQL 或内部 provider 信息。

#### Q15：支付 Webhook 如何做到安全且幂等？

- 在读取并改变业务状态前，用供应商规定的原始请求体和密钥验签。
- 验证金额、对象和环境等业务字段。
- provider event ID 建唯一约束，去重记录与推广激活在同一事务中。
- 对重复、乱序和并发投递编写测试。

### 4.4 实时、性能与可靠性

#### Q16：为什么事件必须在数据库 commit 后发布？

- 提交前发布可能让订阅者看到最终被回滚的状态。
- commit 后直接发布仍可能遇到“已提交但发布失败”的窗口；低可靠性场景可接受并记录限制，高可靠性场景用 outbox。
- 消费者仍需幂等，因为网络重试可能产生重复事件。

#### Q17：WebSocket 能保证消息 exactly-once 吗？

- 不能。断线、重连、进程崩溃和重复投递都会破坏 exactly-once 假设。
- 可以定义 at-most-once 或 at-least-once，并通过 event ID、游标/版本和幂等消费改善体验。
- 进程内 Pub/Sub 也无法跨实例，需要共享 broker 或可恢复事件源。

#### Q18：GraphQL 的 N+1 是什么，如何证明已经解决？

- 父列表每个元素分别加载 relation，会把一次逻辑查询放大为 `1 + N` 次数据库访问。
- 可使用 request-scoped DataLoader、批量 `IN` 查询或合适的 Prisma relation strategy。
- 必须记录相同数据集和 operation 的 SQL 次数、延迟或 query log，对比优化前后，而不是只说“用了 DataLoader”。

#### Q19：为什么 liveness 不检查数据库？

- 数据库故障不代表 Node 进程已死，重启应用通常也修不好数据库。
- liveness 失败会触发重启，错误依赖会导致重启风暴。
- readiness 检查核心依赖并控制是否接流量，更符合数据库故障语义。

#### Q20：如何测试数据库不可用？

- 当前 fake 测试证明了 readiness 的 HTTP 503 和安全错误形状。
- 完整 Foundation 还要在 disposable PostgreSQL 上测试连接失败、运行中断线、timeout、恢复和关闭时的连接释放。
- 回答时应清楚区分“边界语义已测”和“真实网络行为未测”。

### 4.5 测试与工程取舍

#### Q21：单元测试和 e2e 测试各自负责什么？

- 单元测试快速覆盖状态机、计价、授权策略和失败分支。
- e2e 测试证明 DI、transport、validation、guard、错误映射和 schema 能一起工作。
- 数据库约束和并发不能只靠 mock，必须用 PostgreSQL 集成测试。

#### Q22：为什么不追求 100% 覆盖率？

- 覆盖率只能说明代码是否执行，不证明断言质量或并发、约束和安全语义正确。
- 优先覆盖高风险不变量、拒绝路径、事务失败和竞态。
- 对 generated code、装饰器样板和无行为 DTO，不为了数字编写低价值测试。

#### Q23：这个项目做过什么失败或取舍？

可使用 health check 案例：最初把 NestJS 文档网站加入健康检查，但它不是 MealRelay 的运行依赖，会扩大故障域并造成错误摘流，因此移除外部 ping，把 liveness 与数据库 readiness 分开。随后补充数据库失败返回 503 的 e2e 测试，并记录当前仍缺真实 PostgreSQL 故障测试。

#### Q24：你如何证明一个阶段真的完成？

- 先定义外部契约和验收标准，再提交 code/schema/migration/test。
- 执行 typecheck、non-fixing lint、unit、integration/e2e 和 build。
- 把测试、性能、安全观察和限制记录到 `docs/learning/`；长期架构选择写 ADR。

## 5. 简历写法

### 5.1 项目基本信息

```text
MealRelay 外卖平台后端重构（个人项目，持续迭代）
技术栈：TypeScript、NestJS 11、GraphQL/Apollo、Prisma 7、PostgreSQL、Jest、Supertest
项目简介：面向顾客、商家和配送员的三角色外卖平台；将旧 NestJS/TypeORM 系统按纵向切片迁移为标准优先、可测试的模块化单体。
```

### 5.2 当前即可使用的诚实版本

以下表述只覆盖当前已有代码和学习记录：

- 设计 MealRelay 后端分阶段重构路线，将旧 NestJS/TypeORM 系统按契约基线、基础设施、身份、目录、订单和实时事件拆分为可独立验收的纵向切片。
- 基于 NestJS 11 与 Apollo code-first GraphQL 搭建目标 API，使用 Zod 4 建立启动时失败的类型化环境配置边界，并落地全局输入过滤及稳定生成的 GraphQL schema，为后续契约测试提供基线。
- 使用 Prisma 7 PostgreSQL adapter 实现由 Nest 生命周期管理的单例数据库服务，避免按请求重复创建或断开 Client。
- 将健康检查拆分为无外部依赖的 liveness 与带数据库探测的 readiness；数据库异常时返回 503，并通过单元测试和 Supertest e2e 覆盖成功与降级路径。
- 梳理旧系统密码字段暴露、非标准 `x-jwt`、字符串拼接搜索和非事务多写等风险，形成标准 Bearer 认证、DTO/持久化模型隔离及事务化迁移方案。

投递时建议从中选择最强的 3–4 条，不要把整份阶段计划都塞进简历。

### 5.3 身份模块完成后可替换的表述

只有当注册、登录、`me`、资料修改、邮箱验证、migration 和拒绝路径测试全部通过后，才使用：

- 实现基于标准 `Authorization: Bearer` 的 JWT 认证链路，将身份认证、角色检查与资源所有权策略分层，并覆盖缺失、伪造、过期 token 及越权访问。
- 将用户创建与邮箱验证记录、邮箱修改与验证替换纳入 PostgreSQL 事务，使用唯一约束处理并发重复注册，确保密码 hash 不进入 GraphQL schema、普通查询和日志。
- 通过可注入的 password hasher、token adapter 与邮件端口隔离基础设施，保证外部邮件调用发生在事务提交后，并测试供应商失败不会回滚已创建账户。

### 5.4 订单与并发模块完成后可替换的表述

只有真实 PostgreSQL 并发测试通过后，才使用：

- 实现服务端可信计价与订单价格快照，校验菜品、数量和 option 归属，避免客户端篡改金额及菜单变更污染历史订单。
- 将订单生命周期建模为显式状态机，在应用层同时校验角色、资源归属和当前状态，覆盖合法转换与非法跳转。
- 使用 PostgreSQL 条件原子更新解决配送员并发抢单竞态，并通过并行请求测试证明同一订单恰好一个配送员领取成功。
- 在短事务内原子创建订单与订单项，提交后再发布领域事件，避免回滚状态被订阅者观察到。

### 5.5 实时与生产就绪完成后可替换的表述

只有相应 WS e2e、测量和运行证据存在后，才使用：

- 基于 `graphql-ws` 实现认证订阅，按角色、餐厅归属、配送归属与订单 ID 过滤事件，并验证断线和应用关闭不会遗留 listener。
- 通过事件端口解耦领域服务与 GraphQL Pub/Sub，明确单实例投递限制，并按实际可靠性需求演进共享 transport 或 transactional outbox。
- 建立 request ID、结构化脱敏日志、健康探针与 graceful shutdown，使用可复现基线衡量查询次数和延迟，再通过索引/批处理将 `[指标]` 从 `[优化前]` 改善到 `[优化后]`。
- 在 CI 中从空 PostgreSQL 应用 reviewed migration，并执行 typecheck、lint、unit、integration/e2e、contract 和 build 门禁。

方括号必须替换为真实测量值；没有数据就删除整条指标表述。

### 5.6 STAR 项目故事模板

#### 故事一：健康检查误依赖

- Situation：初始健康检查会访问 NestJS 文档网站，外部网站故障会让 MealRelay 被误判为不可用。
- Task：建立能正确指导编排器重启和摘流的健康语义。
- Action：移除无关外部 ping，拆分 liveness/readiness，数据库探测设置 timeout，补充成功与 503 降级测试。
- Result：健康检查不再扩大故障域，数据库故障只影响接流量资格；同时记录 fake e2e 尚未覆盖真实网络故障的限制。

#### 故事二：并发抢单（完成后使用）

- Situation：多个配送员可能同时读取到未分配订单。
- Task：保证订单只能被一个配送员领取，失败请求得到确定结果。
- Action：把 current status 和 `driverId IS NULL` 放进数据库更新条件，检查影响行数并映射 conflict；使用真实 PostgreSQL 发起竞争请求。
- Result：测试证明恰好一个请求成功，最终状态无覆盖和非法跳转。

### 5.7 不要这样写

| 不准确表述 | 问题 | 更好的写法 |
| --- | --- | --- |
| “负责高并发外卖系统架构” | 没有流量和容量证据 | “围绕并发抢单设计原子更新，并用真实并发测试验证” |
| “使用微服务提升可扩展性” | 当前目标是模块化单体 | “以模块化单体控制复杂度，通过端口保留可替换基础设施边界” |
| “实现 Redis/BullMQ/outbox” | 尚未因真实问题引入 | “明确单实例事件限制，出现可靠投递需求后再评估 outbox” |
| “性能提升 80%” | 没有数据集、命令和前后结果 | 写清 operation、数据规模、p95/SQL 次数及测量环境 |
| “完整实现登录和权限系统” | 当前身份链路未闭环 | “已完成身份数据模型和 DTO 基础，正在实现认证纵向切片” |
| “项目已上线” | 当前没有生产发布证据 | “个人重构项目，持续迭代” |

## 6. 面试前证据清单

每准备在简历中增加一条能力，先确认至少有一种可展示证据：

| 简历主张 | 最低证据 |
| --- | --- |
| API 契约 | 生成的 `schema.gql`、operation contract test、明确的 schema diff |
| 数据库设计 | Prisma schema、reviewed migration、约束和索引说明 |
| 事务一致性 | 事务代码、失败注入测试、提交后副作用测试 |
| 并发安全 | 真实 PostgreSQL 并发测试和确定的最终状态 |
| 安全 | denial-path 测试、secret 不暴露断言、验签/限流配置 |
| 性能优化 | 固定数据集、基线命令、优化前后 SQL 次数或延迟 |
| 实时通信 | 真实 `graphql-ws` 客户端 e2e、鉴权/过滤/断线测试 |
| 生产就绪 | CI 记录、health/graceful shutdown 故障测试、部署说明 |

推荐准备一个 5–8 分钟的代码导览顺序：

1. 从 `api/src/app.module.ts` 解释模块与 GraphQL bootstrap。
2. 从 `api/src/config/` 解释 fail-fast 配置边界。
3. 从 `api/src/prisma/prisma.service.ts` 解释 Client 生命周期。
4. 从 `api/src/health/` 和 e2e 展示健康语义及失败测试。
5. 业务阶段完成后，再展示对应 service、migration、schema 和并发/契约测试。

## 7. 后续维护

- 每完成一个纵向切片，先补对应 `docs/learning/` 的实测结果，再升级本文的“当前事实边界”和简历版本。
- 涉及跨领域或长期外部契约的选择，新增 ADR，并在本文链接到该决定。
- 所有数字必须可复现；记录数据规模、硬件/容器环境、执行命令和测量日期。
- 面试前从简历的每个动词反推证据：凡是写了“实现、优化、保障、提升”，都应该能现场指出代码和测试。
