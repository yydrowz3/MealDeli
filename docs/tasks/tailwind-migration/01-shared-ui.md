# 01：迁移公共 UI 并解除旧类名依赖

状态：未开始。前置：[00](./00-foundation.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

将 `src/shared/ui/styles.css` 的全部规则迁入公共组件，同时解决尚未迁移业务模块对 `.ui-*` 的依赖，使本次提交后所有模块仍保持原有外观。

## 实施步骤

- [ ] 迁移 Button、Card、Input、PasswordInput、Textarea、Select 和 FormErrorSummary，保持现有导出、属性、默认值及 `className` 传递位置。
- [ ] 按完整类名映射实现按钮四种 variant、三种 size、icon-only、loading 和 disabled；保留加载时内容隐藏占位、spinner 的定位及 800ms 旋转周期。
- [ ] 迁移控件边框、错误状态、聚焦轮廓、密码切换按钮、textarea 最小高度和 resize；保留 label、description、error 与控件的关联。
- [ ] 迁移 Modal／Drawer 的遮罩、滚动、圆角、宽高、头尾间距和 `z-index: 1100`；保留 Portal、焦点约束、Escape、提交中不可关闭及焦点恢复行为。
- [ ] 迁移 Badge 全部 tone、Skeleton、异步状态、ConnectionBanner、金额等展示组件及 ChartFrame／MapFrame；Sonner 继续使用自身渲染机制。
- [ ] 将 spin 和 pulse 定义放入入口主题动画，保留 pulse 的 1.5s 周期及 50% 时 0.55 的透明度，保留减少动态效果行为。
- [ ] 同步修复跨模块依赖：会话骨架屏和订单 loading 的子节点尺寸直接设在 Skeleton 调用处；商家页头按钮的移动端宽度直接设在对应 Button；推广卡按钮的对齐直接设在对应 Button。
- [ ] 商家分析页头 Select 的 field 外层没有公开 `className` 参数：增加纯布局包装层表达原有 15rem／移动端 0 的最小宽度，不改变公共表单 API，并删除依赖 `.ui-field` 的原规则。
- [ ] 图片选择控件的 label 直接使用等价工具类替换裸 `ui-button` 类；保留 label／file input 关联，不将 label 换成改变触发行为的元素。
- [ ] 删除以上已迁移的业务 CSS 后代规则，以及入口中 `.app-session-skeleton .ui-skeleton` 规则；其他业务样式留待对应步骤处理。
- [ ] 移除所有公共 UI 旧样式类，删除 `styles.css` 及入口和公共出口的导入。更新依赖旧类名的测试，用角色、状态、可访问属性或必要的稳定测试标识查询节点。

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

- 完成日期：未完成。
- 命令与结果：未执行。
- 公共组件及跨模块视觉证据：未执行。
- 阻塞项：待记录。
