# Design System 最小任务

## 来源与依赖

- 需求：[`00-overview.md`](../proposals/00-overview.md) 的视觉、共享组件、反馈、响应式与可访问性规则。
- 设计：[`02-design-system.md`](../detailed-designs/02-design-system.md)。
- 依赖：React、Tailwind/DaisyUI、Phosphor Icons、Sonner；不得依赖业务模块、Apollo、Jotai、Router 或 TanStack Form。
- 现状：所需运行时库已安装，但 `web/src/shared/ui/` 尚未建立。

## 实现任务

### Tokens 与公共出口

- [x] React、Tailwind/DaisyUI、Phosphor Icons 和 Sonner 依赖已安装，当前 Web 构建通过。
- [ ] 建立 semantic color、4px spacing、control height、radius、content width、breakpoint 和系统字体 tokens。
- [ ] 建立最小 `index.ts` 公共出口，不导出任何 User、Restaurant、Dish 或 Order 业务模型。

### Primitive 与反馈

- [ ] 实现 Button 四种 variant、三种 size、loading/disabled/aria-busy 及 icon-only label 约束。
- [ ] 实现 Input、Textarea、Select 和 FormErrorSummary，正确关联可见 label、description、error 与焦点。
- [ ] 实现 Card、Modal 和 Drawer；overlay 支持 focus trap、Escape、提交中禁止关闭及关闭后焦点恢复。
- [ ] 实现 Badge、Skeleton、EmptyState、ErrorState、ConnectionBanner 和业务无关 Toast adapter。
- [ ] 实现 `ChartFrame` 与 `MapFrame` 的标题、文字摘要、loading/empty/error/fallback slot，不导入图表或地图业务数据。

### 数据展示

- [ ] 实现只接受 safe integer cents 的 `formatUsd`，非法值不得显示为 `$NaN`。
- [ ] 实现本地时区日期展示并保留 machine-readable `datetime`，测试可固定 locale/timeZone。
- [ ] 实现五态订单 StatusBadge 的一致 label、tone 和 icon，状态不能只靠颜色表达。
- [ ] 校验所有 token 组合满足 WCAG AA，业务组件不复制品牌 hex/radius。

## 测试与验收

- [ ] 配置 Design System 的独立 Vitest/RTL 环境，并补齐 jsdom、user-event、jest-dom 测试依赖。
- [ ] 覆盖 Button、form control、overlay、feedback 的 role、键盘、焦点和无障碍名称。
- [ ] 覆盖金额、日期和五态状态展示的边界与固定时区行为。
- [ ] 证明测试无需 Apollo、Jotai、TanStack Form、Router 或任何业务模块即可运行。

## 完成条件

以上所有任务均为 `[x]`，且 tokens 是唯一视觉值来源、公共组件通过独立测试后，才可在 [`progress.md`](./progress.md) 勾选本模块。

