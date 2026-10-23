# 01：迁移公共 UI 并解除旧类名依赖

状态：已完成（2026-10-24）。前置：[00](./00-foundation.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

将 `src/shared/ui/styles.css` 的全部规则迁入公共组件，同时解决尚未迁移业务模块对 `.ui-*` 的依赖，使本次提交后所有模块仍保持原有外观。

## 实施步骤

- [x] 迁移 Button、Card、Input、PasswordInput、Textarea、Select 和 FormErrorSummary，保持现有导出、属性、默认值及 `className` 传递位置。
- [x] 按完整类名映射实现按钮四种 variant、三种 size、icon-only、loading 和 disabled；保留加载时内容隐藏占位、spinner 的定位及 800ms 旋转周期。
- [x] 迁移控件边框、错误状态、聚焦轮廓、密码切换按钮、textarea 最小高度和 resize；保留 label、description、error 与控件的关联。
- [x] 迁移 Modal／Drawer 的遮罩、滚动、圆角、宽高、头尾间距和 `z-index: 1100`；保留 Portal、焦点约束、Escape、提交中不可关闭及焦点恢复行为。
- [x] 迁移 Badge 全部 tone、Skeleton、异步状态、ConnectionBanner、金额等展示组件及 ChartFrame／MapFrame；Sonner 继续使用自身渲染机制。
- [x] 将 spin 和 pulse 定义放入入口主题动画，保留 pulse 的 1.5s 周期及 50% 时 0.55 的透明度，保留减少动态效果行为。
- [x] 同步修复跨模块依赖：会话骨架屏和订单 loading 的子节点尺寸直接设在 Skeleton 调用处；商家页头按钮的移动端宽度直接设在对应 Button；推广卡按钮的对齐直接设在对应 Button。
- [x] 商家分析页头 Select 的 field 外层没有公开 `className` 参数：增加纯布局包装层表达原有 15rem／移动端 0 的最小宽度，不改变公共表单 API，并删除依赖 `.ui-field` 的原规则。
- [x] 图片选择控件的 label 直接使用等价工具类替换裸 `ui-button` 类；保留 label／file input 关联，不将 label 换成改变触发行为的元素。
- [x] 删除以上已迁移的业务 CSS 后代规则，以及入口中 `.app-session-skeleton .ui-skeleton` 规则；其他业务样式留待对应步骤处理。
- [x] 根据实际基线补充层叠兼容：在调用处用局部 important 工具类保留身份卡片边框、餐厅／菜品及商家餐厅卡片内边距、商家危险区和配送进行中卡片边框、已推广卡片背景与边框、购物车删除按钮颜色，以及目录异步状态标题间距；不提前迁移这些业务模块的其余样式。
- [x] 移除所有公共 UI 旧样式类，删除 `styles.css` 及入口和公共出口的导入。更新依赖旧类名的测试，用角色、状态、可访问属性或必要的稳定测试标识查询节点。

## 验证与验收

```powershell
pnpm --dir apps/web test
```

- 执行共同门禁。公共组件影响全部业务界面，此步执行全量测试，不仅运行 shared UI 测试。
- 浏览器逐项对照公共组件，并额外检查未迁移的商家页头、推广页、订单 loading、会话 loading 和图片选择按钮。
- 确认业务 CSS 与入口不再引用 `.ui-*` 类；公共组件仍能不依赖业务 providers 独立渲染。
- 不以新工具类名称的逐项断言替代原测试；重点保留交互、无障碍和属性透传覆盖。

## Commit message

```text
♻️ refactor(web): migrate shared ui styles to tailwind

Replace shared component selectors with static utility class mappings.
Move dependent consumer rules alongside the elements they style.
Preserve component APIs, accessibility, animation timing and overlays.
```

## 执行记录

- 完成日期：2026-10-24。
- 开始 HEAD：`144a5dac261d32fef0c34cd31742c731fc55925e`；工作区干净，步骤 00 已提交。
- 实现：公共组件改用可静态扫描的工具类及穷举映射；删除 `shared/ui/styles.css` 和两处导入；spin／pulse 移入入口主题，保留 800ms／1.5s 周期及 pulse 中点透明度 0.55。公共 API、className 位置和弹层交互逻辑保持不变；Sonner 仍由自身渲染。
- 跨模块兼容：原计划列出的骨架屏、商家页头按钮、Select 包装层、推广按钮与图片选择 label 均已处理。浏览器进一步发现旧的非分层共享 CSS 会覆盖部分业务规则；迁入 Tailwind utilities 层后这些规则重新生效。因此在对应调用处保留原实际生效值（如卡片 24px 内边距、身份卡片 1px 边框、购物车删除按钮 jade-dark 色），未将这些原有外观改为业务 CSS 中原本被覆盖的值。目录异步标题通过局部后代变体保留零底边距。此类兼容修改不改变业务数据或行为。
- 全量测试：首次 `pnpm --dir apps/web test --maxWorkers=2` 有一个路由套件的 `beforeAll` 导入超过默认 10 秒，其余 409 项通过，4 项因套件初始化失败跳过。使用 `pnpm --dir apps/web test --maxWorkers=2 --hookTimeout=30000` 重跑通过；最终兼容修复及临时页面清理后再次运行同一命令，74 个文件／413 项全部通过。仅在命令行放宽初始化 hook 时间，未改测试配置或业务断言超时；按钮测试增加全 variant／size 的交互与原生属性透传覆盖。
- 共同门禁：清理临时文件后的 `pnpm --dir apps/web lint`、`pnpm --dir apps/web build`、`git diff --check` 均通过；生产构建有既有的大 chunk 提示。未执行本步骤未要求的覆盖率重跑。
- 视觉证据目录（仓库外）：`C:\Users\yze\.codex\visualizations\2026\10\23\01a1698d-9b23-7302-988a-56ff2f561d26\shared-ui`。`before-*` 保存迁移前 6 个场景 × 375／767／768／1280px 的截图和计算样式，统一高度 900px；`verified-*` 保存最终公共控件／Modal／Drawer 的 375／768／1280px 对照，所记录样式无差异。`final-*`、`compare-*` 保存其余兼容场景及目视对照；`cascade.json` 记录额外 9 项调用方与旧共享样式在 375px 的等价检查。
- 基线复用：使用步骤 00 的真实组件、fixture builders、identity test store、fake services、固定经营图表日期与配送路线。`accepted-regression.json`、`accepted-maps-landing.json` 对照步骤 00 的登录、注册、餐厅发现、菜单、结算、订单、首页、正常／回退地图，共 27 组场景／视口；关键业务元素样式一致。768px 下 BODY 总高度的差异来自临时场景导航增加链接，业务容器尺寸一致。分析页新增包装层承接原 min-width，字段自身的 min-width／min-height 计算值因嵌套而变化，实际宽高不变；图表动画 SVG 不用于逐节点静态等价结论。
- 浏览器交互：确认 primary hover 颜色、disabled 的 0.62 透明度与禁用指针、loading 内容隐藏占位和绝对定位 spinner、错误控件边框、3px info 聚焦轮廓。Tab 跳过禁用／加载按钮；Modal／Drawer 内 Tab 循环，Escape 关闭，Modal 焦点回到打开按钮，遮罩 z-index 为 1100，滚动锁定与恢复正常；`keyboard.json` 保存结果。提交中不可关闭由既有 overlay 测试覆盖。原全局 reduced-motion 规则保留原样；当前浏览器工具不支持 motion 仿真，未另行模拟该偏好。
- 清理与审计：临时 HTML／TSX／旧样式对照文件已移到证据目录，不纳入提交；自动生成路由的格式改动已还原。入口及业务 CSS 不再引用 `.ui-*`，公共组件没有旧自定义样式类或自有 CSS 导入，仍可独立于业务 providers 渲染。证据总览见目录内 `verification-report.json`。
- 阻塞项：无。仅完成步骤 01，后续步骤保持未开始。
