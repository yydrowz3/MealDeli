# 10：迁移配送界面与地图样式

状态：已完成（2026-10-24）。前置：[09](./09-owner-insights.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/courier` 的接单、配送、完成界面与正常／回退地图，删除最后一个业务 CSS 文件 `courier.css`。

## 实施步骤

- [x] 迁移 dashboard、活动／可接订单卡、最近配送、配送详情、警告、金额和完成状态，保持主布局列比例和移动重排。
- [x] 保留 `767px` 边界、地图桌面 460px／移动端 48vh 最小高度和裁剪圆角；优先把类直接传给 MapContainer，不依赖旧 `.courier-leaflet-map .leaflet-container` 规则。
- [x] Leaflet divIcon 配置使用静态完整工具类，保持三类 marker 的文字、2rem 尺寸、边框、阴影和颜色。通过库支持的尺寸参数协调 marker 定位，必要时仅局部 important 覆盖库内联尺寸，保留原实际视觉位置。
- [x] 回退地图保留网格渐变背景、28px 网格尺寸、SVG 路线、stroke、圆头及 marker 位置；固定属性用工具类或 SVG 展示属性表达。
- [x] 运行时仅保留路线进度的 strokeDasharray 和骑手坐标 left／top 等连续数值的 `style`；若使用 CSS 变量则变量值通过 style 传入，固定布局仍由工具类承担。不得生成无限种动态类名。
- [x] 保留已完成／剩余路线、跳过地图、位置说明、署名、文字标签及 reduced-motion 处理；不改变路线模拟、定时器、持久化、接单或完成配送逻辑。
- [x] 入口已在步骤 00 导入 Leaflet CSS，本步确认地图组件没有再次导入；第三方地图自身定位样式和 Recharts／Sonner 内部样式不重写。
- [x] 删除模块 CSS 导入、文件和旧 `courier-*` 样式类，更新相关测试；数据测试标识与可访问标签按需要保留。

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

- 完成日期：2026-10-24。
- 实施：配送 dashboard、活动／可接订单卡、最近配送、详情、完成状态和正常／回退地图已迁入组件。保留 767px 边界、460px／48vh 最小高度、28px 渐变网格及 SVG 绘制参数。入口继续唯一引入 Leaflet CSS；删除 `courier.css` 和模块导入。
- Marker 兼容：divIcon 的静态完整类使用局部 `grid!` 覆盖 Leaflet unlayered `display: block`。通过 `iconSize: [32, 32]` 设置尺寸，`iconAnchor: [6, 6]` 保持原默认 12px divIcon 被 CSS 放大后的实际偏移；未顺带校正定位。保留 999px 圆角、原阴影及三种颜色，未使用无限动态类。
- 动态 style 例外：仅回退路线 `strokeDasharray` 与骑手 `left`／`top` 两处运行时数值；固定布局及 pickup／destination 坐标均为工具类，路径 stroke 等由 SVG 属性表达。持久化、计时器、接单和完成逻辑未修改。
- 正常／回退地图及配送视觉证据：`C:\Users\yze\.codex\visualizations\2026\10\24\01a16c9d-0ed1-71d1-be37-653338d863c2\courier`。65 组 `before-*`／`after-*` 截图与计算样式最终无差异，比较结果在 `differences.json`。正常地图实际加载 OSM 瓦片；失败场景在浏览器拦截瓦片请求，不依赖真实账户或定位。临时入口、数据与捕获脚本保存在仓库外。
- 场景：375／767／768／1280px dashboard、配送详情及正常／回退地图；地图分别记录进度 0／12／25（起点／中途／终点）。另有可接单、空列表、多个活动配送告警、loading／error／未找到、接单中、完成确认／提交中／完成画面。核对 marker、已完成／剩余路线、缩放控件、署名和文字说明；瓦片加载时机不同不作为像素一致的依据。
- 浏览器交互：Skip map 聚焦详情、减少动态效果时手动推进且暂停自动推进、正常动态效果时定时推进、弹层高于地图、Tab／Shift+Tab 焦点循环、Escape 后恢复焦点全部通过。断网回退后仍可确认完成配送，见 `extended-interactions.json` 和 `offline-completed-1280.png`。
- 命令与结果：定向测试 `pnpm --dir apps/web exec vitest run src/modules/courier src/modules/orders --maxWorkers=2 --hookTimeout=60000` 通过（9 个文件／62 项）。首次迁移误替换 fallback 测试标识，已恢复原 `data-testid` 并重跑通过；未改动测试来掩盖失败。最终 `pnpm --dir apps/web lint`、`pnpm --dir apps/web build`、`git diff --check` 通过；最后的 map 定向复查也通过。保留原大 chunk 提示。
- 阻塞项：无。
