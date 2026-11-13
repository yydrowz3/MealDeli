# 阶段 2：Foundation

## 目标

让 `api/` 成为可重复启动、可验证配置、可连接 PostgreSQL、可生成 code-first schema、可运行自动测试的最小生产式应用，为所有业务模块提供稳定边界。

## 当前状态与已知缺口

- `GraphQLModule` 已加入，但 schema 文件名写成 `scema.gql`，尚无业务 Resolver。
- `ConfigModule.forRoot()` 已通过自定义 `validate` 回调接入 Zod 4 schema；当前覆盖 `NODE_ENV`、`PORT`、`DATABASE_URL` 和 `CORS_ORIGINS`，后续切片必须在同一 schema 中扩展自己的配置契约。
- 全局 `ValidationPipe` 尚未明确 `transform`、`whitelist` 和未知字段策略。
- CORS 当前为宽泛启用，未记录允许源、header 和 WebSocket 边界。
- Prisma generator 输出到自定义目录，但 `PrismaService` 的 import 与之不一致。
- `PrismaModule` 尚未注册或导出 `PrismaService`，也没有启动、关闭和 graceful shutdown 行为。
- Prisma schema 没有业务模型或已审查 migration。
- e2e 仍只验证 Nest 默认 `Hello World`。
- 当前本地依赖未安装，现有 typecheck/Jest 命令尚无法执行。

## 范围

### 包含

- 版本/依赖兼容性确认。
- 类型化、启动时失败的配置验证。
- Apollo code-first GraphQL 基础配置和确定性 schema artifact。
- 单例 Prisma Service、PostgreSQL adapter、生命周期和最小 migration 约定。
- 全局 validation、错误边界、request ID 和 Nest Logger 基线。
- liveness/readiness HTTP 端点。
- disposable PostgreSQL 测试基础设施。
- 最小 GraphQL 与数据库集成/e2e 测试。
- `.env.example` 和运行说明。

### 不包含

- 完整用户、餐厅或订单业务。
- Redis、BullMQ、OpenTelemetry collector 等高级基础设施。
- 真实邮件、存储或支付供应商连接。

## 关键设计

### 1. 依赖兼容性

在改包之前确认 `package.json`、lockfile 和官方文档：

- NestJS 11、`@nestjs/graphql`、`@nestjs/apollo` 与 Apollo Server 的组合。
- 已安装 GraphQL major 是否为 Nest/Apollo 当前支持范围。
- Prisma 7 的 generator、driver adapter、module format 与 `tsconfig.json`。
- Jest、`ts-jest` 与 TypeScript 的版本组合。
- Zod 4 的 schema、transform、类型推导和错误 API；不要复制 Zod 3 的 `errorMap`/错误格式化写法。

只调整完成 Foundation 所必需的包，固定兼容版本并提交 lockfile；不要顺便升级其他依赖。

### 2. 配置边界

使用 Zod 4 定义集中式配置 schema，至少覆盖：

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- JWT 参数（Identity 阶段启用前可为预留但不读取假值）
- CORS allowed origins
- GraphiQL/playground 是否在非生产启用

`EnvironmentVariables` 必须通过 `z.infer<typeof environmentVariablesSchema>` 从运行时 schema 推导，避免手写 interface 与校验规则漂移。`ConfigModule.forRoot({ validate })` 使用 `safeParse()` 返回转换后的配置（例如把 `PORT` 转成 number、把逗号分隔的 CORS origins 规范化为数组）；失败时只汇总 issue path 和 message，不输出输入值或 secret。业务服务通过注入的类型化配置访问，不直接散落读取 `process.env`。

### 3. GraphQL 基础

- 保留 Apollo code-first 和 `/graphql`。
- `autoSchemaFile` 指向命名正确、位置稳定的 generated artifact，并启用稳定排序。
- 生产环境关闭交互式 IDE 和不必要 introspection 的策略需要显式决定。
- 定义 typed GraphQL context：request、request ID、可选 principal 和以后加入的 loaders。
- 添加一个最小、无敏感信息的状态查询或其他最小 Query，使 schema 可生成并能通过 e2e 验证。
- 统一 GraphQL error mapping，避免向客户端返回 stack trace 或数据库错误。

### 4. Prisma/PostgreSQL

- 只保留一个由 Nest 管理的 Prisma Client/Service。
- import 必须与 Prisma generator 的实际 output 一致。
- adapter 从校验后的配置获取 `DATABASE_URL`。
- 在 Nest lifecycle 中连接/断开，支持应用关闭和测试清理。
- `PrismaModule` 注册并导出 service；是否 `@Global()` 需明确权衡，默认优先显式模块依赖。
- 建立 migration 命名、review、deploy 和 seed 规则。
- 禁止对不明确数据库执行 `prisma migrate reset`。

Foundation 可使用最小内部模型或直接以连接探测验证数据库；首个业务模型由 Identity 阶段引入。不要为了测试连接创建无业务意义的永久表。

### 5. Validation 与错误

建议全局 ValidationPipe 基线：

- `transform: true`
- `whitelist: true`
- `forbidNonWhitelisted: true` 由目标 API 的验证与安全测试证明，默认拒绝未知输入；旧前端影响记录到阶段 9
- 明确隐式类型转换策略，分页和 ID 不依赖危险的宽松转换

定义安全的应用错误分类，例如 validation、unauthenticated、forbidden、not found、conflict、provider unavailable 和 internal。客户端只得到稳定、安全信息，服务端日志保留 cause 和 request ID。

### 6. 健康检查和关闭

- `/health/live`：只表示进程事件循环能够响应，不依赖外部服务。
- `/health/ready`：检查应用是否可以接流量，至少包含数据库连通性。
- 数据库失败时 readiness 失败，liveness 不应立即失败导致重启风暴。
- 启用 shutdown hooks，测试关闭 Nest app 与 Prisma/连接池。

### 7. 测试数据库

选择明确 disposable 的 PostgreSQL 环境，例如 Docker Compose/test container 或 CI service container，并记录选择。要求：

- 与开发/共享数据库使用不同 URL。
- migration 在测试开始前应用。
- 测试能确定性清理，仅清理指定测试 database/schema。
- 测试进程结束时关闭 Nest app 和 Prisma Client。
- 不用 SQLite 替代 PostgreSQL 约束、事务或并发行为。

## 建议 PR 顺序

1. 依赖兼容性与 Zod 配置 schema；添加安全 `.env.example`。
2. GraphQL bootstrap、typed context、schema artifact 和最小 e2e。
3. Prisma service/module/lifecycle、初始 migration 约定和连接集成测试。
4. Validation/error mapping、request ID、health 和 graceful shutdown。
5. 测试数据库脚本与完整质量门禁。

## 测试矩阵

| 边界 | 必测行为 |
| --- | --- |
| 配置 | Zod schema 接受并规范化合法配置；缺失/非法值一次性汇总后快速失败；错误不含 secret 输入值 |
| GraphQL | `/graphql` 可执行最小 query；非法输入被拒；schema 稳定生成 |
| Prisma | 可连接 disposable PostgreSQL；查询失败正确传播；关闭不悬挂 |
| Health | live 正常；DB 不可用时 ready 失败；恢复后 ready 正常 |
| 生命周期 | app init/close 可重复；测试没有 open handles |
| CORS | 允许的前端 origin/header 通过；未允许 origin 行为符合策略 |

## 验收标准

- [ ] 新环境只凭 `.env.example` 和文档即可配置，不需要读取源码猜变量。
- [ ] GraphQL schema 由代码生成、排序稳定且路径正确。
- [ ] Prisma Client 只有一个应用管理实例，import/module format 正确。
- [ ] migration 可在明确 disposable PostgreSQL 上从零应用。
- [ ] `/health/live` 与 `/health/ready` 语义不同且有测试。
- [ ] Validation、CORS、GraphiQL 和错误暴露策略明确。
- [ ] typecheck、non-fixing lint、unit、e2e、build 全部通过。
- [ ] 完成后新增对应 learning note；跨领域决策按需新增 ADR。

## 主要风险与缓解

- **包 major 不兼容**：先查官方 compatibility，再安装/调整并锁定版本。
- **Prisma ESM/CJS 混用**：以 generator output 和 `tsconfig.json` 的实际构建结果验证，不复制教程配置。
- **测试误连开发库**：测试启动时检查数据库名/URL 标识，不符合安全条件直接终止。
- **readiness 过度检查**：只检查接流量必需依赖，避免可选供应商让整个 API 下线。

## 参考

- [NestJS configuration](https://docs.nestjs.com/techniques/configuration)
- [NestJS validation](https://docs.nestjs.com/techniques/validation)
- [NestJS GraphQL quick start](https://docs.nestjs.com/graphql/quick-start)
- [NestJS Prisma recipe](https://docs.nestjs.com/recipes/prisma)
- [NestJS lifecycle events](https://docs.nestjs.com/fundamentals/lifecycle-events)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
- [Zod 4 schemas and parsing](https://zod.dev/packages/zod)
- [Zod error customization](https://zod.dev/error-customization)
