# 04：迁移图片上传与预览样式

状态：已完成（2026-10-24）。前置：[03](./03-identity.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/media/components/image-field.tsx` 和 `image-preview.tsx`，删除 `image-field.css`。步骤 01 已处理选择按钮对裸公共按钮类的依赖，本步完成其余样式。

## 实施步骤

- [x] 迁移字段网格、label、描述、状态、错误文字和可换行按钮区，保持字重、字号及间距。
- [x] 保留预览图 16:9 比例、24rem 最大宽度、object-fit、背景、边框与圆角。
- [x] 用等价 Tailwind 可访问隐藏类处理 file input，保持 input 可通过键盘访问及 label 可触发选择。
- [x] 核对现有 DOM 及浏览器焦点：input 与选择 label 隔着 actions 包装层，旧相邻选择器未生效。保留实际聚焦表现，并验证 label 的既有触发和键盘行为；未新增可见焦点行为。
- [x] 保留选择、上传、取消／移除、文件错误和提交中状态，不改文件校验、上传端口和 object URL 生命周期。
- [x] 删除 CSS 导入、样式文件和旧 `media-image-field*` 类名；现有测试没有依赖被移除类名或 CSS 路径的定位，无需修改。

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

- 完成日期：2026-10-24。
- 开始 HEAD：`f22eaf84ea95fff6e3586b9bb4ddb653047e72d0`；步骤 03 已提交，开始时工作区干净。
- 实现：ImageField 的字段网格、650 字重 label、描述／状态／错误文字、flex 换行按钮区和隐藏 file input，以及 ImagePreview 的 16:9 比例、24rem 最大宽度、cover 裁切、背景、边框与圆角均迁入组件静态工具类。删除 `image-field.css` 及其导入，移除全部 `media-image-field*` 类名；公共组件 API、文件属性、校验、请求取消、状态转换和 object URL 生命周期保持原样。
- 隐藏与焦点：使用 1px 绝对定位、overflow、clip、clip-path 与 nowrap 的等价工具类组合，保留原隐藏尺寸及可聚焦性。浏览器确认旧相邻选择器不匹配实际 DOM；迁移前后 file input 均可获得 `:focus-visible`，选择 label 均没有来自该选择器的可见轮廓。保留实际行为，未补写 peer／后代焦点规则，也未改变 DOM 或 label 触发方式。
- 定向测试：清理临时源码后执行 `pnpm --dir apps/web exec vitest run src/modules/media src/modules/identity/components/profile-form.spec.tsx src/modules/owner-management/components --maxWorkers=2 --hookTimeout=30000`，5 个文件／30 项通过。覆盖文件类型／尺寸校验、上传接口、替换／卸载时 object URL 回收、失败重试、取消、移除、上传状态以及资料／商家表单；没有新增类名断言或修改测试配置。本步未重跑全量测试或覆盖率。
- 共同门禁：清理临时源码后的 `pnpm --dir apps/web lint`、`pnpm --dir apps/web build`、`git diff --check` 均通过。生产构建保留既有的大 chunk 提示，成功生成 56 项 PWA precache；未修改依赖、构建配置或更新策略。
- 视觉证据目录（仓库外）：`C:\Users\yze\.codex\visualizations\2026\10\23\01a169bd-3521-7350-bcb1-dc92b6404688\media`。使用真实 ProfilePage、RestaurantForm、DishForm 和 ImageField；复用 Alex Example 会话、catalog／owner fixture builders、现有品牌 PNG 和 `createFakeUploader`，补充本地确定性的上传中、失败及文件错误场景。未使用真实账户、上传服务或数据库操作。
- 响应式对照：资料无图／预览／上传中／失败、餐厅无图／预览／上传中／失败／文件类型错误，以及菜品预览，共 10 个场景 × 375／768／1280px，统一高度 900px。`before-*`／`after-*` 保存截图和计算样式，`style-differences.json` 中最终 30 组字段及子元素的关键样式、尺寸和位置差异为空。目视核对预览裁切、边框、文字与窄屏按钮换行；`contact-375.png`／`contact-1280.png` 为辅助对照，不作为全页面像素完全一致的声明。
- 浏览器交互：迁移前后分别通过选择 label 打开文件选择器，选择仓库品牌 PNG 的本地副本，由 fake uploader 接收；迁移后另确认 file input 的 Enter 选图及移除。Tab 从 file input 进入 Remove image，保留 3px info 聚焦轮廓。商家上传中禁用提交；取消后保留预览、显示 Upload image 并恢复提交；重新上传回到 uploading；失败保留 `aria-invalid`／描述和错误关联，Try again 成功后清除错误。见 `before-focus.json`／`after-focus.json`、`before-tab.json`／`after-tab.json`、`activation-removal.json` 和 `upload-checks.json`。
- 清理与审计：临时 HTML／TSX 已移到证据目录，浏览器视口已重置，验证标签页及开发服务器已关闭；自动生成的路由格式变化已还原。图片模块无自有 CSS 引入、旧图片字段类、旧公共按钮类或固定内联样式。总览见 `verification-report.json`。
- 阻塞项：无。本轮仅实施步骤 04，步骤 05–11 保持未开始。
