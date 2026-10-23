# 07：迁移订单列表、详情与时间线样式

状态：未开始。前置：[06](./06-checkout.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/orders` 的页面、卡片、表格和时间线，删除 `orders.css`。配送历史复用订单界面，也包含在本步验收中。

## 实施步骤

- [ ] 迁移订单页头、筛选、分区切换、列表、详情、事实信息和操作区。
- [ ] 保留桌面表格与移动卡片的原切换边界、表格滚动范围及已选分区状态。
- [ ] 用完整类名映射替换时间线动态 `orders-timeline__step--${state}`，保持当前／完成／待处理状态的标记、连线及文字。
- [ ] 迁移订单条目、金额、配送信息、通知和连接状态；步骤 01 已迁移 loading Skeleton 尺寸，本步移除其余 loading 布局类。
- [ ] 保留角色投影、状态筛选、订阅更新、重连提示、历史详情及取消／操作行为，不调整订单状态机。
- [ ] 删除模块出口等位置的 CSS 导入、文件及旧 `orders-*` 类名，更新依赖旧类名的测试。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/modules/orders src/app/composition/order-route-content.spec.tsx src/modules/courier/pages/courier-pages.spec.tsx
```

- 执行共同门禁；核对 Customer／Owner／Courier 三种投影、移动卡片与桌面表格、详情时间线。
- 覆盖 loading、empty、error、不同订单状态、长商品名、断线提示和操作中状态。
- 确认配送历史没有因为复用组件迁移出现样式或可访问性回归。

## Commit message

```text
♻️ refactor(web): migrate order views to tailwind

Move order cards, tables and timelines to explicit utility classes.
Preserve role-specific views, responsive layouts and status semantics.
Remove order CSS without changing realtime or order state behavior.
```

## 执行记录

- 完成日期：未完成。
- 命令与结果：未执行。
- 三角色订单／时间线／历史视觉证据：未执行。
- 阻塞项：待记录。
