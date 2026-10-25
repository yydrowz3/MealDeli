# 第二轮 Tailwind 样式精简执行计划

创建日期：2026-10-25。状态：**已完成**（2026-10-25）。

## 1. 目标、基线与边界

继续精简整个 `apps/web` 的细节规则，优先删除重复默认值和尺寸覆盖，再取消次要装饰。保留整体配色、内容层级、主要布局和 640／768／1024px 响应式切换，允许字距、局部间距和占位背景发生小幅变化，不要求像素一致。

- 当前工作区包含上一轮已实施但尚未提交的 62 个前端文件变更。本计划以这些修改后的文件为起点，不还原、不覆盖、不混合暂存它们。
- 源码扫描的候选项包括 61 处 `m-0`、14 处 `mt-0`、40 处 `border-solid`、10 处 `focus-visible:outline-solid`。数量包含后代变体，表示审计范围，不等于全部可以删除。
- 已检查本地 Tailwind Preflight：默认 margin／padding 为零、边框为实线、链接颜色和装饰继承。工具类编译结果也确认 `border` 和 `outline-3` 使用默认实线变量。
- 上一轮基线：78 个测试文件／479 项测试通过，lint 和生产构建通过；路由模块的异步导入曾超过默认 10 秒 hook 时限，复跑使用 `--hookTimeout=120000`。这些是历史记录，不作为本轮已通过的结果。
- 不修改业务逻辑、接口、组件公开 props、路由、权限、数据流、持久化或依赖；不新增样式框架、组件 API、CSS 选择器、`@apply` 或样式字符串抽象。
- 保持单一自有 CSS 入口，不清理主题 token 及兼容别名，不改变深浅主题色值。

实施按以下四步顺序进行；每步完成代码检查和对应验证后，再进入下一步。

## 2. 实施步骤

### 步骤 01：删除依赖 Preflight 即可满足的重置

状态：已完成（2026-10-25）。

| 对象 | 具体处理 | 保留条件 |
| --- | --- | --- |
| 普通元素的 `m-0`、`mt-0` | 删除没有抵消其他有效规则的零 margin，保留 `mb-2`、`mt-3` 等实际间距 | 若元素受父组件后代选择器或第三方样式赋予非零 margin，保留局部重置 |
| 订单卡片、购物车、配送详情和状态组件中的后代重置 | 删除仅恢复默认零 margin 的 `[&_p]:m-0`、`[&_h2]:m-0`、`[&_dl]:m-0`、`[&_dd]:m-0` 等；删除后为空的 `className` 一并移除 | 保留后代选择器中有效的字号、颜色、布局和实际间距；不将被删规则搬到子元素 |
| 普通自有组件的 `border-solid` | 保留边框宽度、方向和颜色，只删除重复的实线声明，包括订单分隔线的实线变体 | 配送正常／回退地图的 marker 类名暂时保留实线声明，作为地图样式的明确例外 |
| `focus-visible:outline-solid` | 删除重复的实线声明 | 保留 `outline-3`、轮廓颜色、正负 offset 和键盘焦点行为 |
| 导航和首页链接的 `no-underline` | 在祖先没有 underline 的位置删除直接类和 `[&_a]:no-underline` | 表单错误跳转等主动设置的 `underline` 保留；存在装饰继承时保留明确覆盖 |
| 业务页面和业务表单外层的 `font-sans` | 删除与全局 body 字体一致的重复声明 | `shared/ui` 内的字体声明保留，维持公共组件独立使用的样式基础 |
| 全局 CSS | 删除重复的 universal `box-sizing` 块、body 的 `margin: 0`、仅包含 `a { color: inherit; }` 的 base 层块 | 保留背景、文本颜色、全局字体、最小高度、触控和减少动态效果规则 |

对 margin 和链接装饰的审计采用统一标准：检查元素自身、祖先后代选择器和第三方覆盖；删除后计算样式应保持原值。不能证明等价的项目保留，并在执行记录注明具体规则来源。

本步验证：运行 `src/shared/ui` 下的现有测试及 `src/app/platform-render.spec.tsx`；浏览器核对按钮、输入框、订单卡片、表单错误信息和页头链接的 margin、边框及焦点轮廓。

### 步骤 02：合并重复尺寸和无意义的局部微调

状态：已完成（2026-10-25）。

| 位置／模式 | 确定的最终处理 |
| --- | --- |
| 公共 Button 外层 | 删除外层 `gap-2` 和默认 `py-0`；图标与文字间距继续由现有内部 span 的 `gap-2` 提供；加载图标维持绝对定位 |
| Button 尺寸映射 | 将三份 `leading-none` 合并到公共基础类，字号、高度及水平 padding 的各尺寸映射不变 |
| 菜品定制的数量加减按钮 | 删除与默认 44px 最小高度一致的 `min-h-11!`，保留 `min-w-11` 和公共按钮默认高度 |
| 购物车抽屉的结算按钮 | 删除 `h-9 min-h-9!`，继续使用现有 `size="sm"`，最小高度恢复公共组件的 44px；这是明确允许的局部尺寸变化 |
| 商家餐厅概览的占位图 | 将 `h-56 min-h-24` 简化为 `h-56`；保留宽度、背景和圆角 |
| 分页组件 | 将 `mt-6 [div+&]:mt-4` 统一为 `mt-4`，不再根据前一个兄弟元素调整间距 |
| 等价标准类 | `h-[28rem]` → `h-112`；`md:grid-cols-[repeat(5,1fr)]` → `md:grid-cols-5`；订单时间线的 `h-6 w-6` → `size-6` |

不改变按钮内部 DOM 和现有 `className` 传递方式；不通过新 props、类名合并库或长字符串常量隐藏复杂度。

本步验证：运行公共按钮、购物车抽屉、菜品定制、餐厅发现／菜单、订单页面的现有测试；浏览器确认图标间距、加载按钮占位、分页间距、数量按钮触控区域，以及抽屉结算按钮至少 44px 高。

### 步骤 03：取消次要装饰

状态：已完成（2026-10-25）。以下均作为本轮默认实施项，不留待实现时选择。

- 删除自有页面中的 `tracking-wide`、`tracking-widest` 和首页标题的 `tracking-tight`、`text-balance`。保留字号、字重、颜色、大小写及已有响应式字号。
- 餐厅／菜品图片加载失败时，CatalogImage 的渐变背景改为单色 `bg-jade-soft`；保留占位标记、可访问名称和现有尺寸。删除仅出现在占位 div 上、对其无作用的 `object-cover`；真实图片继续使用 `object-cover`。
- 回退地图删除网格背景的 `background-image` 和 `background-size` 两条规则，保留 `bg-neutral-soft`、SVG 路线、进度、三个定位标记及动态坐标。
- 保留卡片圆角和边框、状态颜色、选中态 ring、必要的 hover／disabled／loading 提示及当前阴影，不继续扩展为视觉改版。

本步验证：运行首页、目录页面、图片及配送地图相关现有测试；在中英日文本、深浅主题下目视检查首页标题自然换行、占位图、回退路线和状态区分。

### 步骤 04：统一验证、审计和清理

状态：已完成（2026-10-25）。

所有命令从仓库根目录执行。步骤 01–03 只运行相关定向测试；全部修改完成后再运行一次完整门禁，不为类名替换新增逐项断言工具类字符串的测试。

```powershell
pnpm --dir apps/web test --maxWorkers=2 --hookTimeout=120000
pnpm --dir apps/web lint
pnpm --dir apps/web build
git diff --check
```

- `--hookTimeout=120000` 只作用于本次命令，不修改测试配置，不跳过用例，不提高业务测试的 `testTimeout`。
- 执行构建前检查生成路由文件状态；构建后若只有本轮工具产生的生成文件变化，恢复该部分，不能覆盖执行前已有修改。
- 浏览器使用真实组件配合现有 fixtures／fake repositories；复用上一轮仓库外的 fixture，临时验证入口不提交，不使用真实账户或写入后端。
- 保存截图、必要计算样式和实际检查结果到仓库外目录，完成后移除临时验证入口，确认没有新增业务代码或临时产物。
- 记录修改前后静态 `className` 字符数和剩余任意值／important 的用途；不设硬性缩减比例，不为减少数量删除功能规则。
- 更新本文件的实施状态与实际验证结果。创建本计划不代表步骤已完成；本轮不自动提交、推送或发布。

## 3. 浏览器验收矩阵

| 检查范围 | 场景与通过标准 |
| --- | --- |
| 375／768／1280px | 首页、登录／注册、餐厅发现／菜单、购物车／结算、订单列表／详情、商家管理／图表、配送正常／回退地图；没有非预期页面横向溢出，长文本可读 |
| 639／640、767／768、1023／1024px | 重点检查首页、餐厅列表、菜单侧栏、商家布局和配送布局；导航显隐无空档，侧栏和网格没有内容挤压 |
| 深浅主题和中英日 | 各主题至少覆盖首页、一个表单、一个业务卡片和两种地图；三种语言覆盖标题、长餐厅／菜名、按钮和分页文字 |
| 控件状态 | 普通／hover／focus／disabled／loading、无效字段、错误状态、分类选中；焦点轮廓可见，禁用／加载按钮不可操作 |
| Modal／Drawer | Tab 和 Shift+Tab 焦点保持在弹层内，Esc 按现有规则关闭，关闭后恢复触发器焦点和 body 滚动；长内容仍可滚动 |
| 点击区域与溢出 | 数量加减、购物车结算和移动端导航保持至少 44px 的目标高度；分类横向滚动、订单表格局部滚动和文本截断继续有效 |

重置删除应在受影响元素上保持原计算样式；允许变化仅限本计划明确列出的字距／换行、占位背景、分页间距和购物车结算按钮高度。上一轮截图可辅助对照，本轮仍需对最终代码重新验证。

## 4. 必须保留的规则与接口约束

- 保留 `min-w-0`、必要的换行／截断、分类横向滚动、图表尺寸和列表网格，避免长文本或第三方内容撑开布局。
- 保留移动端 safe-area、底部导航预留空间、菜单购物车条偏移和正确的导航显隐配对。
- 保留弹层高度限制、overflow、层级、滚动锁和减少动态效果规则；层级不能因简化落到 Leaflet 控件下面。
- 保留 Leaflet 的 `grid!`、主题色及控件的必要 important 覆盖；保留 Skeleton 的真实高度／圆角覆盖，不批量删除 `!`。
- 保留按钮 disabled／loading、表单错误、订单当前步骤和分类选中的视觉反馈。
- 所有导出类型和组件 props 保持兼容；无需 API 变更、数据迁移或依赖升级。

## 5. 执行记录

实施日期：2026-10-25；步骤 01–04 已完成。保留本轮开始前的 62 个前端文件修改，未暂存、提交、推送或发布。

### 5.1 实施范围与等价性

- 本轮增量修改 54 个 TSX 文件和唯一自有 CSS 入口 `apps/web/src/index.css`。涉及 app 布局／首页／错误页／语言切换、catalog、checkout、courier、identity、media、orders、owner-insights、owner-management 和 shared/ui；精确文件清单见仓库外 `source-audit.json` 的 `after.changedFiles`。
- 步骤 01：清除默认零 margin、普通组件实线边框／焦点实线、导航链接装饰覆盖和业务区域字体；移除空 className 及三个重复全局重置。祖先后代规则仅保留实际字体、颜色、间距和布局，未发现需要保留的非零 margin／祖先 underline 抵消项。
- 等价依据：本地 Tailwind Preflight 的 universal 零 margin／padding、实线边框和链接继承；Leaflet 的 margin 和链接覆盖限定在其控件／弹出层。14 个真实组件 fixture 场景在删除工具类前后比较 margin、边框样式／宽度／颜色、outline、字体和链接装饰，差异为 0；全局 CSS 删除后另复核 states、landing、login、orders，差异为 0。输入框键盘焦点仍为 3px solid、offset 2px。
- 保留例外：正常／回退地图共 6 处 marker `border-solid`；shared/ui 内字体声明；表单错误跳转的主动 underline；Leaflet 局部 important、Skeleton 高度／圆角覆盖、弹层滚动锁、safe-area、z-index、主题 token 和兼容别名。
- 步骤 02：按表完成 Button 外层 gap／padding 删除、leading-none 合并、数量按钮与抽屉结算按钮尺寸覆盖删除、概览占位高度／分页间距统一及三个标准类替换。Button 内部 DOM 和 className 传递方式保持原样。
- 步骤 03：删除指定字距及首页 text-balance；CatalogImage 占位背景改为 jade-soft；移除占位 div 上的 object-cover 和回退地图网格背景。真实图片 object-cover、路线和动态坐标保持不变。
- 54 个修改 TSX 的 AST 对照在排除 className 和现有工具类字符串后全部一致（`structure-audit.json`）；业务逻辑、导出类型、props、依赖和路由未改动。

### 5.2 实际验证结果

| 阶段 | 命令范围 | 实际结果 |
| --- | --- | --- |
| 步骤 01 | shared/ui + app/platform-render | 7 文件／86 项测试通过 |
| 步骤 02 | primitives、cart-drawer、cart-dish-customizer、catalog-pages、orders-pages | 5 文件／35 项测试通过 |
| 步骤 03 | landing-page、catalog-pages、category-strip、image-field、delivery-map、courier-pages | 6 文件／31 项测试通过 |
| 完整测试 | `pnpm --dir apps/web test --maxWorkers=2 --hookTimeout=120000` | 78 文件／479 项测试通过，242.22 秒 |
| Lint | `pnpm --dir apps/web lint` | 移除临时 fixture 后通过，无诊断 |
| 生产构建 | `pnpm --dir apps/web build` | tsc、Vite 和 PWA 构建通过；有大于 500kB chunk 提示及插件耗时提示 |
| 空白检查 | `git diff --check` | 通过 |

测试输出包含 Node localStorage 实验性警告及 jsdom 文档导航未实现提示，未导致测试失败。未改测试配置、超时默认值或测试源码，未新增工具类字符串断言。

### 5.3 浏览器验收

复用上一轮 fixture 并补入真实 CartDrawer、DishCustomizer、OrdersPage、餐厅概览及长内容弹层，使用现有 fixtures／fake repositories，无真实账户和后端写入。

- 375／768／1280px：首页、登录／注册、发现／菜单、结算、订单列表／详情／表格、商家列表／概览／菜单／图表、正常／回退地图、公共控件和菜品定制，共 17 类场景；另在三种尺寸检查真实购物车抽屉。未发现页面横向溢出，分类和订单表格保留局部滚动。
- 639／640、767／768、1023／1024px：首页、发现、菜单、商家和配送布局均复核；1024px 的桌面导航／侧栏与移动导航互补，未见显隐空档。
- 深浅主题和 en／zh-CN／ja：覆盖首页、表单、餐厅卡片、菜单和两种地图；检查长餐厅／菜名、标题自然换行、按钮和分页文字。中文最初使用不支持的 zh 参数回退为英文，该批记录已剔除，最终以 zh-CN 重新检查。
- 按钮普通／hover／focus／disabled／loading 均检查；内部 gap 为 8px，加载图标仍绝对定位，禁用／加载使用原生 disabled。无效登录字段显示错误，分类选中 ring 保留。
- 数量按钮高度 44px；购物车结算按钮取消固定高度后，受现有 Drawer 网格和 footer 拉伸影响，900px 高视口实测约 180–185px，均满足至少 44px 的目标。这属于本计划明确允许的结算按钮高度变化，未另外调整弹层布局。
- Modal 和真实 CartDrawer 均验证 Tab／Shift+Tab 焦点留在弹层内、Esc 关闭、触发器焦点恢复及 body 滚动恢复；375×600 长内容 Modal 实测 clientHeight 568px、scrollHeight 1340px，overflow 为 auto。
- 正常地图保留 3 个 marker 和 2 段 SVG 路线，回退地图保留路线、进度和 3 个标记。正常地图外部瓦片异步加载，截图可能含尚未返回的瓦片；未将此视为背景样式精简问题。

仓库外证据目录：

`C:/Users/yze/.codex/visualizations/2026/10/25/01a172f5-4a75-72c1-b538-07294a97af6b/tailwind-simplification`

包含 `computed-before.json`、`computed-step01.json`、`step01-global-css.json`、`step02-metrics.json`、`responsive-audit.json`（118 条有效场景记录，含重复复核）、`controls-audit.json`、`cart-sizes.json`、fixture 副本及截图。最终视口截图以 `.viewport.png` 结尾，包含中英日、深浅主题、地图、焦点和弹层。长页面另有整页截图辅助查看。

### 5.4 静态统计与清理

- 同口径统计生产 TSX 中直接写为 `className="…"` 的 JSX 静态字符串，排除测试、表达式、模板字符串和类名映射常量：426 处／19,883 字符 → 413 处／18,033 字符，减少 1,850 字符（约 9.3%）。该口径不包括 Button 基础字符串和尺寸映射的进一步缩减。
- 剩余任意值／任意变体用于 safe-area、指定列宽和比例、窄屏品牌显隐、地图 marker 颜色及坐标、弹层最大高度／层级、阴影和后代排版／无效状态。important 保留用于 Leaflet 覆盖、Skeleton 尺寸／圆角和 body 滚动锁。逐项位置见 `source-audit.json`，未为减少数量删除这些功能规则。
- 开发服务器及临时验证入口均已清理。生成路由在启动前没有已有修改；开发／构建工具重新生成的差异已从本轮开始前的文件副本恢复，SHA-256 为 `81DE5217B47B6ADE9F7E070EEDBE2A86B31E812FB1DCF6B3311152E5047D0A6F`。
- 仓库内未留下 fixture、截图、审计脚本或新增业务文件；未修改暂存区。生产构建产物留在已忽略的 dist 目录。
