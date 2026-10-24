# 06：迁移购物车与结算样式

状态：已完成（2026-10-24）。前置：[05](./05-catalog.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/checkout` 页面、购物车、菜品定制、地址与确认操作，删除 `checkout.css`。

## 实施步骤

- [x] 迁移结算页最大宽度、留白、详情／摘要网格；保留 48rem 起生效的 `7fr / 5fr` 列比例、摘要最小宽度和 sticky 顶部位置。
- [x] 迁移购物车条目、计数器、选项描述、合计和移除按钮；保留失效条目的 `data-invalid` 语义及起始边框，不把“属性存在”误写成仅匹配字符串 true。
- [x] 保留计数器按钮最小点击尺寸以及抽屉结算按钮原有 2.25rem 高度，正确覆盖公共 Button 默认最小高度。
- [x] 将按钮内容 span 的 flex 对齐写到本组件显式子节点，或使用 Tailwind 后代变体，不恢复旧公共类名。
- [x] 迁移菜品选项 fieldset、单选／多选、附加价格、错误提示、地址编辑器和对话框操作区。
- [x] 保留金额计算、数量限制、跨餐厅确认、库存失效、地址校验与订单提交行为，不改原生表单语义。
- [x] 删除 CSS 导入、`checkout.css` 和旧 `checkout-*`／`dish-choice`／`dish-option*`／`dish-customizer` 样式类；现有测试没有依赖这些样式类或 CSS 路径，无需修改。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/modules/checkout
```

- 执行共同门禁；对照移动端抽屉／结算单列和桌面摘要，检查 48rem 边界两侧。
- 覆盖空购物车、长选项名、失效商品、数量边界、地址错误、提交中、失败重试与确认弹层。
- 验证键盘焦点、弹层关闭后焦点恢复和按钮内部图标／文字对齐。

## Commit message

```text
♻️ refactor(web): migrate cart and checkout styles to tailwind

Replace checkout, cart and dish option selectors with utilities.
Preserve invalid item states, sticky summaries and control sizing.
Keep cart persistence, pricing and order submission behavior intact.
```

## 执行记录

- 完成日期：2026-10-24。
- 开始 HEAD：`e4112fe1ee7de7a48f2d64747a4f798e8a19e416`；步骤 05 已提交，工作区干净。
- 实现：结算页、CartSummary、CartDrawer、DishCustomizer 和 CartDishCustomizer 的样式迁入静态工具类，移除 AddressEditor 和 CartSummary 无规则的壳类名，删除 `checkout.css` 及模块出口导入。保留全部业务逻辑、组件属性、数据流、原生表单及无障碍语义。
- 层叠与精确值：保留 72rem 最大宽度、48rem 起生效的 `minmax(0, 7fr) minmax(20rem, 5fr)`、20rem 摘要最小列宽和 sticky 16px 顶部位置。`data-[invalid]` 匹配属性存在，保持 4px 起始边框及 12px 缩进；不补齐未定义的 `--ui-*` 变量，保留原 fallback。计数器保持 44px 最小尺寸，抽屉结算按钮用局部 important 覆盖公共 Button 的 44px 最小高度，保持 36px。移除按钮按迁移前实际效果保留深绿色；两个图标按钮的直接内容 span 保持 inline-flex、居中与 8px 间隔。fieldset 同时明确零边框宽度与 none 样式，保留原 `border: 0` 的计算值；不改无附加价格时最后一个 span 的既有自动起始间距。
- 定向测试：`pnpm --dir apps/web exec vitest run src/modules/checkout --maxWorkers=2 --hookTimeout=30000` 通过，10 个文件／50 项，覆盖购物车持久化、数量／价格、选项校验、地址错误、失效商品、跨餐厅确认、下单失败与成功。没有新增工具类断言、修改测试配置或依赖；本步未重跑全量测试及覆盖率。
- 共同门禁：临时源码清理后的 `pnpm --dir apps/web lint`、`pnpm --dir apps/web build` 和 `git diff --check` 均通过。生产构建保留既有的大 chunk 提示，成功生成 56 项 PWA precache；未修改依赖、构建配置或更新策略。
- 视觉证据目录（仓库外）：`C:\Users\yze\.codex\visualizations\2026\10\24\01a16b72-3706-7ad1-9d57-42dbe8ffbfd2\checkout`。使用真实 CustomerLayout、结算／购物车／定制组件、现有 catalog／checkout fixture builders、Alex Example 身份 test store 及固定演示地址；身份和下单服务均为本地 fake，不访问真实账户或业务服务，不执行数据库 seed／迁移。
- 主场景：结算正常、地址编辑、失效商品和长名称／长选项覆盖 375／767／768／1280px；抽屉正常／空／锁定、数量 99、空购物车及定制弹层覆盖 375／768／1280px，共 34 组，统一高度 900px。`before-computed.json`／`after-computed.json` 记录所检查节点的关键计算样式及位置尺寸，`final-differences.json` 为空，全部场景无整页横向溢出。
- 动态补查：以 HEAD 原组件的临时副本与迁移组件成对核对结算正常、地址错误、下单失败、提交中、选项错误、已选选项、跨餐厅确认与移除确认，覆盖 375／1280px，共 16 对；`dynamic-computed.json`／`dynamic-differences.json` 保存记录，最终差异为空。原组件副本对旧类名加前缀以隔离样式；一次抽屉按钮前缀重复导致副本未匹配原规则，已修正副本并重新采集，不修改业务组件应对验证工具问题。
- 截图核对：`before-*`／`after-*` 和 `stable-*` 保存采集画面；部分批量截图仍出现未稳定或局部缺画，仅作诊断，不作为像素等价证据。已目视检查可靠画面的桌面双列、手机单列、错误字段、选项对齐及确认弹层，并另存 `verified-ready-1280.jpg`／`verified-removal-375.jpg`；不宣称全页面像素完全一致。
- 浏览器交互：实测必选项错误后焦点进入 fieldset、错误文字 `rgb(180, 35, 24)`；单选与多选上限、附加价格、数量变化及 $34.98 合计；跨餐厅保留／替换确认、保留后焦点返回 Add 按钮；抽屉数量从 $14.49 增至 $28.98、减至 1 后确认移除、保留后返回计数器、Tab 顺序及确认弹层内循环、Escape 关闭普通抽屉后恢复 Cart 按钮。数量 99 时加号禁用，锁定抽屉按钮禁用且 Escape 不关闭。地址为空时 `aria-invalid` 与错误关联保留，填写并失焦校验后保存成功；失败下单保留购物车，重试后返回演示订单并清空；提交中为 disabled、`aria-busy`、内容隐藏占位、0.62 透明度与 800ms spinner；失效条目移除后进入空状态。见 `interactions.json`。
- 既有交互边界：临时验证页中的嵌套定制／跨餐厅弹层按 Escape 会同时关闭两层，焦点落到 body；HEAD 原组件与迁移组件结果一致（`nested-escape-baseline.json`）。本步保持该既有行为；普通弹层关闭和按钮取消的焦点恢复已单独验证，不将嵌套 Escape 记为焦点恢复通过。
- 清理与审计：临时 HTML／TSX、原组件副本与隔离 CSS 已移出仓库，浏览器视口已重置，验证标签页和开发服务器已关闭；最终构建后已还原自动生成的路由格式变化。结算模块已无自有 CSS 引入、旧样式类或固定内联样式；公共组件 API 无变化。总览见证据目录内 `verification-report.json`。
- 阻塞项：无。本轮仅实施步骤 06，步骤 07–11 保持未开始；嵌套 Escape 的既有行为如上记录。
