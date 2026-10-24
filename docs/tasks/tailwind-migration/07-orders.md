# 07：迁移订单列表、详情与时间线样式

状态：已完成（2026-10-24）。前置：[06](./06-checkout.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/orders` 的页面、卡片、表格和时间线，删除 `orders.css`。配送历史复用订单界面，也包含在本步验收中。

## 实施步骤

- [x] 迁移订单页头、筛选、分区切换、列表、详情、事实信息和操作区。
- [x] 保留桌面表格与移动卡片的原切换边界、表格滚动范围及已选分区状态。
- [x] 用完整类名映射替换时间线动态 `orders-timeline__step--${state}`，保持当前／完成／待处理状态的标记、连线及文字。
- [x] 迁移订单条目、金额、配送信息、通知和连接状态；步骤 01 已迁移 loading Skeleton 尺寸，本步移除其余 loading 布局类。
- [x] 保留角色投影、状态筛选、订阅更新、重连提示、历史详情及取消／操作行为，不调整订单状态机。
- [x] 删除模块出口等位置的 CSS 导入、文件及旧 `orders-*` 类名，更新依赖旧类名的测试。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/modules/orders src/app/composition/order-route-content.spec.tsx src/modules/courier/pages/courier-pages.spec.tsx
```

- 执行共同门禁；核对 Customer／Owner／Courier 三种投影、移动卡片与桌面表格、详情时间线。
- 覆盖 loading、empty、error、不同订单状态、长商品名、断线提示和操作中状态。
- 确认配送历史没有因为复用组件迁移出现样式或可访问性回归。

## Commit message

```text
♻️ refactor(web): migrate order views to tailwind

Move order cards, tables and timelines to explicit utility classes.
Preserve role-specific views, responsive layouts and status semantics.
Remove order CSS without changing realtime or order state behavior.
```

## 执行记录

- 完成日期：2026-10-24。
- 开始 HEAD：`906bcd2c15502ac96c985b5d9da5fb4509439870`；步骤 06 已提交，工作区干净。
- 实现：OrdersPage、OrderDetailPage、OrderCard、OrderTable 与 OrderTimeline 改用静态工具类；时间线文字与 marker 使用带穷举类型约束的 complete／current／upcoming 映射。删除 `orders.css` 及模块出口导入，清理无规则的页头／操作区壳类名。保留组件 API、角色投影、状态筛选、金额／日期、订单状态机、订阅与重连逻辑；没有新增 CSS、固定内联 style 或动态拼接工具类。
- 精确值与层叠：保留列表 80rem／详情 60rem 最大宽度、24px 内边距、卡片事实信息三列、auto-fit 卡片网格、47.99rem 以下的表格卡片与单列筛选、48rem 起的五列时间线。保留原 repeat(3, 1fr)／repeat(5, 1fr) 轨道、`align-items: start`、14px 事实标签的原行高、marker 的 50% 圆角与 0.3rem 白色内阴影。表格桌面仅底边框着色，手机的 `border: 0` 同时保留 none 样式和 currentColor；不通过补主题变量改变外观。返回按钮继续在原直接内容 span 上对齐图标与文字，未添加结构包装。
- 定向测试：实施初轮及最终表格整理、临时源码清理后均运行 `pnpm --dir apps/web exec vitest run src/modules/orders src/app/composition/order-route-content.spec.tsx src/modules/courier/pages/courier-pages.spec.tsx --maxWorkers=2 --hookTimeout=30000`，两次均为 6 个文件／55 项通过。沿用前序步骤的两个 worker／30 秒初始化 hook 预算；既有测试使用角色、文案和可访问属性，无旧样式类或 CSS 路径断言需要调整。本步未新增工具类名称断言，未执行全量测试或覆盖率。最终日志为证据目录中的 `final-tests.log`。
- 共同门禁：`pnpm --dir apps/web lint`、`pnpm --dir apps/web build` 和 `git diff --check` 均通过；正式构建时临时验证入口已移出仓库，PWA 生成 56 项 precache。保留既有的大 chunk 提示；本次还出现构建插件耗时提示，均不影响成功退出。未改动依赖、构建配置、PWA 策略或业务契约。
- 视觉证据目录（仓库外）：`C:\Users\yze\.codex\visualizations\2026\10\24\01a16bd6-7797-75e3-8edc-bed2a7e4c928\orders`。使用步骤 00 相同的真实布局／订单组件、现有 `buildOrder`／`buildOrderItem`／`buildOrdersByStatus` fixtures 和固定八月日期；补充第二餐厅、长商品／选项和两个条目，订单操作由本地延迟 fake repository 提供。未访问真实账户或业务 API，未执行 seed／迁移，未修改权限或路由准备场景。
- 场景矩阵：21 个场景 × 375／768／1280px，加上顾客列表、商家表格、PICKED 详情与长文本的 767px 边界，共 67 组，统一高度 900px。覆盖三角色列表与详情、配送历史／已完成详情、五种订单状态、断线提示、列表和详情 loading／error、empty、not-found、长文本及商家操作区。`before-computed.json`／`after-computed.json` 保存所检查 DOM 节点的关键计算样式与位置尺寸，`final-differences.json` 为空；全部场景无整页横向溢出。
- 截图与目视：批量 `before-*`／`after-*` 全页 PNG 部分出现空白或错误绘制，只作诊断，不作为像素等价证据。另通过稳定视口截图保存并目视核对 `verified-detail-1280.png`、`verified-owner-1280.png`、`verified-owner-375.png`、`verified-courier-768.png`、`verified-long-375.png` 与 `verified-long-items-375.png`；桌面表格、横向／纵向时间线、手机卡片、配送历史、长文本换行和金额布局正常。不宣称全页面像素完全一致；早期 filtered／pending 全页截图亦不用于视觉结论。
- 浏览器交互：顾客 Past 的 `aria-selected=true`、已送达详情与返回；商家餐厅／状态联合筛选及无匹配结果；配送 Active 继续操作、Completed 分区及已送达详情；错误重试均实际通过。商家操作中按钮为 disabled、`aria-busy=true`、内容 hidden、透明度 0.62、spinner 800ms，与迁移前记录一致，操作完成后显示 Preparing 状态及下一操作。详情返回按钮的 Tab 顺序与 `rgb(57, 115, 183) solid 3px` 焦点轮廓保留，Tab 跳过加载按钮进入移动导航。结果见 `interactions.json`；实时订阅、重连恢复与权限边界由既有定向测试覆盖，不将 fake repository 验证视作真实网络验收。全局 reduced-motion 规则未改动，本步未模拟该偏好。
- 清理与审计：临时 HTML／TSX 已移至证据目录，开发服务器和验收标签页已关闭，临时视口已重置；构建自动生成的路由格式变化已还原。订单模块没有自有 CSS 导入、旧样式类或固定内联样式；其他模块只保留其原有实现。证据总览为 `verification-report.json`。
- 阻塞项：无。本轮仅实施步骤 07，步骤 08–11 保持未开始。
