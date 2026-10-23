# 11：完成单入口审计与最终验收

状态：未开始。前置：[10](./10-courier.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

完成跨模块残留审计、最终视觉回归和全量验证，在前端 README 中记录新的样式约定。本步不是把前面未完成的模块统一留到最后迁移。

## 实施步骤

- [ ] 扫描 `apps/web/src`，确认仅有 `index.css`，没有新增 scss／sass／less／CSS module；组件、模块出口和路由没有 CSS 导入，`main.tsx` 保留唯一入口导入。
- [ ] 检查入口只包含第三方导入、DaisyUI 插件、主题／动画与基础规则，不存在组件选择器、`@apply` 或局部页面媒体查询。
- [ ] 扫描旧样式类前缀：`ui-`、`app-`、`landing-`、`identity-`、`media-image-field`、`catalog-`、`checkout-`、`dish-`、`orders-`、`owner-`、`courier-`。人工区分真实类名与函数名、测试标识、文案、`ui-sans-serif`，不按前缀盲删。
- [ ] 扫描生产 TSX 的 `style`、组件内 `<style>` 和动态类名拼接；确认唯一自有内联样式例外为配送地图运行时数值。第三方库属性、SVG 绘制参数不强制改写成 CSS。
- [ ] 核对没有改动 generated GraphQL、routeTree、后端、依赖版本／锁文件、PWA 缓存或业务契约；若出现不在计划内的差异，先定位原因。
- [ ] 修复审计发现的零散残留；影响某模块外观的修复必须重跑该模块测试和视觉检查，不仅跑静态扫描。
- [ ] 在 `apps/web/README.md` 更新单入口、主题变量、组件工具类、完整变体映射和动态 style 例外约定，不重写历史产品设计／任务完成记录。
- [ ] 基于步骤 00 的相同数据与视口完成最终场景矩阵，记录截图路径和检查结果，核对各步骤实施 commit 的标题、正文与范围。
- [ ] 更新当前子计划记录和本系列 README 的最终状态，并创建本步骤一个独立 commit；通过 `git log` 查看提交哈希，不为把自身哈希写回文档而追加空提交。

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

- 完成日期：未完成。
- 全量测试／lint／build／coverage：未执行。
- 静态审计与例外列表：未执行。
- 最终视觉场景矩阵与证据路径：未执行。
- 00–10 提交核对结果：未执行。
- 阻塞项：待记录。
