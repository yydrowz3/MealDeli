# MealDeli Customer 前端设计方案

## 1. 目标与边界

Customer 体验覆盖登录后的餐厅发现、菜单选择、单餐厅购物车、模拟结账、下单和订单追踪。用户完成 `Pay & place order` 后即视为支付成功，前端不连接真实支付服务。

核心成功指标：

- 能按分类或名称快速找到餐厅，并清楚识别 Promotion。
- 能正确选择必选/可选菜品选项，并在加入购物车前理解价格。
- 能使用个人地址完成一个与后端总价一致的订单。
- 能区分当前订单和历史订单，并实时理解配送进度。

## 2. 导航与页面清单

| 路由 | 页面 | 主要操作 |
| --- | --- | --- |
| `/restaurants` | Restaurant discovery | `View menu` |
| `/restaurants/$restaurantId` | Restaurant menu | `Add to cart` |
| `/checkout` | Checkout | `Pay & place order` |
| `/orders` | Current and past orders | `View order` |
| `/orders/$orderId` | Order tracking/detail | 无或 `Back to orders` |
| `/profile` | Customer profile | `Save changes` |

### 2.1 Customer 导航

- 桌面 Header：`MealDeli`、搜索框、`Restaurants`、`Orders`、购物车、头像菜单。
- 移动端 Header：Logo、搜索按钮、购物车；底部导航为 `Restaurants`、`Orders`、`Profile`。
- 购物车按钮显示商品总数量 badge；数量为 0 时不显示 badge。
- `/checkout` 和订单详情页使用简化 Header，并提供明确返回操作。

## 3. 餐厅发现 `/restaurants`

### 3.1 页面结构

```text
┌─────────────────────────────────────────────────────────────┐
│ Header / Search / Cart                                      │
├─────────────────────────────────────────────────────────────┤
│ Delivery to: {saved address}                    [Edit]       │
├─────────────────────────────────────────────────────────────┤
│ Categories: horizontal chips/cards                          │
├─────────────────────────────────────────────────────────────┤
│ Promoted on MealDeli                                        │
│ [Restaurant card] [Restaurant card]                         │
├─────────────────────────────────────────────────────────────┤
│ All restaurants                                             │
│ [Restaurant card] [Restaurant card] [Restaurant card]       │
└─────────────────────────────────────────────────────────────┘
```

如果用户没有地址，顶部提示改为 `Add a delivery address`，点击进入 `/profile`。缺少地址不阻止浏览，只在 Checkout 阶段阻止下单。

### 3.2 分类

- 使用后端分类名称、图片和餐厅数量。
- 桌面端为可换行的图片卡片，移动端为横向滚动圆角卡片。
- 第一项为 `All`，只负责清除当前分类筛选。
- 点击分类后显示该分类餐厅列表，并在 URL search 参数保存 slug 和 page。
- 不在前端提供 Owner 的分类 CRUD。

### 3.3 餐厅卡片

餐厅卡片只展示有可靠数据来源的字段：

- 餐厅图片或 MealDeli 占位图。
- 餐厅名称。
- Category 名称。
- 地址，最多两行。
- 有效推广时显示 `Promoted` badge。
- 操作文字 `View menu`。

不显示评分、评论数、预计送达时间、配送费、距离或营业状态。Promotion 餐厅依照后端排序出现，避免同时复制到多个分区导致同一餐厅重复；`Promoted on MealDeli` 可作为第一页顶部标签化分组，其余内容保持统一列表。

### 3.4 搜索与分页

- 搜索 placeholder：`Search restaurants`
- 300ms debounce，仅按后端支持的餐厅名称搜索。
- 搜索状态保存在 `?query=`，翻页状态保存在 `?page=`。
- 输入为空时恢复普通列表。
- 搜索无结果：`No restaurants found` + `Try a different restaurant name.`
- 分类无结果：`No restaurants in this category yet.`
- 分页使用 `Previous`、页码和 `Next`；移动端只保留上一页、当前页和下一页。

## 4. 餐厅菜单 `/restaurants/$restaurantId`

### 4.1 页面布局

- 顶部大图，桌面比例约 3:1，移动端约 16:9。
- 餐厅名称作为 H1；下方显示 Category 和完整地址。
- Promotion 有效时只显示低调 `Promoted` badge，不显示虚构折扣。
- 菜单以卡片列表或两列网格展示；每个 Dish 显示名称、描述、格式化价格和图片。
- 桌面端右侧提供 sticky cart summary；移动端底部显示 `View cart · {count} · {total}`。

菜单没有业务分组字段，因此首版统一使用 `Menu` 标题，不虚构 Breakfast、Popular 或 Drinks 等分组。

### 4.2 Dish 卡片

- 无选项的 Dish 点击后仍打开详情，以便选择数量和查看完整描述。
- 有选项时显示 `Customize` 辅助标签。
- 图片失败使用中性占位图；描述最多三行，详情弹层显示全文。
- 价格使用基础价格，如 `From $12.00` 仅在存在额外收费选项时使用；否则显示 `$12.00`。

### 4.3 加载与失败

- 加载时显示餐厅 Hero 和 6 个 Dish skeleton。
- 餐厅不存在：`Restaurant not found` + `Back to restaurants`。
- 菜单为空：`This restaurant hasn’t added a menu yet.`。
- 请求失败保留页面壳并显示 `We couldn’t load this restaurant.` + `Try again`。

## 5. Dish 定制弹窗

桌面端使用居中 modal，移动端使用接近全屏的 bottom sheet。弹层包含：

1. Dish 图片、名称、描述和基础价格。
2. 每个 option 的名称和规则说明。
3. Quantity stepper。
4. 底部 sticky 按钮 `Add {quantity} to cart · {line total}`。

### 5.1 选项规则

- `minSelections = 1`、`maxSelections = 1`：radio，显示 `Required`。
- `minSelections = 0`、`maxSelections = 1`：radio 或可取消单选，显示 `Optional`。
- `maxSelections > 1`：checkbox，并显示 `Choose up to {max}` 或 `Choose {min}–{max}`。
- 选项额外价格使用 `+$1.50`。
- 点击 Add 时验证所有 option；缺少必选项时滚动并聚焦到首个错误。
- line total = `(basePriceMinor + selected extras) × quantity`。
- Quantity 最小 1，首版最大 99；到达边界时禁用对应按钮。

关闭弹窗前如果用户已修改选项，不额外确认；本次未加入购物车的编辑直接丢弃，以保持流程简单。

## 6. 购物车

### 6.1 数据与持久化

- 购物车只允许一个 restaurant。
- 存储到 localStorage，包含 restaurant ID/name、Dish ID/name、价格快照、选项 ID 与显示名称、数量和图片。
- 重新载入菜单时以服务端 Dish/option 为准校验；Checkout 最终以 `createOrder` 的服务端价格校验为准。
- 用户退出时清理购物车，避免共享设备泄露上一个账号的订单内容。
- 订单创建成功后立即清空购物车；失败时保留。

### 6.2 切换餐厅

当购物车非空且用户尝试加入另一家餐厅的 Dish 时显示确认：

- 标题：`Start a new cart?`
- 说明：`Your cart contains items from {restaurant}. Adding this item will clear your current cart.`
- Primary：`Start new cart`
- Secondary：`Keep current cart`

确认后清空旧购物车，再加入当前配置的 Dish。仅浏览另一家餐厅不清空购物车。

### 6.3 Cart drawer

- 展示 restaurant name、各行商品、选项、数量、行总价和删除操作。
- 支持 `−`、`+` 调整数量；数量从 1 减少时询问 `Remove item?`，也可提供独立删除按钮。
- 汇总为 `Subtotal` 与 `Total`，数值相同。
- 辅助说明：`Delivery is free in this demo.`
- 主按钮：`Go to checkout`
- 空状态：`Your cart is empty` + `Browse restaurants`

## 7. Checkout `/checkout`

### 7.1 进入条件

- 只允许 CUSTOMER。
- 购物车为空时显示空状态并提供 `Browse restaurants`，不渲染空表单。
- 刷新页面后从 localStorage 恢复购物车。
- 餐厅或 Dish 已不存在时显示 `Some items are no longer available.`，要求返回购物车删除失效项。

### 7.2 页面结构

桌面端为 7/5 两列，移动端顺序为 Address → Order summary → Payment：

```text
Delivery address             Order summary
{saved address} [Edit]       Items / options / quantities

Payment                      Subtotal        $xx.xx
Demo payment                 Delivery         $0.00
No card required             Total           $xx.xx
                              [Pay & place order]
```

### 7.3 地址

- 有地址时显示全文和 `Edit`。
- 无地址或点击 Edit 时显示 `Delivery address` textarea，最多 500 字符。
- 保存地址通过现有个人资料能力更新 User，并回到 Checkout。
- 地址为空时禁用下单并显示 `Add a delivery address to continue.`。
- 当前 Order 模型不保存地址快照；文案中不承诺历史订单会保留下单时地址。

### 7.4 模拟支付

- 区块标题：`Payment`
- 方式：`Demo payment`
- 说明：`No card is required. Your order will be placed immediately.`
- 不显示信用卡输入、Stripe/Paddle 品牌或虚构卡号。
- 主按钮：`Pay & place order`
- 点击后再次锁定购物车并提交订单；按钮处于 loading，禁止返回触发第二次提交。
- 服务端返回成功和 order ID 后清空购物车，跳转 `/orders/$orderId`，显示 Toast `Order placed.`。
- 失败时保留购物车，显示 `We couldn’t place your order. Try again.`。

## 8. Orders `/orders`

### 8.1 页面结构

- H1：`Your orders`
- Tabs：`Current`、`Past`
- Current 包含 PENDING、COOKING、WAITING、PICKED。
- Past 包含 DELIVERED。
- 默认按 `createdAt` 降序，由前端在展示前统一排序。

### 8.2 订单卡片

- Restaurant name 和图片。
- `Order #{shortId}`，短 ID 只用于展示，复制时仍复制完整 ID。
- 下单时间。
- 状态 badge 和对应一句话。
- 商品数量和 `totalMinor`。
- Primary/secondary 操作：`Track order` 或 `View order`。

空状态：

- Current：`No active orders` + `When you place an order, its live status will appear here.`
- Past：`No past orders yet` + `Browse restaurants`
- 全部请求失败：`We couldn’t load your orders.` + `Try again`

## 9. 订单详情 `/orders/$orderId`

### 9.1 页面内容

- Restaurant summary：名称、图片、地址。
- 订单编号和下单时间。
- 当前状态标题和说明。
- 五阶段垂直或横向时间线。
- Item 明细：Dish 快照名称、选项快照、数量、行总价。
- Order summary：`Subtotal`、`Delivery $0.00`、`Total`。
- 辅助说明：`Payment completed in demo mode.`
- `Back to orders`。

不展示 Courier 姓名、电话、真实位置或顾客配送地图，因为当前需求和数据源不支持。

### 9.2 实时更新

- 初始通过订单详情查询获得当前状态，再订阅该订单更新。
- 收到新状态后更新时间线、标题和订单列表缓存，并显示非打断式 Toast，例如 `Your order is ready for pickup.`。
- 连接中断显示 `Live updates are reconnecting…` banner，保留最后已知状态。
- 重连后重新读取订单，避免漏掉离线期间的状态变化。
- 收到比当前状态更早的事件时忽略，不允许时间线倒退。

### 9.3 不存在与越权

- 不存在或无权查看统一显示 `Order not found`，不泄露订单是否属于其他用户。
- 提供 `Back to orders`，不提供按 ID 猜测或重试其他订单的输入框。

## 10. Profile `/profile`

### 10.1 内容

- Avatar：查看、上传、更换或移除。
- `Full name`
- `Email address`
- `Delivery address`
- 可选 `New password`
- Role 只读显示 `Customer`，不可编辑。
- 主按钮 `Save changes`，次操作 `Log out`。

修改 email 后提示需要重新验证：`Verify your new email address to keep your account secure.`。保存成功显示 `Profile updated.`。

## 11. 响应式与可访问性

- 375px 下分类横向滚动但可键盘操作，滚动容器提供可见 focus。
- 餐厅卡片移动端单列，640px 起两列，1024px 起三列。
- 菜单桌面端两列，移动端单列；Cart drawer 移动端占满宽度。
- Checkout 桌面两列，移动端将总价和主按钮吸附底部，但不能遮挡最后一项内容。
- Order timeline 在移动端垂直展示，在宽屏横向展示。
- Modal/Bottom sheet 打开后锁定背景滚动、限制焦点，关闭后恢复至触发 Dish 卡片。
- 数量 stepper、选项、购物车删除和返回按钮具有明确英文可访问名称。
- Promotion、状态和必选选项不仅依靠颜色，也显示文本。

## 12. 验收场景

1. Customer 能浏览全部分类、分页餐厅、按名称搜索并清除条件。
2. 餐厅卡片不出现评分、ETA、距离或其他无数据字段。
3. Promotion 餐厅有清晰但克制的 `Promoted` 标签。
4. Dish 必选项缺失时无法加入购物车；价格和数量计算与 cents 规则一致。
5. 购物车刷新后保留；加入另一餐厅 Dish 前必须确认清空。
6. 没有配送地址时可以浏览和编辑购物车，但不能提交订单。
7. Checkout 不要求银行卡，`Pay & place order` 只创建一次订单。
8. 服务端拒绝价格或选项后保留购物车并显示可恢复错误。
9. 下单成功后清空购物车，并直接打开正确订单详情。
10. Current/Past 分类正确，订单详情的 Items 与下单快照一致。
11. PENDING 到 DELIVERED 的实时更新按顺序呈现；断线重连后状态与服务端一致。
12. Customer 无法访问 Owner、Courier 页面或其他用户订单。

