# 03：迁移身份认证与资料样式

状态：未开始。前置：[02](./02-app-shell.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/identity` 的页面与表单，删除 `identity.css`。范围包含登录、注册、邮箱提示／验证、重新发送邮件、资料编辑和相关加载／错误状态。

## 实施步骤

- [ ] 迁移页面居中、`100dvh` 高度、桌面卡片 440px 最大宽度和标题间距。
- [ ] 保留原 `639px` 移动边界、顶部对齐、32px 顶部间距、无边框／无阴影卡片，不直接更换成不等价断点。
- [ ] 迁移普通／紧凑表单间距、表单错误文案、注册确认复选框与错误缩进。
- [ ] 保留公共 Card 的默认样式和本模块覆盖效果，必要时仅在调用方使用 important 工具类覆盖边框。
- [ ] 移除页面、组件和模块出口中的 CSS 导入与旧 `identity-*` 类名，删除 `identity.css`。
- [ ] 保持表单校验、提交、认证、邮箱确认、redirect 和资料保存逻辑；同步修正现有测试中受类名移除影响的定位。

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

- 完成日期：未完成。
- 命令与结果：未执行。
- 认证／资料视觉与键盘证据：未执行。
- 阻塞项：待记录。
