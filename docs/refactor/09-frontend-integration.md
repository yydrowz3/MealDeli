# 阶段 9：前端重构与集成

## 启动条件

本阶段明确延后。只有当阶段 0–8 的核心后端重构完成、目标 API schema 稳定、后端契约测试和生产质量门禁通过后，才开始修改 `frontend/`。

后端阶段可以只读检查旧前端以理解产品行为，但不得为了保持旧前端临时可用而添加 `x-jwt`、双协议、旧 schema fallback 或其他兼容 shim。每个后端切片应记录其对前端 operation、生成类型、认证、cache 和页面行为的影响，作为本阶段输入。

## 目标

1. 根据稳定的目标 API 重新组织 GraphQL documents、fragments 和生成类型。
2. 把 HTTP 与 `graphql-ws` 认证统一迁移到 `Authorization: Bearer <JWT>`，不保留 `x-jwt`。
3. 评审 access token 的浏览器存储、过期、登出和刷新策略，并记录 XSS/CSRF 边界。
4. 按服务端真实返回结果设计 Apollo cache update、分页、订阅和错误状态。
5. 清理旧类型、重复 operation、手工 cache 拼接和硬编码后端地址。
6. 用 Vitest、operation contract tests 和少量关键 Cypress 流程证明完整集成。

## 输入产物

- `api/src/schema.gql` 的稳定生成版本及 schema diff 历史。
- 各后端阶段记录的 intentional breaking changes 和前端适配清单。
- 目标 API 的认证、错误、分页、上传和 subscription 契约。
- 后端 GraphQL/HTTP/WS e2e 与生产运行说明。

## 建议工作顺序

1. 盘点旧页面、路由、operation、fragment、Apollo policy 和本地状态。
2. 基于稳定 API 运行 codegen，逐项处理类型和 nullability 差异。
3. 重构 HTTP/WS link、环境化 endpoint 和认证生命周期。
4. 按身份、目录、订单、实时、支付/上传顺序迁移页面与 hooks。
5. 为 cache、错误、loading/empty state 和权限拒绝补组件/集成测试。
6. 将旧前端 `Client`、`Owner`、`Delivery` 枚举迁移到目标 API 的 `CUSTOMER`、`OWNER`、`COURIER`，运行三个角色的关键 Cypress 流程并记录跨层调试证据。

## 验收标准

- [ ] 前端不再发送或读取 `x-jwt`。
- [ ] GraphQL 类型由稳定目标 schema 生成，无手工维护的重复服务端类型。
- [ ] 前端使用的每个 operation 都能通过目标 API contract validation。
- [ ] Apollo cache 在注册/登录、资料修改、目录分页、订单状态和 subscription 后保持一致。
- [ ] endpoint、HTTP/WS URL 和允许的 origin 通过环境配置管理。
- [ ] `CUSTOMER`、`OWNER`、`COURIER` 至少各有一个关键路径得到自动化证明，旧枚举值已从前端生成类型和操作中移除。
- [ ] 前端 build、Vitest、codegen diff 和选定 Cypress 流程通过。
- [ ] 完成前端集成 learning note，记录浏览器安全、cache 与端到端契约取舍。

## 面试复盘重点

- codegen 如何把 GraphQL nullability 和 schema 演进变成 TypeScript 约束。
- Apollo normalized cache 何时自动更新，何时需要 field policy 或显式写入。
- Bearer token 在浏览器中的 XSS/CSRF 取舍，以及 access/refresh token 生命周期。
- HTTP 查询、WebSocket subscription 和服务端已提交状态如何保持一致。
- 如何从浏览器 operation 沿 Nest resolver/service/Prisma 路径定位全栈问题。
