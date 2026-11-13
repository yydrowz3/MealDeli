# MealRelay 文档

本目录保存目标 API 重建过程中的计划、架构决策和学习证据。项目目录仍保留历史名称 `tiny-food-delivery`，公开产品名使用 **MealRelay**。

## 文档分类

- [`refactor/README.md`](./refactor/README.md)：从旧 `backend/` 迁移到新 `api/` 的执行顺序、阶段计划和验收门槛。
- [`project-interview-guide.md`](./project-interview-guide.md)：项目难点、面试问题与回答要点，以及按实际完成度划分的简历表达模板。
- `adr/`：影响多个领域或外部契约的长期架构决策；只在决策发生时创建。
- `learning/`：每个实质性里程碑完成后的学习记录；不提前创建空占位文件。

## 维护规则

1. 实现前更新对应的 refactor 阶段文档，明确范围和验收标准。
2. 后端优先阶段改变 GraphQL、HTTP、认证或订阅契约时，同一变更中更新生成的 API schema、后端契约测试、相关 learning note/ADR 和阶段 9 前端适配记录；不要修改前端。进入前端集成阶段后，再同步更新前端操作、生成类型和对应测试。
3. 阶段完成后补充 `docs/learning/<number>-<topic>.md`，记录测试证据、权衡和面试问题。
4. 跨领域、难以回退的选择写入 `docs/adr/`；阶段计划本身不能替代 ADR。
5. 文档中的命令默认从 `api/` 执行，除非明确标注其他目录。
