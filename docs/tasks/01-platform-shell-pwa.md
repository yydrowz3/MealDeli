# Platform Shell 与 PWA 最小任务

## 来源与依赖

- 需求：[`00-overview.md`](../proposals/00-overview.md)、[`01-guest.md`](../proposals/01-guest.md)、[`02-customer.md`](../proposals/02-customer.md)、[`03-owner.md`](../proposals/03-owner.md)、[`04-courier.md`](../proposals/04-courier.md) 的导航与页面规则。
- 设计：[`00-architecture.md`](../detailed-designs/00-architecture.md)、[`01-platform-shell-pwa.md`](../detailed-designs/01-platform-shell-pwa.md)。
- 依赖：Design System、Identity 公共 session/token 接口及各业务模块的 lazy page entry。
- 现状：Vite/TanStack Router/Apollo/PWA 基础依赖、品牌资源和 manifest 已存在，Web 构建通过；应用仍是示例路由结构。

## 实现任务

### 启动与传输

- [ ] 用 Zod 解析 `VITE_API_HTTP_URL`、`VITE_API_WS_URL`、`VITE_APP_ORIGIN`；非法配置显示启动错误且不创建 Apollo。
- [ ] 实现 `createAppServices` 与 `AppProviders`，按 Error Boundary → Jotai → Apollo → Router → Toaster 顺序注入同一显式 store。
- [ ] 配置带 credentials 和内存 access token 的 HTTP link；无 token 时不发送 Authorization。
- [ ] 配置读取最新 token 的 GraphQL WS link、30 秒封顶退避、token 更新重建和正常 dispose。
- [ ] 实现 single-flight refresh；并发 Unauthorized 只刷新一次，原请求最多重试一次，失败统一清理私有状态。

### 路由与界面组合

- [ ] 实现纯函数 `AccessPolicy`，按 checking、登录、邮箱验证、角色顺序处理并拒绝非法 `returnTo`。
- [ ] 建立 Guest、Customer、Owner、Courier layout；layout 只接收导航模型、badge/count 和内容 slot。
- [ ] 完成共享路由组合与 lazy page entry；`/dashboard` 是唯一按角色分派页面的路由。
- [ ] 实现 Landing 的 Hero、唯一主 CTA、三角色注册链接、How it works 和 Footer，且不请求 Catalog。
- [ ] 覆盖 runtime、chunk、root render、offline、session expired 和 role mismatch 的统一恢复界面。

### PWA

- [x] 保留 MealDeli manifest 名称、Jade/Warm White 配色及现有 PWA/品牌图标；现有 Vite 构建可生成 manifest 与 service worker。
- [ ] 将 GraphQL、uploads、地图瓦片和所有 mutation 设为 NetworkOnly，禁止缓存用户数据、Cart、token 和业务响应。
- [ ] 离线时保留 App Shell 并明确阻止业务读写，不将失败伪装为成功。
- [ ] 用“新版本可用 + Reload”提示替代自动重载，并避免在表单或下单期间刷新。

## 测试与验收

- [ ] 测试 runtime config、所有 AccessPolicy 分支和 checking 时不闪现私有页面。
- [ ] 测试 auth single-flight、失败清理一次、WS 重建/重连不重复订阅。
- [ ] 契约测试确认 PWA 不缓存 GraphQL/uploads，更新不会自动 reload。
- [ ] 测试 Landing 三个角色 CTA、唯一 H1 和键盘顺序。
- [ ] 完成跨模块路由回归，并保证任何业务模块都不反向导入 Platform。

## 完成条件

以上所有任务均为 `[x]`，且 Platform 可在隔离 store、模拟网络和模拟 session 下通过测试后，才可在 [`progress.md`](./progress.md) 勾选本模块。
