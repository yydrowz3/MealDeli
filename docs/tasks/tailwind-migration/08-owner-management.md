# 08：迁移商家餐厅与菜单管理样式

状态：已完成（2026-10-24）。前置：[07](./07-orders.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/owner-management` 的全部页面与组件，删除 `owner-management.css`，同时处理本模块页面中的固定 Skeleton 内联高度。

## 实施步骤

- [x] 迁移餐厅列表、创建、概览、设置、菜单管理页以及 restaurant selector、餐厅／菜品表单、订单操作和新订单通知。
- [x] 保留普通／窄版页面宽度、卡片图片与占位、摘要网格、餐厅 hero、菜品行和移动重排。
- [x] 核对 `--space-5`、`--color-text-muted`、`--color-surface-muted`、`--radius-lg` 等旧声明的实际计算结果；未定义时不擅自赋予新的“合理”视觉值。
- [x] 迁移菜品选项构建器的选项／选择／限制网格、警告文案及表单按钮区，保持删除和新增控件的布局。
- [x] 迁移危险操作区和固定新订单通知的层级、阴影、间距与移动端左右定位；步骤 01 已迁移页头按钮的宽度规则，本步统一清理遗留布局类。
- [x] 将创建、列表、概览、菜单、设置页面的所有固定 Skeleton 高度改成工具类，保留 13／24／28／30rem 等现有尺寸。
- [x] 保留表单、上传、删除确认、订单动作与实时通知逻辑。删除 CSS 导入、文件及 `owner-*` 旧样式类，更新测试。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/modules/owner-management src/modules/media
```

- 执行共同门禁；核对 375／768／1280px 的五类商家页面以及原 47.99rem 边界。
- 覆盖无餐厅、多餐厅、长菜品名、无图片、多级选项、保存中、危险确认和新订单通知。
- 不通过补主题 token 修复原有设计缺陷；需要改变外观的事项单独记录并询问。

## Commit message

```text
♻️ refactor(web): migrate owner management styles to tailwind

Move restaurant, menu and settings layouts into their components.
Replace fixed skeleton styles and preserve option builder layouts.
Keep existing computed visuals, management actions and notifications.
```

## 执行记录

- 完成日期：2026-10-24。
- 开始 HEAD：`55919891d236f3959961fac2fe08b9f4f15cea57`；步骤 07 已提交，工作区干净。
- 实现：餐厅列表、创建、概览、菜单与设置页，以及餐厅／设置／菜品表单、订单通知和订单动作包装层均改为静态工具类。RestaurantSelector 已由公共 Select 承担样式，无旧规则需要迁移；保留其原实现。删除 `owner-management.css` 及模块出口导入，移除全部旧 `owner-*` 样式类。组件 API、表单校验、上传、原生语义、删除确认、选择持久化、订单动作、实时订阅及导航回调保持不变。
- 精确值与未定义变量：保留普通页面 90rem／窄页 50rem 最大宽度、24px／移动端 16px 内边距和原 47.99rem inclusive max-width 边界。浏览器确认 `--space-5`、`--color-text-muted`、`--color-surface-muted`、`--font-size-sm`、`--font-size-2xl` 为空；继续引用原变量，不新增 fallback 或 token，保留零实际 gap／padding、继承色与字号、无渐变背景的原有结果。`--radius-lg`／`--radius-md` 实际为 0.5／0.375rem，`--shadow-lg` 为原两段阴影；均按实际值保留。原餐厅卡片 24px 内边距及危险区中性边框的局部 important 兼容继续保留。
- 布局与状态：保留餐厅图片 16:9、概览图片 14rem 高、菜品图片桌面 9×7rem／移动端 100%×10rem；摘要桌面 repeat(3, 1fr)／手机两列、近期订单与菜品行移动重排、选项与选择／限制网格。选择行保留 `align-items: end` 与单侧边框色。新订单通知仍为 z-index 60、26rem 最大宽度、桌面右下 24px／手机左右及底部 16px；Modal／Drawer 继续使用公共组件。固定 Skeleton 高度改为 `h-52`／`h-96`／`h-112`／`h-120`，分别保持 13／24／28／30rem。
- 定向测试：`pnpm --dir apps/web exec vitest run src/modules/owner-management src/modules/media --maxWorkers=2 --hookTimeout=30000` 通过，9 个文件／61 项。沿用前序步骤两个 worker 和 30 秒初始化 hook 预算，不修改测试配置、覆盖率阈值或业务断言。现有测试不依赖旧样式类／CSS 路径，因此无需替换断言；未添加镜像工具类名称的测试，未额外执行全量测试与覆盖率。日志为证据目录中的 `targeted-tests.log`。
- 共同门禁：清理临时验证入口后的 `pnpm --dir apps/web lint`、`pnpm --dir apps/web build` 和 `git diff --check` 均通过。生产构建生成 56 项 PWA precache，保留既有的大 chunk 与插件耗时提示，成功退出；日志分别为 `lint.log`、`build.log`。未修改构建配置或 PWA 策略。
- 视觉证据目录（仓库外）：`C:\Users\yze\.codex\visualizations\2026\10\24\01a16bd6-7797-75e3-8edc-bed2a7e4c928\owner-management`。复用步骤 00 的真实商家布局与组件、owner-management／catalog fixture builders；Date.now 固定在 `2026-08-17T12:00:00Z`。补充第二餐厅、本地 hero 图片、长菜品名和两组选项／每组两个选择，创建场景使用符合既有 UUID 校验的固定分类 ID。repository、导航与订阅均为本地 fake；未访问真实账户／API，未执行真实上传、数据库 seed 或迁移，未改路由／权限准备截图。
- 场景矩阵：28 个场景 × 375／768／1280px，加上列表、创建、概览、菜单、设置、复杂选项与通知的 767px 边界，共 91 组，统一高度 900px。覆盖五类页面、空餐厅／菜单、图片与占位、长菜品、多级选项、移除警告、不同页面加载／错误／缺失、编辑抽屉、餐厅／菜品／设置删除确认、创建提交中、订单动作失败、通知与断线提示。`before-computed.json`／`after-computed.json` 保存关键计算样式和位置尺寸；忙碌按钮内旋转节点的连续几何值不作静态比较。`final-differences.json` 为空，旧变量记录全部一致，所有场景无整页横向溢出。
- 截图与目视：批量 `before-*`／`after-*` PNG 部分出现未绘制画面，仅作诊断。另保存并目视检查稳定截图：`verified-restaurants-1280.png`、`verified-delete-1280.png`、`verified-create-375.png`、`verified-menu-375.png`、`verified-editor-375.png`、`verified-overview-768.png`、`verified-settings-768.png`、`verified-notifier-375.png`、`verified-dish-form-1280.png`。桌面图片与卡片、手机菜品重排、表单、抽屉、双列选项、摘要、危险确认与通知布局正常；不宣称全部页面像素完全一致。通知的临时触发按钮单独放在验证层，避免被固定通知或底栏遮挡；该调整仅存在于已移出仓库的验证入口。
- 浏览器交互：实测餐厅必填错误关联与有效创建、菜单／订单导航、多餐厅选择；餐厅删除后保留第二餐厅；选择项新增／删除、仅剩一个选择时禁用删除、移除已有选项的快照警告（`rgb(118, 80, 15)`）、菜品保存及删除；编辑抽屉 Escape 关闭并恢复到 Edit。删除确认内正／反向 Tab 保持焦点，3px info 轮廓保留，Escape 关闭后回到 Delete restaurant。设置页初始保存禁用、编辑后启用、提交中 disabled／aria-busy／内容 hidden／透明度 0.62／800ms spinner、保存成功提示与禁用重置，以及危险确认取消均通过。概览固定数据销售额为 $38.99；通知查看、去重、关闭与 fake stream 断线提示通过。结果见 `interactions.json`。不将 fake stream 检查视为真实网络恢复验收；上传与订单权威回查等逻辑由现有定向测试覆盖，全局 reduced-motion 规则未修改，本步未另行模拟该偏好。
- 清理与审计：临时 HTML／TSX 已移至证据目录，开发服务器与本步验收标签页已关闭，视口已重置。正式门禁使用原 Vite 配置；构建生成的路由格式变化在结束后还原。模块没有固定内联 style、组件 style 标签或自有 CSS 导入；后端、依赖／锁文件、GraphQL 生成文件与业务契约未改动。源码此时仅余入口、owner-insights 与 courier 三个 CSS 文件。证据总览为 `verification-report.json`。
- 阻塞项：无。本轮仅实施步骤 08，步骤 09–11 保持未开始。
