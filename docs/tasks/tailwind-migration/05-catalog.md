# 05：迁移餐厅发现与菜单样式

状态：已完成（2026-10-24）。前置：[04](./04-media.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/catalog` 页面和组件，删除 `catalog.css`，覆盖发现页、菜单页、搜索、分类、分页、图片和商品卡片，以及购物车插槽布局。

## 实施步骤

- [x] 将发现页标题、地址、搜索栏、分类横条、结果标题和分页布局写入各组件。
- [x] 分类选中状态保留 `aria-pressed`，使用属性变体，保持键盘操作和原横向滚动样式。
- [x] 迁移餐厅卡、菜品卡、图片占位和加载骨架屏，保留图片比例、截断／换行、价格位置及卡片点击区域。
- [x] 迁移菜单 hero、返回操作、餐厅信息、菜品网格及购物车 sidebar／mobile slot，保留原断点和无购物车时的布局分支。
- [x] 检查公共 Card 默认 padding 与模块原覆盖规则，保留实际生效的 24px 内边距，避免移除旧 CSS 后产生额外内边距。
- [x] 保留搜索防抖／参数、分类筛选、分页、促销标识、图片失败和重试逻辑；迁移 loading、empty、error 及已知数据上的错误提示。
- [x] 删除所有 catalog CSS 导入、文件和旧 `catalog-*` 样式类名；现有测试不依赖被移除的样式类或 CSS 路径，无需修改。保留无障碍关联所用的既有 ID。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/modules/catalog src/modules/checkout/components/cart-drawer.spec.tsx
```

- 执行共同门禁；核对 375／768／1280px 发现页和菜单页、原 640／1024px 附近断点两侧。
- 检查长餐厅名／菜品名、空结果、图片失败、分页与购物车侧栏／移动栏，不引入横向溢出。
- 商品选择与购物车内容保持原有行为，模块只通过现有公共插槽协作。

## Commit message

```text
♻️ refactor(web): migrate catalog pages to tailwind

Move discovery, menu and catalog card styling into their components.
Preserve responsive cart slots, category states and image fallbacks.
Remove catalog CSS while retaining search and pagination behavior.
```

## 执行记录

- 完成日期：2026-10-24。
- 开始 HEAD：`32cd3a3afc7e1e781d367e529589c3a99787708a`；步骤 04 已提交，开始时工作区干净。
- 实现：发现页、菜单页和六个组件的布局、分类选中状态、图片／占位、卡片、分页及骨架屏均改为静态工具类，删除 `catalog.css` 及两处导入，清除无样式用途的错误壳类名。保留组件属性、事件、状态、服务调用、URL 参数归属、购物车插槽和无障碍关联。
- 层叠与边界：保留 `39.99rem`／`63.99rem` 的 inclusive 边界，餐厅两列区间与手机单列区间使用互斥媒体变体；菜品仍只在手机断点变为单列。保留公共 Card 原实际 24px 内边距，以及 Skeleton hero 的最小高度／圆角覆盖。小字号仅设置原 font-size，不额外改变继承行高；保留分类选中时的精确 box-shadow、原渐变插值及分页在结果网格后 16px／其他位置 24px 的间距。页面内后代工具变体承接标题／段落规则及现有购物车插槽内部节点。
- 定向测试：清理临时源码后执行 `pnpm --dir apps/web exec vitest run src/modules/catalog src/modules/checkout/components/cart-drawer.spec.tsx --maxWorkers=2 --hookTimeout=30000`，7 个文件／30 项通过。沿用既有命令行 worker 与 hook 预算，没有修改测试配置或新增工具类断言；本步未重跑全量测试或覆盖率。
- 共同门禁：临时源码清理后的 `pnpm --dir apps/web lint`、`pnpm --dir apps/web build`、`git diff --check` 均通过。生产构建保留既有的大 chunk 提示，成功生成 56 项 PWA precache；未修改依赖、构建配置或更新策略。格式化时发生一次 Windows 文件映射占用，停止开发服务器后重跑该文件成功，未改变业务实现。
- 视觉证据目录（仓库外）：`C:\Users\yze\.codex\visualizations\2026\10\23\01a169bd-3521-7350-bcb1-dc92b6404688\catalog`。复用真实 CustomerLayout、目录组件、CartSummary／CartDrawer、catalog／checkout fixture builders、identity test store 和固定的 `2026-08-17T12:00:00.000Z` 促销时钟。使用本地 fake repository、现有品牌 PNG、缺图与本地 404 场景，未访问真实账户或业务服务。
- 主场景：发现／菜单正常页面覆盖 375／639／640／768／1023／1024／1280px；长名称、搜索空结果、首次错误／加载、保留旧结果时的刷新中／失败、长菜单、无购物车、空菜单、菜单错误／加载／未找到覆盖 375／768／1280px，共 50 组，统一高度 900px。`before-computed.json`／`after-computed.json` 记录所有关键计算样式，差异为空；`static-differences.json` 中静态可见元素的尺寸／位置差异为空。
- 滚动补查：初轮采集时浏览器保留滚动位置，隐藏节点的零矩形加上 scrollY，以及 sticky 移动栏及子节点的纵坐标产生诊断差异，保留在 `raw-differences.json`；未将这些记录当作像素等价证据。随后用 HEAD 原组件临时副本与新组件在相同交互定位下成对核对菜单顶部／底部，7 个视口 × 2 个位置共 14 组，完整样式、几何位置和 scrollX／scrollY 均一致，见 `controlled-menu.json`／`controlled-menu-differences.json`。另按原基线的一分类／一餐厅规模复核 375／768／1280px，3 组完整记录一致，均无整页横向溢出，见 `standard-discovery.json`。
- 基线限制：六分类压力场景在迁移前已有整页横向溢出，迁移后相同视口的溢出状态、节点宽度和位置均未扩大；本步按视觉等价边界保留现有行为，未顺带修改 grid 的最小尺寸策略。菜单与原基线规模发现页无新增溢出。截图保存为 `before-*`／`after-*`、`controlled-*` 和 `standard-*`；已目视核对卡片、占位、长文本、错误与空状态，不宣称所有像素完全相同。
- 浏览器交互：实测分类 Enter 选中、`aria-pressed`、jade 边框／阴影与 3px info 焦点轮廓；输入触发搜索防抖并清除分类，Clear 恢复空查询；Next 后页码变为 2，焦点进入结果标题。发现／菜单 Try again 均恢复结果；菜品 Enter 将原 dish 传给选择回调。真实购物车抽屉从 $14.49 增加数量后显示 $28.98，Escape 关闭并恢复到 Cart 按钮。见 `discovery-interactions.json`、`retry-checks.json`、`menu-interactions.json` 和 `cart-drawer.png`。
- 清理与审计：临时 HTML／TSX 与 HEAD 组件副本已移出仓库，浏览器视口已重置，验证标签页和开发服务器已关闭；最终构建后已还原自动生成的路由格式变化。目录模块已无自有 CSS 导入、旧目录样式类或固定内联样式，公共组件 API 无变化。总览见证据目录内 `verification-report.json`。
- 阻塞项：无。本轮仅实施步骤 05，步骤 06–11 保持未开始；六分类压力场景的既有溢出限制如上记录。
