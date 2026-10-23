# 10：迁移配送界面与地图样式

状态：未开始。前置：[09](./09-owner-insights.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/courier` 的接单、配送、完成界面与正常／回退地图，删除最后一个业务 CSS 文件 `courier.css`。

## 实施步骤

- [ ] 迁移 dashboard、活动／可接订单卡、最近配送、配送详情、警告、金额和完成状态，保持主布局列比例和移动重排。
- [ ] 保留 `767px` 边界、地图桌面 460px／移动端 48vh 最小高度和裁剪圆角；优先把类直接传给 MapContainer，不依赖旧 `.courier-leaflet-map .leaflet-container` 规则。
- [ ] Leaflet divIcon 配置使用静态完整工具类，保持三类 marker 的文字、2rem 尺寸、边框、阴影和颜色。通过库支持的尺寸参数协调 marker 定位，必要时仅局部 important 覆盖库内联尺寸，保留原实际视觉位置。
- [ ] 回退地图保留网格渐变背景、28px 网格尺寸、SVG 路线、stroke、圆头及 marker 位置；固定属性用工具类或 SVG 展示属性表达。
- [ ] 运行时仅保留路线进度的 strokeDasharray 和骑手坐标 left／top 等连续数值的 `style`；若使用 CSS 变量则变量值通过 style 传入，固定布局仍由工具类承担。不得生成无限种动态类名。
- [ ] 保留已完成／剩余路线、跳过地图、位置说明、署名、文字标签及 reduced-motion 处理；不改变路线模拟、定时器、持久化、接单或完成配送逻辑。
- [ ] 入口已在步骤 00 导入 Leaflet CSS，本步确认地图组件没有再次导入；第三方地图自身定位样式和 Recharts／Sonner 内部样式不重写。
- [ ] 删除模块 CSS 导入、文件和旧 `courier-*` 样式类，更新相关测试；数据测试标识与可访问标签按需要保留。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/modules/courier src/modules/orders
```

- 执行共同门禁；对照 375／768／1280px 正常地图、回退地图、dashboard、配送详情及完成状态。
- 在浏览器核对路线起点／中途／终点的三个 marker 和渐进路线，验证 tile failure 回退不阻断完成配送。
- 核对地图控件、署名、Skip map、reduced motion、键盘焦点及弹层始终位于地图之上。
- 单元测试继续使用 fake map／clock／storage，不请求真实位置或真实 tiles；浏览器视觉验证将正常地图与断网回退分别记录。

## Commit message

```text
♻️ refactor(web): migrate courier maps and views to tailwind

Move dispatch, delivery and fallback map styling into components.
Keep only runtime route coordinates and progress as inline values.
Preserve map markers, vendor rendering and delivery interactions.
```

## 执行记录

- 完成日期：未完成。
- 命令与结果：未执行。
- 正常／回退地图及配送视觉证据：未执行。
- 阻塞项：待记录。
