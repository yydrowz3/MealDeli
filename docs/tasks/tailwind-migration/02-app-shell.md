# 02：迁移应用布局、首页与平台状态

状态：已完成（2026-10-24）。前置：[01](./01-shared-ui.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移入口 CSS 中所有应用与首页选择器。覆盖 `src/app/layouts`、`pages`、`errors`、`routing`、`pwa/register.tsx`，以及路由和 composition 内属于应用级 loading 的固定内联样式。

## 实施步骤

- [x] 迁移 Guest、Customer、Owner、Courier 布局、品牌链接和共享导航链接的类名；保持桌面导航、移动底部导航和侧栏的原显示断点。
- [x] 保留 sticky 页头、固定底栏、内容最大宽度、安全区间距、购物车按钮和配送提示条的尺寸与层级。
- [x] 迁移首页 hero、角色卡片、操作步骤、页尾及图片比例，保留 clamp 字号／间距、网格比例及移动布局。
- [x] 迁移启动错误、应用错误边界、在线要求、私有内容门禁和会话骨架屏；保留恢复操作、角色属性及状态文案。
- [x] 迁移 PWA 更新提示的定位、移动排列和层级，不更改注册策略、更新确认或服务工作线程策略。
- [x] 将 `routes/dashboard.tsx`、`app/composition/order-route-content.tsx` 的固定 Skeleton 高度改成工具类；业务模块自身 loading 留到对应步骤。
- [x] 从入口删除全部 `.app-*`、`.landing-*` 选择器及其媒体查询，清理组件中无样式作用的遗留类名。
- [x] 入口此时仅保留导入、DaisyUI 插件、主题与全局基础设置；基础规则限定为原有 reset／box-sizing、页面字体背景、链接继承、触摸行为、平滑滚动及减少动态效果，不新增组件规则。

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

- 完成日期：2026-10-24。
- 开始 HEAD：`c1c22c8650347d95dea18f211d580445ea9e9b5e`；步骤 01 已提交，工作区干净。
- 实现：四类布局、品牌／共享导航、首页、启动／离线／资源加载／错误边界页面、私有内容门禁和 PWA 更新提示均改为静态工具类。保留所有语义属性、文案、链接和操作回调；OnlineRequired 继续复用已迁移的 OfflinePage。Dashboard 与 checkout composition 的固定 Skeleton 高度分别改为 `h-128`（32rem）、`h-112`（28rem），业务模块 loading 未提前迁移。
- 入口：删除全部 `.app-*`、`.landing-*` 选择器及对应媒体查询，仅保留导入、DaisyUI、主题／动画、变量兼容别名和原有全局基础规则。现有链接颜色继承移到 `@layer base`，使显式链接颜色工具类保留原有优先级；未新增组件选择器、`@apply` 或组件 style 标签。
- 层叠与断点：保留 `39.999rem`、`63.999rem` 的原 inclusive max-width 边界。首次对照发现重叠任意媒体变体排序会让手机角色网格错误显示为两列，最终将中间区间写为 `39.999rem < width <= 63.999rem`，与手机单列互斥。按原实际样式保留访客注册链接 650 字重、错误边界眉题 muted 色、单侧边框颜色、`border: 0` 的 none 样式，以及 PWA 原始 transform／shadow。
- 定向测试：实施初轮及最终清理后均执行 `pnpm --dir apps/web exec vitest run src/app src/routes --maxWorkers=2 --hookTimeout=30000`，两次均为 16 个文件／70 项通过。沿用步骤 01 的两个 worker 与 30 秒初始化 hook 预算，未修改测试配置；现有测试使用角色、文案、属性和操作查询，无需替换旧样式类断言。本步骤未额外执行全量测试或覆盖率。
- 共同门禁：清理临时源码后的 `pnpm --dir apps/web lint`、`pnpm --dir apps/web build`、`git diff --check` 全部通过。正常生产构建生成 56 项 PWA precache；仍有既有的大 chunk 提示，不影响成功退出。
- 视觉证据目录（仓库外）：`C:\Users\yze\.codex\visualizations\2026\10\23\01a1698d-9b23-7302-988a-56ff2f561d26\app-shell`。`before-layouts-*`／`verified-layouts-*` 记录首页及顾客、商家、配送布局，共 4 个场景 × 375／639／640／768／1023／1024／1280px；`before-states-*`／`verified-states-computed.json` 记录启动、离线、chunk 错误、根错误边界、会话骨架、角色拒绝与更新提示，共 7 个场景 × 375／768／1280px，统一高度 900px。最终 49 组所记录关键计算样式无差异，见 `verified-layout-diff.json`、`verified-state-diff.json`；另保存截图并目视对照，不据此宣称所有像素完全一致。
- 数据与隔离：复用步骤 00 的临时真实组件页面、fixtures、identity test store、fake services、原图片和导航数据，补充确定性平台状态与长内容布局场景。未接入真实账户、改权限、seed 数据或访问真实业务接口。
- 生产 PWA 视觉验收：临时构建配置仅在原 Vite 配置上增加验证 HTML input，并将结果输出到证据目录的 `production`。通过现有 register 注入接口触发真实 PwaUpdatePrompt 的 ready 状态；375／768／1280px 的生产布局与迁移前一致，见 `production-update-diff.json`。实际点击 Later 后提示消失；Reload／显式激活和更新控制行为由既有测试覆盖。未注册或激活真实 service worker，未修改更新、缓存或注册策略；正式门禁使用原构建配置。
- 键盘与滚动：375×900、隐藏临时场景导航的长页面中，三类角色的页末按钮底部均为 804px，固定底栏顶部 839px、底部 900px，内容未被遮挡；顾客／配送 sticky 页头滚动后仍在 top 0。Tab 从页末按钮进入对应移动导航，保留 `aria-current=page`；记录见 `keyboard-scroll.json`。生产首页 CTA hover 实测为 jade-dark 背景、surface 文字、700 字重，见 `link-hover.json`。原安全区公式及 reduced-motion 规则保留，当前浏览器安全区 inset 为零，未模拟非零 inset 或 reduced-motion。
- 清理与审计：临时 HTML／TSX／构建配置已移出仓库，生成路由格式变化已还原；应用源码不再使用旧 `app-*`／`landing-*` 样式类，入口没有组件规则，app／routes 范围内已无固定内联 style。证据总览为目录内 `verification-report.json`。
- 阻塞项：无。仅完成步骤 02，步骤 03–11 保持未开始。
