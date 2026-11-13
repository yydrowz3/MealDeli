# 阶段 3：身份与访问控制

## 目标

交付第一个完整业务纵向切片：注册、登录、当前用户、资料编辑和邮箱验证；同时建立后续领域复用的认证 principal、角色策略和资源所有权策略。

## 目标外部契约

旧前端使用以下能力，因此它们是产品行为证据；具体 GraphQL 类型、字段和错误语义由本阶段按安全性、标准和可解释性重新评审：

- `createAccount(input)`
- `login(input)`，成功返回 token
- `me`
- `editProfile(input)`
- `verifyEmail(input)`
- 旧前端 `UserRole`：`Client`、`Owner`、`Delivery`；目标 API 以当前 `api/` 的 `CUSTOMER`、`OWNER`、`COURIER` 为准，不提供旧值兼容别名
- API HTTP 使用 `Authorization: Bearer <JWT>`；后续 subscription API 使用 `Authorization` bearer connection parameter

旧 `x-jwt` 只用于识别历史行为，不在新 API 中保留。本阶段不修改前端 HTTP/WebSocket client；API 必须拒绝格式错误、重复或冲突的认证凭据，并把前端 Bearer 迁移记录到阶段 9。

## 领域模型与不变量

### User

建议字段：

- `id`
- 规范化后的唯一 `email`
- `passwordHash`，默认查询路径不选择、不映射到 GraphQL
- `role`
- `verifiedAt` 或等价验证状态
- `createdAt`、`updatedAt`
- 可选的乐观并发版本字段，仅在资料写冲突有具体需求时加入

不变量：

- email trim 并按明确规则规范化后唯一。
- role 只能是三个契约枚举值。
- password hash 永远不进入 API model、日志或错误。
- email 改变后旧验证失效，并重新进入未验证状态。

### EmailVerification

建议字段：

- `id`
- `userId`，唯一或保证每个用户只有一个有效 verification
- token/code 的 hash，而不是可直接使用的明文 secret
- `expiresAt`
- `createdAt`

创建用户与 verification、修改 email 与替换 verification 都应在数据库事务中完成。邮件发送在提交之后执行；发送失败不能回滚已提交账户，也不能伪装成账户创建失败。

## 模块边界

```text
auth/
├── auth.module.ts
├── auth.service.ts             # 登录和 token 签发
├── jwt-token.service.ts        # JWT adapter
├── gql-auth.guard.ts
├── roles.guard.ts
├── current-user.decorator.ts
└── policies/                   # 所有权/属性策略基础

users/
├── users.module.ts
├── users.resolver.ts
├── users.service.ts            # 应用用例
├── user.mapper.ts              # persistence → safe API model
├── dto/
└── *.spec.ts
```

Resolver 只处理 GraphQL 输入、principal 和输出映射；Prisma 查询、hash、JWT 和邮件调用留在可注入服务/适配器中。

## 认证流程

### 注册

1. DTO 校验 email、password、role。
2. 规范化 email，依赖数据库 unique constraint 防止竞态重复注册。
3. 在事务中创建 `User` 和 `EmailVerification`。
4. 提交后调用邮件端口；失败记录安全日志并进入可重试路径。
5. 返回兼容的 `{ ok, error }`，不返回用户 secret。

### 登录

1. 规范化 email。
2. 仅在认证查询中显式选择 `passwordHash`。
3. 对不存在用户也执行等价成本的 hash compare 或采取稳定策略，减少账户枚举/时序差异。
4. 验证成功后签发包含最少 claims 的短期 access token。
5. token 至少验证签名、算法、过期时间、issuer/audience（如果配置）。

首版只实现项目真实使用的 access token；refresh token、rotation 和 revocation 需要具体产品需求和 ADR 后再加入，不能为了面试关键词引入未使用体系。

### 请求认证

1. GraphQL context 从 HTTP `Authorization: Bearer <JWT>` 或 WS 的 `Authorization` connection parameter 读取 bearer token。
2. token service 验证并产生最小 `AuthenticatedPrincipal`，例如 `userId`、`role`、`tokenId`。
3. 需要最新账户状态的操作在应用层重新读取用户；不要相信客户端传入 role/userId。
4. Guard 处理“是否已认证/角色是否允许”，应用服务仍处理资源所有权和状态。

### 邮箱修改与验证

- 修改 email 必须检查当前 principal，并通过 unique constraint 处理竞争。
- 在一个事务中更新 email、清除 verified 状态、替换 verification。
- 验证 token 必须有过期时间并只能成功消费一次；用条件更新或删除保证并发点击只成功一次。
- 验证成功提交后再触发后续事件。

## 安全控制

- 使用成熟 password hashing 库，参数通过基准和运行环境决定；不自行实现算法。
- login 和 verification 应有按 IP/账户维度的限流计划，避免暴力尝试。
- 错误信息避免确认某 email 是否注册；内部日志保留 request ID 和安全 cause。
- GraphQL `User` 类型从定义上不存在 password 字段。
- JWT secret/private key 只从已验证配置注入，禁止默认开发 secret 进入生产。
- 日志清洗 `Authorization`、password、verification token。
- CORS 与认证分开：CORS 是浏览器边界，不是授权机制。

## 数据库与 migration

- 为规范化 email 建唯一索引；明确 PostgreSQL 大小写策略。
- verification 的有效唯一性尽量由约束保证，不采用先查再写。
- migration 包含表、外键、删除策略、唯一约束和必要索引。
- seed 只生成明确的本地测试账户，不包含固定生产凭据。

## 测试矩阵

| 用例 | 单元 | PostgreSQL 集成 | GraphQL e2e |
| --- | --- | --- | --- |
| email/password 规范化与 hash | 是 |  |  |
| 成功注册 + verification |  | 是，验证事务 | 是 |
| 同 email 并发注册 |  | 是，真实并发 | 可选 |
| 登录成功/错误密码/不存在账户 | 是 |  | 是 |
| JWT 缺失、伪造、过期、claims 非法 | 是 |  | 是 |
| `me` 不返回 password |  |  | 是 + schema 断言 |
| 错误角色 |  |  | 是 |
| email 修改事务与旧 token 失效 |  | 是 | 是 |
| verification 并发消费 |  | 是，真实并发 |  |
| 邮件供应商失败 | 是，fake port |  | 验证账户状态不回滚 |

## 建议 PR 顺序

1. User/Verification Prisma schema、migration、mapper 和 repository 集成测试。
2. password hasher、注册服务和 `createAccount` e2e。
3. token adapter、GraphQL context/guard、login 和 `me`。
4. role decorator/guard 与应用层 policy 基础。
5. edit profile、verification、提交后邮件端口和失败测试。
6. 限流、目标身份契约测试和阶段 9 前端适配记录。

## 验收标准

- [ ] 注册、登录、当前用户、资料编辑和邮箱验证五项目标身份行为通过后端 API 测试。
- [ ] 当前 HTTP API 只接受标准 bearer transport，旧 `x-jwt` 被拒绝且有测试；WS 认证在 subscription 阶段验证。
- [ ] password 字段不在 generated schema，hash 不在日志或普通查询。
- [ ] 注册、email 修改与 verification 具有正确事务边界。
- [ ] 未认证、错误角色、错误所有者分别被测试。
- [ ] 重复注册和 token 重复消费由数据库/原子操作保证。
- [ ] 邮件外部调用发生在 commit 后且可替换为 fake。
- [ ] 目标 schema 与旧前端身份操作的差异已记录到阶段 9，当前未修改前端。
- [ ] 完成 learning note，并在 token 兼容策略长期化时补 ADR。

## 面试复盘重点

- authentication、authorization、role 与 ownership 的区别。
- Nest middleware/guard/interceptor/pipe/filter 在 GraphQL 下的执行位置。
- 为什么 unique constraint 比 check-then-insert 更能防止并发重复注册。
- 为什么 password hash 不应仅依赖 `@HideField()`，还要控制查询与映射。
- access/refresh token 的取舍，以及当前项目为何先只实现实际需要的部分。

## 参考

- [NestJS authentication](https://docs.nestjs.com/security/authentication)
- [NestJS authorization](https://docs.nestjs.com/security/authorization)
- [NestJS encryption and hashing](https://docs.nestjs.com/security/encryption-and-hashing)
- [NestJS execution context](https://docs.nestjs.com/fundamentals/execution-context)
