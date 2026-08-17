# Owner Analytics 与 Promotion 最小任务

## 来源与依赖

- 需求：[`03-owner.md`](../proposals/03-owner.md) 的 Dashboard、统计、图表与 Promotion 章节。
- 设计：[`09-owner-analytics-promotion.md`](../detailed-designs/09-owner-analytics-promotion.md)。
- 依赖：Design System、Orders read model、Owner restaurant selection/read summary、现有 Payment API。
- 现状：后端 Payment 已校验 ownership，在事务中写 Payment/更新 promotedUntil，transactionId 有唯一约束并默认使用 7 天；前端 Insights 模块尚不存在。

## 实现任务

### Analytics

- [x] 实现接收 `orders`、`now`、可选 restaurantId 的纯 `computeOwnerMetrics`，不得请求独立 analytics API。
- [x] 按浏览器本地日界线生成今天及前 6 天完整 bucket，区间为 `[dayStart-6, tomorrowStart)`，空日补 0。
- [x] 计算 Sales、Orders、rounded Average；Active 统计全部 PENDING/COOKING/WAITING/PICKED，不受七天创建时间限制。
- [x] 按 dishName 汇总 Top dishes quantity，数量降序、名称升序稳定 tie-break，取前 5；缺 items 不影响 Sales/Orders。
- [x] 实现 Dashboard 的 All/单餐厅选择、四张指标卡、Sales/Top dishes 图表、文字摘要和无数据状态。
- [x] 复用 Orders active list/action slot；订单 cache/subscription 更新时直接重新计算，不持久化 metrics。

### Promotion

- [x] Payment 表已有 transactionId 唯一约束；后端在 ownership 校验后以事务写 Payment 并更新 promotedUntil，默认 `PROMOTION_DAYS=7`；API 构建通过。
- [x] 定义 `$9.99 / 7 days` demo 常量和 inactive/active/submitting/error 状态；active 仅由合法且未来的 promotedUntil 决定。
- [x] 实现 Promotion 页面、不可关闭的提交确认和明确的 Demo payment/no real charge 文案，active 时禁止重复购买。
- [x] 单次提交只生成一个 `demo_` transaction ID；timeout 手动 retry 必须复用同一 ID。
- [x] 成功或 duplicate 后 refetch Restaurant/Payments；duplicate 且 Promotion 已 active 时按成功处理。
- [x] 实现 history 的日期、餐厅、截断 transaction ID 和 `Demo promotion`；不得把 `$9.99` 描述为持久化交易金额或发票。
- [x] 增加前后端契约断言，保证 UI duration 与 `PROMOTION_DAYS` 均为 7；不修改 Payment schema。

## 测试与验收

- [x] 覆盖七天边界、本地时区/DST、Sales/Average/Active、restaurant filter 和零订单。
- [x] 覆盖 Top dishes tie/limit/missing items 及图表文字摘要、empty、移动布局。
- [x] 覆盖 Promotion active/expired/invalid date、单次 UUID、同 ID retry、duplicate refetch 和 active 禁止重复。
- [x] API build 和类型检查通过，并核对 Payment unique、ownership、7 天配置和 promotedUntil 更新的 schema/service/transaction 契约证据；API Jest 不作为本轮门禁。
- [x] 证明 Analytics 只用 Order fixtures 和注入 clock 即可独立测试。

## 完成条件

以上所有任务均为 `[x]`，且统计口径稳定、Promotion 明确为 Demo、没有虚构 Payment 字段后，才可在 [`progress.md`](./progress.md) 勾选本模块。
