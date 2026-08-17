# Cart 与 Checkout 最小任务

## 来源与依赖

- 需求：[`02-customer.md`](../proposals/02-customer.md) 的 Dish 定制、购物车、Checkout、地址与模拟支付章节。
- 设计：[`06-cart-checkout.md`](../detailed-designs/06-cart-checkout.md)。
- 依赖：Design System、Catalog read model、Identity address/session、Order command port、Jotai、TanStack Form、Zod。
- 现状：后端 `createOrder` 已按 ID/quantity 验证 Dish 与 options、计算服务端价格快照并返回 orderId；前端 Checkout 模块尚不存在。

## 实现任务

### Cart 模型与持久化

- [ ] 定义 version 1 Cart snapshot、line/option/choice 类型和 Zod hydration schema；不保存 UI/表单/请求状态。
- [ ] 用 `atomWithStorage` 和 `mealdeli.cart.v1` 同步恢复 Cart；损坏 JSON、未知版本或非法金额/数量应删除并回到空 Cart。
- [ ] 实现 add/merge/change quantity/remove/clear/replace restaurant actions 和 count/total selectors，不暴露任意 setter。
- [ ] 用确定性的 Dish+choice ID selection key 合并行；quantity 限制 1–99，所有金额必须是 safe integer cents。
- [ ] 实现单餐厅规则；加入另一餐厅只返回确认需求，用户确认前不得修改现有 Cart。
- [ ] logout/session expired 时由 Platform 清 Cart 和 storage，浏览其他餐厅不改变 Cart。

### 定制、结账与下单

- [ ] 用 TanStack Form field arrays 和 Zod 实现 Dish option 的归属、去重、min/max、optional 与 quantity 校验。
- [ ] 实现定制总价、首错聚焦和 `Add {quantity} to cart`；关闭未提交表单不得写入 Cart。
- [ ] 实现 Cart drawer/sidebar/mobile bar 的 empty、行编辑、USD summary 和跨餐厅确认交互。
- [ ] 实现 Checkout loader：先做 Customer/verified gate，再 hydrate Cart、读取地址并 refetch Catalog 验证每个项。
- [ ] 对失效 Dish/option 标记为不可下单，并要求删除或重新配置；空 Cart 显示专属 empty 而非重定向循环。
- [ ] 用 TanStack Form 实现 1–500 字符地址编辑与 Profile command 同步；模拟支付明确无需银行卡且配送费为 `$0.00`。
- [x] 后端 `createOrder` 已仅依据 restaurant/dish/option/choice ID 与 quantity 校验并计算最终 cents，保存价格快照后返回 orderId；API 构建通过。
- [ ] 实现 createOrder mapping，禁止提交客户端 price/name；成功清 Cart 并导航，业务/网络失败保留 Cart。
- [ ] 对 mutation timeout 先查询 Orders 协调结果，禁止无确认的自动重试和重复提交。

## 测试与验收

- [ ] 覆盖 Cart hydration、actions、金额、跨餐厅确认、logout clear 和隔离 store。
- [ ] 覆盖 Dish 表单 field arrays、min/max、重复 choice、价格、首错焦点和提交时机。
- [ ] 覆盖 Checkout empty/address/invalid item、isSubmitting、防重复下单及成功/失败/timeout。
- [ ] 修复并运行 createOrder 后端测试，覆盖价格快照、跨餐厅 Dish、选项规则和服务端总价。
- [ ] 证明 Cart 可用 Dish fixture、memory storage、fixed UUID 和 fake ports 独立测试。

## 完成条件

以上所有任务均为 `[x]`，且刷新保留 Cart、退出/成功下单清理、最终金额完全服从服务端后，才可在 [`progress.md`](./progress.md) 勾选本模块。

