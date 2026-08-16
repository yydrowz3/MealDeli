# Design System 详细设计

## 1. 职责与非目标

Design System 提供 MealDeli 的视觉 token、无业务 primitive、反馈组件、可访问性行为和格式化展示。所有组件均为纯 props 驱动。

不负责：GraphQL、Jotai、TanStack Form、路由、角色权限、业务状态推进、API 错误解析或实体查询。

## 2. 依赖与公共出口

唯一运行时依赖为 React、Tailwind/DaisyUI 基础样式、Phosphor Icons 和 Sonner adapter。不得导入任何 `src/modules`。

```ts
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export type AsyncStateProps = {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};

export function formatUsd(minor: number): string;
export function formatDateTime(value: string | Date): string;
export function getOrderStatusPresentation(status: OrderStatus): StatusPresentation;
```

Design System 可以定义仅用于显示的 `OrderStatus` 字符串 union，但不定义转换权限；业务状态机归 Orders。

## 3. 建议目录

```text
src/shared/ui/
├── tokens.css
├── primitives/button.tsx
├── primitives/input.tsx
├── primitives/select.tsx
├── primitives/textarea.tsx
├── primitives/card.tsx
├── overlays/modal.tsx
├── overlays/drawer.tsx
├── feedback/badge.tsx
├── feedback/skeleton.tsx
├── feedback/empty-state.tsx
├── feedback/error-state.tsx
├── feedback/connection-banner.tsx
├── feedback/toast.ts
├── data/money.tsx
├── data/date-time.tsx
├── data/order-status.tsx
├── testing/render.tsx
└── index.ts
```

## 4. Tokens

### 4.1 Color

| Token | Value | Usage |
| --- | --- | --- |
| `--color-charcoal` | `#202723` | 主文字、深色表面 |
| `--color-jade` | `#2FA36B` | Primary、链接、选中 |
| `--color-jade-dark` | `#247F54` | hover/pressed |
| `--color-jade-soft` | `#E3F3EA` | 成功浅底 |
| `--color-warm-white` | `#F7F6F2` | 页面背景 |
| `--color-surface` | `#FFFFFF` | 卡片/overlay |
| `--color-muted` | `#66706A` | 辅助文字 |
| `--color-border` | `#DDE2DE` | 分隔/边框 |
| `--color-warning` | `#B7791F` | WAITING/警告 |
| `--color-danger` | `#C2413B` | 删除/失败 |
| `--color-info` | `#3973B7` | PICKED/信息 |

组件只能引用 semantic token，不直接写品牌 hex。所有文字/背景组合达到 WCAG AA。

### 4.2 Geometry

- 4px spacing grid：4、8、12、16、24、32、48、64。
- control height：44px；移动 primary 48px。
- radius：control 10px、card 14px、overlay 18px。
- content max width：1280px；Auth 440px。
- breakpoint：640px、768px、1024px、1280px。

### 4.3 Typography

使用系统 sans stack，不发起远程字体请求。正文 16/1.5，辅助 14/1.45，页面标题 28–36/1.2。金额和统计启用 tabular numerals。

## 5. Primitive 规格

### 5.1 Button

- `loading=true` 自动设置 disabled、`aria-busy=true`，保留按钮宽度。
- icon-only 必须提供 `aria-label`。
- `danger` 只表达破坏性动作，不作为普通错误页主按钮。
- 组件不自行 Toast、不调用 mutation、不二次确认。

### 5.2 Form controls

- `Input`、`Textarea`、`Select` 接收可见 label、description、error 和原生 control props。
- error 自动生成并连接 `aria-describedby`；error 出现不改变 label。
- placeholder 不代替 label。
- `FormErrorSummary` 接收字段列表和 focus callback，不理解业务字段。
- Design System 不直接 import TanStack Form；业务模块使用 `<form.Field>` 读取 `field.state.value`、`field.state.meta.errors`、`field.handleChange` 和 `field.handleBlur`，再绑定到这些纯 props controls。
- 所有表单统一由 TanStack Form 管理 dirty/submitting/field arrays，Zod schema 作为 `validators.onBlur`/`validators.onSubmit` 的 Standard Schema；不得在 UI primitive 内再写一套校验规则。

### 5.3 Modal/Drawer

- 打开时 focus 首个可操作元素或标题，锁定背景滚动和焦点。
- Escape 只关闭可取消 overlay；提交中可由调用方设置 `dismissible=false`。
- 关闭后恢复至触发元素。
- 移动端可由调用方切换 Drawer；组件本身不读取业务 route。

### 5.4 Feedback

- `EmptyState` 与 `ErrorState` 必须接收英文 title；action 可选。
- Skeleton 与最终布局尺寸一致，纯装饰且不进入 accessibility tree。
- `ConnectionBanner` 使用 `role=status`，不抢焦点。
- Toast adapter 只暴露 success/error/info 和 action；业务层提供最终文案。

## 6. 金额、时间与状态

### 6.1 Money

`formatUsd` 只接受 safe integer cents；负数是否允许由调用方决定。非法值在开发环境抛错，不静默显示 `$NaN`。

```ts
formatUsd(0) === "$0.00";
formatUsd(1299) === "$12.99";
```

### 6.2 Date

- ISO/Date 转为浏览器本地时区。
- 列表格式 `Aug 16, 2026, 7:30 PM`。
- 相对时间只能作为辅助，并必须保留 machine-readable `datetime`。
- 测试注入固定 locale/timeZone 或断言语义值，避免依赖 CI 时区。

### 6.3 Order status presentation

| Status | Label | Tone | Icon meaning |
| --- | --- | --- | --- |
| PENDING | `Order placed` | neutral | receipt |
| COOKING | `Preparing your order` | jade | cooking |
| WAITING | `Ready for pickup` | warning | package |
| PICKED | `On the way` | info | bicycle/car |
| DELIVERED | `Delivered` | success | check |

StatusBadge 始终包含文字和图标，不能只用颜色。

## 7. 图表与地图外围组件

- `ChartFrame` 提供标题、description、文字 summary、loading/empty/error slot；Recharts 图形由 Owner Insights 提供。
- `MapFrame` 提供标题、`Skip map`、attribution slot、loading/fallback；Leaflet 和路线逻辑归 Courier。
- 两者均不能导入业务数据或网络库。

## 8. 独立测试

- Button 四 variant、loading、disabled、键盘激活和 icon label。
- Form control 的 label/error/description 关联和 focus。
- Modal/Drawer focus trap、Escape、不可关闭提交态和焦点恢复。
- Empty/Error/Connection 组件的 role、action 和无障碍名称。
- `formatUsd`：0、cents、较大值、非整数拒绝。
- Date formatter：固定时区、无效日期。
- StatusBadge：五态的文字、图标和 tone。
- axe 可选作为后续补充；首版至少用语义断言覆盖 label/role/focus。

测试只使用 RTL，不创建 Apollo/Jotai/TanStack Form/Router provider。业务模块另测 TanStack Form field adapter 与 error 映射。

## 9. 验收标准

- 任一 Design System 测试都可在没有业务模块的环境中运行。
- token 是视觉值的唯一来源；业务组件不复制 hex/radius。
- overlay、form、toast 和 status 均满足键盘与屏幕阅读器基本行为。
- Design System 不包含 `User`、`Restaurant`、`Dish`、`Order` domain type。
