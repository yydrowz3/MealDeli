# MealDeli Courier 前端设计方案

## 1. 目标与边界

Courier 体验覆盖查看可接订单、一次接取一个订单、在地图上演示配送进度、完成配送以及查看历史记录。地图使用真实底图和固定模拟点位，不读取浏览器位置，也不代表真实导航。

核心成功指标：

- 在线 Courier 能看到已有和实时出现的 WAITING 订单。
- 并发接单失败时能安全恢复，不出现两个 Courier 同时拥有同一订单的假象。
- Courier 同时只能拥有一个 PICKED 订单。
- 模拟地图清楚区分餐厅、顾客和 Courier，并能演示位置移动。
- 完成配送后订单进入 DELIVERED，并立即出现在历史记录中。

## 2. 导航与页面清单

| 路由 | 页面 | 主要操作 |
| --- | --- | --- |
| `/dashboard` | Courier dashboard | `Accept order` / `Continue delivery` |
| `/deliveries/$orderId` | Active delivery | `Complete delivery` |
| `/orders` | Delivery history | `View details` |
| `/orders/$orderId` | Completed delivery detail | `Back to orders` |
| `/profile` | Courier profile | `Save changes` |

### 2.1 Courier 导航

- 移动端底部导航：`Dashboard`、`Orders`、`Profile`。
- 桌面端顶部导航保留相同三项，右侧显示头像菜单和 `Log out`。
- 有活动配送时 Dashboard 导航显示小型状态点，并在所有 Courier 页面顶部显示 `Active delivery` banner。
- 配送详情使用简化 Header：返回箭头、`Delivery`、短订单号。

## 3. Dashboard `/dashboard`

### 3.1 无活动订单

页面结构：

```text
Courier dashboard
[Availability: Online]

Available orders
[Order card]
[Order card]

Recent deliveries
[Completed order row]
```

- 首版只有 `Online` 状态，不提供真正的上下线调度；标签用于解释页面正在接收实时订单。
- 初始列表依赖建议新增的 available orders 查询：只显示 WAITING 且 `courierId = null`。
- `cookedOrders` 订阅收到新订单后插入列表顶部。
- Available 默认按 ready/created time 从早到晚，优先展示等待较久的订单。

### 3.2 有活动订单

Dashboard 顶部显示突出卡片：

- `Active delivery`
- Restaurant name、address、order total、接受时间。
- 状态 `On the way`
- 主按钮 `Continue delivery`

Available orders 仍可显示以便演示市场情况，但所有 `Accept order` 按钮禁用，说明为 `Complete your active delivery before accepting another order.`。前端和建议的服务端校验共同保证一次一个订单。

### 3.3 Available order card

仅展示 Courier 完成判断所需且已有数据来源的内容：

- Restaurant name。
- Restaurant address。
- `Order ready for pickup`。
- Item 数量。
- Order total，仅作为订单参考，不称为 Courier earnings。
- 创建时间。
- 主按钮 `Accept order`。

由于当前系统没有配送地址快照、距离和配送报酬，不显示顾客地址、里程、预计用时或 earnings。

### 3.4 空状态

- 标题：`No orders available`
- 说明：`New pickup orders will appear here while you’re online.`
- 页面保持订阅连接，不使用手动高频轮询。
- 提供低优先级 `Refresh` 作为连接恢复后的手动补救。

## 4. 接单流程

### 4.1 Accept

1. 点击 `Accept order` 后只锁定当前卡片，按钮显示 loading。
2. 服务端原子确认订单仍无人接取，并校验 Courier 没有活动订单。
3. 成功后从 Available 移除订单，更新本地 active delivery，跳转 `/deliveries/$orderId`。
4. Customer 和 Owner 应通过订单订阅收到正确的 `PICKED`、`courierId` 和关联数据。

### 4.2 竞态失败

如果订单已被其他 Courier 接走：

- 从列表移除该订单。
- Toast：`This order was accepted by another courier.`
- 焦点移动到下一张可接订单的标题；没有下一单时移动到空状态标题。
- 不显示通用红色错误页，也不自动接受其他订单。

如果 Courier 已有活动订单：

- Toast：`You already have an active delivery.`
- 显示 `Continue delivery` 操作。
- 重新读取 active delivery，保证多标签页一致。

网络失败时保留订单卡，按钮恢复为可用，显示 `We couldn’t accept this order. Try again.`。客户端超时后必须重新查询，避免实际成功但页面认为失败。

## 5. 配送详情 `/deliveries/$orderId`

### 5.1 页面布局

桌面端地图约占 65%，右侧面板 35%；移动端地图占首屏约 48%，下方为可滚动订单面板。

```text
┌───────────────────────────────┬──────────────────────┐
│                               │ On the way           │
│ Map                           │ Restaurant           │
│ R ─────── C ───────────── D   │ Pickup details       │
│                               │ Order summary        │
│                               │ [Complete delivery]  │
└───────────────────────────────┴──────────────────────┘
```

标记：

- Restaurant：餐厅图标，英文可访问名称 `Pickup: {restaurant}`。
- Customer destination：Home 图标，名称 `Demo delivery destination`。
- Courier：高对比方向标记，名称 `Simulated courier location`。
- Route：Jade 主线，已完成部分使用深 Jade，未完成部分使用浅灰。

### 5.2 模拟位置规则

- 使用固定城市中心坐标和预定义路线，不读取 `navigator.geolocation`。
- 根据 order ID 稳定选择一组模拟 restaurant/destination 坐标，同一订单刷新后路线不跳到另一城市。
- 接单成功后 Courier 从 restaurant marker 开始，每 2 秒沿路线前进一个确定步长。
- 路线总演示时间约 45–60 秒；刷新后可从本地保存的演示进度恢复，但服务端状态仍是唯一业务事实。
- 页面始终显示标签 `Demo route` 和说明 `Location is simulated for this demo.`。
- 地图不得上传坐标到后端，也不要求位置权限。

模拟进度不限制 `Complete delivery`。Courier 可随时点击完成，便于演示；按钮确认后以服务端订单状态为准。

### 5.3 地图降级

OpenStreetMap tile 无法加载时：

- 保留地图容器尺寸，显示简化网格背景、三个标记和连接路线。
- Banner：`Map tiles are unavailable. The demo route is still active.`
- `Complete delivery` 仍可使用。
- 不把地图加载失败当作整个订单页失败。

### 5.4 订单信息面板

- 状态：`On the way`
- Restaurant name 和 pickup address。
- `Demo delivery destination`，不展示当前 User address 作为真实订单目的地。
- Items 仅显示 Dish 快照名称和数量；可折叠查看选项。
- Order total 作为信息展示。
- 主按钮 `Complete delivery`。

不显示电话、消息、外部导航、拍照证明、签名、PIN 或收入金额。

## 6. 完成配送

点击 `Complete delivery` 显示确认弹窗：

- 标题：`Complete this delivery?`
- 说明：`This will mark the order as delivered.`
- Primary：`Complete delivery`
- Secondary：`Keep delivering`

确认后：

1. 按钮进入 loading 并禁止重复提交。
2. 更新订单为 DELIVERED。
3. 成功显示完成视图：`Delivery completed`、订单号和 `Back to dashboard`。
4. 短暂完成视图后可自动返回 `/dashboard`，但不能在屏幕阅读器读完前强制跳转；默认由用户点击返回更稳定。
5. 清除本地模拟路线进度和 active delivery。
6. 订单立即出现在 `/orders`。

如果订单已由另一状态变化导致不能完成，重新读取订单：

- 已 DELIVERED：按成功处理，避免重复错误。
- 仍 PICKED：显示 `We couldn’t complete the delivery. Try again.`。
- 不属于当前 Courier：显示 `This delivery is no longer assigned to you.` 并返回 Dashboard。

## 7. Delivery history `/orders`

### 7.1 列表

- 标题：`Delivery history`
- Tabs：`Active`、`Completed`
- Active 最多一个 PICKED 订单。
- Completed 包含 DELIVERED，按更新时间降序。
- WAITING 未接订单不属于 Courier 的 `/orders`，只存在 Dashboard Available 区。

订单卡片/行显示：

- Restaurant name。
- 短订单号。
- Status。
- 接单/完成时间以已有时间字段为准；不虚构独立 delivery timestamp。
- Item 数量和 order total。
- `Continue delivery` 或 `View details`。

空历史：`No completed deliveries yet` + `Accepted deliveries will appear here after completion.`。

## 8. 完成订单详情 `/orders/$orderId`

- Restaurant name 和 address。
- Order ID、createdAt、updatedAt。
- 状态 `Delivered`。
- Item 快照、数量、选项和 total。
- 简化的完成时间线：`Ready for pickup`、`Accepted`、`Delivered`；若后端没有每阶段 timestamp，只显示顺序，不虚构具体时间。
- `Back to orders`。
- 已完成订单不再展示互动地图或 `Complete delivery`。

不存在和越权统一显示 `Order not found`。

## 9. Profile `/profile`

- Avatar、`Full name`、`Email address`、`Address`、可选 `New password`。
- Role 只读显示 `Courier`。
- Address 是个人资料字段，不作为真实定位或 Courier 当前地址使用。
- 主按钮 `Save changes`，成功显示 `Profile updated.`。
- 不包含车辆、证件、银行账户、配送区域或上线审核。

## 10. 实时连接与恢复

Courier Dashboard 同时依赖初始查询和 `cookedOrders` 实时订阅：

- 首次进入：查询 available orders 和当前 Courier orders。
- 在线期间：订阅新 WAITING orders。
- 订阅断开：显示 `New order updates are reconnecting…`，现有列表仍可查看。
- 重连成功：重新查询 available orders；按 order ID 去重。
- 接单成功：订阅该 order 的 updates 或在关键操作后重新查询。
- 页面从后台恢复时重新校验 active delivery，避免多标签页或长时间挂起导致状态过期。

订阅事件只作为通知，不替代服务端查询结果。列表合并时按 ID 和状态去重，已 PICKED/DELIVERED 的订单不能重新出现在 Available。

## 11. 响应式与可访问性

- 375px 为核心验收宽度，Accept 与 Complete 按钮至少 48px 高。
- Available cards 移动端单列，768px 两列，1200px 最多三列。
- 配送详情移动端地图在上、面板在下；桌面左右分栏。
- 地图支持键盘用户跳过：地图前提供 `Skip map`，直接移动到订单信息。
- 标记不能只依靠颜色区分，必须使用不同图标和英文 label。
- 模拟移动尊重 `prefers-reduced-motion`：开启时不动画，只通过 `Advance demo route` 按钮或静态进度展示。
- Toast 和连接 banner 不抢焦点；接单竞态后按定义恢复焦点。
- 地图 tile attribution 始终可见，不被底部按钮遮挡。
- 订单总额明确标为 `Order total`，避免误解为配送收入。

## 12. 验收场景

1. Courier 首次进入能通过查询看到已存在的 WAITING 未接订单，而不只等待新订阅。
2. 新 WAITING 订单实时插入 Available，重连后列表无重复。
3. 接单成功将状态更新为 PICKED，并让 Customer 和 Owner 收到正确更新。
4. 两名 Courier 同时接同一订单时只有一人成功，另一人看到可恢复提示。
5. Courier 有 PICKED 订单时所有其他 Accept 被禁用，服务端也拒绝第二单。
6. 同一订单刷新后使用相同模拟路线，不请求浏览器定位权限。
7. 地图 tile 失败时仍能看到简化路线并完成配送。
8. `prefers-reduced-motion` 开启时 Courier 标记不会自动动画。
9. Complete 重复点击只产生一次状态更新；已 DELIVERED 被幂等视为成功。
10. 完成后活动订单清除、历史列表出现该订单、Customer/Owner 收到 DELIVERED。
11. Courier 不能查看未分配给自己的订单详情，也不能访问 Owner 或 Checkout 页面。
12. 所有界面不展示虚构的 earnings、距离、ETA、真实顾客地址或真实定位。

