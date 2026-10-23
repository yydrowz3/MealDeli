# 08：迁移商家餐厅与菜单管理样式

状态：未开始。前置：[07](./07-orders.md) 已完成并提交；执行 [共同门禁与提交流程](./README.md)。

## 目标与范围

迁移 `src/modules/owner-management` 的全部页面与组件，删除 `owner-management.css`，同时处理本模块页面中的固定 Skeleton 内联高度。

## 实施步骤

- [ ] 迁移餐厅列表、创建、概览、设置、菜单管理页以及 restaurant selector、餐厅／菜品表单、订单操作和新订单通知。
- [ ] 保留普通／窄版页面宽度、卡片图片与占位、摘要网格、餐厅 hero、菜品行和移动重排。
- [ ] 核对 `--space-5`、`--color-text-muted`、`--color-surface-muted`、`--radius-lg` 等旧声明的实际计算结果；未定义时不擅自赋予新的“合理”视觉值。
- [ ] 迁移菜品选项构建器的选项／选择／限制网格、警告文案及表单按钮区，保持删除和新增控件的布局。
- [ ] 迁移危险操作区和固定新订单通知的层级、阴影、间距与移动端左右定位；步骤 01 已迁移页头按钮的宽度规则，本步统一清理遗留布局类。
- [ ] 将创建、列表、概览、菜单、设置页面的所有固定 Skeleton 高度改成工具类，保留 13／24／28／30rem 等现有尺寸。
- [ ] 保留表单、上传、删除确认、订单动作与实时通知逻辑。删除 CSS 导入、文件及 `owner-*` 旧样式类，更新测试。

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

- 完成日期：未完成。
- 命令与结果：未执行。
- 商家页面／选项构建／通知视觉证据：未执行。
- 阻塞项：待记录。
