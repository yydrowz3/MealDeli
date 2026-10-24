# 09：迁移经营分析与推广样式

状态：已完成（2026-10-24）。前置：[08](./08-owner-management.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/owner-insights` 的 Dashboard、指标卡、图表和推广界面，删除 `owner-insights.css`。

## 实施步骤

- [x] 迁移页头、餐厅选择布局、指标网格、图表网格、订单摘要及无餐厅时的 onboarding。保留步骤 01 对 field 包装层的兼容调整。
- [x] 保留指标四列／两列、图表 `3fr / 2fr` 布局、18rem 图表容器高度及原断点，不让 ResponsiveContainer 的父级失去可计算尺寸。
- [x] 保留 Recharts 的数据、轴、tooltip、圆角和颜色属性；SVG 绘制参数继续通过库 API 配置，颜色可以继续引用入口主题变量。
- [x] 迁移推广价格、有效推广卡、购买卡、历史列表与确认区，保留移动端按钮拉伸和桌面对齐。
- [x] 将 promotion 页固定 28rem Skeleton 内联高度改成工具类；应用级 dashboard loading 已在步骤 02 处理。
- [x] 保留日历日期、金额、统计口径、推广有效期与购买确认行为；删除 CSS 导入、文件和旧 `owner-insights-*` 类，更新图表测试包装层中的遗留类名断言。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/modules/owner-insights src/routes
```

- 执行共同门禁；核对 375／768／1280px 指标、图表、选择控件和推广历史，以及原 47.99／63.99rem 边界。
- 覆盖无餐厅、零销量、多餐厅、有效／过期推广、提交中和确认弹层；图表始终保留可读文字摘要。
- 浏览器确认图表不是空白或高度为零，金额与日期显示未改变。

## Commit message

```text
♻️ refactor(web): migrate owner insights styles to tailwind

Replace analytics and promotion selectors with component utilities.
Preserve chart dimensions, metric grids and promotion history layouts.
Keep sales calculations, readable summaries and purchase flows intact.
```

## 执行记录

- 完成日期：2026-10-24。
- 实施：页头、指标、图表、订单摘要、onboarding、推广价格／历史／确认区已迁移为完整工具类；删除模块 CSS 及导入。Skeleton 使用 `h-[28rem]`。保留原 47.99／63.99rem 边界和 field 包装层；有效推广卡沿用步骤 01 后实际生效的白底和公共边框。
- 图表／指标／推广视觉证据：`C:\Users\yze\.codex\visualizations\2026\10\24\01a16c9d-0ed1-71d1-be37-653338d863c2`，`before-*`／`after-*` 截图与计算样式、`differences.json`、两组 `*-interactions.json`。临时入口复用真实组件和 fixture builders，时钟固定为 `2026-08-17T12:00:00Z`，未连接真实账户。
- 视觉检查：45 组场景／视口的采样计算样式最终无差异；包括 375／767／768／1023／1024／1280px 的指标、18rem 图表、推广卡／历史，以及无餐厅、零销量、有效／过期推广、空历史、加载、错误、未找到、确认、提交中、提交错误。截图实际检查图表柱形、文字摘要、金额日期及移动端重排。修正 `text-small` 附带行高造成的 0.7px 偏差，改为仅设置字号；保留 CSS 原 `start`／`end` 对齐值。
- 浏览器交互：餐厅切换到第二家、Escape 关闭确认后恢复焦点、确认购买后进入有效推广状态，前后结果一致。
- 命令与结果：定向测试 `pnpm --dir apps/web exec vitest run src/modules/owner-insights src/routes --maxWorkers=2 --hookTimeout=60000` 通过（7 个文件／27 项）；`pnpm --dir apps/web lint`、`pnpm --dir apps/web build`、`git diff --check` 通过。构建保留原大 chunk 提示。默认路由测试的动态导入在本机超过 10 秒 hook 限制；以 CLI `--hookTimeout=60000` 验证，不修改测试配置、不跳过测试。冷启动验证曾中止重试；TypeScript 解析诊断 `ts-resolution.log` 成功退出。
- 阻塞项：无。
