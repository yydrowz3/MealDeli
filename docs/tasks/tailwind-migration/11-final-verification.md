# 11：完成单入口审计与最终验收

状态：已完成（2026-10-24）。前置：[10](./10-courier.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

完成跨模块残留审计、最终视觉回归和全量验证，在前端 README 中记录新的样式约定。本步不是把前面未完成的模块统一留到最后迁移。

## 实施步骤

- [x] 扫描 `apps/web/src`，确认仅有 `index.css`，没有新增 scss／sass／less／CSS module；组件、模块出口和路由没有 CSS 导入，`main.tsx` 保留唯一入口导入。
- [x] 检查入口只包含第三方导入、DaisyUI 插件、主题／动画与基础规则，不存在组件选择器、`@apply` 或局部页面媒体查询。
- [x] 扫描旧样式类前缀：`ui-`、`app-`、`landing-`、`identity-`、`media-image-field`、`catalog-`、`checkout-`、`dish-`、`orders-`、`owner-`、`courier-`。人工区分真实类名与函数名、测试标识、文案、`ui-sans-serif`，不按前缀盲删。
- [x] 扫描生产 TSX 的 `style`、组件内 `<style>` 和动态类名拼接；确认唯一自有内联样式例外为配送地图运行时数值。第三方库属性、SVG 绘制参数不强制改写成 CSS。
- [x] 核对没有改动 generated GraphQL、routeTree、后端、依赖版本／锁文件、PWA 缓存或业务契约；若出现不在计划内的差异，先定位原因。
- [x] 修复审计发现的零散残留；影响某模块外观的修复必须重跑该模块测试和视觉检查，不仅跑静态扫描。
- [x] 在 `apps/web/README.md` 更新单入口、主题变量、组件工具类、完整变体映射和动态 style 例外约定，不重写历史产品设计／任务完成记录。
- [x] 基于步骤 00 的相同数据与视口完成最终场景矩阵，记录截图路径和检查结果，核对各步骤实施 commit 的标题、正文与范围。
- [x] 更新当前子计划记录和本系列 README 的最终状态，并创建本步骤一个独立 commit；通过 `git log` 查看提交哈希，不为把自身哈希写回文档而追加空提交。

## 静态检查入口

以下命令均从仓库根目录执行。`rg` 无匹配时 exit code 1 属正常；每个结果需要结合上下文判断，不能将搜索无输出视为完整语法分析。

```powershell
rg --files apps/web/src -g '*.css' -g '*.scss' -g '*.sass' -g '*.less'
rg -n '\.css' apps/web/src -g '*.ts' -g '*.tsx'
rg -n '@apply|@import|@plugin|@theme|@keyframes' apps/web/src/index.css
rg -n 'style=|<style' apps/web/src -g '*.tsx'
rg -n 'className' apps/web/src -g '*.tsx' -g '*.ts'
git diff --check
```

预期源码文件清单只有 `apps/web/src/index.css`。CSS 引用可包含 token 测试读取入口，实际生产导入只有 `main.tsx`；入口允许第三方包 CSS 引用。

## 全量验证

```powershell
pnpm --dir apps/web lint
pnpm --dir apps/web test
pnpm --dir apps/web build
pnpm --dir apps/web test:coverage
```

- 不降低现有覆盖率阈值、不跳过失败测试、不伪造截图或执行证据；只因样式架构变化更新旧类名／文件位置断言。
- 浏览器验收首页与四类布局、身份／资料、图片、发现／菜单、购物车／结算、三角色订单、商家管理、指标／推广、配送正常／回退地图。
- 每个场景检查 375／768／1280px 及涉及断点两侧；覆盖 loading／empty／error、hover／focus／disabled／提交中、长文本和减少动态效果。
- 从生产构建确认工具类完整生成，地图、图表、toast、抽屉和 PWA 更新提示布局正常。测试 mock 不能替代这项检查。
- 完成标准：前 11 项提交均可查证，本步全部门禁通过且证据已记录；仍有阻塞时保持本步未完成。

## Commit message

```text
♻️ refactor(web): finalize single-entry tailwind styling

Remove remaining legacy style references and document styling rules.
Verify the single CSS entry and runtime-only inline style exceptions.
Record full regression checks for the completed component migration.
```

## 执行记录

- 完成日期：2026-10-24。
- 全量测试／lint／build／coverage：`pnpm --dir apps/web test --maxWorkers=2 --hookTimeout=60000` 通过（74 个文件／413 项）；`pnpm --dir apps/web lint` 和 `pnpm --dir apps/web build` 通过。`pnpm --dir apps/web test:coverage --maxWorkers=2 --hookTimeout=60000 --coverage.reportsDirectory=<仓库外证据目录>/coverage` 同样通过 413 项，statements 87.13%、branches 80.09%、functions 83.27%、lines 89.03%；未修改原 80% 阈值或跳过测试。共同门禁和最后 `git diff --check` 均通过。保留既有大 chunk 提示；CLI hook 预算沿用步骤 09 对本机动态导入冷启动的处理。
- 静态审计与例外列表：源码只剩 `src/index.css`，生产 CSS 导入仅 `src/main.tsx:14`；token 测试允许读取入口。入口保留 Tailwind、Leaflet、DaisyUI、主题／动画、token 别名与全局基础规则，没有组件选择器、`@apply` 或页面局部媒体查询。使用 TypeScript AST 复查生产 TS／TSX 的 CSS 导入、JSX style、style 元素和 className；33 处 className 表达式逐项检查为完整字符串、有限映射或调用方类名组合，没有部分工具类动态拼接。divIcon 的完整静态类另行人工核对。旧前缀只存在于标识、模块路径、变量别名及动画名称等非旧样式选择器场景。
- 唯一运行时内联例外：`src/modules/courier/components/map-fallback.tsx:35` 的 `strokeDasharray` 及 `:56` 的 `left`／`top`。第三方绘图属性／内部样式保持不动。审计发现公共弹层通过 `body.style.overflow` 写入固定值，已改为切换可扫描的 `overflow-hidden!` 工具类并恢复原类状态；同步更新原有滚动锁测试，4 项 overlay 定向测试通过。
- 范围核对：相对计划基线 `7113e37`，后端、generated GraphQL、routeTree、依赖清单／锁文件、PWA 缓存策略无变更。构建自动产生的 routeTree 格式差异已还原。临时验证入口／配置已移出仓库；没有生成产物或真实账户数据纳入提交。`apps/web/README.md` 记录单入口、token、组件工具类、完整变体映射、important 覆盖与动态例外约定。
- 最终视觉场景矩阵与证据路径：`C:\Users\yze\.codex\visualizations\2026\10\24\01a16c9d-0ed1-71d1-be37-653338d863c2`。`final/matrix.json` 和 279 张截图覆盖首页／四类布局、身份／资料、图片、发现／菜单、结算／抽屉、三角色订单和五种状态、商家管理、指标／推广、正常／回退配送地图、公共控件和 PWA／toast；主要视口 375／768／1280×900，并额外覆盖 639／640、767／768、1023／1024px 两侧。`final/sheets/` 为逐场景目视检查索引；完整截图保留原尺寸。矩阵未发现运行时异常，图表非零高度且文字摘要可读；正常瓦片的稳定画面另见步骤 10 的 `courier/` 对照。
- 验证数据与生产构建：复用步骤 00 及各模块之前的 fixture builders、固定八月日期和 fake repositories，挂载真实生产组件，通过同一 Vite／Tailwind／DaisyUI 插件链构建为 `final-production/` 后用 preview 验收。PWA 提示注入 fake registrar 触发真实组件，toast 使用真实 Sonner；没有修改生产权限或服务逻辑。正式 `pnpm build` 仅为本地冒烟设置进程级 loopback API／WS／origin 环境变量，浏览器拦截匿名 refresh 返回 Unauthorized，`final/main-smoke.json` 及 6 张 `main-*` 截图验证正式应用首页与登录，未修改 `.env`。
- 浏览器交互：`final/interactions.json` 记录公共弹层、顾客抽屉、商家编辑抽屉、推广确认和配送确认的滚动锁、关闭恢复、焦点／层级；hover 颜色为 `rgb(36,127,84)`，焦点为 `rgb(57,115,183) solid 3px`，Tab 跳过禁用／加载按钮。地图 Skip map、PWA 提示显示／稍后关闭、toast 显示通过；减少动态效果与断网完成配送见步骤 10 的扩展交互记录。
- 已知基线现象：六分类 stress fixture 在 375／768px 有横向溢出（见步骤 05 的既有记录及 `final/overflow-review.json`），本次保持该行为；单分类基线无溢出。OSM 瓦片加载与图表动画时机不能用于宣称逐像素一致。未将这些既有现象或不稳定资源画面伪报为迁移回归。
- 00–10 提交核对结果：每步均为单独 refactor commit 且有正文，顺序为 `144a5da`、`c1c22c8`、`fd94a17`、`f22eaf8`、`32cd3a3`、`e4112fe`、`906bcd2`、`5591989`、`9962c36`、`fc65d46`、`8ce81a5`；本步使用规定标题／正文独立提交，不追加记录自身哈希的空提交。完整核对在 `static-audit.json`。
- 阻塞项：无。测试／覆盖率／构建日志、静态审计、临时入口源码及生产验收产物均保存在上述仓库外目录。
