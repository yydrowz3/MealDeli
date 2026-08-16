# Courier Dispatch 与 Delivery 详细设计

## 1. 职责与非目标

Courier 模块拥有可接订单、单活动配送、接单竞态、配送 Dashboard、模拟地图/路线、完成配送和 Courier 历史投影。

不负责：Order 基础状态机、真实 GPS/导航、配送报酬、距离/ETA、顾客真实地址、电话/聊天、后台定位或多单路线优化。

## 2. 依赖与公共出口

依赖 Design System、Identity current Courier atom、Orders read model/repository/subscription、React Leaflet、Jotai、Zod。

```ts
export type AvailableOrder = Order;

export type DemoPoint = { lat: number; lng: number };
export type DemoRoute = {
  orderId: string;
  restaurant: DemoPoint;
  destination: DemoPoint;
  path: readonly DemoPoint[];
  progressIndex: number;
};

export interface CourierRepository {
  availableOrders(): Promise<readonly AvailableOrder[]>;
  takeOrder(id: string): Promise<void>;
  completeOrder(id: string): Promise<void>;
}

export function createDemoRoute(orderId: string): DemoRoute;
export const courierRouteAtom: Atom<DemoRoute | null>;
export const advanceCourierRouteAtom: WritableAtom<null, [], void>;
export const clearCourierRouteAtom: WritableAtom<null, [], void>;
export function createCourierRouteTestStore(options?: RouteTestStoreOptions): JotaiStore;
export function CourierDashboardPage(): JSX.Element;
export function DeliveryPage(props: { orderId: string }): JSX.Element;
```

Orders type/Timeline/StatusBadge 从 Orders 公共出口导入，不在 Courier 重新定义。

## 3. 建议目录

```text
src/modules/courier/
├── api/courier.graphql
├── api/courier-repository.ts
├── model/available-orders.ts
├── model/demo-route.ts
├── model/route-atoms.ts
├── model/active-delivery.ts
├── components/available-order-card.tsx
├── components/active-delivery-card.tsx
├── components/delivery-map.tsx
├── components/map-fallback.tsx
├── pages/courier-dashboard-page.tsx
├── pages/delivery-page.tsx
├── testing/fixtures.ts
├── testing/handlers.ts
└── index.ts
```

## 4. Available orders API

### 4.1 GraphQL contract

```graphql
extend type Query {
  availableOrders: GetOrdersOutput!
}
```

- `@Roles(UserRole.COURIER)`。
- 无参数、首版不分页，符合 demo 简单范围。
- 查询 `status = WAITING AND courierId IS NULL`。
- 按 `createdAt ASC, id ASC`，较早等待订单优先。
- 返回 Order fields，并通过现有 field resolvers 获取 items/restaurant。
- 非 Courier 由 guard 拒绝；错误返回 `{ ok: false, orders: null, error }`。

Service 建议独立 `getAvailableOrders()`，不要把 `getOrders` 的角色分支扩展为魔法 status。

### 4.2 前端列表

初次进入与每次重连后调用 query；`cookedOrders` 只负责增量。合并按 ID 去重，并再次过滤 WAITING/null courierId。排序最早优先。

Available card 只显示 Restaurant、address、items count、order total 和 ready state；total 明确标记 `Order total`，不显示 earnings、distance、ETA 或 customer address。

## 5. 单活动订单

Active 定义为当前 Courier 的 `status = PICKED`。Dashboard 初始并行读取：

- `availableOrders`
- `getOrders(status: PICKED)`
- 最近 `getOrders(status: DELIVERED)`

若异常数据返回多个 PICKED：按 updatedAt 最新显示一个，禁用所有 Accept，并显示 `Multiple active deliveries need attention.`；同时记录服务端 invariant error，不能静默允许更多订单。

存在 active 时 Available 仍显示，但按钮 disabled，说明 `Complete your active delivery before accepting another order.`。

## 6. 原子 takeOrder 后端设计

保持现有 mutation：

```graphql
takeOrder(input: TakeOrderInput!): TakeOrderOutput!
```

### 6.1 Transaction

使用 Prisma `$transaction`，`isolationLevel: Serializable`：

1. 查询 Courier 是否存在 `courierId = currentUser.id AND status != DELIVERED`；存在返回 `You already have an active delivery.`。
2. 条件 `updateMany`：`id=input.id AND status=WAITING AND courierId=null`，写 `courierId=currentUser.id,status=PICKED`。
3. count != 1 返回 `Order is no longer available.`。
4. 查询并返回更新后的 order，include restaurant owner/items 必要关系。
5. Serializable conflict 可在 service 内最多重试一次；仍冲突返回 no-longer-available，不把数据库异常暴露给客户端。

不同 Courier 竞争同一 Order 只有一个 conditional update 成功；同 Courier 并发接不同 Order 通过 Serializable active check 保证只有一个 transaction 提交。

### 6.2 Publish

Transaction commit 后才发布：

```ts
await pubSub.publish(NEW_ORDER_UPDATE, {
  orderUpdates: updatedOrder,
});
```

payload 必须包含正确 PICKED/courierId/customerId/restaurant.ownerId。发布失败不能回滚已提交接单；记录错误并依靠各客户端重连/refetch 恢复。

### 6.3 前端竞态

- success：移出 Available，写 Orders cache，导航 delivery。
- no longer available：移出卡片，Toast `This order was accepted by another courier.`。
- already active：refetch active，显示 `Continue delivery`。
- network timeout：不得自动调用 takeOrder；refetch active/available 判断是否已成功。

## 7. Demo route

### 7.1 生成

- 使用固定演示城市中心与若干预定义 restaurant/destination pairs。
- 对 order ID 做稳定非加密 hash，选择 pair。
- path 为预定义 polyline 或确定性线性插值，不调用 geocoding/directions API。
- 同一 order ID 在不同设备/刷新得到相同基础路线。
- 不读取 `navigator.geolocation`，不把坐标上传 API。

### 7.2 Route atoms

- `courierRouteAtom` 使用 `atomWithStorage` 且设置 `getOnInit: true`，key `mealdeli.delivery-demo.v1`。
- 自定义 storage 的 Zod shape 包含 version=1、orderId、progressIndex、startedAt；基础 path 重新由 orderId 派生，不把大量坐标持久化。
- 当前 active order ID 与存储不一致时丢弃旧路线。
- 每 2 秒前进一步，总时长目标 45–60 秒，到终点后停留。
- DELIVERED/logout/assignment lost 时执行 `clearCourierRouteAtom` 并删除 storage。
- `prefers-reduced-motion` 时不自动 timer，显示静态进度和可选 `Advance demo route`。

路线进度不控制业务 status，`Complete delivery` 在任何进度都可用。

## 8. Map UI 与降级

- React Leaflet map：Restaurant、Demo destination、Courier 三种图标和 accessible label。
- completed segment Jade，remaining gray；显示 `Demo route` 和 `Location is simulated for this demo.`。
- MapFrame 前提供 `Skip map`，tile attribution 不被 sticky button 遮挡。
- tile/network failure 渲染本地 grid fallback + 三 marker + SVG path，Banner `Map tiles are unavailable. The demo route is still active.`。
- 地图失败不阻止 `Complete delivery`。

Map component 只接收 `DemoRoute` 和 failure callback，不查询 order 或直接操作 Jotai store；timer/controller 执行 write-only progress atom。

## 9. Complete delivery

确认 `Complete this delivery?` 后调用现有 `editOrder(id, DELIVERED)`：

- 按钮 loading、禁止重复。
- success 更新 Orders cache、执行 clear route atom、显示 `Delivery completed`。
- 已 DELIVERED 视为幂等成功。
- permission/assignment lost：清 route，返回 Dashboard，提示 `This delivery is no longer assigned to you.`。
- timeout：先 getOrder；DELIVERED 则成功，否则允许用户手动 retry。

后端 `canEditOrder` 保持 COURIER 只可 PICKED/DELIVERED，但应额外校验 transition 与 assignment，不能允许未接取 Courier 修改。

## 10. Realtime 与页面恢复

- Dashboard 启动 query + cooked subscription。
- 订阅断线显示 `New order updates are reconnecting…`；已有数据保留。
- 重连 refetch available/active，按 ID 去重。
- Delivery page 订阅当前 order；如果变为 DELIVERED 清路线并显示完成；如果 courierId 改变则 assignment lost。
- tab visibility 恢复时 refetch active，不依赖 timer 推测业务状态。

## 11. 页面

### 11.1 Dashboard

- Online informational badge、Active card、Available、Recent deliveries。
- 无 Available：`No orders available`，订阅保持连接。
- 手动 `Refresh` 只触发 query，不创建高频 polling。

### 11.2 Delivery

- 移动地图上/信息下；桌面 65/35。
- 显示 pickup Restaurant/address、Demo destination、items、Order total。
- 不显示真实顾客资料、外部导航、电话、照片、PIN 或 income。

### 11.3 History

复用 Orders `/orders` 的 Active/Completed 投影。已完成详情不再显示互动地图。

## 12. 独立测试

### 12.1 前端

- available merge/filter/sort/dedupe。
- active invariant、Accept disabled、三个错误分支和 timeout reconciliation。
- hash/route 对相同 ID 稳定、不同 fixture 分布、progress clamp。
- Jotai route atoms：hydration/version/order mismatch/advance/clear、不同 test store 隔离。
- reduced motion、timer cleanup、tile fallback、Skip map。
- complete success/idempotent/lost/timeout。
- subscription reconnect/refetch 和 visibility restore。

测试注入 Jotai `createStore()`、fake clock、memory storage、fake map renderer、Order repository/subscription；不得使用 default store 或请求真实 tiles/WS。

### 12.2 后端

- available 只 Courier，正确 filter/order。
- 两 Courier 同 Order 并发只有一个成功。
- 同 Courier 两 Order 并发只有一个成功。
- 已 PICKED/DELIVERED 不可接，已有 active 不可接。
- transaction commit 后 payload 完整；publish failure 不回滚。
- complete 只 assigned Courier 且 PICKED → DELIVERED。

## 13. 验收标准

- 刷新 Dashboard 能看到既有 WAITING 订单，而非只等待订阅。
- 前后端共同保证 Courier 一次一个 active delivery。
- 接单 timeout、竞争和重连都不会生成第二次自动 mutation。
- 模拟位置稳定、可降级、尊重 reduced motion，且从不访问真实定位。
- Courier 模块可用 fake Orders/Map/clock/storage 独立测试。
