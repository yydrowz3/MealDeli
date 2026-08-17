# Identity 与 Profile 最小任务

## 来源与依赖

- 需求：[`01-guest.md`](../proposals/01-guest.md)、[`02-customer.md`](../proposals/02-customer.md)、[`03-owner.md`](../proposals/03-owner.md)、[`04-courier.md`](../proposals/04-courier.md) 的认证与 Profile 章节。
- 设计：[`03-identity-profile.md`](../detailed-designs/03-identity-profile.md)。
- 依赖：Design System、Media Upload、Platform transport port、Jotai、TanStack Form、Zod。
- 现状：后端已有注册、登录、退出、刷新、验证、`me`、编辑 Profile 和 HttpOnly refresh cookie；前端模块与 `resendVerification` 尚缺，API 测试当前无法通过。

## 实现任务

### Session 与数据接口

- [x] 建立 `SessionUser`、`IdentitySnapshot`、error code 和 GraphQL adapter，生成类型不得跨模块暴露。
- [x] 实现内存 identity/access-token atoms、只读 selectors 和职责单一的 bootstrap/set/clear action atoms。
- [x] 实现 session bootstrap：refresh 成功后查询 `me`；失败静默转 anonymous；二次失败清理 session。
- [x] 后端登录/刷新已使用 HttpOnly refresh cookie，登录响应不向客户端返回 refresh token；API 构建通过。
- [x] 后端邮箱验证 token 以 SHA-256 hash 存储，验证成功后删除 verification 记录；API 构建通过。
- [x] 新增公开且防账户枚举的 `resendVerification` GraphQL 契约、60 秒服务端冷却、1 小时 hash token 和通用邮件错误。

### 表单与页面

- [x] 为 Login、Signup、Resend、Profile 建立 TanStack Form options 和唯一 Zod 校验源，不复制 loading/field state 到 Jotai。
- [x] 实现 Login：统一错误文案，成功后 `me`，安全处理 returnTo，并按三角色跳转。
- [x] 实现 Signup：合法 role query 预选，非法/缺失时要求选择；成功不自动登录并清空 password。
- [x] 实现 Check email 与 verification gate；未验证 session 只能访问公开/验证/resend/logout 流程。
- [x] 实现 Verify page 的缺 token、loading、success、invalid/expired、network error 与 resend 恢复路径。
- [x] 实现 Profile：Media 图片适配、role 只读、保存后同步 Apollo/Jotai；修改 email 后立即进入验证门禁。
- [x] 实现本地优先 logout；即使 mutation 失败也清 session，并由 Platform 清 Cart 与 Owner/Courier 私有状态。

## 测试与验收

- [x] 覆盖 role/query/password/Profile schema 与 TanStack Form 字段/表单错误、重复提交。
- [x] 覆盖 atoms 的 bootstrap、anonymous、logout、expired、store 隔离和 token 不持久化。
- [x] 覆盖 Login/Signup/Verify/Resend/Profile 的成功、失败、跳转与 Apollo/Jotai 同步。
- [x] 覆盖后端 resend 的未知/已验证/未验证邮箱一致响应、冷却、旧 token 失效和邮件异常。
- [x] API build 和类型检查通过，并以 GraphQL schema/DTO、resolver 公开性、service 冷却/token hash/通用错误分支的契约证据验证 resend；API Jest 不作为本轮门禁。

## 完成条件

以上所有任务均为 `[x]`，且未验证账号无法进入业务路由、token 不落盘、Identity 可独立测试后，才可在 [`progress.md`](./progress.md) 勾选本模块。
