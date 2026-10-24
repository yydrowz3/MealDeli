# 03：迁移身份认证与资料样式

状态：已完成（2026-10-24）。前置：[02](./02-app-shell.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/identity` 的页面与表单，删除 `identity.css`。范围包含登录、注册、邮箱提示／验证、重新发送邮件、资料编辑和相关加载／错误状态。

## 实施步骤

- [x] 迁移页面居中、`100dvh` 高度、桌面卡片 440px 最大宽度和标题间距。
- [x] 保留原 `639px` 移动边界、顶部对齐、32px 顶部间距和无阴影卡片，不直接更换成不等价断点；边框按实际层叠保留 1px，详见执行记录。
- [x] 迁移普通／紧凑表单间距、表单错误文案、注册确认复选框与错误缩进。
- [x] 保留公共 Card 的默认样式和本模块覆盖效果，必要时仅在调用方使用 important 工具类覆盖边框。
- [x] 移除页面、组件和模块出口中的 CSS 导入与旧 `identity-*` 类名，删除 `identity.css`。
- [x] 保持表单校验、提交、认证、邮箱确认、redirect 和资料保存逻辑；现有测试没有依赖被移除类名的定位，无需修改。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/modules/identity
```

- 执行共同门禁；对照 375／1280px 登录、注册、资料及邮箱状态界面，补查 639px 两侧。
- 检查密码可见性、输入错误、提交中、复选框、键盘焦点和错误摘要跳转。
- 模块内不再有本地 CSS 引入或旧身份样式类；公共组件 API 无变化。

## Commit message

```text
♻️ refactor(web): migrate identity forms to tailwind

Replace identity page and form selectors with component utilities.
Preserve mobile card treatment, validation and accessible field links.
Remove the identity stylesheet without changing authentication flows.
```

## 执行记录

- 完成日期：2026-10-24。
- 开始 HEAD：`fd94a17bb516f738e13fe6cc192874b10d4d1d3e`；步骤 02 已提交，工作区干净。
- 实现：四个页面、CheckEmail 与四个表单改为静态工具类；删除 `identity.css` 及模块出口导入，清除无样式用途的 `identity-checkbox-field`。保持公共组件 API、DOM 语义、表单属性、校验、认证、导航及资料保存逻辑。保留 `100dvh`、440px 卡片、24px／16px 表单顶部间距、16px 表单间隔和 28px 复选框错误缩进。
- 层叠与边界：原 CSS 的手机无边框声明已被步骤 01 保留原视觉的 important 类覆盖；迁移前实际为 1px solid 边框。因此按 README 的实际计算样式原则保留该边框，没有将旧的未生效声明变成视觉改版。`max-width: 639px` 仍为 inclusive 边界；使用任意属性保留 `align-items: start` 与 `box-shadow: none` 的精确计算值。
- 测试：初轮身份模块 12 个文件／67 项通过；最终清理临时源码后执行 `pnpm --dir apps/web exec vitest run src/modules/identity src/shared/ui/primitives/primitives.spec.tsx --maxWorkers=2 --hookTimeout=30000`，13 个文件／78 项通过。附加公共表单套件覆盖密码切换及错误摘要焦点回调；身份表单本身没有错误摘要，不添加新的交互。没有新增工具类名称断言，也没有修改测试配置；未重跑全量测试或覆盖率。
- 共同门禁：清理临时源码后的 `pnpm --dir apps/web lint`、`pnpm --dir apps/web build`、`git diff --check` 均通过。生产构建有既有的大 chunk 提示，成功生成 56 项 PWA precache；未修改依赖、构建配置或更新策略。
- 视觉证据目录（仓库外）：`C:\Users\yze\.codex\visualizations\2026\10\23\01a169bd-3521-7350-bcb1-dc92b6404688\identity`。复用步骤 00 的 Alex Example、`alex@example.test`、真实 GuestLayout／身份组件及本地 fake repository／identity test store；不使用真实账户或业务服务。通过 HEAD 的临时原组件副本与迁移后组件成对对照登录、注册、角色选择、资料、邮箱提示、未验证门禁及验证加载／成功／无效／网络错误，共 10 场景 × 375／639／640／1280px，统一高度 900px。
- 对照结果：`stable-computed.json` 与 `stable-differences.json` 记录最终 40 组关键样式及元素位置／尺寸，差异为空；`stable-original-*`／`stable-migrated-*` 保存稳定截图，`contact-375.png`／`contact-1280.png` 辅助目视核对。早期批量 full-page 截图出现未稳定画面，保留作诊断但不用于最终验收，也不宣称全页面所有像素完全相同。
- 浏览器交互：实际核对邮箱字段的 `aria-invalid`／`aria-describedby` 与错误边框、登录表单错误颜色、密码显隐、注册复选框 Space 切换及 14px／28px 错误文案、Tab 焦点与 3px info 轮廓、提交中禁用／`aria-busy`／隐藏内容占位／spinner／0.62 透明度、重发成功后的 30s 冷却禁用，以及资料保存成功和禁用 Role 字段。记录见 `login-errors.json`、`migrated-checkbox.json`、`signup-interaction.json`、`pending-keyboard.json`、`resend.json`、`profile-save.json`。
- 清理与审计：临时 HTML／TSX 及 HEAD 组件副本均已移出仓库，浏览器视口覆盖已重置；开发服务器已停止。自动生成的路由格式变化已还原。身份模块已无本地 CSS 引入、旧身份样式类或固定内联样式；不修改其他迁移步骤与产品历史进度。
- 阻塞项：无。本轮仅实施步骤 03，步骤 04–11 保持未开始。总览见证据目录内 `verification-report.json`。
