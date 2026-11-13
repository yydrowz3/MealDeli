# 阶段 1：契约基线

## 目标

在实现新业务代码前，明确目标 API 必须提供的产品行为、哪些历史行为只作为参考、哪些非标准或不安全行为必须按当前 Web 标准修复，并把目标后端契约变成可自动验证的产物。旧前端适配在后端完成后统一处理。

## 当前契约来源

### 传输

- GraphQL HTTP：`http://localhost:3000/graphql`
- GraphQL WebSocket：`ws://localhost:3000/graphql`，协议为 `graphql-ws`
- 旧 HTTP JWT header：`x-jwt`；目标为 `Authorization: Bearer <JWT>`，不保留兼容路径
- 旧 WebSocket token：connection params 中的 `x-jwt`；目标为 `Authorization` connection parameter 中的 bearer 值
- 上传：`POST /uploads`，multipart 字段名为 `file`

### 旧前端当前使用的 GraphQL 行为（历史证据）

| 领域 | 操作 |
| --- | --- |
| 身份 | `createAccount`、`login`、`me`、`editProfile`、`verifyEmail` |
| 餐厅 | `restaurants`、`restaurant`、`category`、`searchRestaurant`、`myRestaurants`、`myRestaurant`、`createRestaurant`、`createDish` |
| 订单 | `createOrder`、`editOrder`、`takeOrder`、订单详情相关查询 |
| 实时 | `pendingOrders`、`cookedOrders`、`orderUpdates` |
| 支付 | `createPayment` |

旧 schema 还定义了删除/编辑餐厅菜品、订单列表、用户资料和支付列表等操作。是否迁移取决于产品需求，但不能因旧 schema 存在就默认公开所有字段。

## 后端阶段需要固定的产品与领域面

1. 注册、登录、浏览、下单、状态推进等产品能力及其业务语义；具体 operation/input 名称由目标 API 评审决定。
2. 目标 GraphQL 字段、nullability、错误语义和 payload 形状，由生成 schema 与后端契约测试固定。
3. `UserRole` 的目标值为当前 `api/` 使用的 `CUSTOMER`、`OWNER`、`COURIER`；旧前端的 `Client`、`Owner`、`Delivery` 在阶段 9 迁移，不要求 API 提供兼容别名。
4. `OrderStatus` 的状态值和前端使用方式。
5. 餐厅、分类和搜索的 15 条分页行为。
6. 上传成功至少返回 `ok` 和 `url`。

旧前端 operation 名称、查询字段和 cache 假设必须进入阶段 9 的适配清单，但除产品/领域不变量外，不自动成为当前 API 的兼容要求。

## 明确不兼容的安全修复

- 新 API 不暴露 password hash，即使旧生成 schema 中存在 `User.password`。
- 搜索不复刻旧 raw SQL 字符串插值。
- 支付不再信任客户端提交的 transaction ID 直接激活推广。
- 上传不信任 `originalname`、客户端 MIME 或任意对象路径。
- role guard 不能替代应用服务中的所有权和状态检查。
- HTTP/WS 认证使用标准 bearer transport，不实现 `x-jwt` fallback 或双读。
- HTTP method/status/header、CORS、media type、multipart、GraphQL/WebSocket 和 Webhook 等边界采用当前官方标准或维护中的协议；非标准旧约定不作为兼容要求。

这些变化需要后端测试和文档说明；如果影响现有前端，应记录到阶段 9 的适配清单，而不是在当前切片修改前端。

## 工作拆分

### 1. 操作清单

- 只读收集 `frontend/src/**/*.{ts,tsx}` 中的 `gql` 文档，作为历史使用证据。
- 记录 operation name、变量、输入类型、查询字段、fragment 和使用页面。
- 标记重复定义，例如 `me` 与 `myRestaurant`，供阶段 9 重构共享文档和生成类型时处理。
- 标记前端拼写兼容问题，例如代码中的 `COOCKED_ORDERS_SUBSCRIPTION` 常量名；常量内部拼写不应决定服务端契约。

### 2. Schema 快照

- 将旧 `backend/src/schema.gql` 作为只读输入，不手工修改。
- Foundation 完成后保存新 API 自动生成且排序稳定的 schema artifact。
- 使用 schema diff 将变化分为：兼容新增、危险 breaking change、有意安全修复。
- 为有意 breaking change 写 ADR 或在对应阶段 learning note 中明确说明。

### 3. 契约测试

- 为目标 API 建立独立、可读的 GraphQL/HTTP 契约测试，不以旧前端 document 能否直接执行作为后端验收条件。
- 在 Nest e2e 应用中执行代表性目标操作，验证 schema 校验、payload 形状和认证边界。
- 对暂未实现的领域先维护清单，不创建永远失败的大型测试套件；在领域切片开始时启用对应测试。
- 对 schema 生成文件做确定性检查，避免人工修改 generated SDL。

### 4. 错误语义

为每个操作记录：

- 输入验证错误是 GraphQL transport error 还是 `{ ok: false, error }`。
- 未认证与未授权如何表示。
- not-found 是否避免泄露资源存在性。
- 客户可见 error 是否稳定；内部 cause 如何进入清洗后的结构化日志。

## 建议产物

- 可机读的目标 API operation/endpoint 集合。
- 只读的旧前端 operation 清单和阶段 9 适配差异。
- 新旧 schema diff 命令或测试。
- 按领域维护的契约矩阵。
- 第一批身份和 Foundation 契约 e2e。
- 对 password 字段移除等安全修复的明确说明。

## 验收标准

- [ ] 每个当前前端 GraphQL 操作都能追溯到文件和页面，并标记目标 API 中保留、替换或删除的决定。
- [ ] HTTP、WebSocket 和 uploads 的 transport 假设有测试计划。
- [ ] `UserRole`、`OrderStatus`、分页和 payload 形状被记录。
- [ ] password 暴露、raw search、未验签支付等行为被明确排除。
- [ ] 新 schema 可确定性生成并与基线比较。
- [ ] 后端契约失败能指出具体目标 operation，而不是只报告整份 schema 不匹配。
- [ ] 所有已知前端影响都进入阶段 9 输入清单，当前阶段未修改前端源码或生成类型。

## 主要风险

- 生成的前端类型可能比真实页面操作更旧，不能单独作为权威来源。
- 旧 schema 是 persistence-driven 的，包含客户端不需要或不应访问的关系字段。
- 仅做 SDL diff 无法证明 Resolver 的权限和运行时 payload，需要 e2e 补充。

## 参考

- [NestJS GraphQL quick start](https://docs.nestjs.com/graphql/quick-start)
- [NestJS resolvers](https://docs.nestjs.com/graphql/resolvers)
- [GraphQL validation](https://spec.graphql.org/)
