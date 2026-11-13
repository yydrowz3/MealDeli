# Zod 环境变量验证

## 实现的启动行为

- Nest 在创建应用模块时，通过 `ConfigModule.forRoot({ validate })` 校验环境变量；非法配置会阻止应用开始监听端口。
- `NODE_ENV` 只接受 `development`、`test` 或 `production`。
- `PORT` 接受整数或仅包含十进制数字的字符串，缺失/空字符串时默认 3000，并限制在 1–65535。
- `DATABASE_URL` 必须是带 host 和数据库名的 `postgres:`/`postgresql:` URL。
- `CORS_ORIGINS` 从逗号分隔字符串转换为规范化、去重的 HTTP(S) origin 数组，并拒绝 credentials、path、query 和 fragment。

## 启动数据流

```text
process environment + .env
  -> ConfigModule.forRoot
  -> validateEnvironment
  -> environmentVariablesSchema.safeParse
  -> Zod validation + transforms
  -> typed EnvironmentVariables
  -> ConfigService<EnvironmentVariables, true>
```

`ConfigModule` 收到的是包含许多操作系统变量的对象。Zod object 默认只返回声明过的字段，因此应用配置不会携带无关变量；这不意味着修改或清理 `process.env` 本身。

## 关键决策与取舍

### 运行时 schema 是类型的唯一来源

`EnvironmentVariables` 使用 `z.infer<typeof environmentVariablesSchema>` 推导，不再维护平行的 TypeScript interface。这样增加或转换环境变量时，`ConfigService` 看到的输出类型与启动时实际返回值保持一致。

### 使用自定义 `validate` 回调

Nest `ConfigModule` 的自定义同步 `validate` 回调允许返回转换后的对象，适合把字符串端口转换为 number、把 CORS 字符串转换为数组。Zod 负责 schema 与转换，Nest 负责加载顺序和启动失败边界。

### 严格转换而非宽松 coercion

未直接使用 `z.coerce.number()`，因为 JavaScript `Number()` 会把空字符串、boolean 等值转换成数字。端口 schema 只转换符合 `^\d+$` 的字符串，避免意外接受非环境变量语义的输入。

### 保留领域相关 URL 约束

通用 URL 格式校验不足以表达 PostgreSQL 协议、数据库名和纯 origin 规则，因此在 Zod transform 中使用 `URL` 解析，并通过 Zod issue 返回稳定错误。transform 不向外抛解析异常。

## 拒绝的方案

- Joi `validationSchema`：Nest 支持，但会引入第二套 schema/type 维护方式；本项目已决定使用 Zod 4。
- `class-transformer` + `class-validator` 配置 class：更适合 Nest DTO；环境配置仍需额外解决类型推导和严格字符串转换。
- 分散读取 `process.env`：会把验证时机推迟到业务请求，并使测试和依赖关系不透明。
- 直接抛出或记录完整 `ZodError` input：配置可能包含数据库凭据、JWT secret 和 provider key。

## 失败与安全行为

- 使用 `safeParse()` 一次收集所有无效字段，减少逐项修复配置导致的重复重启。
- 启动错误只拼接 issue path 和 message，不包含 issue input；测试使用标记字符串验证数据库配置值不会出现在错误文本中。
- schema 只规范化配置，不记录配置对象，也不改变业务 DTO 的 `ValidationPipe`/`class-validator` 策略。
- `.env.example` 只包含本地占位值，真实凭据仍由部署环境或 secret manager 提供。

## 自动测试证据

验证日期：2026-08-07。

```text
Targeted TypeScript: passed
Targeted ESLint (non-fixing): passed
Targeted Jest: 1 suite, 14 tests passed
```

全量 `tsc --noEmit` 与 Nest build 仍被当前工作区未完成的 Users 代码阻断（缺少 mapper/type/import 和旧 DTO 文件）；全量 Jest 为 6/8 suites 通过，失败来自同一 Users Resolver 以及既有 health timeout 断言不一致。这些失败不经过配置模块，未在本切片中扩展范围修复。

覆盖范围：

- 合法配置的 number/array 转换、origin 规范化和去重；
- `PORT` 默认值、整数语法和边界；
- PostgreSQL 协议及数据库名；
- CORS 协议、path/credentials/query/fragment 边界；
- 多字段错误汇总与输入值不泄露；
- 未声明环境变量不会进入已验证配置对象。

## 性能观察

schema 只在应用启动时同步执行一次，当前字段数量很小，URL 解析和数组去重不会进入请求热路径。若将来配置按模块拆分，应继续在启动阶段完成验证，不要把重复 parse 放进 request-scoped provider。

## 面试问题

### 为什么 TypeScript interface 不能替代环境变量校验？

- interface 在编译后不存在，无法验证运行时字符串。
- 环境变量可能缺失、格式错误或需要转换；Zod 同时提供 runtime parse 和输出类型推导。

### 为什么不用 `z.coerce.number()` 直接转换端口？

- 宽松 coercion 会接受空字符串或 boolean 等非预期输入。
- 先限制十进制整数字符串再转换，可以让配置契约和错误更明确。

### 为什么错误不能打印输入值？

- 数据库 URL、JWT secret 和 provider key 都可能出现在同一配置对象。
- 运维只需要变量路径和约束信息即可定位问题，原始值没有必要进入日志。

### Zod 与 Nest `ConfigModule` 分别负责什么？

- Nest 加载并合并 `.env` 与进程环境，在 bootstrap 阶段调用自定义 validator。
- Zod 定义字段、转换和错误；validator 将解析后的输出交给类型化 `ConfigService`。

## 官方参考

- [NestJS configuration：custom validate function](https://docs.nestjs.com/techniques/configuration#custom-validate-function)
- [Zod schemas and parsing](https://zod.dev/packages/zod)
- [Zod transforms and preprocess](https://zod.dev/api#transforms)
- [Zod error customization](https://zod.dev/error-customization)
