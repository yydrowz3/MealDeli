# MealRelay 重构文档索引

这组文档把“重构”定义为：以 `api/` 为目标，按可运行的纵向切片逐步重建面试级 NestJS 后端；`backend/` 和 `frontend/` 在当前阶段都只用于行为与产品取证，不构成目标 API 的兼容性门禁。阶段 0–8 完成并稳定后，再进入独立的前端重构与集成阶段。

## 推荐顺序

| 顺序 | 阶段 | 主要结果 | 进入下一阶段的门槛 |
| --- | --- | --- | --- |
| 0 | [总体计划](./00-overall-plan.md) | 范围、原则、交付节奏和全局完成标准 | 团队对迁移方式与目标架构达成一致 |
| 1 | [契约基线](./01-contract-baseline.md) | 目标 API 契约、旧行为矩阵、安全/标准边界和延后适配清单 | 目标后端契约可被自动验证，breaking change 有记录 |
| 2 | [Foundation](./02-foundation.md) | 可启动的 GraphQL/Prisma API、配置、测试数据库和健康检查 | typecheck、lint、unit、e2e、build 全绿 |
| 3 | [身份与访问控制](./03-identity-access.md) | 注册、登录、当前用户、资料编辑、邮箱验证、RBAC/所有权基础 | 目标身份契约、事务、安全和拒绝路径通过后端测试 |
| 4 | [餐厅与查询](./04-catalog-query.md) | 分类、餐厅、菜品、搜索、分页、缓存与 N+1 控制 | 浏览和店主管理领域行为通过目标 API 测试 |
| 5 | [订单与并发](./05-orders-concurrency.md)（[完整实施蓝图](./05-orders-concurrency-implementation.md)） | 服务端计价、事务、状态机、抢单和并发安全 | 真实并发测试证明不重复抢单、不丢失状态 |
| 6 | [实时与异步](./06-realtime-async.md)（[完整实施蓝图](./06-realtime-async-implementation.md)） | 认证订阅、提交后事件和可替换事件总线 | HTTP 与 `graphql-ws` 契约均有 runtime 证据，自动 e2e 留到 Jest phase |
| 7 | [支付、上传与调度](./07-payments-uploads-schedules.md)（[支付/推广蓝图](./07-payments-promotion-implementation.md)、[安全上传蓝图](./07-secure-upload-implementation.md)） | 验签/幂等支付、七天推广、安全上传、多实例安全调度 | 重复事件和外部服务失败不会破坏领域状态 |
| 8 | [后端生产就绪](./08-production-readiness.md) | 可观测性、安全边界、CI、部署迁移、容量与恢复方案 | 后端发布检查表和自动质量门禁完整，API 契约稳定 |
| 9 | [前端重构与集成](./09-frontend-integration.md) | 前端架构整理、codegen、Bearer/WS 迁移、Apollo cache 和关键 E2E | 新前端与稳定 API 完整集成，关键用户流程通过 |

截至 2026-08-09，Catalog、Orders、进程内 Realtime、Paddle 支付/推广和多实例过期调度主代码已经提交，但阶段门槛尚未闭环。当前 `prisma validate` 通过，TypeScript/build 因缺少已引用的 `@paddle/paddle-node-sdk` 失败，非修复 lint 还暴露出全仓库格式债务。下一步先用独立提交收口这些 7A 阻断，再实施阶段 7B 安全图片上传；审计证据、逐文件完整代码、runtime 验证矩阵和延期 Jest/前端清单见 [阶段 7A 收口与阶段 7B 安全图片上传蓝图](./07-secure-upload-implementation.md)。

## 使用方式

- 每次只选择一个阶段中的一个可评审小切片，避免一次 PR 同时迁移多个领域。
- 当前只执行阶段 0–8；不要为了让旧前端临时可用而扭曲 API 或添加兼容 shim。契约变化记录到阶段 9 的输入清单。
- 在开始阶段前重新确认已安装版本以及 NestJS、Prisma、GraphQL 的官方文档。
- 当前 functional-refactor 阶段不新增或扩写 Jest；保持代码可测试，先记录可复现 runtime/失败场景和 deferred coverage，再在后续 Jest phase 自动化。
- 只有上一阶段的门槛满足后，才把下一阶段标记为进行中；紧急安全修复例外。
- 阶段文件描述计划；真正实现后，将实测结果写入 `docs/learning/`，不要把计划文字当作完成证据。
