# 09：迁移经营分析与推广样式

状态：未开始。前置：[08](./08-owner-management.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/owner-insights` 的 Dashboard、指标卡、图表和推广界面，删除 `owner-insights.css`。

## 实施步骤

- [ ] 迁移页头、餐厅选择布局、指标网格、图表网格、订单摘要及无餐厅时的 onboarding。保留步骤 01 对 field 包装层的兼容调整。
- [ ] 保留指标四列／两列、图表 `3fr / 2fr` 布局、18rem 图表容器高度及原断点，不让 ResponsiveContainer 的父级失去可计算尺寸。
- [ ] 保留 Recharts 的数据、轴、tooltip、圆角和颜色属性；SVG 绘制参数继续通过库 API 配置，颜色可以继续引用入口主题变量。
- [ ] 迁移推广价格、有效推广卡、购买卡、历史列表与确认区，保留移动端按钮拉伸和桌面对齐。
- [ ] 将 promotion 页固定 28rem Skeleton 内联高度改成工具类；应用级 dashboard loading 已在步骤 02 处理。
- [ ] 保留日历日期、金额、统计口径、推广有效期与购买确认行为；删除 CSS 导入、文件和旧 `owner-insights-*` 类，更新图表测试包装层中的遗留类名断言。

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

- 完成日期：未完成。
- 命令与结果：未执行。
- 图表／指标／推广视觉证据：未执行。
- 阻塞项：待记录。
