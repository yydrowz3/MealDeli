# MealDeli 总体实施进度

## 状态规则

- 基线日期：2026-08-17。
- `[x]` 表示模块任务文档中的全部必需任务和验收项均有实现与验证证据。
- `[ ]` 表示模块尚未完成；部分实现不会折算为模块完成。
- 当前验证结果：API 与 Web 构建通过；Web lint 通过但有 3 条 Fast Refresh 警告；API 测试失败，主要原因是 Jest 无法解析 Prisma 生成客户端以及 AppController 断言已过期。

## 模块进度

以下顺序采用 [`00-architecture.md`](../detailed-designs/00-architecture.md) 的建议实施顺序。

- [ ] [Platform Shell / PWA](./01-platform-shell-pwa.md)
- [ ] [Design System](./02-design-system.md)
- [ ] [Identity / Profile](./03-identity-profile.md)
- [ ] [Media Upload](./04-media-upload.md)
- [ ] [Catalog Discovery](./05-catalog-discovery.md)
- [ ] [Orders / Realtime](./07-orders-realtime.md)
- [ ] [Cart / Checkout](./06-cart-checkout.md)
- [ ] [Owner Restaurant / Menu](./08-owner-restaurant-menu.md)
- [ ] [Owner Analytics / Promotion](./09-owner-analytics-promotion.md)
- [ ] [Courier Dispatch / Delivery](./10-courier-dispatch-delivery.md)

当前完成度：**0 / 10 模块**。

## 总体验收

- [ ] 10 个模块均只通过公共出口协作，依赖方向符合架构且不存在循环。
- [ ] Guest、Customer、Owner、Courier 的核心流程满足对应 proposal 验收场景。
- [ ] GraphQL、REST、会话失效、实时断线与 PWA 离线状态均具有设计规定的恢复路径。
- [ ] API 单元测试、API 构建、Web 构建和 Web lint 全部通过。
- [ ] 375px 的 Guest/Customer/Courier 流程与 1280px 的 Owner 流程完成响应式和键盘验收。

