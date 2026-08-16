# MealDeli Guest 前端设计方案

## 1. 目标与边界

Guest 体验负责建立品牌认知，并把用户引导至登录或正确角色的注册流程。未登录用户不能浏览分类、餐厅或菜单；尝试打开私有路由时必须先登录。

核心成功指标：

- 用户能在首页快速理解 MealDeli 提供点餐、餐厅经营和配送三种服务。
- 用户能通过明确入口注册为 CUSTOMER、OWNER 或 COURIER。
- 注册、验证邮箱和登录能够形成连续、无歧义的流程。
- 身份验证失败、链接过期和会话失效时存在明确恢复路径。

## 2. 导航与页面清单

| 路由 | 页面 | 主要操作 |
| --- | --- | --- |
| `/` | Brand landing page | `Get started` |
| `/login` | Log in | `Log in` |
| `/signup?role=CUSTOMER` | Customer sign up | `Create account` |
| `/signup?role=OWNER` | Owner sign up | `Create account` |
| `/signup?role=COURIER` | Courier sign up | `Create account` |
| `/verify-email?token=...` | Email verification result | `Continue to log in` |

注册提交成功后，不新增必须公开的独立路由；当前注册页切换为 `Check your email` 成功视图。直接访问缺少 token 的 `/verify-email` 显示无效链接状态。

### 2.1 Header

- 左侧为文字 Logo `MealDeli`，点击返回 `/`。
- 桌面端右侧显示 `Log in` 文字按钮和 `Sign up` Jade 实心按钮。
- 移动端保留 Logo 与 `Log in`，主注册操作由页面内容承担，不使用汉堡菜单。
- 登录或注册页 Header 只保留 Logo 和互相切换的入口，减少干扰。

## 3. 首页 `/`

### 3.1 页面结构

```text
┌─────────────────────────────────────────────────────────────┐
│ MealDeli                                  Log in  [Sign up] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Good food, delivered simply.      [Food imagery]           │
│  Order from local restaurants,                              │
│  run your kitchen, or deliver with us.                      │
│  [Get started]                                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Choose how you use MealDeli                                 │
│ [Order food] [Add your restaurant] [Deliver with us]        │
├─────────────────────────────────────────────────────────────┤
│ How it works: Choose → Order → Track                        │
├─────────────────────────────────────────────────────────────┤
│ Simple benefits / trust message                             │
├─────────────────────────────────────────────────────────────┤
│ Footer                                                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Hero

- H1：`Good food, delivered simply.`
- Supporting copy：`Order from local restaurants, run your kitchen, or deliver with us.`
- 主按钮：`Get started`，跳转到页面内角色选择区；不在 Hero 同时放置三个同等级按钮。
- 右侧使用餐食与配送场景的品牌图片，不使用 Uber 商标、截图或素材。
- 暖白背景配局部 Jade 色块，确保 Charcoal 文字对比清晰。

### 3.3 角色入口

三个卡片保持同等视觉层级：

| 卡片 | 描述 | CTA | 目标 |
| --- | --- | --- | --- |
| Order food | `Find local restaurants and track every order.` | `Order food` | `/signup?role=CUSTOMER` |
| Add your restaurant | `Manage your menu, orders, and promotions.` | `Add your restaurant` | `/signup?role=OWNER` |
| Deliver with us | `Choose an order and follow a simple delivery flow.` | `Deliver with us` | `/signup?role=COURIER` |

卡片点击与内部 CTA 具有相同目标。使用图标或原创插图区分角色，不使用角色颜色编码。

### 3.4 How it works

使用三步横向流程，移动端改为纵向：

1. `Choose your role`
2. `Create your account`
3. `Start with MealDeli`

该分区只解释平台入口，不展示虚构餐厅、评分、配送时间或价格。

### 3.5 Footer

- Logo 与一句话：`Simple delivery for everyone.`
- 链接：`Log in`、`Sign up`、`For restaurants`、`For couriers`。
- 辅助信息：`© 2026 MealDeli`。
- 首版不放置没有实际页面的 `Help`、`Careers`、`Terms` 或社交链接。

## 4. 登录 `/login`

### 4.1 布局

- 440px 最大宽度的单列表单，桌面端居中，移动端占满可用宽度。
- 标题：`Welcome back`
- 说明：`Log in to continue to MealDeli.`
- 字段：`Email address`、`Password`
- 密码框提供 `Show password` / `Hide password`。
- 主按钮：`Log in`
- 底部：`New to MealDeli? Sign up`
- 不提供未实现的社交登录和 `Forgot password`。

### 4.2 行为

1. Email 在提交前 trim，使用浏览器和前端格式校验。
2. Password 为空时不发送请求。
3. 提交中禁用表单和按钮，按钮文案保留并显示 spinner。
4. 登录成功后读取当前用户角色并跳转：
   - CUSTOMER → `/restaurants`
   - OWNER → `/dashboard`
   - COURIER → `/dashboard`
5. 若用户尚未验证邮箱，显示 `Verify your email to continue.`，进入 `Check your email` 恢复视图。
6. 如果从私有路由进入登录页，成功后只在目标路由对该角色合法时使用 `returnTo`；否则进入默认入口。

### 4.3 错误文案

| 情况 | UI 文案 |
| --- | --- |
| Email 无效 | `Enter a valid email address.` |
| Password 为空 | `Enter your password.` |
| 账号或密码错误 | `Incorrect email or password.` |
| 网络失败 | `We couldn’t log you in. Check your connection and try again.` |
| 通用失败 | `Something went wrong. Try again.` |

账号不存在和密码错误在前端统一为同一文案，避免泄露账号是否存在。

## 5. 注册 `/signup`

### 5.1 角色预选

- 首页三个入口必须携带 `role` query 参数。
- 页面标题根据角色变化：
  - CUSTOMER：`Create your customer account`
  - OWNER：`Create your owner account`
  - COURIER：`Create your courier account`
- 副标题显示当前角色价值，不提供表单内自由切换角色的 selector。
- 用户可通过次级链接 `Choose a different role` 返回首页角色区。
- role 缺失或非法时显示角色选择三卡片，不默认为 CUSTOMER。

### 5.2 表单

字段按以下顺序：

1. `Full name`
2. `Email address`
3. `Password`
4. 勾选确认：`I understand this is a MealDeli demo account.`

主按钮为 `Create account`，底部提供 `Already have an account? Log in`。

校验规则与当前后端一致：

- Name：1–100 字符，去除首尾空格。
- Email：合法格式，最多 255 字符，提交时规范化大小写。
- Password：8–128 字符。
- Role：只允许 CUSTOMER、OWNER、COURIER。

首版不要求在注册时填写地址、头像、餐厅信息或配送工具。Customer 在 Checkout 或 Profile 补地址，Owner 登录后创建餐厅，Courier 登录后直接进入配送看板。

### 5.3 注册失败

| 情况 | UI 文案 |
| --- | --- |
| Email 已存在 | `An account with this email already exists.` |
| Role 参数非法 | `Choose how you want to use MealDeli.` |
| 字段校验失败 | 字段下显示具体说明 |
| 网络失败 | `We couldn’t create your account. Try again.` |

失败时保留 name、email 和角色，不保留 password。

## 6. Check your email

注册成功后用成功视图替换表单：

- 图标：邮件轮廓 + Jade 成功圆点。
- 标题：`Check your email`
- 说明：`We sent a verification link to {email}. The link expires in 1 hour.`
- 主按钮：`Open email app`，仅在能够安全提供通用 mailto 行为时显示；否则省略。
- 次按钮：`Back to log in`
- 文本按钮：`Resend email`
- 辅助操作：`Use a different email` 返回注册表单。

`Resend email` 依赖总览中建议补充的后端能力：

- 点击后按钮进入 30 秒倒计时，防止重复请求。
- 成功显示 `Verification email sent.`。
- 不论邮箱是否存在，服务端和界面使用相同成功反馈。
- 失败显示 `We couldn’t resend the email. Try again later.`。

## 7. 邮箱验证 `/verify-email`

### 7.1 Loading

页面加载后立即验证 token，显示小型 spinner 和 `Verifying your email…`。不展示空白页面，不允许重复提交。

### 7.2 Success

- 标题：`Email verified`
- 说明：`Your MealDeli account is ready.`
- 主按钮：`Continue to log in`
- 如果已有有效会话，可改为 `Continue to MealDeli` 并进入角色默认页。

### 7.3 Expired or invalid

- 标题：`This verification link is no longer valid`
- 说明：`Request a new email to verify your account.`
- 主操作：显示 email 输入框和 `Resend email`。
- 次操作：`Back to log in`
- 不区分 token 不存在、已使用和已过期的具体安全原因。

### 7.4 Network error

- 标题：`We couldn’t verify your email`
- 说明：`Check your connection and try again.`
- 主按钮：`Try again`
- 不自动无限重试。

## 8. 私有路由拦截

Guest 直接访问 `/restaurants`、`/orders`、`/dashboard`、`/checkout`、`/profile` 或 `/deliveries/*` 时：

1. 显示短暂的会话检查 skeleton，避免私有内容闪现。
2. 无有效会话则跳转 `/login?returnTo=...`。
3. 登录页顶部显示 `Log in to continue.`，不使用错误样式。
4. 登录成功后验证 `returnTo` 是站内允许路径并且与角色匹配。

## 9. 响应式与可访问性

- 首页桌面 Hero 为 55/45 两列，移动端先文字后图片。
- 角色卡片桌面三列，平板两列，移动端单列。
- Auth 页面移动端取消外层卡片阴影，保持 16px 页面边距和 48px 主按钮。
- 首个 H1 每页唯一；表单错误使用 `aria-describedby`；提交结果使用适当 live region。
- 验证页加载完成后把焦点移至结果标题。
- 密码可见性按钮具备文字可访问名称，不能只显示眼睛图标。
- 所有 Hero 和角色图片提供有意义的英文 alt，装饰性背景使用空 alt。

## 10. 页面状态与验收场景

### 10.1 必须覆盖的状态

- 首页图片加载失败时使用品牌占位背景，不影响 CTA。
- 登录和注册的 idle、validation error、submitting、API error、success。
- 验证邮件发送成功、重新发送冷却、重新发送失败。
- 验证 token 的 loading、success、invalid/expired、network error。
- 已登录用户访问 Auth 页时显示 `Continue to MealDeli`，不强制退出。

### 10.2 验收场景

1. Guest 从 `Order food` 注册后，提交角色固定为 CUSTOMER。
2. Guest 从 `Add your restaurant` 和 `Deliver with us` 进入时分别创建 OWNER 与 COURIER。
3. 非法或缺失 role 不会静默创建 CUSTOMER，而是要求重新选择。
4. 重复提交注册或登录只产生一次请求。
5. 注册成功后可看到目标邮箱、1 小时有效期和恢复操作。
6. 有效验证链接显示成功状态；无效链接提供重新发送路径。
7. 三种角色登录后进入正确默认页。
8. 未登录打开任何私有路由都不会看到私有页面内容，并能在登录后安全返回合法目标。

