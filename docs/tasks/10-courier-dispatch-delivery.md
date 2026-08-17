# Courier Dispatch 与 Delivery 最小任务

## 来源与依赖

- 需求：[`04-courier.md`](../proposals/04-courier.md) 的 Dashboard、接单、配送、地图降级、完成和历史章节。
- 设计：[`10-courier-dispatch-delivery.md`](../detailed-designs/10-courier-dispatch-delivery.md)。
- 依赖：Design System、Identity current Courier、Orders read model/repository/subscription、React Leaflet、Jotai、Zod。
- 现状：后端已有非原子的 `takeOrder` 和 Courier `cookedOrders` 订阅，但没有 `availableOrders` 查询、单活动订单约束或正确更新 payload；前端 Courier 模块尚不存在。

## 实现任务

### Available 与原子接单

- [ ] 新增 COURIER-only `availableOrders` 查询，只返回 WAITING 且 courierId=null，按 createdAt/id 升序且不分页。
- [ ] 实现前端 initial query + cooked increment 的 filter/sort/dedupe；重连必须 refetch，不能只依赖订阅。
- [ ] 实现 Available card，仅显示餐厅、地址、items count、Order total 和 ready 状态，不虚构收益/距离/ETA/顾客地址。
- [ ] 并行读取 available、PICKED active、最近 DELIVERED；多个 active 时显示 invariant error 并禁用全部 Accept。
- [ ] 用 Serializable transaction 实现同 Courier 单 active 检查和 WAITING/null courierId 条件 updateMany；冲突最多重试一次。
- [ ] transaction commit 后发布更新后的 PICKED Order；publish failure 只记录并依靠 refetch 恢复，不回滚接单。
- [ ] 实现 success、no longer available、already active、timeout 四种协调；timeout 不自动重复 takeOrder。

### 模拟路线与配送页面

- [ ] 用 order ID 稳定 hash 选择固定演示点和预定义路线；不读取 geolocation、不调用 directions/geocoding API。
- [ ] 用 `mealdeli.delivery-demo.v1` 只持久化 version/orderId/progressIndex/startedAt；shape/version/order mismatch 时清理。
- [ ] 实现每 2 秒推进、45–60 秒总时长、progress clamp 和 cleanup；reduced motion 时关闭自动 timer并提供手动推进。
- [ ] 实现 React Leaflet 的三类 marker、已完成/剩余路线、Demo/模拟位置文案、Skip map 和 attribution。
- [ ] tile/network failure 时切换本地 grid + marker + SVG route，且不阻止 Complete delivery。
- [ ] 实现移动/桌面 Delivery layout、pickup/items/Order total；不显示真实顾客资料、外部导航、电话、PIN 或收入。

### 完成、实时与历史

- [ ] Complete 确认后只允许 assigned Courier 执行 PICKED→DELIVERED；服务端验证 assignment 与相邻 transition。
- [ ] 成功或已 DELIVERED 时清 route 并显示完成；assignment lost 清 route 返回 Dashboard；timeout 先查询再允许手动 retry。
- [ ] Dashboard/Delivery 订阅保留已知数据并显示 reconnect banner；重连和 tab visibility 恢复时 refetch active/order。
- [ ] 实现 Dashboard 的 Online、Active、Available、Recent、empty 与手动 Refresh，不使用高频 polling。
- [ ] 复用 Orders 的 Active/Completed history 和完成详情，已完成订单不显示互动地图。

## 测试与验收

- [ ] 覆盖 available merge/filter/sort/dedupe、active invariant、Accept disabled 和四个接单结果。
- [ ] 覆盖 route hash 稳定性、hydration/version/mismatch、advance/clamp/clear、timer cleanup 和 store 隔离。
- [ ] 覆盖 reduced motion、Skip map、tile fallback、complete success/idempotent/lost/timeout 和页面恢复。
- [ ] 覆盖后端 available 权限/filter/order、两 Courier 竞争、同 Courier 两单竞争、publish failure 和 assigned completion。
- [ ] 测试只使用 fake Orders/Map/clock/storage/subscription，不请求真实 tiles、WS 或位置。

## 完成条件

以上所有任务均为 `[x]`，且刷新可看到现有 WAITING、一次只能有一个 active、地图失败不阻断完成、从不访问真实位置后，才可在 [`progress.md`](./progress.md) 勾选本模块。

