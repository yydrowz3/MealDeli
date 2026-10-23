# 06：迁移购物车与结算样式

状态：未开始。前置：[05](./05-catalog.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/checkout` 页面、购物车、菜品定制、地址与确认操作，删除 `checkout.css`。

## 实施步骤

- [ ] 迁移结算页最大宽度、留白、详情／摘要网格；保留 48rem 起生效的 `7fr / 5fr` 列比例、摘要最小宽度和 sticky 顶部位置。
- [ ] 迁移购物车条目、计数器、选项描述、合计和移除按钮；保留失效条目的 `data-invalid` 语义及起始边框，不把“属性存在”误写成仅匹配字符串 true。
- [ ] 保留计数器按钮最小点击尺寸以及抽屉结算按钮原有 2.25rem 高度，正确覆盖公共 Button 默认最小高度。
- [ ] 将按钮内容 span 的 flex 对齐写到本组件显式子节点，或使用 Tailwind 后代变体，不恢复旧公共类名。
- [ ] 迁移菜品选项 fieldset、单选／多选、附加价格、错误提示、地址编辑器和对话框操作区。
- [ ] 保留金额计算、数量限制、跨餐厅确认、库存失效、地址校验与订单提交行为，不改原生表单语义。
- [ ] 删除 CSS 导入、`checkout.css` 和旧 `checkout-*`／`dish-choice`／`dish-option*`／`dish-customizer` 样式类，更新相关测试。

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

- 完成日期：未完成。
- 命令与结果：未执行。
- 购物车／结算／定制弹层视觉证据：未执行。
- 阻塞项：待记录。
