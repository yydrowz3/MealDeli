# 下一步重构实施蓝图：阶段 6 收口与阶段 7A 支付/推广

> 状态：实施说明，不代表代码已经落地。审计日期为 2026-08-09。
>
> 本文给出本切片全部新增或语义修改的手写文件完整目标内容。`api/src/schema.gql`、`api/src/generated/prisma/**` 与 `api/pnpm-lock.yaml` 是生成物，必须由工具生成并审查，不能手工复制。

## 1. 执行结论

当前功能主线已经完成 Foundation、Identity、Catalog、Orders 和进程内 Realtime 的编码，最新提交是 `a8f0349 feat: subscription`。下一项新的业务能力应当是阶段 7，但不能直接把支付、上传、调度一次性塞进同一个 PR。

实际执行顺序是：

1. **C0：阶段 6 收口**：补 11 个 Catalog/Orders CHECK，处理空 migration，修正 GraphQL peer 版本，独立完成 Prettier 基线，补 Catalog/Orders/Realtime runtime evidence 与 learning 03/04/05。
2. **P1：可信 checkout**：Owner 为自己的 Restaurant 请求服务端创建 Paddle transaction；客户端不再提交 `transactionId` 来激活推广。
3. **P2：验签与幂等处理**：只接受 raw-body 验签成功的 `transaction.completed`，校验 checkout、price、quantity、amount、currency 与 provider transaction。
4. **P3：原子推广**：同一 Serializable transaction 中写 webhook event、Payment、checkout 完成状态和 `Restaurant.promotedUntil`。
5. **P4：读取与排序**：安全暴露 Owner 支付历史；公共餐厅列表按“当前仍有效的推广”优先排序。
6. **P5：过期调度**：每小时用 PostgreSQL `FOR UPDATE SKIP LOCKED` 分批清理过期时间，多实例不会重复转换同一行。
7. **P6：运行时证据**：使用 Paddle sandbox/webhook simulator 验证签名、重放、乱序、错误金额、并发购买和多实例过期。

```mermaid
flowchart LR
  C0["C0\n阶段 6 收口"] --> P1["P1\n服务端 checkout"]
  P1 --> P2["P2\nraw body + Paddle 验签"]
  P2 --> P3["P3\n幂等支付 + 7 天推广"]
  P3 --> P4["P4\n查询 + promoted 排序"]
  P4 --> P5["P5\n多实例安全过期"]
  P5 --> P6["P6\nruntime evidence"]
  P6 --> U["阶段 7B\n安全图片上传"]
```

阶段 7B 上传紧随本切片，但不与支付事务混合。上传涉及 magic bytes、像素限制、重新编码、对象存储补偿和角色/用途约束，是另一个独立 HTTP/外部存储边界。

## 2. 当前项目状态审计

### 2.1 Git 与功能状态

审计时两层 Git 都是 clean：

```text
root: main...origin/main
api:  main...origin/main
HEAD: a8f0349 feat: subscription
```

| 范围 | 已有实现 | 未闭环内容 |
| --- | --- | --- |
| Foundation | Nest 11、Apollo code-first、Zod config、Prisma 7/PostgreSQL、health | 全仓格式门禁未通过；learning 仅有 01/02 |
| Identity | 注册/登录、Argon2、Bearer-only HTTP/WS、JWT claims、邮箱验证、RBAC | 自动 Jest 阶段延后；identity learning note 缺失 |
| Catalog | 分类/餐厅/菜品、Owner 写路径、15 项分页、参数化查询 | 两个 CHECK 缺失；尚无 promotion 字段/排序；learning/query evidence 缺失 |
| Orders | 服务端计价快照、Serializable create、幂等、状态机、CAS 抢单 | 九个 CHECK 缺失；真实重叠并发证据与 learning 缺失 |
| Realtime | `graphql-ws`、严格 WS Bearer、提交后事件端口、三个授权订阅 | GraphQL peer 不兼容；真实 WS lifecycle evidence 与 learning 缺失 |
| Payments/uploads | 目标 API 中不存在 | 下一阶段 |

### 2.2 实测质量门禁

2026-08-09 的只读检查结果：

| 命令 | 结果 | 结论 |
| --- | --- | --- |
| `pnpm exec prisma validate` | 通过 | 当前 Prisma schema 语法有效 |
| `pnpm exec tsc --noEmit --incremental false` | 通过 | 当前 TypeScript 可编译 |
| `pnpm exec prettier --check "src/**/*.ts" "test/**/*.ts"` | 失败，124 个文件 | `.prettierrc` 的单引号/换行规则未落实 |
| non-fixing ESLint | 失败，1033 errors | 其中 1030 个可机械修复，当前 lint 不是绿色门禁 |
| `pnpm exec prisma migrate status` | 失败状态 | `20260809104356_orders_foundation` 为空且尚未应用 |

按仓库指导没有运行 Jest；functional-refactor 尚未完成。现有配置 spec 也已经落后于实际必填 JWT/Email 环境变量，不能把旧测试通过与否当成本阶段事实。

### 2.3 数据库缺口

- 已应用的 Catalog migration 没有 `dishes_price_minor_check` 与 `dishes_options_array_check`。
- 已应用的 Orders migration 没有订单/快照的九个 CHECK。
- 后续 `20260809104356_orders_foundation/migration.sql` 是空文件。它已经提交，不能假设所有其他数据库都未应用，因此不删除、不改名、不回写；先应用这个空 history entry，再创建新的 forward migration。
- 当前 `Restaurant` 没有 `promotedUntil`，Catalog 仍只按创建时间排序。

### 2.4 依赖缺口

当前直接依赖 `graphql@17.0.2`，但本地包声明：

- `@nestjs/graphql@13.4.2` 要求 `graphql ^16.11.0`；
- `@nestjs/apollo@13.4.2` 要求 `graphql ^16.10.0`。

build 通过不代表该组合受支持。实施前把 GraphQL 固定到当前 16.x 最新兼容版本 `16.14.2`，并把 `ws` 变成显式 runtime dependency。

## 3. 遗留行为取证与目标纠正

### 3.1 遗留支付

遗留前端在 Paddle checkout success callback 中，把浏览器拿到的 checkout ID 和 Restaurant ID 传给 `createPayment`。遗留服务随后：

1. 只检查 Restaurant ownership；
2. 直接保存客户端提供的 `transactionId`；
3. 把 `isPromoted` 设为 true；
4. 把 `promotedUntil` 重置为本地墙上时间加七天。

该流程没有 webhook 验签、provider event 去重、price/amount/currency 校验、事务或并发保护。攻击者无需真正付款就能调用 mutation 激活推广，因此目标 API **不保留 `createPayment(transactionId, restaurantId)`**。

### 3.2 遗留调度

遗留 `@Cron("0 0 * * *")` 先查询全部过期 Restaurant，再使用未 await 的 `forEach(async ...)` 逐条保存。多个实例会重复处理，进程可能在保存完成前结束，也没有提交后事件或失败观测。

### 3.3 遗留上传

遗留上传端点直接信任 `originalname`/MIME，把 provider client 建在 controller 内，失败时返回公共 fallback URL。阶段 7B 将完整替换这一行为；本切片不复制任何 Supabase SDK 或 fallback 语义。

## 4. 本切片范围与非目标

### 4.1 包含

- 阶段 6 的 integrity/format/dependency/runtime 文档收口。
- Paddle Billing 服务端 transaction 创建。
- `POST /payments/webhooks/paddle` raw-body 验签。
- provider-neutral payment port 与 Paddle adapter。
- checkout、webhook event、Payment 与 promotion 的 Prisma 模型和 forward migration。
- provider event ID 与 transaction ID 双重幂等。
- 七天累加规则、UTC/fixed Clock seam、并发 transaction retry。
- `Restaurant.isPromoted`/`promotedUntil` GraphQL 字段与有效推广优先排序。
- Owner 支付历史查询。
- 每小时、多实例安全的过期清理和提交后 domain events。
- deferred Jest、runtime smoke、前端阶段 9 适配与 learning-note 清单。

### 4.2 不包含

- 不修改 `backend/` 或 `frontend/`。
- 不运行前端 codegen，不修改生成的前端 types。
- 不实现图片上传；它是阶段 7B。
- 不实现退款/chargeback 后撤销推广；若产品要求退款回收权益，另写业务规则和 ADR。
- 不保存 Paddle raw payload、卡号、客户地址或支付方式明细。
- 不引入 Redis/BullMQ/outbox。当前 promotion 事件仍是单实例 best-effort；数据库是事实来源。
- 不新增或扩写 Jest；自动测试留到 functional refactor 完成后的 Jest phase。

## 5. 目标外部契约

### 5.1 GraphQL

```graphql
enum PaymentProvider {
  PADDLE
}

input CreatePromotionCheckoutInput {
  restaurantId: ID!
}

type CreatePromotionCheckoutPayload {
  ok: Boolean!
  error: String
  transactionId: String
}

type Payment {
  id: ID!
  provider: PaymentProvider!
  restaurantId: ID!
  amountMinor: Int!
  currency: String!
  promotionStartsAt: DateTime!
  promotionEndsAt: DateTime!
  createdAt: DateTime!
}

input MyPaymentsInput {
  page: Int! = 1
}

type MyPaymentsPayload {
  ok: Boolean!
  error: String
  payments: [Payment!]!
  totalResults: Int!
  totalPages: Int!
}

extend type Mutation {
  createPromotionCheckout(input: CreatePromotionCheckoutInput!): CreatePromotionCheckoutPayload!
}

extend type Query {
  myPayments(input: MyPaymentsInput! = { page: 1 }): MyPaymentsPayload!
}

extend type Restaurant {
  isPromoted: Boolean!
  promotedUntil: DateTime
}
```

只有 `OWNER` 能调用 checkout/query，应用服务再次验证 role 与 Restaurant ownership。`transactionId` 只能用于 Paddle.js 打开服务端已准备好的 transaction，不能提交回 API 激活推广。

### 5.2 HTTP webhook

```text
POST /payments/webhooks/paddle
Content-Type: application/json
Paddle-Signature: ts=...;h1=...
```

响应策略：

| 情况 | HTTP | 说明 |
| --- | --- | --- |
| 正确处理、重复、业务拒绝、无关 event | 204 | 已收到；不要求 Paddle 重试 |
| 缺 raw body/signature 或验签失败 | 400 | 不是可信请求 |
| provider contract 解析失败、数据库暂时错误、Serializable retry 耗尽 | 500 | 可重试；日志只含非敏感 event/checkout ID |

## 6. 核心领域决定

### 6.1 七天是每笔已验证付款购买的权益

```text
base = max(processedAt, currentPromotedUntil)
newPromotedUntil = base + 7 days
```

这比遗留的“每次重置为 now + 7 days”更符合“每笔购买获得完整七天”的付费不变量。两笔并发购买必须最终累计十四天；Serializable isolation + `P2034` 有界重试保证不会丢失其中一笔延长。

### 6.2 读取以时间为真相

`isPromoted = promotedUntil != null && promotedUntil > evaluatedAt`。即使 scheduler 延迟，过期 Restaurant 也不会继续显示为 promoted。scheduler 只负责清理旧字段、保持索引紧凑并发布失效事件。

### 6.3 幂等键

- Paddle 官方说明 webhook 是 at-least-once，使用 `event_id` 去重。
- `providerEventId` 唯一：同一通知重试只处理一次。
- `providerTransactionId` 唯一：即使异常地产生不同 event ID，也只能生成一笔业务 Payment。
- `checkoutId` 在 Payment 上唯一：一个服务端 checkout 只能授予一次权益。

### 6.4 raw payload 不持久化

数据库仅保存事件 ID、notification ID、type、provider transaction ID、时间与已验证业务摘要。完整 payload 可能包含客户/支付细节，不写日志、不进事件总线、不进数据库。

## 7. C0：进入支付前必须完成的收口

### 7.1 依赖修正

在 `api/` 执行，并独立提交 manifest/lockfile：

```powershell
pnpm add graphql@16.14.2 graphql-ws@6.2.1 ws@8.20.1
pnpm add @nestjs/schedule@6.1.3 @paddle/paddle-node-sdk@3.10.0
pnpm list --depth 0
pnpm why graphql
```

本文在 2026-08-09 额外核对了 Paddle Node SDK `3.10.0` 的发布包声明：`CreateTransactionRequestBody` 使用 `items`、`customData` 和 `collectionMode`，完成事件暴露 `eventId`、`notificationId`、`occurredAt`、transaction `customData/items/details`，金额字段分别为 `unitPrice.amount` 与 `details.totals.grandTotal`；`LogLevel.error` 也存在。该版本要求 Node.js `>=20`，当前审计环境 Node.js `26.7.0` 满足要求。

实施当天重新运行 `pnpm view` 与 peer 检查；如果版本已经变化，只能在官方兼容范围内更新并 review lockfile，不能无依据复制本文版本。

### 7.2 独立格式化提交

```powershell
pnpm exec prettier --write "src/**/*.ts" "test/**/*.ts"
pnpm exec prettier --check "src/**/*.ts" "test/**/*.ts"
pnpm exec eslint "{src,test}/**/*.ts"
pnpm exec tsc --noEmit --incremental false
pnpm run build
```

不要使用当前自带 `--fix` 的 `pnpm run lint` 做审计。格式化 diff 不夹带语义变更。

### 7.3 Forward integrity migration

先确认目标数据库，按顺序应用现有空 migration；随后创建 `catalog_orders_integrity`，不能编辑已应用的旧 migration。

`api/prisma/migrations/<timestamp>_catalog_orders_integrity/migration.sql` 完整内容：

```sql
-- Catalog constraints omitted from an already-applied migration.
ALTER TABLE "dishes"
ADD CONSTRAINT "dishes_price_minor_check"
CHECK ("price_minor" >= 0 AND "price_minor" <= 100000000) NOT VALID;

ALTER TABLE "dishes"
ADD CONSTRAINT "dishes_options_array_check"
CHECK (jsonb_typeof("options") = 'array') NOT VALID;

ALTER TABLE "dishes" VALIDATE CONSTRAINT "dishes_price_minor_check";
ALTER TABLE "dishes" VALIDATE CONSTRAINT "dishes_options_array_check";

-- Order aggregate constraints.
ALTER TABLE "orders"
ADD CONSTRAINT "orders_total_minor_check"
CHECK ("total_minor" >= 0 AND "total_minor" <= 2147483647) NOT VALID;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_version_check"
CHECK ("version" >= 0) NOT VALID;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_request_hash_check"
CHECK ("request_hash" ~ '^[0-9a-f]{64}$') NOT VALID;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_courier_state_check"
CHECK (
  ("status" IN ('PENDING', 'COOKING') AND "courier_id" IS NULL)
  OR "status" = 'COOKED'
  OR ("status" IN ('PICKED_UP', 'DELIVERED') AND "courier_id" IS NOT NULL)
) NOT VALID;

-- Immutable order-item snapshot constraints.
ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_position_check"
CHECK ("position" >= 0 AND "position" < 25) NOT VALID;

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_base_price_check"
CHECK ("base_price_minor" >= 0 AND "base_price_minor" <= 100000000) NOT VALID;

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_options_extra_check"
CHECK ("options_extra_minor" >= 0 AND "options_extra_minor" <= 2147483647) NOT VALID;

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_line_total_check"
CHECK (
  "line_total_minor" >= 0
  AND "line_total_minor" <= 2147483647
  AND "line_total_minor" = "base_price_minor" + "options_extra_minor"
) NOT VALID;

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_selected_options_array_check"
CHECK (jsonb_typeof("selected_options") = 'array') NOT VALID;

ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_total_minor_check";
ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_version_check";
ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_request_hash_check";
ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_courier_state_check";
ALTER TABLE "order_items" VALIDATE CONSTRAINT "order_items_position_check";
ALTER TABLE "order_items" VALIDATE CONSTRAINT "order_items_base_price_check";
ALTER TABLE "order_items" VALIDATE CONSTRAINT "order_items_options_extra_check";
ALTER TABLE "order_items" VALIDATE CONSTRAINT "order_items_line_total_check";
ALTER TABLE "order_items" VALIDATE CONSTRAINT "order_items_selected_options_array_check";
```

### 7.4 C0 退出门槛

- 11 个约束在 PostgreSQL catalog 中存在且 `convalidated = true`。
- GraphQL runtime 位于 Nest GraphQL/Apollo 的 16.x peer 范围。
- Prettier、non-fixing ESLint、typecheck 与 build 全绿。
- 真实 Catalog/Orders runtime、query plan/count、重叠 courier claim、WS connect/filter/disconnect 已记录。
- 基于实际结果创建 learning 03/04/05；不能把计划文档复制成“完成证据”。

## 8. Prisma 目标模型

`api/prisma/schema.prisma` 完整目标内容：

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

enum UserRole {
  CUSTOMER
  OWNER
  COURIER
}

enum OrderStatus {
  PENDING
  COOKING
  COOKED
  PICKED_UP
  DELIVERED
}

enum PaymentProvider {
  PADDLE
}

enum PromotionCheckoutStatus {
  PENDING
  READY
  FAILED
  COMPLETED
}

model User {
  id           String    @id @default(uuid(7)) @db.Uuid
  email        String    @unique(map: "users_email_key") @db.VarChar(254)
  passwordHash String    @map("password_hash") @db.VarChar(255)
  role         UserRole  @default(CUSTOMER)
  verifiedAt   DateTime? @map("verified_at") @db.Timestamptz(3)
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  emailVerification EmailVerification?
  restaurants       Restaurant[]
  customerOrders    Order[]             @relation("OrderCustomer")
  courierOrders     Order[]             @relation("OrderCourier")
  promotionCheckouts PromotionCheckout[]
  payments           Payment[]

  @@map("users")
}

model EmailVerification {
  id        String   @id @default(uuid(7)) @db.Uuid
  userId    String   @unique(map: "email_verifications_user_id_key") @map("user_id") @db.Uuid
  tokenHash String   @unique(map: "email_verifications_token_hash_key") @map("token_hash") @db.Char(64)
  expiresAt DateTime @map("expires_at") @db.Timestamptz(3)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([expiresAt], map: "email_verifications_expires_at_idx")
  @@map("email_verifications")
}

model Category {
  id             String       @id @default(uuid(7)) @db.Uuid
  name           String       @db.VarChar(80)
  normalizedName String       @unique(map: "categories_normalized_name_key") @map("normalized_name") @db.VarChar(80)
  slug           String       @unique(map: "categories_slug_key") @db.VarChar(100)
  coverImageUrl  String?      @map("cover_image_url") @db.VarChar(2048)
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(3)
  restaurants    Restaurant[]

  @@map("categories")
}

model Restaurant {
  id             String    @id @default(uuid(7)) @db.Uuid
  ownerId        String    @map("owner_id") @db.Uuid
  categoryId     String    @map("category_id") @db.Uuid
  name           String    @db.VarChar(120)
  address        String    @db.VarChar(255)
  coverImageUrl  String    @map("cover_image_url") @db.VarChar(2048)
  promotedUntil  DateTime? @map("promoted_until") @db.Timestamptz(3)
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  owner              User                @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  category           Category            @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  dishes             Dish[]
  orders             Order[]
  promotionCheckouts PromotionCheckout[]
  payments           Payment[]

  @@index([createdAt(sort: Desc), id(sort: Desc)], map: "restaurants_created_at_id_idx")
  @@index([ownerId, createdAt(sort: Desc), id(sort: Desc)], map: "restaurants_owner_page_idx")
  @@index([categoryId, createdAt(sort: Desc), id(sort: Desc)], map: "restaurants_category_page_idx")
  @@index([promotedUntil, createdAt(sort: Desc), id(sort: Desc)], map: "restaurants_promotion_page_idx")
  @@index([ownerId, promotedUntil, createdAt(sort: Desc), id(sort: Desc)], map: "restaurants_owner_promotion_page_idx")
  @@index([categoryId, promotedUntil, createdAt(sort: Desc), id(sort: Desc)], map: "restaurants_category_promotion_page_idx")
  @@map("restaurants")
}

model Dish {
  id           String     @id @default(uuid(7)) @db.Uuid
  restaurantId String     @map("restaurant_id") @db.Uuid
  name         String     @db.VarChar(120)
  description  String     @db.VarChar(500)
  priceMinor   Int        @map("price_minor")
  photoUrl     String?    @map("photo_url") @db.VarChar(2048)
  options      Json       @default("[]") @db.JsonB
  createdAt    DateTime   @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt    DateTime   @updatedAt @map("updated_at") @db.Timestamptz(3)
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)

  @@index([restaurantId, createdAt, id], map: "dishes_restaurant_menu_idx")
  @@map("dishes")
}

model Order {
  id             String      @id @default(uuid(7)) @db.Uuid
  customerId     String      @map("customer_id") @db.Uuid
  restaurantId   String      @map("restaurant_id") @db.Uuid
  courierId      String?     @map("courier_id") @db.Uuid
  status         OrderStatus @default(PENDING)
  totalMinor     Int         @map("total_minor")
  version        Int         @default(0)
  idempotencyKey String      @map("idempotency_key") @db.Uuid
  requestHash    String      @map("request_hash") @db.Char(64)
  createdAt      DateTime    @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt      DateTime    @updatedAt @map("updated_at") @db.Timestamptz(3)
  customer       User        @relation("OrderCustomer", fields: [customerId], references: [id], onDelete: Restrict)
  courier        User?       @relation("OrderCourier", fields: [courierId], references: [id], onDelete: Restrict)
  restaurant     Restaurant  @relation(fields: [restaurantId], references: [id], onDelete: Restrict)
  items          OrderItem[]

  @@unique([customerId, idempotencyKey], map: "orders_customer_idempotency_key")
  @@index([customerId, createdAt(sort: Desc), id(sort: Desc)], map: "orders_customer_page_idx")
  @@index([restaurantId, status, createdAt(sort: Desc), id(sort: Desc)], map: "orders_restaurant_status_page_idx")
  @@index([courierId, status, createdAt(sort: Desc), id(sort: Desc)], map: "orders_courier_status_page_idx")
  @@map("orders")
}

model OrderItem {
  id                String   @id @default(uuid(7)) @db.Uuid
  orderId           String   @map("order_id") @db.Uuid
  position          Int
  dishId            String   @map("dish_id") @db.Uuid
  dishName          String   @map("dish_name") @db.VarChar(120)
  basePriceMinor    Int      @map("base_price_minor")
  selectedOptions   Json     @default("[]") @map("selected_options") @db.JsonB
  optionsExtraMinor Int      @map("options_extra_minor")
  lineTotalMinor    Int      @map("line_total_minor")
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  order             Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@unique([orderId, position], map: "order_items_order_position_key")
  @@map("order_items")
}

model PromotionCheckout {
  id                    String                  @id @default(uuid(7)) @db.Uuid
  provider              PaymentProvider         @default(PADDLE)
  ownerId               String                  @map("owner_id") @db.Uuid
  restaurantId          String                  @map("restaurant_id") @db.Uuid
  providerTransactionId String?                 @unique(map: "promotion_checkouts_provider_transaction_key") @map("provider_transaction_id") @db.VarChar(64)
  status                PromotionCheckoutStatus @default(PENDING)
  failedAt              DateTime?               @map("failed_at") @db.Timestamptz(3)
  completedAt           DateTime?               @map("completed_at") @db.Timestamptz(3)
  createdAt             DateTime                @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt             DateTime                @updatedAt @map("updated_at") @db.Timestamptz(3)

  owner      User       @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  restaurant Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Restrict)
  payment    Payment?

  @@index([ownerId, createdAt(sort: Desc), id(sort: Desc)], map: "promotion_checkouts_owner_page_idx")
  @@index([restaurantId, createdAt(sort: Desc), id(sort: Desc)], map: "promotion_checkouts_restaurant_idx")
  @@map("promotion_checkouts")
}

model PaymentWebhookEvent {
  id                    String          @id @default(uuid(7)) @db.Uuid
  provider              PaymentProvider @default(PADDLE)
  providerEventId       String          @unique(map: "payment_webhook_events_provider_event_key") @map("provider_event_id") @db.VarChar(64)
  providerNotificationId String         @map("provider_notification_id") @db.VarChar(64)
  eventType             String          @map("event_type") @db.VarChar(80)
  providerTransactionId String          @map("provider_transaction_id") @db.VarChar(64)
  occurredAt            DateTime        @map("occurred_at") @db.Timestamptz(3)
  receivedAt            DateTime        @map("received_at") @db.Timestamptz(3)
  payment               Payment?

  @@index([providerTransactionId], map: "payment_webhook_events_transaction_idx")
  @@index([receivedAt(sort: Desc), id(sort: Desc)], map: "payment_webhook_events_received_idx")
  @@map("payment_webhook_events")
}

model Payment {
  id                    String          @id @default(uuid(7)) @db.Uuid
  provider              PaymentProvider @default(PADDLE)
  ownerId               String          @map("owner_id") @db.Uuid
  restaurantId          String          @map("restaurant_id") @db.Uuid
  checkoutId            String          @unique(map: "payments_checkout_key") @map("checkout_id") @db.Uuid
  webhookEventId        String          @unique(map: "payments_webhook_event_key") @map("webhook_event_id") @db.Uuid
  providerTransactionId String          @unique(map: "payments_provider_transaction_key") @map("provider_transaction_id") @db.VarChar(64)
  priceId               String          @map("price_id") @db.VarChar(64)
  unitAmountMinor       Int             @map("unit_amount_minor")
  amountMinor           Int             @map("amount_minor")
  currency              String          @db.Char(3)
  promotionStartsAt     DateTime        @map("promotion_starts_at") @db.Timestamptz(3)
  promotionEndsAt       DateTime        @map("promotion_ends_at") @db.Timestamptz(3)
  createdAt             DateTime        @default(now()) @map("created_at") @db.Timestamptz(3)

  owner        User                @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  restaurant   Restaurant          @relation(fields: [restaurantId], references: [id], onDelete: Restrict)
  checkout     PromotionCheckout   @relation(fields: [checkoutId], references: [id], onDelete: Restrict)
  webhookEvent PaymentWebhookEvent @relation(fields: [webhookEventId], references: [id], onDelete: Restrict)

  @@index([ownerId, createdAt(sort: Desc), id(sort: Desc)], map: "payments_owner_page_idx")
  @@index([restaurantId, createdAt(sort: Desc), id(sort: Desc)], map: "payments_restaurant_idx")
  @@map("payments")
}
```

## 9. Promotion/payment migration

先用 `pnpm exec prisma migrate dev --create-only --name promotion_payments` 生成，再把 SQL review 成下列完整目标；不要直接对共享数据库运行 reset。

`api/prisma/migrations/<timestamp>_promotion_payments/migration.sql`：

```sql
-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PADDLE');

-- CreateEnum
CREATE TYPE "PromotionCheckoutStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'COMPLETED');

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN "promoted_until" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "promotion_checkouts" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PADDLE',
    "owner_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "provider_transaction_id" VARCHAR(64),
    "status" "PromotionCheckoutStatus" NOT NULL DEFAULT 'PENDING',
    "failed_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "promotion_checkouts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promotion_checkouts_transaction_id_check" CHECK (
      "provider_transaction_id" IS NULL OR "provider_transaction_id" ~ '^txn_[a-z0-9]{26}$'
    ),
    CONSTRAINT "promotion_checkouts_state_check" CHECK (
      ("status" = 'PENDING' AND "provider_transaction_id" IS NULL AND "failed_at" IS NULL AND "completed_at" IS NULL)
      OR ("status" = 'READY' AND "provider_transaction_id" IS NOT NULL AND "failed_at" IS NULL AND "completed_at" IS NULL)
      OR ("status" = 'FAILED' AND "failed_at" IS NOT NULL AND "completed_at" IS NULL)
      OR ("status" = 'COMPLETED' AND "provider_transaction_id" IS NOT NULL AND "failed_at" IS NULL AND "completed_at" IS NOT NULL)
    )
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PADDLE',
    "provider_event_id" VARCHAR(64) NOT NULL,
    "provider_notification_id" VARCHAR(64) NOT NULL,
    "event_type" VARCHAR(80) NOT NULL,
    "provider_transaction_id" VARCHAR(64) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_webhook_events_event_type_check" CHECK ("event_type" = 'transaction.completed'),
    CONSTRAINT "payment_webhook_events_event_id_check" CHECK ("provider_event_id" ~ '^evt_[a-z0-9]{26}$'),
    CONSTRAINT "payment_webhook_events_notification_id_check" CHECK ("provider_notification_id" ~ '^ntf_[a-z0-9]{26}$'),
    CONSTRAINT "payment_webhook_events_transaction_id_check" CHECK ("provider_transaction_id" ~ '^txn_[a-z0-9]{26}$')
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PADDLE',
    "owner_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "checkout_id" UUID NOT NULL,
    "webhook_event_id" UUID NOT NULL,
    "provider_transaction_id" VARCHAR(64) NOT NULL,
    "price_id" VARCHAR(64) NOT NULL,
    "unit_amount_minor" INTEGER NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "promotion_starts_at" TIMESTAMPTZ(3) NOT NULL,
    "promotion_ends_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_provider_transaction_id_check" CHECK ("provider_transaction_id" ~ '^txn_[a-z0-9]{26}$'),
    CONSTRAINT "payments_price_id_check" CHECK ("price_id" ~ '^pri_[a-z0-9]{26}$'),
    CONSTRAINT "payments_unit_amount_check" CHECK ("unit_amount_minor" > 0 AND "unit_amount_minor" <= 100000000),
    CONSTRAINT "payments_amount_check" CHECK ("amount_minor" > 0 AND "amount_minor" <= 2147483647),
    CONSTRAINT "payments_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "payments_promotion_duration_check" CHECK ("promotion_ends_at" = "promotion_starts_at" + INTERVAL '7 days')
);

-- CreateIndex
CREATE INDEX "restaurants_promotion_page_idx" ON "restaurants"("promoted_until", "created_at" DESC, "id" DESC);
CREATE INDEX "restaurants_owner_promotion_page_idx" ON "restaurants"("owner_id", "promoted_until", "created_at" DESC, "id" DESC);
CREATE INDEX "restaurants_category_promotion_page_idx" ON "restaurants"("category_id", "promoted_until", "created_at" DESC, "id" DESC);
CREATE UNIQUE INDEX "promotion_checkouts_provider_transaction_key" ON "promotion_checkouts"("provider_transaction_id");
CREATE INDEX "promotion_checkouts_owner_page_idx" ON "promotion_checkouts"("owner_id", "created_at" DESC, "id" DESC);
CREATE INDEX "promotion_checkouts_restaurant_idx" ON "promotion_checkouts"("restaurant_id", "created_at" DESC, "id" DESC);
CREATE UNIQUE INDEX "payment_webhook_events_provider_event_key" ON "payment_webhook_events"("provider_event_id");
CREATE INDEX "payment_webhook_events_transaction_idx" ON "payment_webhook_events"("provider_transaction_id");
CREATE INDEX "payment_webhook_events_received_idx" ON "payment_webhook_events"("received_at" DESC, "id" DESC);
CREATE UNIQUE INDEX "payments_checkout_key" ON "payments"("checkout_id");
CREATE UNIQUE INDEX "payments_webhook_event_key" ON "payments"("webhook_event_id");
CREATE UNIQUE INDEX "payments_provider_transaction_key" ON "payments"("provider_transaction_id");
CREATE INDEX "payments_owner_page_idx" ON "payments"("owner_id", "created_at" DESC, "id" DESC);
CREATE INDEX "payments_restaurant_idx" ON "payments"("restaurant_id", "created_at" DESC, "id" DESC);

-- AddForeignKey
ALTER TABLE "promotion_checkouts" ADD CONSTRAINT "promotion_checkouts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "promotion_checkouts" ADD CONSTRAINT "promotion_checkouts_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_checkout_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "promotion_checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_webhook_event_id_fkey" FOREIGN KEY ("webhook_event_id") REFERENCES "payment_webhook_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

## 10. Clock 与配置代码

### 10.1 `api/src/common/time/clock.ts`

```ts
export const CLOCK = Symbol('CLOCK');

export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
```

### 10.2 `api/src/common/time/time.module.ts`

```ts
import { CLOCK, SystemClock } from './clock';
import { Module } from '@nestjs/common';

@Module({
  providers: [
    SystemClock,
    {
      provide: CLOCK,
      useExisting: SystemClock,
    },
  ],
  exports: [CLOCK],
})
export class TimeModule {}
```

### 10.3 `api/src/config/environment.variables.ts`

```ts
import { z } from 'zod';

const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;
const PADDLE_ENVIRONMENTS = ['sandbox', 'production'] as const;
const DEFAULT_PORT = 3000;
const MIN_PORT = 1;
const MAX_PORT = 65_535;

const requiredString = (name: string) =>
  z
    .string({ error: `${name} is required` })
    .trim()
    .min(1, { error: `${name} is required` });

const portSchema = z.preprocess(
  (value) => (value === undefined || value === '' ? DEFAULT_PORT : value),
  z
    .union(
      [
        z.number(),
        z
          .string()
          .trim()
          .regex(/^\d+$/, { error: 'PORT must be an integer' })
          .transform(Number),
      ],
      { error: 'PORT must be an integer' },
    )
    .pipe(
      z
        .number({ error: 'PORT must be an integer' })
        .int({ error: 'PORT must be an integer' })
        .min(MIN_PORT, {
          error: `PORT must be between ${MIN_PORT} and ${MAX_PORT}`,
        })
        .max(MAX_PORT, {
          error: `PORT must be between ${MIN_PORT} and ${MAX_PORT}`,
        }),
    ),
);

const databaseUrlSchema = requiredString('DATABASE_URL').transform((databaseUrl, context) => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    context.issues.push({
      code: 'custom',
      input: databaseUrl,
      message: 'DATABASE_URL must be a valid PostgreSQL URL',
    });
    return z.NEVER;
  }

  if (parsedUrl.protocol !== 'postgres:' && parsedUrl.protocol !== 'postgresql:') {
    context.issues.push({
      code: 'custom',
      input: databaseUrl,
      message: 'DATABASE_URL must use the postgres or postgresql protocol',
    });
    return z.NEVER;
  }

  if (!parsedUrl.hostname || !parsedUrl.pathname || parsedUrl.pathname === '/') {
    context.issues.push({
      code: 'custom',
      input: databaseUrl,
      message: 'DATABASE_URL must include a host and database name',
    });
    return z.NEVER;
  }

  return databaseUrl;
});

const corsOriginSchema = z.string().transform((origin, context) => {
  let parsedOrigin: URL;

  try {
    parsedOrigin = new URL(origin);
  } catch {
    context.issues.push({
      code: 'custom',
      input: origin,
      message: 'CORS_ORIGINS must contain valid HTTP origins',
    });
    return z.NEVER;
  }

  if (parsedOrigin.protocol !== 'http:' && parsedOrigin.protocol !== 'https:') {
    context.issues.push({
      code: 'custom',
      input: origin,
      message: 'CORS_ORIGINS must contain only HTTP or HTTPS origins',
    });
    return z.NEVER;
  }

  if (
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.search ||
    parsedOrigin.hash ||
    (parsedOrigin.pathname !== '' && parsedOrigin.pathname !== '/')
  ) {
    context.issues.push({
      code: 'custom',
      input: origin,
      message: 'CORS_ORIGINS entries must not include credentials, paths, queries, or fragments',
    });
    return z.NEVER;
  }

  return parsedOrigin.origin;
});

const corsOriginsSchema = requiredString('CORS_ORIGINS')
  .transform((rawOrigins) =>
    rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .pipe(
    z.array(corsOriginSchema).min(1, {
      error: 'CORS_ORIGINS must contain at least one origin',
    }),
  )
  .transform((origins) => [...new Set(origins)]);

const integerFromEnvironment = (name: string, minimum: number, maximum: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value),
    z
      .number({ error: `${name} must be an integer` })
      .int({ error: `${name} must be an integer` })
      .min(minimum, {
        error: `${name} must be between ${minimum} and ${maximum}`,
      })
      .max(maximum, {
        error: `${name} must be between ${minimum} and ${maximum}`,
      }),
  );

const httpUrlSchema = (name: string) =>
  requiredString(name).transform((value, context) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      context.issues.push({
        code: 'custom',
        input: value,
        message: `${name} must be a valid HTTP(S) URL`,
      });
      return z.NEVER;
    }

    if (
      (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      context.issues.push({
        code: 'custom',
        input: value,
        message: `${name} must be a valid HTTP(S) URL without embedded credentials`,
      });
      return z.NEVER;
    }

    return parsedUrl.toString();
  });

const paddleIdSchema = (name: string, prefix: string) =>
  requiredString(name).regex(new RegExp(`^${prefix}_[a-z0-9]{26}$`), {
    error: `${name} must be a valid Paddle ${prefix} ID`,
  });

const currencySchema = requiredString('PADDLE_PROMOTION_CURRENCY')
  .transform((value) => value.toUpperCase())
  .pipe(
    z.string().regex(/^[A-Z]{3}$/, {
      error: 'PADDLE_PROMOTION_CURRENCY must be a three-letter uppercase currency code',
    }),
  );

export const environmentVariablesSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS, {
    error: `NODE_ENV must be one of: ${NODE_ENVIRONMENTS.join(', ')}`,
  }),
  PORT: portSchema,
  DATABASE_URL: databaseUrlSchema,
  CORS_ORIGINS: corsOriginsSchema,
  JWT_SECRET: requiredString('JWT_SECRET').refine(
    (secret) => Buffer.byteLength(secret, 'utf8') >= 32,
    { error: 'JWT_SECRET must contain at least 32 UTF-8 bytes' },
  ),
  JWT_ACCESS_TTL_SECONDS: integerFromEnvironment('JWT_ACCESS_TTL_SECONDS', 60, 86_400),
  JWT_ISSUER: requiredString('JWT_ISSUER'),
  JWT_AUDIENCE: requiredString('JWT_AUDIENCE'),
  EMAIL_VERIFICATION_TTL_SECONDS: integerFromEnvironment(
    'EMAIL_VERIFICATION_TTL_SECONDS',
    300,
    604_800,
  ),
  FRONTEND_VERIFY_EMAIL_URL: httpUrlSchema('FRONTEND_VERIFY_EMAIL_URL'),
  RESEND_API_KEY: requiredString('RESEND_API_KEY'),
  RESEND_FROM: requiredString('RESEND_FROM'),
  RESEND_TIMEOUT_MS: integerFromEnvironment('RESEND_TIMEOUT_MS', 100, 30_000),
  PADDLE_ENVIRONMENT: z.enum(PADDLE_ENVIRONMENTS, {
    error: `PADDLE_ENVIRONMENT must be one of: ${PADDLE_ENVIRONMENTS.join(', ')}`,
  }),
  PADDLE_API_KEY: requiredString('PADDLE_API_KEY'),
  PADDLE_WEBHOOK_SECRET: requiredString('PADDLE_WEBHOOK_SECRET'),
  PADDLE_PROMOTION_PRICE_ID: paddleIdSchema('PADDLE_PROMOTION_PRICE_ID', 'pri'),
  PADDLE_PROMOTION_UNIT_PRICE_MINOR: integerFromEnvironment(
    'PADDLE_PROMOTION_UNIT_PRICE_MINOR',
    1,
    100_000_000,
  ),
  PADDLE_PROMOTION_CURRENCY: currencySchema,
  PADDLE_API_TIMEOUT_MS: integerFromEnvironment('PADDLE_API_TIMEOUT_MS', 100, 30_000),
  PROMOTION_EXPIRY_BATCH_SIZE: integerFromEnvironment(
    'PROMOTION_EXPIRY_BATCH_SIZE',
    1,
    1_000,
  ),
  PROMOTION_EXPIRY_MAX_BATCHES: integerFromEnvironment(
    'PROMOTION_EXPIRY_MAX_BATCHES',
    1,
    100,
  ),
});

export type EnvironmentVariables = z.infer<typeof environmentVariablesSchema>;
```

### 10.4 `api/.env.example`

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://mealrelay:change_me@localhost:5432/mealrelay_dev
CORS_ORIGINS=http://localhost:5173

JWT_SECRET=replace_with_at_least_32_random_bytes
JWT_ACCESS_TTL_SECONDS=900
JWT_ISSUER=mealrelay-api
JWT_AUDIENCE=mealrelay-web

EMAIL_VERIFICATION_TTL_SECONDS=86400
FRONTEND_VERIFY_EMAIL_URL=http://localhost:5173/confirm-email
RESEND_API_KEY=replace_with_resend_api_key
RESEND_FROM=MealRelay <noreply@example.com>
RESEND_TIMEOUT_MS=5000

PADDLE_ENVIRONMENT=sandbox
PADDLE_API_KEY=replace_with_paddle_sandbox_api_key
PADDLE_WEBHOOK_SECRET=replace_with_notification_destination_secret
PADDLE_PROMOTION_PRICE_ID=pri_replace_with_real_paddle_price_id
PADDLE_PROMOTION_UNIT_PRICE_MINOR=1000
PADDLE_PROMOTION_CURRENCY=USD
PADDLE_API_TIMEOUT_MS=5000

PROMOTION_EXPIRY_BATCH_SIZE=100
PROMOTION_EXPIRY_MAX_BATCHES=10
```

真实 `.env` 已存在且不应提交。实施时只补变量名/本地值，不把 secret 复制到文档、日志或 Git diff。

## 11. Payment domain 与 provider port

### 11.1 `api/src/payments/domain/payment-provider.ts`

```ts
import { registerEnumType } from '@nestjs/graphql';

export enum PaymentProvider {
  PADDLE = 'PADDLE',
}

registerEnumType(PaymentProvider, {
  name: 'PaymentProvider',
  description: 'The verified provider that produced the payment fact.',
});
```

### 11.2 `api/src/payments/domain/promotion.constants.ts`

```ts
export const PROMOTION_DURATION_DAYS = 7;
export const PROMOTION_DURATION_MS = PROMOTION_DURATION_DAYS * 24 * 60 * 60 * 1_000;
export const PROMOTION_CHECKOUT_CUSTOM_DATA_KEY = 'mealrelayPromotionCheckoutId';
```

### 11.3 `api/src/payments/domain/promotion-checkout.result.ts`

```ts
export enum PromotionCheckoutError {
  ResourceUnavailable = 'RESOURCE_UNAVAILABLE',
  ProviderUnavailable = 'PROVIDER_UNAVAILABLE',
}

export type PromotionCheckoutResult =
  | { ok: true; transactionId: string }
  | { ok: false; error: PromotionCheckoutError };
```

### 11.4 `api/src/payments/domain/promotion-event.ts`

```ts
import type { DomainEvent } from '@/events/domain-event';
import { randomUUID } from 'node:crypto';

export const PROMOTION_ACTIVATED_EVENT = 'PromotionActivated';
export const PROMOTION_EXPIRED_EVENT = 'PromotionExpired';

export interface CommittedPromotionPaymentFact {
  paymentId: string;
  restaurantId: string;
  ownerId: string;
  promotedUntil: Date;
}

export interface ExpiredPromotionFact {
  restaurantId: string;
  expiredAt: Date;
}

export interface PromotionActivatedEvent extends DomainEvent {
  readonly type: typeof PROMOTION_ACTIVATED_EVENT;
  readonly paymentId: string;
  readonly restaurantId: string;
  readonly ownerId: string;
  readonly promotedUntil: string;
}

export interface PromotionExpiredEvent extends DomainEvent {
  readonly type: typeof PROMOTION_EXPIRED_EVENT;
  readonly restaurantId: string;
  readonly expiredAt: string;
}

export function createPromotionActivatedEvent(
  fact: CommittedPromotionPaymentFact,
  occurredAt: Date,
): PromotionActivatedEvent {
  return {
    eventId: randomUUID(),
    type: PROMOTION_ACTIVATED_EVENT,
    occurredAt: occurredAt.toISOString(),
    paymentId: fact.paymentId,
    restaurantId: fact.restaurantId,
    ownerId: fact.ownerId,
    promotedUntil: fact.promotedUntil.toISOString(),
  };
}

export function createPromotionExpiredEvent(
  fact: ExpiredPromotionFact,
  occurredAt: Date,
): PromotionExpiredEvent {
  return {
    eventId: randomUUID(),
    type: PROMOTION_EXPIRED_EVENT,
    occurredAt: occurredAt.toISOString(),
    restaurantId: fact.restaurantId,
    expiredAt: fact.expiredAt.toISOString(),
  };
}
```

### 11.5 `api/src/payments/integrations/payment-provider.port.ts`

```ts
import type { PaymentProvider } from '../domain/payment-provider';

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export type ProviderEventRejectionReason =
  | 'CHECKOUT_REFERENCE_MISSING'
  | 'UNEXPECTED_COLLECTION_MODE'
  | 'UNEXPECTED_PRICE'
  | 'UNEXPECTED_QUANTITY'
  | 'UNEXPECTED_UNIT_AMOUNT'
  | 'UNEXPECTED_SUBTOTAL'
  | 'UNEXPECTED_DISCOUNT'
  | 'UNEXPECTED_CURRENCY';

export interface VerifiedPromotionPayment {
  kind: 'promotion-payment';
  provider: PaymentProvider;
  providerEventId: string;
  providerNotificationId: string;
  eventType: 'transaction.completed';
  providerTransactionId: string;
  checkoutId: string;
  priceId: string;
  unitAmountMinor: number;
  amountMinor: number;
  currency: string;
  occurredAt: Date;
}

export type VerifiedPaymentWebhook =
  | { kind: 'ignored'; providerEventId: string; eventType: string }
  | {
      kind: 'rejected';
      providerEventId: string;
      eventType: 'transaction.completed';
      reason: ProviderEventRejectionReason;
    }
  | VerifiedPromotionPayment;

export interface PaymentProviderPort {
  createPromotionTransaction(checkoutId: string): Promise<{ transactionId: string }>;
  verifyWebhook(rawBody: Buffer, signature: string): Promise<VerifiedPaymentWebhook>;
}

export class InvalidPaymentWebhookError extends Error {}
export class PaymentProviderContractError extends Error {}
export class PaymentProviderUnavailableError extends Error {}
```

### 11.6 `api/src/payments/integrations/paddle-payment.provider.ts`

```ts
import { EnvironmentVariables } from '@/config/environment.variables';
import { PaymentProvider } from '../domain/payment-provider';
import { PROMOTION_CHECKOUT_CUSTOM_DATA_KEY } from '../domain/promotion.constants';
import {
  InvalidPaymentWebhookError,
  PaymentProviderContractError,
  PaymentProviderPort,
  PaymentProviderUnavailableError,
  ProviderEventRejectionReason,
  VerifiedPaymentWebhook,
} from './payment-provider.port';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment, LogLevel, Paddle } from '@paddle/paddle-node-sdk';
import { z } from 'zod';

const paddleEventId = z.string().regex(/^evt_[a-z0-9]{26}$/);
const paddleNotificationId = z.string().regex(/^ntf_[a-z0-9]{26}$/);
const paddleTransactionId = z.string().regex(/^txn_[a-z0-9]{26}$/);
const paddlePriceId = z.string().regex(/^pri_[a-z0-9]{26}$/);
const minorAmount = z.string().regex(/^\d{1,10}$/);
const uuidV7 = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

const eventEnvelopeSchema = z.object({
  eventId: paddleEventId,
  eventType: z.string().min(1).max(80),
});

const completedTransactionEventSchema = z.object({
  eventId: paddleEventId,
  eventType: z.literal('transaction.completed'),
  occurredAt: z.string().datetime({ offset: true }),
  notificationId: paddleNotificationId,
  data: z.object({
    id: paddleTransactionId,
    status: z.literal('completed'),
    collectionMode: z.string(),
    currencyCode: z.string().regex(/^[A-Z]{3}$/),
    customData: z.record(z.string(), z.unknown()).nullable(),
    items: z.array(
      z.object({
        quantity: z.number().int().positive(),
        price: z.object({
          id: paddlePriceId,
          unitPrice: z.object({
            amount: minorAmount,
            currencyCode: z.string().regex(/^[A-Z]{3}$/),
          }),
        }),
      }),
    ),
    details: z.object({
      totals: z.object({
        subtotal: minorAmount,
        discount: minorAmount,
        grandTotal: minorAmount,
        currencyCode: z.string().regex(/^[A-Z]{3}$/),
      }),
    }),
  }),
});

@Injectable()
export class PaddlePaymentProvider implements PaymentProviderPort {
  private readonly paddle: Paddle;
  private readonly webhookSecret: string;
  private readonly promotionPriceId: string;
  private readonly promotionUnitPriceMinor: number;
  private readonly promotionCurrency: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    const environment = config.get('PADDLE_ENVIRONMENT', { infer: true });
    this.paddle = new Paddle(config.get('PADDLE_API_KEY', { infer: true }), {
      environment:
        environment === 'sandbox' ? Environment.sandbox : Environment.production,
      logLevel: LogLevel.error,
    });
    this.webhookSecret = config.get('PADDLE_WEBHOOK_SECRET', { infer: true });
    this.promotionPriceId = config.get('PADDLE_PROMOTION_PRICE_ID', { infer: true });
    this.promotionUnitPriceMinor = config.get('PADDLE_PROMOTION_UNIT_PRICE_MINOR', {
      infer: true,
    });
    this.promotionCurrency = config.get('PADDLE_PROMOTION_CURRENCY', { infer: true });
    this.timeoutMs = config.get('PADDLE_API_TIMEOUT_MS', { infer: true });
  }

  async createPromotionTransaction(checkoutId: string): Promise<{ transactionId: string }> {
    try {
      const transaction = await withTimeout(
        this.paddle.transactions.create({
          collectionMode: 'automatic',
          items: [{ priceId: this.promotionPriceId, quantity: 1 }],
          customData: {
            [PROMOTION_CHECKOUT_CUSTOM_DATA_KEY]: checkoutId,
          },
        }),
        this.timeoutMs,
      );

      return { transactionId: transaction.id };
    } catch {
      throw new PaymentProviderUnavailableError('Paddle transaction creation failed.');
    }
  }

  async verifyWebhook(rawBody: Buffer, signature: string): Promise<VerifiedPaymentWebhook> {
    let unmarshalled: unknown;
    try {
      unmarshalled = await this.paddle.webhooks.unmarshal(
        rawBody.toString('utf8'),
        this.webhookSecret,
        signature,
      );
    } catch {
      throw new InvalidPaymentWebhookError('Paddle signature verification failed.');
    }

    const envelope = eventEnvelopeSchema.safeParse(unmarshalled);
    if (!envelope.success) {
      throw new PaymentProviderContractError('Verified Paddle event envelope is invalid.');
    }

    if (envelope.data.eventType !== 'transaction.completed') {
      return {
        kind: 'ignored',
        providerEventId: envelope.data.eventId,
        eventType: envelope.data.eventType,
      };
    }

    const completed = completedTransactionEventSchema.safeParse(unmarshalled);
    if (!completed.success) {
      throw new PaymentProviderContractError(
        'Verified Paddle transaction.completed payload is invalid.',
      );
    }

    const event = completed.data;
    const rejection = this.rejectionReason(event.data);
    if (rejection) {
      return {
        kind: 'rejected',
        providerEventId: event.eventId,
        eventType: event.eventType,
        reason: rejection,
      };
    }

    const checkoutId = event.data.customData?.[PROMOTION_CHECKOUT_CUSTOM_DATA_KEY];
    if (typeof checkoutId !== 'string') {
      throw new PaymentProviderContractError('Promotion checkout reference disappeared.');
    }

    const item = event.data.items[0];
    return {
      kind: 'promotion-payment',
      provider: PaymentProvider.PADDLE,
      providerEventId: event.eventId,
      providerNotificationId: event.notificationId,
      eventType: event.eventType,
      providerTransactionId: event.data.id,
      checkoutId,
      priceId: item.price.id,
      unitAmountMinor: toMinor(item.price.unitPrice.amount),
      amountMinor: toMinor(event.data.details.totals.grandTotal),
      currency: event.data.details.totals.currencyCode,
      occurredAt: new Date(event.occurredAt),
    };
  }

  private rejectionReason(
    transaction: z.infer<typeof completedTransactionEventSchema>['data'],
  ): ProviderEventRejectionReason | null {
    const checkoutId = transaction.customData?.[PROMOTION_CHECKOUT_CUSTOM_DATA_KEY];
    if (typeof checkoutId !== 'string' || !uuidV7.safeParse(checkoutId).success) {
      return 'CHECKOUT_REFERENCE_MISSING';
    }

    if (transaction.collectionMode !== 'automatic') {
      return 'UNEXPECTED_COLLECTION_MODE';
    }

    if (transaction.items.length !== 1 || transaction.items[0].price.id !== this.promotionPriceId) {
      return 'UNEXPECTED_PRICE';
    }

    if (transaction.items[0].quantity !== 1) {
      return 'UNEXPECTED_QUANTITY';
    }

    if (toMinor(transaction.items[0].price.unitPrice.amount) !== this.promotionUnitPriceMinor) {
      return 'UNEXPECTED_UNIT_AMOUNT';
    }

    if (toMinor(transaction.details.totals.subtotal) !== this.promotionUnitPriceMinor) {
      return 'UNEXPECTED_SUBTOTAL';
    }

    if (toMinor(transaction.details.totals.discount) !== 0) {
      return 'UNEXPECTED_DISCOUNT';
    }

    const currencies = [
      transaction.currencyCode,
      transaction.items[0].price.unitPrice.currencyCode,
      transaction.details.totals.currencyCode,
    ];
    if (currencies.some((currency) => currency !== this.promotionCurrency)) {
      return 'UNEXPECTED_CURRENCY';
    }

    return null;
  }
}

function toMinor(value: string): number {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 2_147_483_647) {
    throw new PaymentProviderContractError('Paddle amount is outside the supported range.');
  }
  return amount;
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new PaymentProviderUnavailableError('Paddle request timed out.')),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
```

`withTimeout` 限制应用等待时间，但 Paddle SDK 当前接口没有暴露可传入的 `AbortSignal`，因此不能宣称已经取消底层网络请求。超时后的 draft transaction 可能成为 provider orphan；由于客户端拿不到 transaction ID，它不能激活推广。阶段 8 需增加 orphan 指标/清理策略，并在 SDK 支持取消时替换这一边界。

## 12. Payment persistence 完整代码

### 12.1 `api/src/payments/persistence/promotion-checkout.repository.ts`

```ts
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentProvider, PromotionCheckoutStatus } from '@/generated/prisma/enums';
import { Injectable } from '@nestjs/common';

export interface PendingPromotionCheckout {
  id: string;
}

@Injectable()
export class PromotionCheckoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, restaurantId: string): Promise<PendingPromotionCheckout | null> {
    return this.prisma.$transaction(async (transaction) => {
      const restaurant = await transaction.restaurant.findFirst({
        where: {
          id: restaurantId,
          ownerId,
        },
        select: { id: true },
      });

      if (!restaurant) {
        return null;
      }

      return transaction.promotionCheckout.create({
        data: {
          provider: PaymentProvider.PADDLE,
          ownerId,
          restaurantId,
        },
        select: { id: true },
      });
    });
  }

  async attachProviderTransaction(checkoutId: string, transactionId: string): Promise<boolean> {
    const updated = await this.prisma.promotionCheckout.updateMany({
      where: {
        id: checkoutId,
        status: PromotionCheckoutStatus.PENDING,
        providerTransactionId: null,
      },
      data: {
        providerTransactionId: transactionId,
        status: PromotionCheckoutStatus.READY,
      },
    });

    return updated.count === 1;
  }

  async markFailed(checkoutId: string, failedAt: Date): Promise<void> {
    await this.prisma.promotionCheckout.updateMany({
      where: {
        id: checkoutId,
        status: PromotionCheckoutStatus.PENDING,
      },
      data: {
        status: PromotionCheckoutStatus.FAILED,
        failedAt,
      },
    });
  }
}
```

### 12.2 `api/src/payments/persistence/payment.selects.ts`

```ts
import { Prisma } from '@/generated/prisma/client';

export const PAYMENT_SELECT = {
  id: true,
  provider: true,
  restaurantId: true,
  amountMinor: true,
  currency: true,
  promotionStartsAt: true,
  promotionEndsAt: true,
  createdAt: true,
} as const satisfies Prisma.PaymentSelect;

export type PaymentRecord = Prisma.PaymentGetPayload<{
  select: typeof PAYMENT_SELECT;
}>;
```

### 12.3 `api/src/payments/persistence/payment.mapper.ts`

```ts
import { PaymentProvider as PrismaPaymentProvider } from '@/generated/prisma/enums';
import { PaymentProvider } from '../domain/payment-provider';
import { PaymentModel } from '../models/payment.model';
import { PaymentRecord } from './payment.selects';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentMapper {
  toModel(payment: PaymentRecord): PaymentModel {
    return {
      id: payment.id,
      provider: toPublicProvider(payment.provider),
      restaurantId: payment.restaurantId,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      promotionStartsAt: payment.promotionStartsAt,
      promotionEndsAt: payment.promotionEndsAt,
      createdAt: payment.createdAt,
    };
  }
}

function toPublicProvider(provider: PrismaPaymentProvider): PaymentProvider {
  switch (provider) {
    case PrismaPaymentProvider.PADDLE:
      return PaymentProvider.PADDLE;
  }
}
```

### 12.4 `api/src/payments/persistence/payment.repository.ts`

```ts
import { PAGE_SIZE } from '@/common/pagination/page.constants';
import { PageResult, pageOffset, toPageResult } from '@/common/pagination/page.types';
import { Prisma } from '@/generated/prisma/client';
import {
  PaymentProvider,
  PromotionCheckoutStatus,
} from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';
import { PROMOTION_DURATION_MS } from '../domain/promotion.constants';
import type { CommittedPromotionPaymentFact } from '../domain/promotion-event';
import type { VerifiedPromotionPayment } from '../integrations/payment-provider.port';
import { PAYMENT_SELECT, PaymentRecord } from './payment.selects';
import { Injectable } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';

const MAX_TRANSACTION_ATTEMPTS = 3;

export type ApplyPromotionPaymentResult =
  | { kind: 'applied'; fact: CommittedPromotionPaymentFact }
  | { kind: 'replayed' }
  | {
      kind: 'rejected';
      reason: 'CHECKOUT_UNAVAILABLE' | 'CHECKOUT_NOT_READY' | 'TRANSACTION_MISMATCH';
    };

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async applyPromotionPayment(
    input: VerifiedPromotionPayment,
    receivedAt: Date,
  ): Promise<ApplyPromotionPaymentResult> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction): Promise<ApplyPromotionPaymentResult> => {
            const existingEvent = await transaction.paymentWebhookEvent.findUnique({
              where: { providerEventId: input.providerEventId },
              select: { id: true },
            });
            if (existingEvent) {
              return { kind: 'replayed' };
            }

            const checkout = await transaction.promotionCheckout.findUnique({
              where: { id: input.checkoutId },
              select: {
                id: true,
                provider: true,
                ownerId: true,
                restaurantId: true,
                providerTransactionId: true,
                status: true,
                restaurant: {
                  select: { promotedUntil: true },
                },
                payment: {
                  select: { providerTransactionId: true },
                },
              },
            });

            if (!checkout || checkout.provider !== PaymentProvider.PADDLE) {
              return { kind: 'rejected', reason: 'CHECKOUT_UNAVAILABLE' };
            }

            if (checkout.status === PromotionCheckoutStatus.COMPLETED) {
              return checkout.payment?.providerTransactionId === input.providerTransactionId
                ? { kind: 'replayed' }
                : { kind: 'rejected', reason: 'TRANSACTION_MISMATCH' };
            }

            if (checkout.status !== PromotionCheckoutStatus.READY) {
              return { kind: 'rejected', reason: 'CHECKOUT_NOT_READY' };
            }

            if (checkout.providerTransactionId !== input.providerTransactionId) {
              return { kind: 'rejected', reason: 'TRANSACTION_MISMATCH' };
            }

            const promotionStartsAt = laterDate(receivedAt, checkout.restaurant.promotedUntil);
            const promotionEndsAt = new Date(
              promotionStartsAt.getTime() + PROMOTION_DURATION_MS,
            );

            const webhookEvent = await transaction.paymentWebhookEvent.create({
              data: {
                provider: PaymentProvider.PADDLE,
                providerEventId: input.providerEventId,
                providerNotificationId: input.providerNotificationId,
                eventType: input.eventType,
                providerTransactionId: input.providerTransactionId,
                occurredAt: input.occurredAt,
                receivedAt,
              },
              select: { id: true },
            });

            const completed = await transaction.promotionCheckout.updateMany({
              where: {
                id: checkout.id,
                status: PromotionCheckoutStatus.READY,
                providerTransactionId: input.providerTransactionId,
              },
              data: {
                status: PromotionCheckoutStatus.COMPLETED,
                completedAt: receivedAt,
              },
            });
            if (completed.count !== 1) {
              throw new PromotionCheckoutRaceError();
            }

            await transaction.restaurant.update({
              where: { id: checkout.restaurantId },
              data: { promotedUntil: promotionEndsAt },
              select: { id: true },
            });

            const payment = await transaction.payment.create({
              data: {
                provider: PaymentProvider.PADDLE,
                ownerId: checkout.ownerId,
                restaurantId: checkout.restaurantId,
                checkoutId: checkout.id,
                webhookEventId: webhookEvent.id,
                providerTransactionId: input.providerTransactionId,
                priceId: input.priceId,
                unitAmountMinor: input.unitAmountMinor,
                amountMinor: input.amountMinor,
                currency: input.currency,
                promotionStartsAt,
                promotionEndsAt,
              },
              select: { id: true },
            });

            return {
              kind: 'applied',
              fact: {
                paymentId: payment.id,
                restaurantId: checkout.restaurantId,
                ownerId: checkout.ownerId,
                promotedUntil: promotionEndsAt,
              },
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 2_000,
            timeout: 5_000,
          },
        );
      } catch (error) {
        if (error instanceof PromotionCheckoutRaceError || hasPrismaCode(error, 'P2034')) {
          if (attempt === MAX_TRANSACTION_ATTEMPTS) {
            throw error;
          }
          await delay(attempt * 10 + Math.floor(Math.random() * 10));
          continue;
        }

        if (hasPrismaCode(error, 'P2002')) {
          const replay = await this.resolveReplay(input);
          if (replay) {
            return { kind: 'replayed' };
          }
        }

        throw error;
      }
    }

    throw new Error('Promotion payment transaction retry exhausted.');
  }

  async listOwnerPayments(ownerId: string, page: number): Promise<PageResult<PaymentRecord>> {
    const where: Prisma.PaymentWhereInput = { ownerId };
    const [payments, totalResults] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        select: PAYMENT_SELECT,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: pageOffset(page),
        take: PAGE_SIZE,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return toPageResult(payments, totalResults);
  }

  private async resolveReplay(input: VerifiedPromotionPayment): Promise<boolean> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { checkoutId: input.checkoutId },
          { providerTransactionId: input.providerTransactionId },
          {
            webhookEvent: {
              is: { providerEventId: input.providerEventId },
            },
          },
        ],
      },
      select: { id: true },
    });

    return payment !== null;
  }
}

class PromotionCheckoutRaceError extends Error {}

function laterDate(receivedAt: Date, promotedUntil: Date | null): Date {
  return promotedUntil && promotedUntil.getTime() > receivedAt.getTime()
    ? promotedUntil
    : receivedAt;
}

function hasPrismaCode(error: unknown, code: string): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}
```

### 12.5 `api/src/payments/persistence/promotion-expiry.repository.ts`

```ts
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { ExpiredPromotionFact } from '../domain/promotion-event';
import { Injectable } from '@nestjs/common';

interface ExpiredPromotionRow {
  restaurantId: string;
  expiredAt: Date;
}

@Injectable()
export class PromotionExpiryRepository {
  constructor(private readonly prisma: PrismaService) {}

  expireBatch(now: Date, batchSize: number): Promise<ExpiredPromotionFact[]> {
    return this.prisma.$queryRaw<ExpiredPromotionRow[]>(Prisma.sql`
      WITH expired AS (
        SELECT "id", "promoted_until"
        FROM "restaurants"
        WHERE "promoted_until" IS NOT NULL
          AND "promoted_until" <= ${now}
        ORDER BY "promoted_until" ASC, "id" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${batchSize}
      )
      UPDATE "restaurants" AS restaurant
      SET "promoted_until" = NULL,
          "updated_at" = ${now}
      FROM expired
      WHERE restaurant."id" = expired."id"
      RETURNING
        restaurant."id" AS "restaurantId",
        expired."promoted_until" AS "expiredAt"
    `);
  }
}
```

`UPDATE ... FROM (SELECT ... FOR UPDATE SKIP LOCKED)` 是单条原子语句。多个实例可以取得不同批次；第二个实例不会再次返回已被第一个实例清空的行。事件仍然只在 SQL promise 成功返回后发布。

## 13. Application services 完整代码

### 13.1 `api/src/payments/application/promotion-checkout.service.ts`

```ts
import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CLOCK, Clock } from '@/common/time/clock';
import { UserRole } from '@/users/user-role.enum';
import {
  PromotionCheckoutError,
  PromotionCheckoutResult,
} from '../domain/promotion-checkout.result';
import {
  PAYMENT_PROVIDER,
  PaymentProviderPort,
  PaymentProviderUnavailableError,
} from '../integrations/payment-provider.port';
import { PromotionCheckoutRepository } from '../persistence/promotion-checkout.repository';
import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class PromotionCheckoutService {
  private readonly logger = new Logger(PromotionCheckoutService.name);

  constructor(
    private readonly checkouts: PromotionCheckoutRepository,
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProviderPort,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async create(
    principal: AuthenticatedPrincipal,
    restaurantId: string,
  ): Promise<PromotionCheckoutResult> {
    assertOwner(principal);

    const checkout = await this.checkouts.create(principal.userId, restaurantId);
    if (!checkout) {
      return {
        ok: false,
        error: PromotionCheckoutError.ResourceUnavailable,
      };
    }

    let providerTransaction: { transactionId: string };
    try {
      providerTransaction = await this.provider.createPromotionTransaction(checkout.id);
    } catch (error) {
      if (!(error instanceof PaymentProviderUnavailableError)) {
        throw error;
      }

      await this.checkouts.markFailed(checkout.id, this.clock.now());
      this.logger.warn(`Promotion checkout ${checkout.id} failed at the provider boundary.`);
      return {
        ok: false,
        error: PromotionCheckoutError.ProviderUnavailable,
      };
    }

    const attached = await this.checkouts.attachProviderTransaction(
      checkout.id,
      providerTransaction.transactionId,
    );
    if (!attached) {
      this.logger.error(`Promotion checkout ${checkout.id} could not attach its provider transaction.`);
      throw new InternalServerErrorException('Promotion checkout is unavailable.');
    }

    return {
      ok: true,
      transactionId: providerTransaction.transactionId,
    };
  }
}

function assertOwner(principal: AuthenticatedPrincipal): void {
  if (principal.role !== UserRole.OWNER) {
    throw new ForbiddenException('Owner access is required.');
  }
}
```

### 13.2 `api/src/payments/application/payment-query.service.ts`

```ts
import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import type { PageResult } from '@/common/pagination/page.types';
import { UserRole } from '@/users/user-role.enum';
import { PaymentModel } from '../models/payment.model';
import { PaymentMapper } from '../persistence/payment.mapper';
import { PaymentRepository } from '../persistence/payment.repository';
import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class PaymentQueryService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly mapper: PaymentMapper,
  ) {}

  async myPayments(
    principal: AuthenticatedPrincipal,
    page: number,
  ): Promise<PageResult<PaymentModel>> {
    if (principal.role !== UserRole.OWNER) {
      throw new ForbiddenException('Owner access is required.');
    }

    const result = await this.payments.listOwnerPayments(principal.userId, page);
    return {
      ...result,
      results: result.results.map((payment) => this.mapper.toModel(payment)),
    };
  }
}
```

### 13.3 `api/src/payments/application/payment-webhook.service.ts`

```ts
import { CLOCK, Clock } from '@/common/time/clock';
import {
  DOMAIN_EVENT_PUBLISHER,
  DomainEventPublisher,
} from '@/events/domain-event-bus.port';
import { createPromotionActivatedEvent } from '../domain/promotion-event';
import {
  PAYMENT_PROVIDER,
  PaymentProviderPort,
} from '../integrations/payment-provider.port';
import { PaymentRepository } from '../persistence/payment.repository';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly provider: PaymentProviderPort,
    private readonly payments: PaymentRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly events: DomainEventPublisher,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async handle(rawBody: Buffer, signature: string): Promise<void> {
    const verified = await this.provider.verifyWebhook(rawBody, signature);

    if (verified.kind === 'ignored') {
      return;
    }

    if (verified.kind === 'rejected') {
      this.logger.warn(
        `Rejected verified payment event ${verified.providerEventId}: ${verified.reason}.`,
      );
      return;
    }

    const receivedAt = this.clock.now();
    const result = await this.payments.applyPromotionPayment(verified, receivedAt);

    if (result.kind === 'rejected') {
      this.logger.warn(
        `Rejected promotion event ${verified.providerEventId}: ${result.reason}.`,
      );
      return;
    }

    if (result.kind === 'replayed') {
      return;
    }

    const event = createPromotionActivatedEvent(result.fact, receivedAt);
    try {
      this.events.publish(event);
    } catch (error) {
      this.logger.error(
        `Domain event ${event.eventId} failed after the payment commit.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
```

### 13.4 `api/src/payments/application/promotion-expiry.service.ts`

```ts
import { CLOCK, Clock } from '@/common/time/clock';
import { EnvironmentVariables } from '@/config/environment.variables';
import {
  DOMAIN_EVENT_PUBLISHER,
  DomainEventPublisher,
} from '@/events/domain-event-bus.port';
import { createPromotionExpiredEvent } from '../domain/promotion-event';
import { PromotionExpiryRepository } from '../persistence/promotion-expiry.repository';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PromotionExpiryService {
  private readonly logger = new Logger(PromotionExpiryService.name);
  private readonly batchSize: number;
  private readonly maxBatches: number;

  constructor(
    private readonly promotions: PromotionExpiryRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly events: DomainEventPublisher,
    @Inject(CLOCK)
    private readonly clock: Clock,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.batchSize = config.get('PROMOTION_EXPIRY_BATCH_SIZE', { infer: true });
    this.maxBatches = config.get('PROMOTION_EXPIRY_MAX_BATCHES', { infer: true });
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'promotion-expiry',
    timeZone: 'UTC',
    waitForCompletion: true,
  })
  async expirePromotions(): Promise<void> {
    const evaluatedAt = this.clock.now();
    let expiredCount = 0;

    for (let batch = 0; batch < this.maxBatches; batch += 1) {
      const expired = await this.promotions.expireBatch(evaluatedAt, this.batchSize);
      expiredCount += expired.length;

      for (const fact of expired) {
        const event = createPromotionExpiredEvent(fact, evaluatedAt);
        try {
          this.events.publish(event);
        } catch (error) {
          this.logger.error(
            `Domain event ${event.eventId} failed after promotion expiry.`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      if (expired.length < this.batchSize) {
        break;
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Expired ${expiredCount} restaurant promotions.`);
    }
  }
}
```

## 14. GraphQL/HTTP adapters 完整代码

### 14.1 `api/src/payments/models/payment.model.ts`

```ts
import { PaymentProvider } from '../domain/payment-provider';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Payment')
export class PaymentModel {
  @Field(() => ID)
  id!: string;

  @Field(() => PaymentProvider)
  provider!: PaymentProvider;

  @Field(() => ID)
  restaurantId!: string;

  @Field(() => Int)
  amountMinor!: number;

  @Field()
  currency!: string;

  @Field(() => Date)
  promotionStartsAt!: Date;

  @Field(() => Date)
  promotionEndsAt!: Date;

  @Field(() => Date)
  createdAt!: Date;
}
```

### 14.2 `api/src/payments/dto/promotion-checkout.dto.ts`

```ts
import { OperationPayload } from '@/common/dto/operation.payload';
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class CreatePromotionCheckoutInput {
  @Field(() => ID)
  @IsUUID('7')
  restaurantId!: string;
}

@ObjectType()
export class CreatePromotionCheckoutPayload extends OperationPayload {
  @Field(() => String, { nullable: true })
  transactionId?: string;
}
```

### 14.3 `api/src/payments/dto/payment-query.dto.ts`

```ts
import { OperationPayload } from '@/common/dto/operation.payload';
import { PageInput } from '@/common/pagination/page.input';
import { PaymentModel } from '../models/payment.model';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType()
export class MyPaymentsInput extends PageInput {}

@ObjectType()
export class MyPaymentsPayload extends OperationPayload {
  @Field(() => [PaymentModel])
  payments: PaymentModel[] = [];

  @Field(() => Int)
  totalResults = 0;

  @Field(() => Int)
  totalPages = 0;
}
```

### 14.4 `api/src/payments/payments.resolver.ts`

```ts
import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CurrentPrincipal } from '@/auth/current-principal.decorator';
import { GqlAuthGuard } from '@/auth/gql-auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { UserRole } from '@/users/user-role.enum';
import { PaymentQueryService } from './application/payment-query.service';
import { PromotionCheckoutService } from './application/promotion-checkout.service';
import { PromotionCheckoutError } from './domain/promotion-checkout.result';
import {
  MyPaymentsInput,
  MyPaymentsPayload,
} from './dto/payment-query.dto';
import {
  CreatePromotionCheckoutInput,
  CreatePromotionCheckoutPayload,
} from './dto/promotion-checkout.dto';
import { PaymentModel } from './models/payment.model';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@Resolver(() => PaymentModel)
export class PaymentsResolver {
  constructor(
    private readonly checkouts: PromotionCheckoutService,
    private readonly queries: PaymentQueryService,
  ) {}

  @Mutation(() => CreatePromotionCheckoutPayload)
  async createPromotionCheckout(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: CreatePromotionCheckoutInput,
  ): Promise<CreatePromotionCheckoutPayload> {
    const result = await this.checkouts.create(principal, input.restaurantId);
    if (result.ok) {
      return {
        ok: true,
        transactionId: result.transactionId,
      };
    }

    return {
      ok: false,
      error: checkoutErrorMessage(result.error),
    };
  }

  @Query(() => MyPaymentsPayload)
  async myPayments(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input', {
      type: () => MyPaymentsInput,
      defaultValue: { page: 1 },
    })
    input: MyPaymentsInput,
  ): Promise<MyPaymentsPayload> {
    const page = await this.queries.myPayments(principal, input.page);
    return {
      ok: true,
      payments: page.results,
      totalResults: page.totalResults,
      totalPages: page.totalPages,
    };
  }
}

function checkoutErrorMessage(error: PromotionCheckoutError): string {
  switch (error) {
    case PromotionCheckoutError.ResourceUnavailable:
      return 'Resource is unavailable.';
    case PromotionCheckoutError.ProviderUnavailable:
      return 'Payment checkout is temporarily unavailable.';
  }
}
```

### 14.5 `api/src/payments/paddle-webhook.controller.ts`

```ts
import { PaymentWebhookService } from './application/payment-webhook.service';
import { InvalidPaymentWebhookError } from './integrations/payment-provider.port';
import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

@Controller('payments/webhooks')
export class PaddleWebhookController {
  constructor(private readonly webhooks: PaymentWebhookService) {}

  @Post('paddle')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handlePaddleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('paddle-signature') signature: string | undefined,
  ): Promise<void> {
    if (!signature || !request.rawBody || request.rawBody.length === 0) {
      throw new BadRequestException('A signed raw webhook body is required.');
    }

    try {
      await this.webhooks.handle(request.rawBody, signature);
    } catch (error) {
      if (error instanceof InvalidPaymentWebhookError) {
        throw new BadRequestException('Webhook signature verification failed.');
      }
      throw error;
    }
  }
}
```

### 14.6 `api/src/payments/payments.module.ts`

```ts
import { AuthModule } from '@/auth/auth.module';
import { TimeModule } from '@/common/time/time.module';
import { EventsModule } from '@/events/events.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { PaymentQueryService } from './application/payment-query.service';
import { PaymentWebhookService } from './application/payment-webhook.service';
import { PromotionCheckoutService } from './application/promotion-checkout.service';
import { PromotionExpiryService } from './application/promotion-expiry.service';
import { PAYMENT_PROVIDER } from './integrations/payment-provider.port';
import { PaddlePaymentProvider } from './integrations/paddle-payment.provider';
import { PaddleWebhookController } from './paddle-webhook.controller';
import { PaymentMapper } from './persistence/payment.mapper';
import { PaymentRepository } from './persistence/payment.repository';
import { PromotionCheckoutRepository } from './persistence/promotion-checkout.repository';
import { PromotionExpiryRepository } from './persistence/promotion-expiry.repository';
import { PaymentsResolver } from './payments.resolver';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AuthModule, EventsModule, TimeModule],
  controllers: [PaddleWebhookController],
  providers: [
    PaymentsResolver,
    PromotionCheckoutService,
    PaymentQueryService,
    PaymentWebhookService,
    PromotionExpiryService,
    PromotionCheckoutRepository,
    PaymentRepository,
    PromotionExpiryRepository,
    PaymentMapper,
    PaddlePaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      useExisting: PaddlePaymentProvider,
    },
  ],
})
export class PaymentsModule {}
```

## 15. Catalog promotion 完整修改

### 15.1 `api/src/catalog/models/restaurant.model.ts`

```ts
import { CategoryModel } from './category.model';
import { DishModel } from './dish.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Restaurant')
export class RestaurantModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  address!: string;

  @Field()
  coverImageUrl!: string;

  @Field(() => CategoryModel)
  category!: CategoryModel;

  @Field(() => [DishModel])
  menu!: DishModel[];

  @Field()
  isPromoted!: boolean;

  @Field(() => Date, { nullable: true })
  promotedUntil?: Date;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
```

### 15.2 `api/src/catalog/persistence/catalog.selects.ts`

```ts
import { Prisma } from '@/generated/prisma/client';

export const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  coverImageUrl: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      restaurants: true,
    },
  },
} as const satisfies Prisma.CategorySelect;

export const DISH_SELECT = {
  id: true,
  name: true,
  description: true,
  priceMinor: true,
  photoUrl: true,
  options: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DishSelect;

export const RESTAURANT_SELECT = {
  id: true,
  name: true,
  address: true,
  coverImageUrl: true,
  promotedUntil: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: CATEGORY_SELECT,
  },
} as const satisfies Prisma.RestaurantSelect;

export type CategoryRecord = Prisma.CategoryGetPayload<{
  select: typeof CATEGORY_SELECT;
}>;

export type DishRecord = Prisma.DishGetPayload<{
  select: typeof DISH_SELECT;
}>;

export type RestaurantRecord = Prisma.RestaurantGetPayload<{
  select: typeof RESTAURANT_SELECT;
}>;
```

### 15.3 `api/src/catalog/persistence/catalog.mapper.ts`

```ts
import { CatalogInputError } from '../domain/catalog-input.error';
import {
  MenuOptionDefinition,
  parseMenuOptionDefinitions,
} from '../domain/menu-option-definition';
import { CategoryModel } from '../models/category.model';
import { DishOptionModel } from '../models/dish-option.model';
import { DishModel } from '../models/dish.model';
import { RestaurantModel } from '../models/restaurant.model';
import {
  CategoryRecord,
  DishRecord,
  RestaurantRecord,
} from './catalog.selects';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

@Injectable()
export class CatalogMapper {
  private readonly logger = new Logger(CatalogMapper.name);

  toCategory(category: CategoryRecord): CategoryModel {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      coverImageUrl: category.coverImageUrl,
      restaurantCount: category._count.restaurants,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  toRestaurant(restaurant: RestaurantRecord, evaluatedAt: Date): RestaurantModel {
    return {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      coverImageUrl: restaurant.coverImageUrl,
      category: this.toCategory(restaurant.category),
      menu: [],
      isPromoted:
        restaurant.promotedUntil !== null &&
        restaurant.promotedUntil.getTime() > evaluatedAt.getTime(),
      promotedUntil: restaurant.promotedUntil ?? undefined,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  }

  toDish(dish: DishRecord): DishModel {
    let definitions: MenuOptionDefinition[];
    try {
      definitions = parseMenuOptionDefinitions(dish.options);
    } catch (error) {
      if (!(error instanceof CatalogInputError)) {
        throw error;
      }

      this.logger.error(`Invalid persisted menu options for dish ${dish.id}.`);
      throw new InternalServerErrorException('Catalog data is unavailable.');
    }

    return {
      id: dish.id,
      name: dish.name,
      description: dish.description,
      priceMinor: dish.priceMinor,
      photoUrl: dish.photoUrl,
      options: definitions.map(toDishOptionModel),
      createdAt: dish.createdAt,
      updatedAt: dish.updatedAt,
    };
  }
}

function toDishOptionModel(definition: MenuOptionDefinition): DishOptionModel {
  if (definition.choices !== undefined) {
    return {
      name: definition.name,
      extraMinor: null,
      choices: definition.choices.map((choice) => ({ ...choice })),
    };
  }

  return {
    name: definition.name,
    extraMinor: definition.extraMinor,
    choices: null,
  };
}
```

### 15.4 `api/src/catalog/persistence/catalog-query.repository.ts`

```ts
import { escapeLikePattern } from '../domain/catalog-text';
import { PAGE_SIZE } from '@/common/pagination/page.constants';
import { PageResult, pageOffset, toPageResult } from '@/common/pagination/page.types';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  CATEGORY_SELECT,
  CategoryRecord,
  DISH_SELECT,
  DishRecord,
  RESTAURANT_SELECT,
  RestaurantRecord,
} from './catalog.selects';

@Injectable()
export class CatalogQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCategories(): Promise<CategoryRecord[]> {
    return this.prisma.category.findMany({
      select: CATEGORY_SELECT,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  findCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
    return this.prisma.category.findUnique({
      where: { slug },
      select: CATEGORY_SELECT,
    });
  }

  async listRestaurants(
    page: number,
    evaluatedAt: Date,
    where: Prisma.RestaurantWhereInput = {},
  ): Promise<PageResult<RestaurantRecord>> {
    const offset = pageOffset(page);

    return this.prisma.$transaction(
      async (transaction) => {
        const activeWhere: Prisma.RestaurantWhereInput = {
          AND: [where, { promotedUntil: { gt: evaluatedAt } }],
        };
        const inactiveWhere: Prisma.RestaurantWhereInput = {
          AND: [
            where,
            {
              OR: [
                { promotedUntil: null },
                { promotedUntil: { lte: evaluatedAt } },
              ],
            },
          ],
        };

        const totalResults = await transaction.restaurant.count({ where });
        const activeCount = await transaction.restaurant.count({ where: activeWhere });
        const activeTake = Math.max(0, Math.min(PAGE_SIZE, activeCount - offset));
        const active =
          activeTake === 0
            ? []
            : await transaction.restaurant.findMany({
                where: activeWhere,
                select: RESTAURANT_SELECT,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                skip: offset,
                take: activeTake,
              });

        const inactiveTake = PAGE_SIZE - active.length;
        const inactiveSkip = Math.max(0, offset - activeCount);
        const inactive =
          inactiveTake === 0
            ? []
            : await transaction.restaurant.findMany({
                where: inactiveWhere,
                select: RESTAURANT_SELECT,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                skip: inactiveSkip,
                take: inactiveTake,
              });

        return toPageResult([...active, ...inactive], totalResults);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        maxWait: 2_000,
        timeout: 5_000,
      },
    );
  }

  listRestaurantsByCategory(
    categoryId: string,
    page: number,
    evaluatedAt: Date,
  ): Promise<PageResult<RestaurantRecord>> {
    return this.listRestaurants(page, evaluatedAt, { categoryId });
  }

  searchRestaurants(
    normalizedQuery: string,
    page: number,
    evaluatedAt: Date,
  ): Promise<PageResult<RestaurantRecord>> {
    return this.listRestaurants(page, evaluatedAt, {
      name: {
        contains: escapeLikePattern(normalizedQuery),
        mode: 'insensitive',
      },
    });
  }

  listOwnerRestaurants(
    ownerId: string,
    page: number,
    evaluatedAt: Date,
  ): Promise<PageResult<RestaurantRecord>> {
    return this.listRestaurants(page, evaluatedAt, { ownerId });
  }

  findOwnerRestaurant(ownerId: string, restaurantId: string): Promise<RestaurantRecord | null> {
    return this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        ownerId,
      },
      select: RESTAURANT_SELECT,
    });
  }

  findRestaurantById(restaurantId: string): Promise<RestaurantRecord | null> {
    return this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: RESTAURANT_SELECT,
    });
  }

  async findMenuByRestaurantId(restaurantId: string): Promise<DishRecord[]> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        dishes: {
          select: DISH_SELECT,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    return restaurant?.dishes ?? [];
  }
}
```

这里有意使用“active/inactive 两段分页”，而不是持久化一个会被 scheduler 延迟污染的 `isPromoted` boolean。每次列表为一致快照执行 2 次 count 与最多 2 次 select；阶段 7 runtime 必须记录 query count/latency/plan，只有测量证明它是瓶颈后才改成 raw SQL、物化字段或缓存。

### 15.5 `api/src/catalog/application/catalog-query.service.ts`

```ts
import { assertOwner } from './assert-owner';
import { parseCatalogInput } from './parse-catalog-input';
import { normalizeCategorySlug } from '../domain/category-name';
import { normalizeSearchQuery } from '../domain/catalog-text';
import { CategoryModel } from '../models/category.model';
import { DishModel } from '../models/dish.model';
import { RestaurantModel } from '../models/restaurant.model';
import { CatalogMapper } from '../persistence/catalog.mapper';
import { CatalogQueryRepository } from '../persistence/catalog-query.repository';
import { RestaurantRecord } from '../persistence/catalog.selects';
import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CLOCK, Clock } from '@/common/time/clock';
import { PageResult } from '@/common/pagination/page.types';
import { Inject, Injectable } from '@nestjs/common';

export interface CategoryPage {
  category: CategoryModel;
  restaurants: RestaurantModel[];
  totalResults: number;
  totalPages: number;
}

@Injectable()
export class CatalogQueryService {
  constructor(
    private readonly queries: CatalogQueryRepository,
    private readonly mapper: CatalogMapper,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async allCategories(): Promise<CategoryModel[]> {
    const categories = await this.queries.findCategories();
    return categories.map((category) => this.mapper.toCategory(category));
  }

  async restaurants(page: number): Promise<PageResult<RestaurantModel>> {
    const evaluatedAt = this.clock.now();
    return this.mapRestaurantPage(
      await this.queries.listRestaurants(page, evaluatedAt),
      evaluatedAt,
    );
  }

  async restaurant(restaurantId: string): Promise<RestaurantModel | null> {
    const evaluatedAt = this.clock.now();
    const restaurant = await this.queries.findRestaurantById(restaurantId);
    return restaurant ? this.mapper.toRestaurant(restaurant, evaluatedAt) : null;
  }

  async category(rawSlug: string, page: number): Promise<CategoryPage | null> {
    const slug = parseCatalogInput(() => normalizeCategorySlug(rawSlug));
    const category = await this.queries.findCategoryBySlug(slug);

    if (!category) {
      return null;
    }

    const evaluatedAt = this.clock.now();
    const restaurants = await this.queries.listRestaurantsByCategory(
      category.id,
      page,
      evaluatedAt,
    );
    const pageResult = this.mapRestaurantPage(restaurants, evaluatedAt);

    return {
      category: this.mapper.toCategory(category),
      restaurants: pageResult.results,
      totalResults: pageResult.totalResults,
      totalPages: pageResult.totalPages,
    };
  }

  async searchRestaurant(
    rawQuery: string,
    page: number,
  ): Promise<PageResult<RestaurantModel>> {
    const query = parseCatalogInput(() => normalizeSearchQuery(rawQuery));
    const evaluatedAt = this.clock.now();
    return this.mapRestaurantPage(
      await this.queries.searchRestaurants(query, page, evaluatedAt),
      evaluatedAt,
    );
  }

  async myRestaurants(
    principal: AuthenticatedPrincipal,
    page: number,
  ): Promise<PageResult<RestaurantModel>> {
    assertOwner(principal);
    const evaluatedAt = this.clock.now();
    return this.mapRestaurantPage(
      await this.queries.listOwnerRestaurants(principal.userId, page, evaluatedAt),
      evaluatedAt,
    );
  }

  async myRestaurant(
    principal: AuthenticatedPrincipal,
    restaurantId: string,
  ): Promise<RestaurantModel | null> {
    assertOwner(principal);
    const evaluatedAt = this.clock.now();
    const restaurant = await this.queries.findOwnerRestaurant(
      principal.userId,
      restaurantId,
    );
    return restaurant ? this.mapper.toRestaurant(restaurant, evaluatedAt) : null;
  }

  async menu(restaurantId: string): Promise<DishModel[]> {
    const dishes = await this.queries.findMenuByRestaurantId(restaurantId);
    return dishes.map((dish) => this.mapper.toDish(dish));
  }

  private mapRestaurantPage(
    page: PageResult<RestaurantRecord>,
    evaluatedAt: Date,
  ): PageResult<RestaurantModel> {
    return {
      ...page,
      results: page.results.map((restaurant) =>
        this.mapper.toRestaurant(restaurant, evaluatedAt),
      ),
    };
  }
}
```

### 15.6 `api/src/catalog/application/restaurant-management.service.ts`

```ts
import { assertOwner } from './assert-owner';
import { parseCatalogInput } from './parse-catalog-input';
import {
  NormalizedCategoryName,
  normalizeCategoryName,
} from '../domain/category-name';
import { normalizeCatalogText, normalizeHttpUrl } from '../domain/catalog-text';
import { CatalogMutationError, CatalogResult } from '../domain/catalog-result';
import type { RestaurantModel } from '../models/restaurant.model';
import { CatalogMapper } from '../persistence/catalog.mapper';
import { hasPrismaCode } from '../persistence/prisma-error';
import { RestaurantRepository } from '../persistence/restaurant.repository';
import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CLOCK, Clock } from '@/common/time/clock';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

export interface CreateRestaurantCommand {
  name: string;
  address: string;
  coverImageUrl: string;
  categoryName: string;
}

export interface EditRestaurantCommand {
  restaurantId: string;
  name?: string | null;
  address?: string | null;
  coverImageUrl?: string | null;
  categoryName?: string | null;
}

interface RestaurantChanges {
  name?: string;
  address?: string;
  coverImageUrl?: string;
  category?: NormalizedCategoryName;
}

@Injectable()
export class RestaurantManagementService {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly mapper: CatalogMapper,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async create(
    principal: AuthenticatedPrincipal,
    command: CreateRestaurantCommand,
  ): Promise<CatalogResult<RestaurantModel>> {
    assertOwner(principal);
    const input = parseCatalogInput(() => ({
      ownerId: principal.userId,
      name: normalizeCatalogText(command.name, 'name', 1, 120),
      address: normalizeCatalogText(command.address, 'address', 3, 255),
      coverImageUrl: normalizeHttpUrl(command.coverImageUrl, 'coverImageUrl'),
      category: normalizeCategoryName(command.categoryName),
    }));

    try {
      const created = await this.restaurants.create(input);
      return {
        ok: true,
        value: this.mapper.toRestaurant(created, this.clock.now()),
      };
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        return {
          ok: false,
          error: CatalogMutationError.CategoryConflict,
        };
      }
      if (hasPrismaCode(error, 'P2003') || hasPrismaCode(error, 'P2025')) {
        return {
          ok: false,
          error: CatalogMutationError.ResourceUnavailable,
        };
      }
      throw error;
    }
  }

  async edit(
    principal: AuthenticatedPrincipal,
    command: EditRestaurantCommand,
  ): Promise<CatalogResult<undefined>> {
    assertOwner(principal);
    const changes = parseCatalogInput(() => normalizeChanges(command));

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('At least one restaurant field must be changed.');
    }

    try {
      const updated = await this.restaurants.update({
        restaurantId: command.restaurantId,
        ownerId: principal.userId,
        ...changes,
      });
      return updated
        ? { ok: true, value: undefined }
        : {
            ok: false,
            error: CatalogMutationError.ResourceUnavailable,
          };
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        return {
          ok: false,
          error: CatalogMutationError.CategoryConflict,
        };
      }
      if (hasPrismaCode(error, 'P2003') || hasPrismaCode(error, 'P2025')) {
        return {
          ok: false,
          error: CatalogMutationError.ResourceUnavailable,
        };
      }
      throw error;
    }
  }

  async delete(
    principal: AuthenticatedPrincipal,
    restaurantId: string,
  ): Promise<CatalogResult<undefined>> {
    assertOwner(principal);

    try {
      const deleted = await this.restaurants.delete(restaurantId, principal.userId);
      return deleted
        ? { ok: true, value: undefined }
        : {
            ok: false,
            error: CatalogMutationError.ResourceUnavailable,
          };
    } catch (error) {
      if (hasPrismaCode(error, 'P2003') || hasPrismaCode(error, 'P2025')) {
        return {
          ok: false,
          error: CatalogMutationError.ResourceUnavailable,
        };
      }
      throw error;
    }
  }
}

function normalizeChanges(command: EditRestaurantCommand): RestaurantChanges {
  const changes: RestaurantChanges = {};

  if (command.name !== undefined && command.name !== null) {
    changes.name = normalizeCatalogText(command.name, 'name', 1, 120);
  }
  if (command.address !== undefined && command.address !== null) {
    changes.address = normalizeCatalogText(command.address, 'address', 3, 255);
  }
  if (command.coverImageUrl !== undefined && command.coverImageUrl !== null) {
    changes.coverImageUrl = normalizeHttpUrl(command.coverImageUrl, 'coverImageUrl');
  }
  if (command.categoryName !== undefined && command.categoryName !== null) {
    changes.category = normalizeCategoryName(command.categoryName);
  }

  return changes;
}
```

### 15.7 `api/src/catalog/catalog.module.ts`

```ts
import { CatalogQueryService } from './application/catalog-query.service';
import { DishManagementService } from './application/dish-management.service';
import { RestaurantManagementService } from './application/restaurant-management.service';
import { CatalogQueryResolver } from './catalog-query.resolver';
import { DishManagementResolver } from './dish-management.resolver';
import { CatalogMapper } from './persistence/catalog.mapper';
import { CatalogQueryRepository } from './persistence/catalog-query.repository';
import { DishRepository } from './persistence/dish.repository';
import { RestaurantRepository } from './persistence/restaurant.repository';
import { RestaurantManagementResolver } from './restaurant-management.resolver';
import { AuthModule } from '@/auth/auth.module';
import { TimeModule } from '@/common/time/time.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AuthModule, TimeModule],
  providers: [
    CatalogQueryResolver,
    RestaurantManagementResolver,
    DishManagementResolver,
    CatalogQueryService,
    RestaurantManagementService,
    DishManagementService,
    CatalogQueryRepository,
    RestaurantRepository,
    DishRepository,
    CatalogMapper,
  ],
})
export class CatalogModule {}
```

## 16. Bootstrap 完整修改

### 16.1 `api/src/app.module.ts`

```ts
import { AuthModule } from '@/auth/auth.module';
import { GraphqlContextFactory } from '@/auth/graphql-context.factory';
import { CatalogModule } from '@/catalog/catalog.module';
import { EnvironmentVariables } from '@/config/environment.variables';
import { validateEnvironment } from '@/config/validate-environment';
import { HealthModule } from '@/health/health.module';
import { OrdersModule } from '@/orders/orders.module';
import { PaymentsModule } from '@/payments/payments.module';
import { UsersModule } from '@/users/users.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    ScheduleModule.forRoot(),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule, AuthModule],
      inject: [ConfigService, GraphqlContextFactory],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
        contexts: GraphqlContextFactory,
      ): ApolloDriverConfig => ({
        driver: ApolloDriver,
        graphiql: config.get('NODE_ENV', { infer: true }) !== 'production',
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        stopOnApplicationShutdown: true,
        subscriptions: {
          'graphql-ws': {
            path: '/graphql',
            connectionInitWaitTimeout: 5_000,
            onConnect: (context: unknown) => contexts.onConnect(context),
            onSubscribe: (context: unknown) => contexts.onSubscribe(context),
            onClose: (context: unknown) => contexts.onClose(context),
          },
        },
        context: (context: unknown) => contexts.create(context),
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    OrdersModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 16.2 `api/src/main.ts`

```ts
import { EnvironmentVariables } from '@/config/environment.variables';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const config = app.get(ConfigService<EnvironmentVariables, true>);

  app.useBodyParser('json', { limit: '1mb' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  });
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
```

### 16.3 `api/test/setup-env.ts`

这只是保持既有 test bootstrap 可构造 `AppModule` 的环境夹具更新，不代表本阶段新增 Jest coverage。

```ts
process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '3001';
process.env.DATABASE_URL ??=
  'postgresql://mealrelay_test:mealrelay_test@localhost:5432/mealrelay_test';
process.env.CORS_ORIGINS ??= 'http://localhost:5173';
process.env.JWT_SECRET ??= 'test-only-jwt-secret-with-at-least-32-bytes';
process.env.JWT_ACCESS_TTL_SECONDS ??= '900';
process.env.JWT_ISSUER ??= 'mealrelay-api-test';
process.env.JWT_AUDIENCE ??= 'mealrelay-web-test';
process.env.EMAIL_VERIFICATION_TTL_SECONDS ??= '3600';
process.env.FRONTEND_VERIFY_EMAIL_URL ??= 'http://localhost:5173/confirm-email';
process.env.RESEND_API_KEY ??= 'test-only-resend-key';
process.env.RESEND_FROM ??= 'MealRelay Test <noreply@example.test>';
process.env.RESEND_TIMEOUT_MS ??= '500';
process.env.PADDLE_ENVIRONMENT ??= 'sandbox';
process.env.PADDLE_API_KEY ??= 'test-only-paddle-api-key';
process.env.PADDLE_WEBHOOK_SECRET ??= 'test-only-paddle-webhook-secret';
process.env.PADDLE_PROMOTION_PRICE_ID ??= 'pri_01gsz8z1q1n00f12qt82y31smh';
process.env.PADDLE_PROMOTION_UNIT_PRICE_MINOR ??= '1000';
process.env.PADDLE_PROMOTION_CURRENCY ??= 'USD';
process.env.PADDLE_API_TIMEOUT_MS ??= '500';
process.env.PROMOTION_EXPIRY_BATCH_SIZE ??= '100';
process.env.PROMOTION_EXPIRY_MAX_BATCHES ??= '10';
```

`validate-environment.spec.ts` 当前在本切片之前就已落后于实际必填变量。按照仓库的 Jest 延后规则，不在本文伪造测试通过；Jest phase 开始时重建完整 valid-config fixture 和每个 Paddle 变量的拒绝用例。

## 17. 文件级实施顺序

### Commit 1：迁移完整性收口

1. 确认 `DATABASE_URL` 指向的数据库与 migration history。
2. 应用已提交的空 migration，不改写历史。
3. create-only 生成 `catalog_orders_integrity`。
4. 写入本文完整 SQL，先在 disposable/local PostgreSQL 验证脏数据，再应用到明确目标。
5. 查询 `pg_constraint`，确认 11 个约束 validated。

### Commit 2：机械格式基线

只运行 Prettier write；review 后确保语义文件没有手工夹带。随后 non-fixing ESLint、typecheck、build 全绿。

### Commit 3：GraphQL runtime 兼容

只修改 `package.json`/`pnpm-lock.yaml`：GraphQL 16.14.2、显式 graphql-ws/ws。用真实 HTTP 与 WS smoke 证明没有回归。

### Commit 4：Payment schema 与 Clock

1. 加 Clock port/module。
2. 修改 Prisma schema。
3. create-only 生成 `promotion_payments`，review migration/constraints/indexes。
4. `prisma validate`、`prisma generate`、`tsc`。

### Commit 5：服务端 checkout

1. 配置校验与 `.env.example`。
2. provider port/Paddle adapter。
3. checkout repository/service/resolver。
4. 用 Paddle sandbox 创建 transaction，确认 custom data 只含 checkout UUID。

### Commit 6：Webhook 与原子推广

1. raw-body bootstrap。
2. controller、verification adapter、webhook service。
3. Payment repository 的 Serializable transaction 与提交后事件。
4. 用同一签名事件顺序重放、并发重放。

### Commit 7：Catalog/query/expiry

1. Restaurant fields/mapper/select。
2. active/inactive promoted-first 分页。
3. Owner payment history。
4. `SKIP LOCKED` expiry repository、cron service、提交后事件。

### Commit 8：运行时与学习证据

生成/review SDL，记录 Paddle sandbox、数据库、分页和 scheduler 的实际结果；创建 learning 06。不要在实现前创建空 learning note。

## 18. 迁移与生成命令

所有命令从 `api/` 运行：

```powershell
git status --short --branch
git -C .. status --short --branch

pnpm exec prisma migrate status
pnpm exec prisma migrate dev --create-only --name catalog_orders_integrity
# review/edit generated SQL, then apply only to the confirmed development database
pnpm exec prisma migrate dev

pnpm exec prisma migrate dev --create-only --name promotion_payments
# review/edit generated SQL, then apply only to the confirmed development database
pnpm exec prisma migrate dev

pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma migrate status
pnpm exec prettier --check "src/**/*.ts" "test/**/*.ts"
pnpm exec eslint "{src,test}/**/*.ts"
pnpm exec tsc --noEmit --incremental false
pnpm run build
```

禁止对共享/未确认数据库运行 `prisma migrate reset`。生成 SDL 后审查：

```powershell
rg -n "createPromotionCheckout|myPayments|PaymentProvider|isPromoted|promotedUntil" src/schema.gql
rg -n "createPayment|transactionId:.*Input|password|x-jwt" src/schema.gql
```

第二条允许 `transactionId` 作为 checkout payload 输出，但不能出现在任何激活推广的 input 中。

## 19. 手工/runtime 验证矩阵

Jest 延后不等于不验证。阶段 7A 必须保留以下可复现证据：

| 场景 | 操作 | 必须观察到 |
| --- | --- | --- |
| Owner checkout | Owner A 为自己的 Restaurant 调 mutation | 返回 Paddle `txn_...`；DB checkout `READY` |
| ownership denial | Owner A 请求 Owner B Restaurant | safe unavailable；不创建 checkout/provider transaction |
| role denial | CUSTOMER/COURIER 调 mutation/query | GraphQL forbidden；应用服务也拒绝 |
| provider failure | 错误 API key/timeout | checkout `FAILED`；无 Payment/推广 |
| valid webhook | Paddle simulator/真实 sandbox `transaction.completed` | 204；event/payment/checkout/Restaurant 同时 commit |
| invalid signature | 修改 raw body 或签名 | 400；数据库零写入 |
| raw-body mutation | 验签前 parse + reserialize | 必须失败，证明使用 exact raw bytes |
| irrelevant event | 已验签的 product/customer event | 204；数据库零写入 |
| wrong price | 正确签名但其他 price | 204 + safe rejection log；无推广 |
| wrong amount/currency | 配置与 event 不一致 | 204 + safe rejection；无推广 |
| same event replay | 同 event 顺序发送两次 | 只有一个 webhook row、Payment、七天延长 |
| concurrent replay | 两个独立请求同步提交同 event | 只有一个 winner；另一个 replay；不返回 500（除暂时冲突耗尽） |
| different event/same txn | 构造两个 event ID 指向同 txn | provider transaction unique 阻止双重权益 |
| two real purchases | 同一 Restaurant 两个 checkout 并发完成 | 最终累计十四天，不丢更新 |
| scheduler delay | `promotedUntil` 已过期但未清理 | `isPromoted=false` 且排在 active 之后 |
| overlapping schedulers | 两个 app/连接同时运行 expiry | 每个 Restaurant 只被一个 SQL result 返回 |
| event bus failure | recording publisher 抛错 | DB 事实保持成功；日志无 raw payload/secret |

### 建议观测 SQL

```sql
SELECT
  "provider_event_id",
  "provider_transaction_id",
  "occurred_at",
  "received_at"
FROM "payment_webhook_events"
ORDER BY "received_at" DESC;

SELECT
  "restaurant_id",
  "provider_transaction_id",
  "unit_amount_minor",
  "amount_minor",
  "currency",
  "promotion_starts_at",
  "promotion_ends_at"
FROM "payments"
ORDER BY "created_at" DESC;

SELECT "id", "promoted_until"
FROM "restaurants"
ORDER BY ("promoted_until" > CURRENT_TIMESTAMP) DESC, "created_at" DESC;
```

不要把这些查询的真实 ID/金额/时间截图提交到公开仓库；learning note 使用脱敏或本地 fixture 数据。

## 20. Deferred Jest 覆盖

Functional refactor 完成并明确进入 Jest phase 后，实现：

| 层级 | 覆盖 |
| --- | --- |
| Domain unit | `max(now,current)+7d`、恰好边界、UTC、金额解析、provider enum mapping |
| Provider unit | fake Paddle unmarshal/create；无关 event、contract drift、timeout、各 mismatch reason |
| Application unit | role/ownership、provider failure、commit 后发布、publish failure 不回滚 |
| PostgreSQL integration | 三 unique、CHECK、Serializable 双购买、P2034 retry、FK/delete restriction |
| HTTP e2e | exact raw body、正确/错误/缺失签名、204/400/500 策略 |
| GraphQL e2e | checkout/query role、ownership、payload nullability、分页 |
| Concurrency e2e | 同 event 并发重放一次、不同 event 同 txn 一次、两笔付款累计十四天 |
| Scheduler integration | `SKIP LOCKED` 双 worker、batch/max batch、repeat run、只发布实际转换 |
| Contract | generated SDL 不出现 legacy `createPayment` 或 client transaction activation input |

使用 fixed Clock、fake provider、recording event publisher；自动测试不访问真实 Paddle 网络。

## 21. 安全与失败模式复核

- JWT 只保护“谁可以创建 checkout/看历史”；Paddle signature 证明 webhook 来源，两者不能互相替代。
- Webhook secret、API key、signature、raw body、客户信息和卡信息不进入日志/事件/Payment 表。
- Controller 在任何业务解析前使用 exact raw body；`rawBody: true` 依赖 Nest 内建 body parser，不能同时设置 `bodyParser: false`。
- body parser 上限 1 MiB；反向代理也必须设置请求体/速率限制，阶段 8 完成外层防护。
- provider adapter 必须先验签再解析业务字段；不能从 `request.body` 重建字符串。
- checkout reference 是服务端 UUIDv7，provider transaction 由后端创建并写入 custom data，浏览器不能选择 Restaurant/price metadata。
- event、transaction、checkout 三层 unique 共同抵抗重试和异常重复事件。
- 外部 Paddle I/O 不在数据库 transaction 内；网络慢不会长期占用 PostgreSQL connection/lock。
- checkout provider 成功但 DB attach 失败会产生 provider orphan，不会产生伪成功推广；阶段 8 通过指标/清理补偿。
- payment transaction commit 后、进程内 event publish 前仍有 crash window。当前 event 只做缓存/在线通知，数据库查询可恢复；若事件不可丢，另写 outbox ADR。
- 退款/chargeback 不在当前产品规则内。不能静默撤销已购买的推广，也不能假设永不退款；后续需求必须定义权益回收和负余额行为。
- promotion read 直接比较时间，cron 延迟不延长权益。
- cron 使用 `waitForCompletion` 阻止同实例重叠，用 `SKIP LOCKED` 防止多实例领取同一行；一次最多 `batchSize * maxBatches`，避免无限占用。

## 22. 阶段 9 前端适配清单

- 删除 legacy `createPayment(transactionId, restaurantId)` mutation。
- Owner 点击购买时先调 `createPromotionCheckout({ restaurantId: UUID })`。
- 使用当前 Paddle.js `Paddle.Initialize()`，不再使用遗留 `Paddle.Setup({ vendor })` Classic 风格。
- 用返回的 `transactionId` 调 `Paddle.Checkout.open({ transactionId })`；客户端 success callback 只更新 UI/轮询/refetch，不能激活推广。
- checkout completed 后 refetch `myRestaurant`/`myPayments`；服务端 webhook 是最终事实，浏览器 callback 不是。
- Restaurant fragment 加 `isPromoted`/`promotedUntil`；金额字段使用 minor unit。
- ID 全部为 UUID string，role/enum 使用 canonical uppercase。
- 运行 codegen，审查 `createPayment` 删除、目标 payload nullability 与 Paddle transaction string。
- 前端处理“checkout 已完成但 webhook 尚未到达”的短暂 pending UI，不显示未经服务端确认的成功状态。

## 23. 建议提交/PR 顺序

1. `fix: add catalog and order integrity constraints`
2. `style: apply api prettier baseline`
3. `fix: align graphql runtime peer versions`
4. `docs: close catalog orders and realtime evidence`
5. `feat: add promotion payment persistence`
6. `feat: create server-side paddle promotion checkout`
7. `feat: process verified paddle webhooks idempotently`
8. `feat: sort active promotions and expose payment history`
9. `feat: expire promotions safely across instances`
10. `docs: record payment and promotion runtime evidence`

dependency、migration、机械格式和语义代码不混成一个不可审查的大提交。每次提交前后检查两层 Git status；不修改 `backend/`/`frontend/`。

## 24. 完成定义

- [ ] C0 完成：11 个 validated CHECK、GraphQL 16 peer、格式/lint/type/build 与 learning 03/04/05。
- [ ] schema/migration 有 checkout、webhook event、Payment、`promotedUntil` 与全部 unique/CHECK/FK/index。
- [ ] 只有 OWNER 能为自己的 Restaurant 创建 checkout，应用层 ownership 不能只靠 guard。
- [ ] Paddle transaction 在服务端创建，custom data 只引用服务端 checkout；没有 client-supplied activation transaction ID。
- [ ] raw body 与 `Paddle-Signature` 使用官方 SDK验签；伪造/修改 body 零写入。
- [ ] 只处理匹配 checkout/transaction/price/quantity/unit amount/subtotal/discount/currency 的 completed event。
- [ ] provider event、transaction 和 checkout 顺序/并发重放只授予一次权益。
- [ ] 每笔真实付款从 `max(now,currentPromotedUntil)` 追加七天；两笔并发累计十四天。
- [ ] 外部 I/O 不在 Prisma transaction；事件只在 commit 后发布。
- [ ] `isPromoted` 以 `promotedUntil > evaluatedAt` 计算，scheduler 延迟不产生错误展示。
- [ ] 公共/category/search 列表有效推广优先，15 项分页跨 active/inactive 边界无重复/遗漏。
- [ ] cron 同实例不重叠，多实例用 `SKIP LOCKED` 不重复转换；批次有界。
- [ ] Payment GraphQL 不暴露 owner email、raw payload、provider payment method 或内部 checkout/event ID。
- [ ] generated SDL 已 review，不存在 legacy `createPayment` 或 password/x-jwt 暴露。
- [ ] Prisma validate/generate/migrate status、Prettier、non-fixing ESLint、typecheck、build 全绿。
- [ ] runtime matrix 有真实脱敏证据；Jest matrix 已加入延后 backlog，未伪造自动测试通过。
- [ ] 未修改 `backend/`、`frontend/`、前端 generated types 或真实 `.env`。
- [ ] 实施完成后创建 `docs/learning/06-payments-promotions.md`。

## 25. Learning note 要求

`docs/learning/06-payments-promotions.md` 只能基于实际实现/运行结果创建，至少包含：

1. Owner checkout、Paddle transaction、webhook、Payment、Restaurant、query/cron 的完整数据流。
2. JWT 与 webhook signature 各自证明什么，为什么两者都需要。
3. exact raw body、官方 SDK 默认 timestamp tolerance 和实测 400/204/500。
4. event/transaction/checkout unique 如何处理顺序与并发重放。
5. Serializable isolation、P2034 retry 与两笔购买累计十四天的真实观察。
6. provider I/O 与 DB transaction 的边界、orphan 补偿与 commit/publish crash window。
7. promoted-first 两段分页的 query count/plan/latency 基线。
8. `SKIP LOCKED` 多实例行为、batch 上限与重复运行结果。
9. 当前未处理 refund/chargeback、未引入 outbox/queue/cache 的理由与触发条件。
10. deferred Jest 和阶段 9 前端适配。
11. 三到五个基于本代码的面试问题及答案。

## 26. 面试复盘问题

### 为什么 Paddle checkout success callback 不能激活推广？

- callback 在不可信浏览器里，调用者可以伪造或重复调用。
- callback 不证明签名、金额、币种、price 或最终 provider 状态。
- 可信事实来自验签后的 provider webhook，并由数据库幂等消费。

### 为什么 event ID unique 之外还要 transaction ID unique？

- at-least-once 重试通常复用 event ID，所以 event unique 解决标准重放。
- provider bug、不同 notification/event 或集成错误仍可能让同一 transaction 以不同 event ID 到达。
- transaction unique 是业务事实的第二道防线；checkout unique 再保证一次购买意图只授予一次。

### 为什么两笔推广购买使用 Serializable？

- 两个 transaction 都会读取同一个 `promotedUntil` 并计算新的结束时间。
- 较弱隔离下可能发生 lost update，只留下七天而不是十四天。
- Serializable 让其中一个发生 serialization conflict，有限重试后读取 winner 的新值再追加七天。

### scheduler 已经清空过期字段，为什么读取仍比较当前时间？

- cron 可能延迟、暂停、崩溃或在另一实例执行。
- 用户可见业务真相不能依赖后台任务“准点成功”。
- 时间比较保证正确性；清理任务改善存储/索引并产生失效事件。

### 为什么不把 Paddle API 调用放进数据库 transaction？

- 外部网络延迟/重试不可控，会长时间持有连接和锁。
- provider 成功也不能随数据库 rollback 一起撤销，所谓“原子”是假的。
- 先持久化 intent，事务外调用 provider，再短写回；失败通过明确状态和补偿处理。

## 27. 官方依据（2026-08-09 复核）

- [NestJS raw body](https://docs.nestjs.com/faq/raw-body)：`NestFactory.create(..., { rawBody: true })` 与 `RawBodyRequest`，适用于 webhook HMAC 验签。
- [NestJS task scheduling](https://docs.nestjs.com/techniques/task-scheduling)：`ScheduleModule.forRoot()`、`@Cron`、UTC timezone 与 `waitForCompletion`。
- [Paddle verify webhook signatures](https://developer.paddle.com/webhooks/about/signature-verification/)：使用 `Paddle-Signature`、exact raw body 与官方 Node SDK `webhooks.unmarshal()`；SDK 默认校验时间窗口。
- [Paddle webhook delivery](https://developer.paddle.com/webhooks/about/how-webhooks-work/)：at-least-once delivery、使用 `event_id` 去重、事件可能乱序。
- [Paddle `transaction.completed`](https://developer.paddle.com/webhooks/transactions/transaction-completed/)：completed transaction、items、custom data、totals/currency 与 event/notification IDs。
- [Paddle server transaction checkout](https://developer.paddle.com/build/transactions/pass-transaction-checkout/)：服务端创建 transaction 后把 `transactionId` 交给 Paddle.js checkout。
- [Paddle Node SDK](https://developer.paddle.com/sdks/libraries/node/)：官方 TypeScript SDK、transaction API 与 webhook helper。
- [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)：interactive transaction、Serializable 与 retry 边界。
- [Prisma customize migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations)：create-only、review SQL、再 apply。
- [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)：row locks 与并发语义。
- [PostgreSQL `SELECT`](https://www.postgresql.org/docs/current/sql-select.html)：`FOR UPDATE SKIP LOCKED` 适用于 queue-like 多 worker 领取。

## 28. 本文档自检边界

- 文档包含两个 forward migration、Prisma target schema 与所有新增/语义修改手写 TypeScript 文件的完整内容。
- generated SDL、Prisma Client 与 lockfile 按仓库规则只给生成/审查要求，不给手写副本。
- 本文没有修改 `api/src`、migration、package manifest、`backend/` 或 `frontend/`，也没有运行 Jest。
- Paddle SDK 版本/类型、Nest peer 与 Prisma migration 必须在真正实施日重新检查；本文的静态蓝图不能替代目标 lockfile 下的 typecheck/build 和真实 sandbox/runtime 证据。
- 阶段 7B 安全上传必须单独生成实施文档，不能把遗留 Supabase controller 复制进本切片。
