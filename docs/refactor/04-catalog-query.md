# 阶段 4：餐厅与查询

## 目标

迁移分类、餐厅、菜品、菜单选项、搜索和分页，使 Client 能浏览、Owner 只能管理自己的资源，并用真实查询证据处理索引、N+1 和缓存问题。

## 外部契约

优先覆盖旧前端已证明有产品用途的以下能力，但具体目标 operation、字段和 nullability 由本阶段重新评审：

- `restaurants`
- `restaurant`
- `category`
- `searchRestaurant`
- `myRestaurants`
- `myRestaurant`
- `createRestaurant`
- `createDish`

随后按产品需要迁移 `editRestaurant`、`deleteRestaurant`、`editDish`、`deleteDish`。列表分页保持每页 15 条，promoted restaurant 优先排序的最终行为在支付阶段接入。

## 数据模型

### Category

- `id`
- 唯一、规范化 `slug`
- 展示名
- 可选 cover/icon URL

Category 通常按名称/slug 复用。创建餐厅时可通过原子 upsert 获取分类，依赖 unique constraint 解决竞争创建。

### Restaurant

- `id`
- `ownerId` 外键
- name、cover image URL、address
- `categoryId` 外键
- promotion 相关字段由阶段 7 完成
- timestamps

明确同一 Owner 是否允许同名餐厅；若产品要求禁止，应使用组合唯一约束，而不是只做 service 检查。

### Dish

- `id`
- `restaurantId` 外键
- name、description
- 价格的可靠存储形式
- 菜单 option definitions
- timestamps

价格推荐内部使用整数最小货币单位或经过明确舍入规则的 Decimal，禁止使用 JavaScript 浮点直接累加。外部 GraphQL 字段可以通过 mapper 保持客户端所需数值表现。

### 菜单选项

首版需要在两种方案中明确选择并记录：

1. Prisma `Json` 保存 aggregate-owned option definition，并在应用边界用严格 domain parser 校验。
2. 规范化 `DishOption`/`DishOptionChoice` 表，获得更多数据库约束和独立查询能力。

如果选项总是随 Dish 整体读写且不独立查询，经过验证的 JSON 是更简单的核心方案；订单阶段必须把实际选择和价格保存为不可变快照。无论选哪种，都不能把未经校验的任意 JSON 直接用于计价。

## 应用边界与授权

- Client：浏览、查询和搜索。
- Owner：只创建/修改/删除自己餐厅及其菜品。
- Delivery：没有目录管理权限；公开浏览是否允许由产品契约决定。
- Resolver 上的 role guard 只做粗粒度拒绝。
- Service 在每个写操作中使用 `ownerId` 条件验证资源所有权。
- 对 update/delete 优先采用带 `ownerId` 条件的原子查询，避免先查后写期间资源发生变化。

## 查询设计

### 分页

- 保持 15 条默认/固定页大小兼容当前客户端。
- 校验 page 最小值和最大范围。
- 明确 `totalPages`、空页、页码越界和 nullability。
- 初版可保持 offset pagination；在数据量/一致性需要出现时再通过 ADR 评估 cursor pagination。

### 排序

定义稳定的 tie-breaker，例如：

1. 有效 promotion 优先。
2. 业务排序字段。
3. `id` 或 `createdAt` 保证稳定。

没有稳定 tie-breaker 会造成翻页重复/遗漏。

### 搜索

- 禁止复刻旧 raw `ILIKE '%${query}%'` 插值。
- 使用 Prisma 参数化查询。
- 规范化空白、长度和大小写行为。
- 为真实搜索模式选择索引；是否启用 `pg_trgm` 必须由 query plan/数据量支持，并放入 migration。
- 记录 `%term%`、前缀搜索和全文搜索的取舍。

### N+1

- 先用查询日志或计数测试证明 N+1。
- 对可组合关系优先使用适当 select/include 或 request-scoped DataLoader。
- loader key 必须包含授权/租户语义，避免跨用户错误复用。
- 不为尚不存在的 N+1 提前引入复杂 loader 层。

## 缓存策略

缓存只在有基线测量后加入。适合候选：分类列表、餐厅详情和首页餐厅列表。

- cache-aside，明确 key、TTL、最大陈旧时间。
- 创建/编辑/删除餐厅或菜品后显式失效相关 key。
- promotion 状态变化也必须失效排序列表。
- 不缓存依赖 Owner 身份的查询，除非 key 中包含 principal 且有充分理由。
- 首版可使用进程内抽象实现；多实例需要共享缓存时再引入 Redis。

## 建议 PR 顺序

1. Category/Restaurant/Dish schema、migration、约束和 mapper。
2. 公共餐厅列表/详情、15 条分页和 query integration tests。
3. category 与 search；记录 query plan 基线并添加必要索引。
4. Owner 创建/编辑/删除餐厅及所有权拒绝测试。
5. Dish/options CRUD、严格 option parser 和所有权测试。
6. N+1 测量与最小优化；确有收益后再接缓存。

## 测试矩阵

| 风险 | 测试 |
| --- | --- |
| Owner 越权 | 另一 Owner 修改/删除餐厅和 Dish 必须失败且 DB 不变 |
| 分类并发创建 | 两个请求产生一个规范化 Category |
| 分页 | 0、负数、正常页、空页、边界页和稳定排序 |
| 搜索注入 | 引号、通配符、SQL 片段只作为数据，不改变查询结构 |
| 菜单选项 | 重名、非法 extra、未知字段和深度/大小限制 |
| N+1 | 固定 fixture 下查询数有上界，优化前后有记录 |
| 缓存 | 读命中、TTL、写后失效、promotion 失效 |

## 验收标准

- [ ] 浏览和 Owner 管理的目标 API 行为通过后端契约测试；旧前端适配差异已记录到阶段 9。
- [ ] 每个写操作同时验证 role 与 ownership。
- [ ] 分页固定 15 条且排序稳定。
- [ ] 搜索完全参数化，并有恶意输入测试。
- [ ] 菜单 option definition 有严格领域校验。
- [ ] 价格存储/转换不存在未说明的浮点舍入。
- [ ] N+1/索引/缓存优化都有优化前证据，不凭感觉添加。
- [ ] 完成 query plan、性能和安全观察的 learning note。

## 面试复盘重点

- offset 与 cursor pagination 的一致性和性能取舍。
- unique constraint、foreign key 与应用检查各自负责什么。
- PostgreSQL `ILIKE`/trigram/full-text 的适用条件。
- DataLoader 为什么必须 request-scoped。
- cache invalidation 如何覆盖餐厅、菜品和推广排序。

## 参考

- [NestJS GraphQL resolvers](https://docs.nestjs.com/graphql/resolvers)
- [NestJS GraphQL mapped types](https://docs.nestjs.com/graphql/mapped-types)
- [Prisma query optimization](https://www.prisma.io/docs/orm/prisma-client/queries/advanced/query-optimization-performance)
- [PostgreSQL indexes](https://www.postgresql.org/docs/current/indexes.html)
