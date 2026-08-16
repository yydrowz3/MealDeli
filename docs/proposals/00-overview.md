# MealDeli 前端设计总览

## 1. 文档目的

本文定义 MealDeli 前端的共享产品规则、视觉语言、角色权限、导航、订单状态与后端边界。角色专属页面和交互分别见：

- [Guest 设计方案](./01-guest.md)
- [Customer 设计方案](./02-customer.md)
- [Owner 设计方案](./03-owner.md)
- [Courier 设计方案](./04-courier.md)

本轮只输出设计文档，不实现前端或后端代码。产品界面统一使用英文，文档说明使用中文。视觉层级参考 [Uber Eats](https://www.ubereats.com/) 的简洁外卖平台结构，但不复制其品牌、布局细节或配色。

## 2. 产品目标与原则

MealDeli 是一个覆盖点餐、餐厅经营和配送演示的多角色外卖平台。首版目标是让四类用户能够完成清晰、可演示的核心闭环：

| 角色 | 核心目标 | 默认入口 |
| --- | --- | --- |
| GUEST | 了解品牌并完成登录或分角色注册 | `/` |
| CUSTOMER | 浏览餐厅、配置菜品、下单并追踪订单 | `/restaurants` |
| OWNER | 管理多家餐厅、菜单、订单、数据和推广 | `/dashboard` |
| COURIER | 查看可接订单、模拟配送并完成订单 | `/dashboard` |

设计原则：

1. **Focused**：每个页面只有一个主要任务，主操作使用唯一的 Jade 实心按钮。
2. **Familiar**：采用用户熟悉的餐厅卡片、购物车、订单时间线和后台侧边栏模式。
3. **Honest**：不展示后端不存在的评分、真实 ETA、真实支付或真实定位数据。
4. **Role-aware**：登录后导航、页面内容和可执行动作严格由角色决定。
5. **Demo-ready**：模拟支付与位置必须明确可理解，并提供稳定的加载、空白和失败状态。

## 3. 范围与非目标

### 3.1 首版范围

- Email/password 注册、登录、退出、刷新会话、邮箱验证和个人资料编辑。
- 分类、餐厅、菜单、菜品选项、购物车和模拟结账。
- Customer、Owner、Courier 的订单列表、详情和实时状态更新。
- Owner 多餐厅、菜单、订单、7 天统计和 7 天推广管理。
- Courier 可接订单、单活动配送、模拟地图和完成配送。
- 响应式网页，不开发原生移动应用。

### 3.2 明确不包含

- 真实支付、退款、发票、优惠券、小费和支付方式管理。
- 真实 GPS、导航、路线优化、后台定位或地理编码。
- 顾客取消订单、Owner 拒单、客服、聊天和争议处理。
- 评分、评论、收藏、推荐算法、真实配送费、税费和 ETA。
- 预约配送、多人购物车、跨餐厅购物车和服务端购物车同步。
- 浏览器系统通知、提示音、短信通知和移动端推送。

## 4. 信息架构与路由

路由使用共享语义，不增加 `/customer`、`/owner` 或 `/courier` 前缀。相同路由根据角色显示不同内容。

```text
/
├── /login
├── /signup?role=CUSTOMER|OWNER|COURIER
├── /verify-email?token=...
├── /dashboard
├── /restaurants
│   ├── /new
│   └── /$restaurantId
│       ├── /menu
│       ├── /settings
│       └── /promotion
├── /checkout
├── /orders
│   └── /$orderId
├── /deliveries/$orderId
└── /profile
```

### 4.1 路由权限

| 路由 | GUEST | CUSTOMER | OWNER | COURIER |
| --- | --- | --- | --- | --- |
| `/`、`/login`、`/signup`、`/verify-email` | 允许 | 允许，但已登录时提示返回工作区 | 同左 | 同左 |
| `/dashboard` | 登录拦截 | 重定向 `/restaurants` | 经营看板 | 配送看板 |
| `/restaurants` | 登录拦截 | 餐厅发现页 | 我的餐厅页 | 无权限 |
| `/restaurants/$restaurantId` | 登录拦截 | 菜单浏览 | 餐厅概览 | 无权限 |
| `/restaurants/new` | 登录拦截 | 无权限 | 创建餐厅 | 无权限 |
| `/restaurants/$restaurantId/menu` | 登录拦截 | 无权限 | 菜单管理 | 无权限 |
| `/restaurants/$restaurantId/settings` | 登录拦截 | 无权限 | 餐厅设置 | 无权限 |
| `/restaurants/$restaurantId/promotion` | 登录拦截 | 无权限 | 推广管理 | 无权限 |
| `/checkout` | 登录拦截 | 允许 | 无权限 | 无权限 |
| `/orders`、`/orders/$orderId` | 登录拦截 | 我的订单 | 所有旗下餐厅订单 | 配送历史与详情 |
| `/deliveries/$orderId` | 登录拦截 | 无权限 | 无权限 | 当前配送 |
| `/profile` | 登录拦截 | 允许 | 允许 | 允许 |

未登录访问私有路由时跳转到 `/login`，并保留安全的站内 `returnTo`。角色无权访问时显示简短的 `You don’t have access to this page.`，随后跳转至该角色默认入口。不得只隐藏按钮而继续允许越权页面操作。

### 4.2 共享导航

- GUEST：顶部 Logo、`Log in`、主按钮 `Sign up`。
- CUSTOMER：Logo、`Restaurants`、`Orders`、购物车按钮、头像菜单。
- OWNER：桌面左侧栏包含 `Dashboard`、`Restaurants`、`Orders`、`Profile`；移动端使用底部导航和 `More` 菜单。
- COURIER：`Dashboard`、`Orders`、`Profile`；移动端使用底部导航。
- 页面标题左侧提供返回行为时使用图标加可访问名称，不以 Logo 代替返回按钮。

## 5. 视觉系统

### 5.1 颜色

| Token | 色值 | 用途 |
| --- | --- | --- |
| `color-charcoal` | `#202723` | 主文字、深色按钮、顶栏和品牌基础色 |
| `color-jade` | `#2FA36B` | 主 CTA、链接、选中态、成功强调 |
| `color-jade-dark` | `#247F54` | Jade hover/pressed |
| `color-jade-soft` | `#E3F3EA` | 选中背景、成功浅底 |
| `color-warm-white` | `#F7F6F2` | 页面背景 |
| `color-surface` | `#FFFFFF` | 卡片、弹层、表单表面 |
| `color-ink-muted` | `#66706A` | 次要信息和说明文字 |
| `color-border` | `#DDE2DE` | 边框和分隔线 |
| `color-warning` | `#B7791F` | WAITING、警告和注意事项 |
| `color-danger` | `#C2413B` | 删除、失败和破坏性操作 |
| `color-info` | `#3973B7` | PICKED、进行中和信息提示 |

文本与背景应达到 WCAG AA 对比度。订单状态同时显示文本、图标或形状，不只依靠颜色。

### 5.2 字体与排版

- 使用系统无衬线字体栈，避免首版依赖远程字体资源。
- 品牌标题：`40–56px / 1.05`，700；移动端 `36px`。
- 页面标题：`28–36px / 1.2`，700。
- 分区标题：`20–24px / 1.3`，650–700。
- 正文：`16px / 1.5`；辅助文字 `14px / 1.45`。
- 数字统计使用 tabular numerals，金额显示 `$12.50`，不显示裸 cents。
- 英文 UI 使用 sentence case，如 `Create restaurant`，不使用全大写标题。

### 5.3 间距、圆角与层级

- 采用 4px 基础网格：常用间距为 4、8、12、16、24、32、48、64px。
- 页面最大内容宽度 1280px；Customer 餐厅详情最大 1200px；Auth 表单最大 440px。
- 控件高度至少 44px，移动端主要按钮建议 48px。
- 输入框、按钮圆角 10px；卡片 14px；弹窗和抽屉 18px。
- 卡片默认使用 1px 边框，只有弹层、悬浮购物车和菜单使用轻阴影。
- 餐厅与菜品图片使用固定比例和 `object-fit: cover`；缺图时显示品牌占位图。

### 5.4 图标、图表和地图

- 图标使用项目现有 Phosphor Icons，保持 `18–24px` 并提供可访问名称。
- 图表使用现有 Recharts；不使用 3D、渐变堆叠或装饰性图表。
- 地图使用 React Leaflet 与 OpenStreetMap，仅用于 Courier 模拟配送。
- Toast 使用现有 Sonner，默认右上角；移动端改为顶部居中并留出安全区。

## 6. 共享组件与状态

### 6.1 按钮

- Primary：Jade 实心，用于每页唯一主操作，例如 `Pay & place order`。
- Secondary：白底边框，用于次级操作，例如 `Edit profile`。
- Tertiary：文字按钮，用于低优先级操作，例如 `Back`。
- Danger：仅用于删除餐厅或菜品，并要求确认。
- Loading 时保留原宽度，显示 spinner 并禁用重复提交。

### 6.2 表单

- Label 永远可见；placeholder 不能代替 label。
- 必填错误显示在字段下方，并在提交后把焦点移动到首个错误。
- API 通用错误显示在表单顶部，例如 `We couldn’t save your changes. Try again.`。
- 密码输入提供 `Show password`，注册页显示 `At least 8 characters`。
- 图片上传提供预览、更换和失败重试；未上传图片不阻塞保存。

### 6.3 反馈模式

| 情况 | 表现 |
| --- | --- |
| 页面首次加载 | 与最终结构一致的 skeleton，不使用整页 spinner |
| 小范围刷新 | 保留已有内容，在相关区域显示轻量 loading |
| 操作成功 | 简短 Toast，如 `Restaurant updated.` |
| 可恢复失败 | 页面内错误说明和 `Try again` |
| 空列表 | 简单插图/图标、明确说明和相关主操作 |
| 连接中断 | 非阻塞 banner：`Live updates are reconnecting…` |
| 会话失效 | 清理私有状态，提示 `Your session expired. Please log in again.` 并跳转登录 |

弹窗只用于需要立即决策的操作：清空购物车、删除资源、购买推广。普通编辑优先使用独立页面或侧边抽屉。

## 7. 订单状态模型

```text
CUSTOMER creates order
        │
        ▼
     PENDING ── OWNER starts order ──▶ COOKING
                                           │
                                           └── OWNER marks ready ──▶ WAITING
                                                                         │
                                                                         └── COURIER accepts ──▶ PICKED
                                                                                                      │
                                                                                                      └── COURIER completes ──▶ DELIVERED
```

| 状态 | 英文标签 | 用户解释 | 可操作角色 |
| --- | --- | --- | --- |
| `PENDING` | `Order placed` | 餐厅已收到订单，等待开始制作 | OWNER → COOKING |
| `COOKING` | `Preparing your order` | 餐厅正在制作 | OWNER → WAITING |
| `WAITING` | `Ready for pickup` | 餐品已完成，等待 Courier | COURIER → PICKED |
| `PICKED` | `On the way` | Courier 正在模拟配送 | COURIER → DELIVERED |
| `DELIVERED` | `Delivered` | 订单完成 | 无 |

状态推进只允许向前，不在首版提供取消、拒绝、回退或跳级。所有角色的详情页使用相同状态词汇和顺序。

## 8. 金额、时间和内容规范

- 后端金额均为 integer cents；前端通过统一 formatter 显示 USD，例如 `1299 → $12.99`。
- Checkout 总价只包含菜品基础价和选项加价，不虚构 tax、delivery fee 或 service fee。
- 结账摘要显示 `Delivery $0.00` 和说明 `No delivery fee in this demo.`，但最终总额仍与后端 `totalMinor` 完全一致。
- 日期存储按 UTC，显示时使用浏览器本地时区；列表使用 `Aug 16, 2026, 7:30 PM`，相对时间只作为辅助。
- Promotion 固定展示 `$9.99 / 7 days`，该价格属于前端演示说明，不写入当前 Payment 数据模型。
- 不展示没有数据来源的评分、配送时长、距离、营业状态或库存状态。

## 9. 响应式规则

- `< 640px`：单列；主要操作可置底吸附；表格转卡片；弹窗尽量使用底部抽屉。
- `640–1023px`：两列内容；保留顶部导航；Owner 侧栏可折叠。
- `≥ 1024px`：Customer 使用内容区加购物车侧栏；Owner 使用固定侧栏和主内容；Courier 地图与订单信息左右分栏。
- Guest、Customer、Courier 的核心流程以 375px 宽度优先验收。
- Owner 的数据、表格和编辑流程以 1280px 宽度优先验收，同时保证 375px 下可完成任务。
- 横向滚动只允许用于图表的非关键辅助区域，不应用于主表单或主要操作。

## 10. 现有后端能力与边界

### 10.1 可直接支撑的能力

- 用户注册、登录、刷新令牌、退出、邮箱验证和资料编辑。
- 分类、餐厅搜索与分页、餐厅详情、菜品和菜品选项。
- Owner 多餐厅、餐厅与菜品 CRUD。
- Customer 下单和服务端价格校验。
- 按角色查询订单、查询订单详情和推进订单状态。
- Owner 新订单订阅、订单状态订阅、Courier 熟食订单订阅。
- Owner Promotion 记录和 `promotedUntil` 更新。
- 图片上传到 S3 兼容存储。

### 10.2 实施前最小后端补充

以下内容只记录为前端实施依赖，本轮不修改 API：

1. 增加 Courier 可接订单查询：只返回 `status = WAITING` 且 `courierId = null` 的订单，用于刷新和重新连接后的初始列表。
2. 增加重新发送邮箱验证邮件能力，并对频率和未知邮箱返回安全的一致响应。
3. 修正 `cookedOrders` 发布载荷字段名，使其与订阅解析字段一致。
4. Courier 接单后向 `orderUpdates` 发布数据库更新后的订单，确保包含正确的 `status = PICKED`、`courierId` 和餐厅所有者关联。
5. 在服务端校验 Courier 同时只能拥有一个非 `DELIVERED` 的已接订单，避免绕过前端限制。

### 10.3 前端模拟能力

- Customer 点击 `Pay & place order` 后直接创建订单，成功即视为付款完成。
- Owner Promotion 确认后生成一次演示 transaction ID 并调用现有创建记录流程。
- Courier 地图使用固定城市、固定餐厅/顾客坐标和客户端生成的路线进度，不读取或上传真实位置。
- 7 天 Owner 图表由当前返回的订单在前端聚合，不声明为财务报表。

## 11. 跨角色验收标准

- 所有可见 UI 文案为英文，角色名和订单状态在五份文档中一致。
- 登录后进入正确的默认页面，越权路由不会短暂展示敏感内容。
- 所有金额与后端 cents 一致，并使用 USD 两位小数格式。
- 正常、loading、empty、error、offline/reconnecting 和 session expired 状态均有定义。
- 实时更新失败不阻塞页面的基本读取，并提供重新连接反馈。
- 主流程可只用键盘完成；焦点顺序、弹窗焦点锁定和关闭后焦点恢复正确。
- 图片具备有意义的 alt；纯装饰图使用空 alt；图表提供文字摘要。
- 删除、清空购物车和购买 Promotion 均需要明确确认；普通保存不增加多余确认。
- Customer 与 Courier 在 375px、Owner 在 1280px 下能完成各自核心流程，且另一种屏幕尺寸仍可用。

