# Owner Analytics 与 Promotion 详细设计

## 1. 职责与非目标

Owner Insights 模块拥有最近 7 天统计、Sales/Top dishes 图表、active order 摘要和固定 7 天 Promotion。统计为前端演示聚合，不是财务报表。

不负责：Restaurant/Menu CRUD、Order 状态机、真实支付、结算、退款、30 天/自定义区间或 Payment schema 迁移。

## 2. 依赖与公共出口

依赖 Design System、Orders read model、Owner Management 的 restaurant selection/read summary，以及现有 Payment GraphQL API。

```ts
export type OwnerMetrics = {
  salesMinor: number;
  orderCount: number;
  averageOrderMinor: number;
  activeOrderCount: number;
  dailySales: readonly { date: string; salesMinor: number }[];
  topDishes: readonly { dishName: string; quantity: number }[];
};

export function computeOwnerMetrics(input: {
  orders: readonly Order[];
  now: Date;
  restaurantId?: string;
}): OwnerMetrics;

export function OwnerDashboardPage(): JSX.Element;
export function PromotionPage(props: { restaurantId: string }): JSX.Element;
```

## 3. 建议目录

```text
src/modules/owner-insights/
├── api/promotion.graphql
├── api/promotion-repository.ts
├── model/analytics.ts
├── model/date-buckets.ts
├── model/promotion.ts
├── components/metric-card.tsx
├── components/sales-chart.tsx
├── components/top-dishes-chart.tsx
├── components/promotion-card.tsx
├── pages/owner-dashboard-page.tsx
├── pages/promotion-page.tsx
├── testing/fixtures.ts
├── testing/handlers.ts
└── index.ts
```

## 4. 7 天聚合

- 使用浏览器本地时区的今天及前 6 个日历日，区间 `[dayStart-6, tomorrowStart)`。
- 可先按 optional restaurantId 筛选，再按 createdAt 入桶。
- Sales：区间内全部订单 `totalMinor` 之和；不排除 active，因为当前无取消态。
- Orders：区间订单数。
- Average：orderCount=0 时 0，否则 `Math.round(sales/orderCount)` cents。
- Active：全部当前过滤范围内 PENDING/COOKING/WAITING/PICKED 数量，不受 7 天 createdAt 限制，避免老 active 被漏掉。
- Top dishes：区间内 item.quantity 按 `dishName` 汇总，quantity 降序、name 升序稳定 tie-break，取 5。
- 7 个 daily bucket 始终齐全，空日为 0。

所有计算为无副作用纯函数，传入 `now`，不直接调用 `Date.now()`。

## 5. Dashboard

- Restaurant selector 支持 All restaurants；选择由 Owner Management 提供。
- 四卡：`Sales`、`Orders`、`Average order`、`Active orders`。
- `Sales · Last 7 days` 使用 Recharts 简单折线/柱状图。
- `Top dishes` 水平条形图。
- 每个 ChartFrame 提供文字 summary；无数据使用 `No sales data for the last 7 days.`。
- Active orders 列表复用 Orders/Owner action slot，不在 Insights 内复制 mutation。

Order 数据变化由 Apollo/Subscription 触发重新计算；不把 metrics 写入 Jotai 或 Apollo。

## 6. Promotion 常量与状态

```ts
export const DEMO_PROMOTION = {
  priceMinor: 999,
  currency: "USD",
  durationDays: 7,
} as const;

type PromotionState = "inactive" | "active" | "submitting" | "error";
```

active 唯一判断：`promotedUntil != null && new Date(promotedUntil) > now`。客户端倒计时仅辅助，最终以服务端 refetch 为准。

## 7. Payment API

复用 `createPayment(restaurantId, transactionId)` 和 `getPayments`。transaction ID 使用注入的 UUID v7/crypto UUID，以 `demo_` prefix 增强可读性；同一次提交只生成一次，retry 使用同一 ID 以利用服务端 unique 约束。

流程：

1. ownership 与当前 active 状态确认。
2. 显示 `$9.99 / 7 days` 与 `Demo payment — no real charge will be made.`。
3. 确认后锁定 modal，生成/保留 transaction ID。
4. success refetch Restaurant `promotedUntil` 和 Payments。
5. duplicate transaction 错误先 refetch；若 Promotion 已 active 视为成功。
6. network timeout 不生成新 ID，允许同 ID 手动 retry。

## 8. Payment 模型边界

保持当前 Payment model：id、transactionId、ownerId、restaurantId、timestamps。不添加 amount/currency/duration migration。

- History 显示 date、restaurant、截断 transaction ID 和 `Demo promotion`。
- 不显示 `$9.99` 为已持久化交易金额，不称为 invoice/receipt。
- 服务端仍从 `PROMOTION_DAYS` 读取 7；环境配置应与 UI 常量一致，启动/测试契约断言为 7。
- active 时禁用重复购买；不设计叠加/续费。

## 9. 错误与边界

- 无 orders：四卡为 0，图表 empty，不报错。
- 缺 items：该 order 仍计 Sales/Orders，但不计 Top dishes，并记录诊断。
- 跨 DST：通过本地 day boundary helper 逐日构造，不用固定 24h 毫秒倒推。
- restaurant 不属于 Owner：统一 not found，禁止 Payment mutation。
- active date invalid：视为 inactive，同时记录 schema/data error。
- Payment failure 保留页面与同一 transaction ID。

## 10. 独立测试

- 7 day inclusive/exclusive boundary、本地时区和 DST。
- Sales/average/active 口径、restaurant filter、0 orders。
- Top dishes quantity/tie/limit/missing items。
- Chart render 的文字 summary、empty 和 mobile stack。
- Promotion active/expired/invalid date。
- 单次 UUID、timeout retry 同 ID、duplicate refetch、active 禁止重复。
- MSW 覆盖 create/get Payments success/business/network error。
- 后端 Payment tests 保持 unique transaction、ownership、PROMOTION_DAYS=7 和 promotedUntil 更新。

## 11. 验收标准

- Analytics 只依赖 Order fixtures 即可测试，不请求独立 analytics API。
- active order count 不被 7 天区间错误裁剪。
- Promotion 文案明确是 Demo，历史不虚构数据库未保存金额。
- 所有时间测试注入 clock，所有金额为 cents。
