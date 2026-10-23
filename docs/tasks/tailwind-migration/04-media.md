# 04：迁移图片上传与预览样式

状态：未开始。前置：[03](./03-identity.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/media/components/image-field.tsx` 和 `image-preview.tsx`，删除 `image-field.css`。步骤 01 已处理选择按钮对裸公共按钮类的依赖，本步完成其余样式。

## 实施步骤

- [ ] 迁移字段网格、label、描述、状态、错误文字和可换行按钮区，保持字重、字号及间距。
- [ ] 保留预览图 16:9 比例、24rem 最大宽度、object-fit、背景、边框与圆角。
- [ ] 用等价 Tailwind 可访问隐藏类处理 file input，保持 input 可通过键盘访问及 label 可触发选择。
- [ ] 迁移焦点提示前先核对现有 DOM：input 与选择 label 隔着 actions 包装层，旧相邻选择器可能未生效。保留实际聚焦表现，并验证 label 的既有触发和键盘行为；若要新增可见焦点行为，单独向用户确认，不在样式等价迁移中顺带修复。
- [ ] 保留选择、上传、取消／移除、文件错误和提交中状态，不改文件校验、上传端口和 object URL 生命周期。
- [ ] 删除 CSS 导入、样式文件和旧 `media-image-field*` 类名，更新受影响测试。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/modules/media src/modules/identity/components/profile-form.spec.tsx src/modules/owner-management/components
```

- 执行共同门禁；在资料与商家表单中核对无图片、有预览、上传中、错误及窄屏按钮换行。
- 使用 fake uploader 验证业务行为，避免为样式验证上传真实文件；键盘和 label 触发另做浏览器核对。
- 图片模块不再依赖任何 CSS 文件和旧公共按钮类。

## Commit message

```text
♻️ refactor(web): migrate image upload styling to tailwind

Move image field, preview and action layout styles into components.
Preserve file input activation, upload states and preview sizing.
Remove the media stylesheet without changing upload behavior.
```

## 执行记录

- 完成日期：未完成。
- 命令与结果：未执行。
- 上传／预览／键盘验证证据：未执行。
- 阻塞项：待记录。
