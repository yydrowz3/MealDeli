# MealDeli Owner 前端设计方案

## 1. 目标与边界

Owner 体验为多餐厅经营后台，覆盖餐厅创建与切换、菜单维护、订单处理、轻量销售看板和 7 天 Promotion。后台应优先提升信息密度和操作清晰度，不模拟复杂的企业级权限、财务或库存系统。

核心成功指标：

- 新 Owner 能创建第一家餐厅并完成基础菜单配置。
- 多餐厅 Owner 能始终理解当前管理对象，并快速切换餐厅。
- 新订单能实时出现并通过明确动作推进到 `WAITING`。
- 最近 7 天经营数据可以在不虚构业务指标的前提下快速理解。
- Promotion 购买流程明确标注为模拟支付，并显示有效期。

## 2. 导航与页面清单

| 路由 | 页面 | 主要操作 |
| --- | --- | --- |
| `/dashboard` | Owner dashboard | 选择餐厅、查看订单 |
| `/restaurants` | My restaurants | `Create restaurant` |
| `/restaurants/new` | Create restaurant | `Create restaurant` |
| `/restaurants/$restaurantId` | Restaurant overview | `Manage menu` |
| `/restaurants/$restaurantId/menu` | Menu management | `Add dish` |
| `/restaurants/$restaurantId/settings` | Restaurant settings | `Save changes` |
| `/restaurants/$restaurantId/promotion` | Promotion | `Promote for $9.99` |
| `/orders` | All restaurant orders | `View order` |
| `/orders/$orderId` | Owner order detail | `Start preparing` / `Mark ready` |
| `/profile` | Owner profile | `Save changes` |

### 2.1 Owner 导航

- 桌面端使用固定左侧栏：Logo、`Dashboard`、`Restaurants`、`Orders`、`Profile`。
- 左侧栏底部显示 Owner 头像、姓名和 `Log out`。
- `Orders` 出现未处理新订单时显示数字 badge。
- 主内容顶部显示当前页面标题、当前餐厅 selector 和页面主操作。
- 移动端使用底部导航 `Dashboard`、`Restaurants`、`Orders`、`More`；餐厅 selector 放在页面标题下。

### 2.2 当前餐厅上下文

- 当前餐厅用于 Dashboard、Menu 和 Promotion 的统计及操作。
- 选择结果保存在 URL 或本地偏好中；刷新后优先恢复上次餐厅。
- 指定 `$restaurantId` 的页面以 URL 为准，并确认餐厅属于当前 Owner。
- 餐厅删除或无权访问时，清理已保存选择并返回 `/restaurants`。
- `/orders` 默认跨全部餐厅，筛选器可选择 `All restaurants` 或单店。

## 3. 首次使用与空状态

Owner 没有餐厅时，`/dashboard` 和 `/restaurants` 使用相同引导：

- 标题：`Create your first restaurant`
- 说明：`Add your restaurant details, then build a menu and start receiving orders.`
- 主按钮：`Create restaurant`
- 辅助三步：`Restaurant details` → `Add dishes` → `Receive orders`

空状态不显示全为 0 的图表和统计卡，也不自动创建示例餐厅。

## 4. Dashboard `/dashboard`

### 4.1 页面结构

```text
┌──────────────┬──────────────────────────────────────────────┐
│ Side nav     │ Dashboard        [All / Restaurant selector]│
│              ├──────────────────────────────────────────────┤
│ Dashboard    │ [Sales] [Orders] [Average order] [Active]    │
│ Restaurants  ├──────────────────────────────────────────────┤
│ Orders • 2   │ Sales — Last 7 days   | Top dishes           │
│ Profile      ├──────────────────────────────────────────────┤
│              │ Active orders                                 │
└──────────────┴──────────────────────────────────────────────┘
```

### 4.2 统计卡

固定使用最近 7 个日历日（按浏览器本地时区）：

| 指标 | 计算方式 | 显示 |
| --- | --- | --- |
| Sales | 7 天内订单 `totalMinor` 之和 | USD |
| Orders | 7 天内订单数量 | integer |
| Average order | Sales ÷ Orders；无订单时为 `$0.00` | USD |
| Active orders | PENDING、COOKING、WAITING、PICKED 数量 | integer |

Sales 代表平台订单商品总额，不称为 `Revenue`、`Profit` 或 `Payout`。统计由现有订单数据前端聚合，仅供演示。

### 4.3 图表

- `Sales · Last 7 days`：折线图或柱状图，X 轴为日期，Y 轴为 USD。
- `Top dishes`：按订单项数量汇总前 5 个 Dish，使用水平条形图。
- 图表上方提供可读摘要，例如 `Sales were highest on Friday at $420.50.`。
- 无订单时显示 `No sales data for the last 7 days.`，不绘制误导性的平线。
- 不提供 30 天、自定义日期、同比、导出或财务预测。

### 4.4 Active orders

- 展示最多 8 个非 DELIVERED 订单，按创建时间从新到旧。
- 每行包含 restaurant、短订单号、时间、状态、总额和下一操作。
- PENDING 显示 `Start preparing`；COOKING 显示 `Mark ready`；WAITING/PICKED 只显示 `View order`。
- `View all orders` 进入 `/orders` 并保留当前餐厅筛选。

## 5. My restaurants `/restaurants`

### 5.1 列表

- 标题：`Restaurants`
- 主按钮：`Create restaurant`
- 卡片显示图片、name、category、address、Promotion 状态和创建时间。
- 每张卡的主要入口为 `Open restaurant`。
- 次级菜单：`Manage menu`、`Settings`、`Promotion`、`Delete restaurant`。
- Promotion 有效时显示 `Promoted until {date}`，过期时显示 `Promotion ended`。

列表 loading 使用卡片 skeleton。请求失败显示 `We couldn’t load your restaurants.`。筛选、搜索和分页首版不需要，因为现有 `myRestaurants` 返回 Owner 自有列表且产品要求保持简单。

## 6. 创建餐厅 `/restaurants/new`

### 6.1 表单

- 页面标题：`Create restaurant`
- 字段：
  1. `Restaurant name`
  2. `Category` select
  3. `Address` textarea
  4. `Restaurant image` upload
- 主按钮：`Create restaurant`
- 次操作：`Cancel`

Category 只允许从现有全局分类选择。Owner 前端不提供新建、修改或删除全局 Category 的入口，即使当前后端具有相关能力。

### 6.2 图片上传

- 支持常见图片类型，选择后立即本地预览。
- 上传进行中不能提交最终表单。
- 图片为可选字段；上传失败时显示 `Image upload failed. Try again or continue without an image.`。
- 成功创建后跳转 `/restaurants/$restaurantId` 并显示 `Restaurant created.`。

### 6.3 校验与失败

- Name、Category、Address 必填。
- Name 和 Address 只去除首尾空格，不在前端编造后端未定义的更短长度。
- 请求失败保留字段和已完成上传 URL。
- 重复点击只创建一个餐厅。

## 7. 餐厅概览 `/restaurants/$restaurantId`

页面提供当前餐厅的快速入口而不是重复完整 Dashboard：

- Hero：图片、name、category、address、Promotion 状态。
- Quick actions：`Manage menu`、`View orders`、`Edit restaurant`、`Promote restaurant`。
- Summary：Dish 数量、active order 数量、最近 7 天 Sales。
- `Recent orders`：最近 5 个订单。
- 菜单为空时突出 `Add your first dish`。

Owner 从 Customer 视角查看公开菜单不在首版提供独立 preview 模式；概览中的 `Manage menu` 直接进入编辑页。

## 8. Menu management `/restaurants/$restaurantId/menu`

### 8.1 页面布局

- 标题：`Menu`
- 主按钮：`Add dish`
- Dish 列表显示图片、name、description、base price、option 数量和更新时间。
- 操作：`Edit`、`Delete`。
- 不支持拖拽排序、菜单分区、库存、可售时段和批量操作。

空菜单显示：

- `Your menu is empty`
- `Add dishes so customers can place an order.`
- `Add dish`

### 8.2 Add/Edit Dish

桌面使用右侧 drawer，移动端使用独立全屏层。字段：

1. `Dish name`
2. `Description`
3. `Price`，以 USD 文本输入，提交前安全转换为 integer cents
4. `Dish image`
5. `Options`

主按钮根据模式显示 `Add dish` 或 `Save changes`。

### 8.3 Option builder

每个 Option 包含：

- `Option name`
- `Minimum selections`
- `Maximum selections`
- Choices 列表，每项包含 `Choice name` 与 `Extra price`
- `Add choice`、`Remove choice`、`Remove option`

规则：

- 每个 Option 至少有一个 Choice。
- Minimum ≥ 0；Maximum ≥ 1；Minimum ≤ Maximum ≤ Choice 数量。
- Extra price 可为 `$0.00`，不能为负数。
- 编辑现有 option/choice 时保留稳定 ID；新项由后端生成。
- 删除已有 option 前显示行内警告：历史订单仍使用保存的选项快照，不会被改写。

### 8.4 删除 Dish

- 确认标题：`Delete {dish name}?`
- 说明：`This removes the dish from the current menu. Past orders are not changed.`
- Danger 按钮：`Delete dish`
- 成功后显示 `Dish deleted.`；失败则保留列表并显示可重试错误。

## 9. Restaurant settings `/restaurants/$restaurantId/settings`

- 可编辑 `Restaurant name`、`Address` 和 `Restaurant image`。
- Category 当前后端编辑接口不支持修改，因此只读显示并标注 `Category can’t be changed.`。
- 主按钮：`Save changes`
- Danger zone 单独放在页面底部，包含 `Delete restaurant`。

删除确认必须要求 Owner 明确阅读影响：

- 标题：`Delete this restaurant?`
- 说明：`This permanently removes the restaurant and its menu. This action can’t be undone.`
- 可选输入餐厅名称作为高风险确认；首版至少要求二次确认弹窗。
- 如果存在订单导致后端拒绝删除，显示服务端错误，不建议前端隐藏历史订单。

## 10. Orders `/orders`

### 10.1 列表和筛选

- 标题：`Orders`
- Restaurant filter：`All restaurants` + Owner 旗下餐厅。
- Status filter：`All statuses`、PENDING、COOKING、WAITING、PICKED、DELIVERED。
- 默认按 `createdAt` 降序。
- 桌面使用表格，列为 Order、Restaurant、Placed、Status、Items、Total、Action。
- 移动端每行转为订单卡片。

不提供顾客搜索、日期范围、导出、批量处理或删除订单。

### 10.2 新订单实时提醒

收到 `pendingOrders` 后：

1. 将新订单插入列表与 Dashboard，不需要整页刷新。
2. `Orders` badge 增加未处理 PENDING 数量。
3. 显示持久 Toast：`New order from {restaurant}`、`Order #{shortId} · {total}`。
4. Toast 操作 `View order` 打开详情。
5. Toast 仅在 Owner 成功进入 COOKING 或主动关闭后消失。

不播放声音、不申请系统通知权限。如果 WebSocket 断开，显示 `Live order updates are reconnecting…`；重连后重新查询订单补齐漏单。

## 11. Owner 订单详情 `/orders/$orderId`

### 11.1 内容

- Order header：短订单号、restaurant、createdAt、status。
- Items：Dish 快照名称、选项快照、quantity、line total。
- Summary：Total。
- 五阶段状态时间线。
- 不展示顾客 email、电话或其他当前 API 不提供的敏感资料。

### 11.2 状态操作

| 当前状态 | 主按钮 | 目标状态 |
| --- | --- | --- |
| PENDING | `Start preparing` | COOKING |
| COOKING | `Mark ready for pickup` | WAITING |
| WAITING | 无；显示 `Waiting for a courier` | 无 |
| PICKED | 无；显示 `Courier is delivering this order` | 无 |
| DELIVERED | 无；显示 `Order completed` | 无 |

- 点击状态按钮先在原位置显示 loading，成功后使用服务端返回/重新查询结果更新页面。
- 不做乐观状态推进，避免失败时顾客看到错误状态。
- 不提供 `Reject`、`Cancel`、状态回退或任意状态下拉框。

## 12. Promotion `/restaurants/$restaurantId/promotion`

### 12.1 非推广状态

- 标题：`Promote your restaurant`
- 价格：`$9.99 / 7 days`
- 说明：`Promoted restaurants appear ahead of regular listings during the promotion period.`
- 明示演示性质：`Demo payment — no real charge will be made.`
- 主按钮：`Promote for $9.99`

确认弹窗：

- 标题：`Promote {restaurant name}?`
- Summary：`7 days`、`$9.99`、`Demo payment`
- Primary：`Confirm promotion`
- Secondary：`Cancel`

确认后生成唯一演示 transaction ID，调用现有 Promotion 记录流程。处理中禁用关闭和重复提交。

### 12.2 有效状态

- Jade-soft 卡片：`Promotion active`
- 显示 `Promoted until {date and time}`。
- 显示剩余整天/小时只作为辅助，以服务端 `promotedUntil` 为准。
- 首版不允许叠加购买或提前续费，以避免有效期覆盖含义不清。

### 12.3 历史记录

- 列表显示 date、restaurant、transaction ID 的截断值和 `7 days`。
- 当前 Payment 模型不保存 price，因此不在历史记录中声明真实交易金额；可以显示 `Demo promotion`。
- 空状态：`No promotions yet.`
- 失败：`We couldn’t activate the promotion. Try again.`，保留当前页面。

## 13. Profile `/profile`

- Avatar、`Full name`、`Email address`、`Address`、可选 `New password`。
- Role 只读显示 `Owner`。
- 修改 email 后进入重新验证提示。
- `Save changes` 成功显示 `Profile updated.`。
- Profile 不包含银行账户、税务资料、员工账号或餐厅权限。

## 14. 响应式与可访问性

- 1280px 为主要验收宽度：固定 240px 左侧栏，内容宽度自适应。
- 768–1023px 左侧栏收起为图标栏，图标必须有 tooltip 和可访问名称。
- 375px 下使用底部导航；表格转为卡片；主按钮可全宽。
- Dashboard 四张统计卡桌面四列、平板两列、移动端两列或单列。
- 图表在移动端纵向堆叠，并提供文字摘要以替代精确 hover。
- Drawer 和确认弹窗遵循焦点锁定、Escape 关闭、返回焦点规则；危险确认不能被 Escape 误提交。
- 实时 Toast 使用 `role=status`，不抢走当前键盘焦点；订单 badge 有可访问文本。
- 金额、订单数量和状态不能只通过图表或颜色传达。

## 15. 验收场景

1. 无餐厅 Owner 能从 Dashboard 进入创建流程，并在成功后进入新餐厅概览。
2. Owner 可管理多家餐厅，当前上下文在刷新后保持且不能访问他人餐厅。
3. Category 只能选择，Owner UI 不暴露全局 Category CRUD。
4. Dish 价格能无精度损失地转换为 cents；option min/max 和 choice 规则正确校验。
5. 删除 Dish 前确认，历史订单 item 快照仍可展示。
6. 最近 7 天四项指标、Sales 图和 Top dishes 使用同一订单数据口径。
7. 新订单实时插入、Toast 和 badge 同步出现；重连后能补齐漏单。
8. Owner 只能执行 PENDING → COOKING 和 COOKING → WAITING。
9. `/orders` 能跨餐厅查看并按 restaurant/status 筛选。
10. Promotion 明确显示 `$9.99 / 7 days` 和 Demo payment，重复提交只产生一条记录。
11. Promotion 成功后显示服务端有效期，生效期间禁用再次购买。
12. Owner 无法访问 Checkout、Courier delivery 或其他 Owner 的资源。

