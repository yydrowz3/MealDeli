# 02：迁移应用布局、首页与平台状态

状态：未开始。前置：[01](./01-shared-ui.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移入口 CSS 中所有应用与首页选择器。覆盖 `src/app/layouts`、`pages`、`errors`、`routing`、`pwa/register.tsx`，以及路由和 composition 内属于应用级 loading 的固定内联样式。

## 实施步骤

- [ ] 迁移 Guest、Customer、Owner、Courier 布局、品牌链接和共享导航链接的类名；保持桌面导航、移动底部导航和侧栏的原显示断点。
- [ ] 保留 sticky 页头、固定底栏、内容最大宽度、安全区间距、购物车按钮和配送提示条的尺寸与层级。
- [ ] 迁移首页 hero、角色卡片、操作步骤、页尾及图片比例，保留 clamp 字号／间距、网格比例及移动布局。
- [ ] 迁移启动错误、应用错误边界、在线要求、私有内容门禁和会话骨架屏；保留恢复操作、角色属性及状态文案。
- [ ] 迁移 PWA 更新提示的定位、移动排列和层级，不更改注册策略、更新确认或服务工作线程策略。
- [ ] 将 `routes/dashboard.tsx`、`app/composition/order-route-content.tsx` 的固定 Skeleton 高度改成工具类；业务模块自身 loading 留到对应步骤。
- [ ] 从入口删除全部 `.app-*`、`.landing-*` 选择器及其媒体查询，清理组件中无样式作用的遗留类名。
- [ ] 入口此时仅保留导入、DaisyUI 插件、主题与全局基础设置；基础规则限定为原有 reset／box-sizing、页面字体背景、链接继承、触摸行为、平滑滚动及减少动态效果，不新增组件规则。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/app src/routes
```

- 执行共同门禁；对照四类布局、首页、错误页和会话加载页。
- 检查首页 640px 附近、Owner 侧栏 1024px 附近的实际原断点两侧行为，以及 375px 纵向页面是否被底栏遮挡。
- 从生产构建验证 PWA 更新提示布局；使用既有更新控制测试检查行为，不为视觉验证改动真实更新策略。

## Commit message

```text
♻️ refactor(web): migrate app layouts and landing styles

Express navigation, landing sections and platform states with utilities.
Keep responsive behavior, safe areas and update prompt placement.
Leave only theme definitions and global foundations in the entry CSS.
```

## 执行记录

- 完成日期：未完成。
- 命令与结果：未执行。
- 布局／首页／平台状态视觉证据：未执行。
- 阻塞项：待记录。
