# 05：迁移餐厅发现与菜单样式

状态：未开始。前置：[04](./04-media.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/catalog` 页面和组件，删除 `catalog.css`，覆盖发现页、菜单页、搜索、分类、分页、图片和商品卡片，以及购物车插槽布局。

## 实施步骤

- [ ] 将发现页标题、地址、搜索栏、分类横条、结果标题和分页布局写入各组件。
- [ ] 分类选中状态保留 `aria-pressed`，使用属性变体或显式完整类名，保持键盘操作和横向滚动。
- [ ] 迁移餐厅卡、菜品卡、图片占位和加载骨架屏，保留图片比例、截断／换行、价格位置及卡片点击区域。
- [ ] 迁移菜单 hero、返回操作、餐厅信息、菜品网格及购物车 sidebar／mobile slot，保留原断点和无购物车时的布局分支。
- [ ] 检查公共 Card 默认 padding 与模块原覆盖规则，使用明确工具类覆盖，避免移除旧 CSS 后产生额外内边距。
- [ ] 保留搜索防抖／参数、分类筛选、分页、促销标识、图片失败和重试逻辑；迁移 loading、empty、error 及已知数据上的错误提示。
- [ ] 删除所有 catalog CSS 导入、文件和旧 `catalog-*` 类名，并更新受影响测试。

## 验证与验收

```powershell
pnpm --dir apps/web exec vitest run src/modules/catalog src/modules/checkout/components/cart-drawer.spec.tsx
```

- 执行共同门禁；核对 375／768／1280px 发现页和菜单页、原 640／1024px 附近断点两侧。
- 检查长餐厅名／菜品名、空结果、图片失败、分页与购物车侧栏／移动栏，不引入横向溢出。
- 商品选择与购物车内容保持原有行为，模块只通过现有公共插槽协作。

## Commit message

```text
♻️ refactor(web): migrate catalog pages to tailwind

Move discovery, menu and catalog card styling into their components.
Preserve responsive cart slots, category states and image fallbacks.
Remove catalog CSS while retaining search and pagination behavior.
```

## 执行记录

- 完成日期：未完成。
- 命令与结果：未执行。
- 发现／菜单／购物车插槽视觉证据：未执行。
- 阻塞项：待记录。
