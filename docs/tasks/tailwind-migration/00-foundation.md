# 00：记录基线并集中主题入口

状态：已完成（2026-10-23）。前置：收到实施指令，并阅读 [执行约定](./README.md)。完成后创建本文件规定的一个 commit。

## 目标与范围

建立后续逐步迁移的可对照基线，将公共 tokens 和第三方 CSS 统一到入口。暂时保留未迁移的组件及业务 CSS。

涉及 `apps/web/src/index.css`、`src/main.tsx`、`src/shared/ui/index.ts`、`src/shared/ui/tokens.css`、`src/shared/ui/tokens.spec.ts` 和配送地图的 CSS 导入。

## 实施步骤

- [x] 记录实施开始时的 Git HEAD、工作区已有修改、Node／pnpm 版本；检查已安装依赖，缺失时使用前端锁文件安装，不升级依赖。
- [x] 先运行当前 lint、全部测试、生产构建和覆盖率，记录原有失败；原有失败必须明确处理或向用户确认，不能迁移后归因于基线。
- [x] 在浏览器记录首页、四类角色布局、身份表单、餐厅／菜单、购物车／结算、订单、商家管理、图表、配送正常／回退地图的基线截图与关键计算样式。
- [x] 使用同一组固定数据核对 375、768、1280px 视口，并记录各模块原断点两侧的布局；记录 hover、focus、disabled、loading 和错误状态。
- [x] 验证运行配置及角色数据可用。若需隔离环境，复用现有 fixtures／fake services，以临时验证页面承载真实组件；不提交验证入口，不修改业务代码绕过权限，不执行数据库 seed 或迁移来准备截图。
- [x] 将 `tokens.css` 变量原值移入 `index.css`：颜色、字体、圆角、断点和动画相关声明使用适合 Tailwind v4 的主题命名；原有变量名称仍有调用时保持兼容，避免变量自引用。
- [x] 保留 DaisyUI 插件及原主题行为，避免改变其 light／dark 默认选择；全局背景、字体和颜色保持原值。不要把未定义的业务变量补成新的默认值。
- [x] 将 `leaflet/dist/leaflet.css` 的导入从 `delivery-map.tsx` 移到入口的导入区，检查它与 Tailwind／DaisyUI 的层叠顺序和地图控制样式。
- [x] 删除 `tokens.css`，去掉入口及公共 UI 出口中的对应导入；更新 token 测试读取入口，保留颜色对比度断言。此步仍保留 `styles.css` 的现有引入，直到步骤 01。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/shared/ui/tokens.spec.ts src/modules/courier/components/delivery-map.spec.tsx
```

- 执行 README 的共同门禁；基线另外执行 `pnpm --dir apps/web test` 和 `pnpm --dir apps/web test:coverage`。
- 浏览器确认变量集中和 Leaflet 提前加载没有改变布局、地图 marker、控件或弹层层级。
- 截图存入仓库外验证目录；在执行记录写明绝对路径、视口、场景和数据来源，不提交生成产物或账户信息。

## Commit message

```text
♻️ refactor(web): centralize tailwind theme and style imports

Keep shared visual tokens and vendor styles at the application entry.
Preserve existing values and DaisyUI behavior for incremental migration.
Update token checks without changing application or data contracts.
```

## 执行记录

- 完成日期：2026-10-23。
- 基线 HEAD：`7113e3706641da254814cc3be25b59f1fd0d63cf`；开始时工作区干净。Node `v26.12.1`，pnpm `12.15.0`，已有 `node_modules`。
- 原有依赖问题：Recharts 所需的 `es-toolkit/compat/*` 文件缺失，导致测试导入、Vite 启动和生产构建失败。普通 frozen install 未补齐文件，随后使用 `pnpm --dir apps/web install --frozen-lockfile --force` 恢复依赖；未修改清单或锁文件，未升级版本。
- 原有测试问题：首次默认并发运行还出现超时；限制为两个 worker 后，确认未验证用户登录跳转与商家近七日统计两项稳定失败。经用户明确确认，恢复登录的 `verifiedAt` 判断并删除调试输出；在商家页面测试内固定 `Date.now()` 为 `2026-08-17T12:00:00.000Z`，避免八月订单 fixture 随实际日期失效。
- 修复后的迁移前基线：`pnpm --dir apps/web test --maxWorkers=2` 通过，74 个文件／410 项测试；`pnpm --dir apps/web test:coverage --maxWorkers=2` 通过，statements 87.09%、branches 80.08%、functions 83.27%、lines 88.99%；lint 和生产构建通过。原始失败及修复后的日志均保存在下述目录。
- 视觉证据目录（仓库外）：`C:\Users\yze\.codex\visualizations\2026\10\23\01a16823-0a79-7bd3-8969-c93318b95b29\tailwind-foundation`。`before-*.png` 为基线，`after-*.png` 为对照，`stable-*.png` 为额外采集的稳定验收画面；`before-computed.json`、`final-computed.json` 保存 63 个场景／视口组合的关键计算样式，`before-themes.json`、`after-themes.json` 和 `keyboard-result.json` 保存主题与键盘证据。
- 场景与视口：375、768、1280px，统一高度 900px；包含访客首页、顾客发现／菜单／购物车／结算／订单、登录与注册、商家菜单／经营图表、配送正常／回退地图、公共控件状态和弹层。另记录 639/640、767/768、1023/1024px 两侧对应模块的原断点布局；未改动任何原媒体查询边界。
- 数据与隔离方式：本地没有实际运行环境变量，使用临时页面挂载真实组件，复用 catalog、checkout、orders、owner-management、owner-insights 的 fixture builders 和 identity test store；服务调用均由本地 fake service 提供。经营图表时钟固定在 2026-08-17，配送使用 `createDemoRoute("order-00000001", 8)`。未访问真实账户，未修改路由或权限准备截图，未执行数据库 seed／迁移。临时 HTML／TSX 已移出仓库并保存在证据目录，未纳入提交。
- 主题与兼容：采用 `@theme static` 保留尚未通过工具类引用的全部变量；旧 spacing、字体、控件高度和内容宽度名称通过单向别名兼容。保留 unlayered 的 `--color-info`、`--color-warning`，避免 DaisyUI 同名主题变量改变原色；插件仍使用原来的无参数配置。未补齐未定义的业务变量；原动画仍在待步骤 01 处理的 `styles.css`。
- 地图层叠兼容：Leaflet 改从入口加载后，其 `.leaflet-marker-icon` 会覆盖同优先级的 `display: grid`。将现有规则的选择器限定为 `.courier-leaflet-map .courier-leaflet-marker`，保持 marker 居中；保留原入口加载位置及公共组件覆盖顺序。正常／回退地图、三个 marker、缩放按钮和层级已实际核对。
- 对照结果：63 组记录中的主题变量、静态颜色、字体、间距、尺寸、网格和显示方式一致。仅 767px 正常地图的三个运行时 z-index 因 Leaflet 视口调整与重新挂载相差同一个偏移值，相对顺序保持一致。OSM 瓦片、图表动画及按钮过渡受加载时间影响；部分批量全页截图出现未稳定画面，另用 `stable-*` 截图作目视验收，不以这些自动像素差异宣称视觉回归或完全像素一致。
- 状态与键盘：检查 hover、focus、disabled、loading 和表单错误；DaisyUI 显式 light／dark 在相同 1024×900 视口的记录一致。Tab 跳过禁用／加载按钮并进入输入框，焦点轮廓保持 `rgb(57, 115, 183) solid 3px`；弹层内 Tab 保持焦点，Esc 关闭后恢复到打开按钮。
- 本步检查：指定 token／地图定向测试通过（2 个文件／11 项）；清理临时入口后的 lint、生产构建和 `git diff --check` 通过。生产构建仍有大 chunk 提示，不影响成功退出。覆盖率产物移至仓库外，自动生成的路由格式变化已还原。无剩余阻塞；仅完成步骤 00，未实施 01–11。
