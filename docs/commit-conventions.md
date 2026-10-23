# Commit Message Convention

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范，并在提交标题最前添加 Emoji，以便快速识别提交类型。

## 提交格式

```text
<emoji> <type>(<scope>): <description>
```

示例：

```text
✨ feat(logger): add structured logging
```

### 格式要求

- Emoji 放在提交标题最前，用于表示提交类型。
- `type` 必须使用下表中的关键词。
- `scope` 用于说明影响范围，例如 `logger`、`config`、`server` 或 `bootstrap`；没有合适范围时可以省略。
- `description` 使用英文祈使句，首字母小写，不以句号结尾。
- 标题建议不超过 72 个字符。
- 标题与正文之间空一行。
- 正文用于说明变更原因、主要内容和影响范围。
- 每行正文建议不超过团队约定的字符数，常用值为 72 或 100。

## 提交关键词与 Emoji

| Type | Emoji | 用途 | 示例 |
| --- | --- | --- | --- |
| `feat` | ✨ | 新增功能 | `✨ feat(config): support yaml configuration` |
| `fix` | 🐛 | 修复 Bug 或错误行为 | `🐛 fix(config): reject invalid timeout values` |
| `refactor` | ♻️ | 重构代码，不改变外部行为 | `♻️ refactor(bootstrap): simplify initialization` |
| `style` | 🎨 | 代码格式、排版或样式调整，不改变逻辑 | `🎨 style(server): format startup options` |
| `chore` | 🔧 | 日常维护、工具、配置或非业务变更 | `🔧 chore(deps): update logging dependencies` |
| `docs` | 📝 | 文档新增或修改 | `📝 docs: add commit conventions` |
| `test` | ✅ | 新增、修改或整理测试 | `✅ test(config): cover timeout validation` |
| `perf` | ⚡ | 性能优化 | `⚡ perf(logging): reduce startup allocations` |
| `build` | 📦 | 构建系统或依赖构建配置变更 | `📦 build: update go build settings` |
| `ci` | 👷 | CI/CD 流程和配置变更 | `👷 ci: add automated test workflow` |
| `revert` | ⏪ | 回滚之前的提交 | `⏪ revert: revert logger initialization` |

Conventional Commits 推荐使用 `fix` 表示 Bug 修复，不使用 `bug` 作为标准 Type。

## 详细提交模板

```text
<emoji> <type>(<scope>): <description>

Why:
- Explain why the change is needed.

What:
- Describe the main implementation changes.
- Mention important behavior or configuration changes.

Impact:
- Describe affected modules, APIs, users, or compatibility.

BREAKING CHANGE: Describe the migration required by consumers.
```

不需要说明某一部分时，可以删除对应段落。小型提交可以只包含标题；涉及多个模块或行为变化的提交应补充正文。

## 编写建议

### 推荐

```text
✨ feat(logger): add structured logging

- add development and production logger initialization
- load logger environment from application configuration
- flush buffered log entries during shutdown
```

```text
🐛 fix(config): apply the default server address

The server now falls back to :8091 when no address is configured,
while preserving explicitly configured addresses.
```

### 避免

```text
update code
fix bug
✨ feat (logger) : Add logger.
```

最后一个示例包含多余空格、首字母大写和句末句号，不符合本项目推荐格式。

## Breaking Change

如果提交会破坏现有 API、配置格式或运行方式，需要在正文中使用 `BREAKING CHANGE:` 说明迁移方式：

```text
⚠️ refactor(config)!: rename application config fields

BREAKING CHANGE: rename `server.address` to `server.addr` in application.yaml.
```

也可以在 `type` 后添加 `!`，例如 `feat(api)!: change response format`。

## 提交前检查清单

- [ ] 标题以约定的 Emoji 开头。
- [ ] 使用正确的 Conventional Commits `type`。
- [ ] `scope` 准确且简洁。
- [ ] 描述使用英文祈使句、首字母小写且无句号。
- [ ] 标题不超过 72 个字符。
- [ ] 变更涉及破坏性修改时已添加 `BREAKING CHANGE:`。
- [ ] 正文已说明必要的原因、实现和影响。
- [ ] 已运行与本次变更相关的测试或检查。
