# 下一步重构实施蓝图：阶段 7A 收口与阶段 7B 安全图片上传

> 审计日期：2026-08-09  
> 实施目标：先让已经提交的支付/推广切片恢复可构建状态，再交付一个可独立运行、可手工验证、便于后续补 Jest 的安全图片上传纵向切片。  
> 当前阶段约束：`frontend/` 与 `backend/` 只读；不新增 Jest，不运行 Jest；不创建没有实施证据的 learning note。

## 1. 结论

当前不应直接进入阶段 8，也不应一次性重构支付、上传、可观测性和部署。下一步按两个短提交执行：

1. **7A 收口提交**：补回支付实现已经引用但没有安装的 Paddle SDK，并对 `api/src`、`api/test` 做一次独立的机械格式化；重新执行 Prisma validate、TypeScript、非修复 lint 和 build。
2. **7B 业务提交**：实现受 Bearer 认证和 OWNER 角色保护的 `POST /uploads`，只接收单张 JPEG/PNG/WebP，解码后限制尺寸与像素数，统一重编码为剥离 metadata 的 WebP，再通过可注入的 Supabase Storage 适配器保存。

选择 7B 而不是阶段 8 的原因：支付/推广和过期调度代码已经存在，目标 API 唯一尚未迁移的阶段 7 主能力是上传；上传又是 Catalog 中 `coverImageUrl`/`photoUrl` 的真实来源。完成它以后，功能重构才适合做统一收口审计并判断是否进入后端 Jest 阶段。

## 2. 当前项目状态审计

### 2.1 仓库与提交

- 根仓库和 `api/` 内嵌仓库均位于 `main`，审计时工作树干净。
- 两个仓库当前 HEAD 都是 `a46424a feat: payment module`。
- 最近主线依次完成了 Catalog、Orders、Realtime subscription 和 Payments 的编码。
- `api/src` 已有 `auth/`、`users/`、`catalog/`、`orders/`、`events/`、`payments/`；没有 `uploads/`。
- `docs/learning/` 只有 foundation 相关的 01、02；Catalog、Orders、Realtime、Payments 的实测 learning note 尚未补齐。
- `docs/refactor/README.md` 中“Realtime/Async 下一阶段、阶段 7 未开始”的状态已经落后于代码。

### 2.2 2026-08-09 实际质量门禁

从 `api/` 执行了以下非测试检查：

```powershell
pnpm exec prisma validate
pnpm exec tsc --noEmit
pnpm exec eslint "src/**/*.ts" "test/**/*.ts"
pnpm run build
```

结果：

| 检查              | 结果   | 证据/解释                                                                                                             |
| ----------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| `prisma validate` | 通过   | 当前 `schema.prisma` 结构有效                                                                                         |
| TypeScript        | 失败   | `@paddle/paddle-node-sdk` 未安装；其结果类型随之成为 `unknown`                                                        |
| 非修复 lint       | 失败   | 1316 个问题，其中约 1300 个可由 Prettier 自动修复；大量文件使用双引号，与 `.prettierrc` 的 `singleQuote: true` 不一致 |
| build             | 失败   | 与 TypeScript 相同的 Paddle SDK 缺失问题                                                                              |
| Jest              | 未执行 | functional-refactor 阶段按仓库规则延期                                                                                |

最直接的构建错误是：

```text
Cannot find module '@paddle/paddle-node-sdk'
'transaction' is of type 'unknown'
```

提交 `a46424a` 增加了 `@nestjs/schedule`，但没有增加蓝图中已经指定的 `@paddle/paddle-node-sdk@3.10.0`。因此 7A 还不能被视为完成。

### 2.3 旧上传实现只作为风险证据

`backend/src/uploads/uploads.controller.ts` 具有以下问题，目标代码不复制这些行为：

- 没有认证和角色限制；
- 直接读取 `process.env`，并在每次请求创建 Supabase client；
- 信任 `originalname`，把时间戳和原文件名拼成对象 key；
- 没有限制文件大小、数量、MIME、magic bytes、像素数和尺寸；
- 不解码或重编码图片，可能保留 EXIF/GPS 等 metadata；
- 供应商失败时仍返回公共 fallback 图片，形成伪成功语义；
- 没有超时、限流、结构化错误和可替换的存储端口；
- URL 由字符串手工拼接，bucket 名还前后不一致。

## 3. 范围和非目标

### 3.1 本切片交付

- `POST /uploads`，请求类型为 `multipart/form-data`；
- 仅接受标准 `Authorization: Bearer <JWT>`，继续明确拒绝 `x-jwt`、重复 Authorization 和格式错误的凭证；
- 仅 OWNER 可调用，并在 guard 与 application service 两层都验证角色；
- 必填 multipart 字段：`purpose` 和 `file`；
- `purpose` 只允许 `RESTAURANT_COVER`、`DISH_PHOTO`；
- 单文件、5 MiB 输入上限、4096 单边上限、1600 万像素上限；
- 声明 MIME 与实际解码格式必须一致，只允许 JPEG/PNG/WebP；
- 拒绝多帧/动画图片；
- Sharp 自动应用 EXIF orientation，统一输出 WebP，并依靠默认行为移除 metadata；
- 对象 key 只由服务端生成：用途前缀、用户 UUID、随机 UUID，不使用原始文件名；
- Supabase client 是单例 Nest provider，存储在端口之后；
- 外部请求具有真正传递到 `fetch` 的 abort timeout；
- 不覆盖已有对象，使用长缓存 immutable URL；
- HTTP 状态码区分认证、授权、参数、内容、限流和供应商故障；
- 更新安全配置样例、测试进程环境夹具和重构索引；
- 记录手工/runtime 验证矩阵与延期 Jest 清单。

### 3.2 本切片不做

- 不修改 `frontend/`，阶段 9 再增加 `purpose` 字段和 Bearer header；
- 不修改 `backend/`；
- 不把文件二进制写入 PostgreSQL；
- 不新增 `UploadedAsset` 表，不在本切片解决未引用图片的自动回收；
- 不允许用户上传 SVG、GIF、AVIF、视频或任意附件；
- 不由 API 自动创建/修改 Supabase bucket；bucket 是部署资源；
- 不把 Supabase secret 暴露给浏览器；
- 不新增或扩写 Jest；只记录测试设计；
- 不在上传提交中顺手做 Helmet、代理信任、分布式限流或全局日志改造，这些属于阶段 8。

## 4. 目标 HTTP 契约

### 4.1 请求

```http
POST /uploads HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: multipart/form-data; boundary=...

purpose=RESTAURANT_COVER
file=<one JPEG, PNG or WebP>
```

`purpose` 是有意新增的目标契约。旧前端只发送 `file`，因此必须在阶段 9 适配；当前后端阶段不增加无 purpose 的兼容路径。

### 4.2 成功响应

```http
HTTP/1.1 201 Created
Cache-Control: no-store
Content-Type: application/json; charset=utf-8

{
  "ok": true,
  "url": "https://<project>.supabase.co/storage/v1/object/public/mealrelay-public-images/restaurant-covers/<owner-id>/<random-id>.webp",
  "contentType": "image/webp",
  "sizeBytes": 183742,
  "width": 1600,
  "height": 900
}
```

### 4.3 失败语义

| 状态 | 场景                                                                 |
| ---- | -------------------------------------------------------------------- |
| 400  | 缺少 `file`/`purpose`、多余字段、错误 multipart 结构                 |
| 401  | 缺少/错误/过期/重复 Bearer，或使用 `x-jwt`                           |
| 403  | 非 OWNER                                                             |
| 413  | Multer 在读取阶段发现文件超过 5 MiB                                  |
| 422  | MIME 不允许、声明类型与真实格式不匹配、图片损坏/多帧、尺寸或像素超限 |
| 429  | 上传频率超限                                                         |
| 503  | Supabase 超时或上传失败                                              |

供应商错误只向客户端映射为稳定、安全的 503 文案；secret、provider payload 和内部错误对象不得出现在响应中。

## 5. 数据流与安全边界

```mermaid
flowchart LR
    C["OWNER client"] --> H["POST /uploads"]
    H --> A["HttpAuthGuard\nBearer/JWT"]
    A --> R["RolesGuard\nOWNER"]
    R --> T["UploadThrottlerGuard"]
    T --> M["Multer memory buffer\n1 file / 5 MiB"]
    M --> S["UploadImageService\nrole + server key"]
    S --> I["SharpImageProcessor\ndecode/limits/WebP"]
    I --> P["PublicImageStorage port"]
    P --> U["Supabase adapter\ntimeout/no upsert"]
    U --> O["Public immutable object URL"]
```

请求生命周期中的 guard 在 interceptor/Multer 之前运行，因此未认证、错误角色和已限流请求不会先把文件读入内存。应用服务仍重复角色检查，避免以后从非 HTTP transport 调用时绕过领域授权。

## 6. 提交拆分与文件清单

### Commit A：收口阶段 7A

```powershell
cd api
pnpm add @paddle/paddle-node-sdk@3.10.0
pnpm exec prettier --write "src/**/*.ts" "test/**/*.ts"
pnpm exec prisma validate
pnpm exec tsc --noEmit
pnpm exec eslint "src/**/*.ts" "test/**/*.ts"
pnpm run build
```

格式化必须单独提交，使业务 review 不被 1300 个机械变化污染。若安装 SDK 后仍出现 `transaction` 类型问题，应依据 SDK 3.10.0 的实际 `transactions.create()` 返回类型修复，不能用 `as any` 或未检查断言压过错误。

### Commit B：阶段 7B 依赖

```powershell
cd api
pnpm add @supabase/supabase-js@2.112.2 sharp@0.35.3
pnpm add -D @types/multer@2.2.0
```

Multer 2.2.0 已由 `@nestjs/platform-express@11.1.28` 提供；业务代码不直接 import `multer`，因此不额外声明一个重复的运行时依赖。

### Commit C：HTTP auth 与上传纵向切片

```text
api/src/
├── auth/
│   ├── auth.module.ts                         # replace
│   ├── current-http-principal.decorator.ts    # new
│   ├── http-auth.guard.ts                     # new
│   ├── http-authenticated-request.ts          # new
│   └── roles.guard.ts                         # replace; 同时支持 GraphQL/HTTP
├── config/
│   └── environment.variables.ts               # replace
├── uploads/
│   ├── application/upload-image.service.ts    # new
│   ├── domain/upload-errors.ts                 # new
│   ├── domain/upload-purpose.ts                # new
│   ├── dto/upload-image.body.ts                # new
│   ├── dto/upload-image.response.ts            # new
│   ├── integrations/image-processor.port.ts    # new
│   ├── integrations/public-image-storage.port.ts # new
│   ├── integrations/sharp-image.processor.ts   # new
│   ├── integrations/supabase-image-storage.adapter.ts # new
│   ├── upload.constants.ts                     # new
│   ├── upload-throttler.guard.ts               # new
│   ├── uploads.controller.ts                   # new
│   └── uploads.module.ts                       # new
└── app.module.ts                               # replace

api/.env.example                                # replace
api/test/setup-env.ts                           # replace fixture only, not a Jest test
```

## 7. 完整目标代码

以下代码块是实施时的逐文件完整目标，不是省略上下文的伪代码。

### 7.1 `api/src/auth/http-authenticated-request.ts`

```ts
import type { AuthenticatedPrincipal } from "@/auth/auth-principal";
import type { Request } from "express";

export interface AuthenticatedHttpRequest extends Request {
  principal?: AuthenticatedPrincipal;
  accessTokenExpiresAtEpochSeconds?: number;
}
```

### 7.2 `api/src/auth/http-auth.guard.ts`

```ts
import { AccessTokenService } from "@/auth/access-token.service";
import { extractBearerToken } from "@/auth/bearer-token";
import type { AuthenticatedHttpRequest } from "@/auth/http-authenticated-request";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable } from "@nestjs/common";

@Injectable()
export class HttpAuthGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokenService) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const request = executionContext
      .switchToHttp()
      .getRequest<AuthenticatedHttpRequest>();
    const accessToken = extractBearerToken(request);
    const session = await this.accessTokens.verifySession(accessToken);

    request.principal = session.principal;
    request.accessTokenExpiresAtEpochSeconds = session.expiresAtEpochSeconds;
    return true;
  }
}
```

### 7.3 `api/src/auth/current-http-principal.decorator.ts`

```ts
import type { AuthenticatedPrincipal } from "@/auth/auth-principal";
import type { AuthenticatedHttpRequest } from "@/auth/http-authenticated-request";
import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

export const CurrentHttpPrincipal = createParamDecorator(
  (
    _data: unknown,
    executionContext: ExecutionContext,
  ): AuthenticatedPrincipal => {
    const request = executionContext
      .switchToHttp()
      .getRequest<AuthenticatedHttpRequest>();

    if (!request.principal) {
      throw new UnauthorizedException("Authentication is required.");
    }

    return request.principal;
  },
);
```

### 7.4 `api/src/auth/roles.guard.ts`

```ts
import type { AuthenticatedPrincipal } from "@/auth/auth-principal";
import type { GraphqlContext } from "@/auth/graphql-context";
import type { AuthenticatedHttpRequest } from "@/auth/http-authenticated-request";
import { ROLES_METADATA_KEY } from "@/auth/roles.decorator";
import type { UserRole } from "@/users/user-role.enum";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(executionContext: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<readonly UserRole[]>(
      ROLES_METADATA_KEY,
      [executionContext.getHandler(), executionContext.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const principal = getPrincipal(executionContext);
    if (!principal) {
      throw new UnauthorizedException("Authentication is required.");
    }

    if (!requiredRoles.includes(principal.role)) {
      throw new ForbiddenException("Insufficient role.");
    }

    return true;
  }
}

function getPrincipal(
  executionContext: ExecutionContext,
): AuthenticatedPrincipal | undefined {
  const contextType = executionContext.getType<string>();

  if (contextType === "http") {
    return executionContext
      .switchToHttp()
      .getRequest<AuthenticatedHttpRequest>().principal;
  }

  if (contextType === "graphql") {
    return GqlExecutionContext.create(
      executionContext,
    ).getContext<GraphqlContext>().principal;
  }

  return undefined;
}
```

### 7.5 `api/src/auth/auth.module.ts`

```ts
import { AccessTokenService } from "@/auth/access-token.service";
import { AuthResolver } from "@/auth/auth.resolver";
import { AuthService } from "@/auth/auth.service";
import { CredentialsRepository } from "@/auth/credentials.repository";
import { GqlAuthGuard } from "@/auth/gql-auth.guard";
import { GqlThrottlerGuard } from "@/auth/gql-throttler.guard";
import { GraphqlContextFactory } from "@/auth/graphql-context.factory";
import { HttpAuthGuard } from "@/auth/http-auth.guard";
import { PasswordHasherService } from "@/auth/password-hasher.service";
import { RolesGuard } from "@/auth/roles.guard";
import type { EnvironmentVariables } from "@/config/environment.variables";
import { PrismaModule } from "@/prisma/prisma.module";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        name: "identity",
        ttl: 60_000,
        limit: 10,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get("JWT_SECRET", { infer: true }),
      }),
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    CredentialsRepository,
    PasswordHasherService,
    AccessTokenService,
    GraphqlContextFactory,
    GqlAuthGuard,
    HttpAuthGuard,
    GqlThrottlerGuard,
    RolesGuard,
  ],
  exports: [
    PasswordHasherService,
    AccessTokenService,
    GraphqlContextFactory,
    GqlAuthGuard,
    HttpAuthGuard,
    GqlThrottlerGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
```

### 7.6 `api/src/config/environment.variables.ts`

```ts
import { z } from "zod";

const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;
const PADDLE_ENVIRONMENTS = ["sandbox", "production"] as const;
const DEFAULT_PORT = 3000;
const MIN_PORT = 1;
const MAX_PORT = 65_535;

const requiredString = (name: string) =>
  z
    .string({ error: `${name} is required` })
    .trim()
    .min(1, { error: `${name} is required` });

const portSchema = z.preprocess(
  (value) => (value === undefined || value === "" ? DEFAULT_PORT : value),
  z
    .union(
      [
        z.number(),
        z
          .string()
          .trim()
          .regex(/^\d+$/, { error: "PORT must be an integer" })
          .transform(Number),
      ],
      { error: "PORT must be an integer" },
    )
    .pipe(
      z
        .number({ error: "PORT must be an integer" })
        .int({ error: "PORT must be an integer" })
        .min(MIN_PORT, {
          error: `PORT must be between ${MIN_PORT} and ${MAX_PORT}`,
        })
        .max(MAX_PORT, {
          error: `PORT must be between ${MIN_PORT} and ${MAX_PORT}`,
        }),
    ),
);

const databaseUrlSchema = requiredString("DATABASE_URL").transform(
  (databaseUrl, context) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(databaseUrl);
    } catch {
      context.issues.push({
        code: "custom",
        input: databaseUrl,
        message: "DATABASE_URL must be a valid PostgreSQL URL",
      });
      return z.NEVER;
    }

    if (
      parsedUrl.protocol !== "postgres:" &&
      parsedUrl.protocol !== "postgresql:"
    ) {
      context.issues.push({
        code: "custom",
        input: databaseUrl,
        message: "DATABASE_URL must use the postgres or postgresql protocol",
      });
      return z.NEVER;
    }

    if (
      !parsedUrl.hostname ||
      !parsedUrl.pathname ||
      parsedUrl.pathname === "/"
    ) {
      context.issues.push({
        code: "custom",
        input: databaseUrl,
        message: "DATABASE_URL must include a host and database name",
      });
      return z.NEVER;
    }

    return databaseUrl;
  },
);

const corsOriginSchema = z.string().transform((origin, context) => {
  let parsedOrigin: URL;

  try {
    parsedOrigin = new URL(origin);
  } catch {
    context.issues.push({
      code: "custom",
      input: origin,
      message: "CORS_ORIGINS must contain valid HTTP origins",
    });
    return z.NEVER;
  }

  if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") {
    context.issues.push({
      code: "custom",
      input: origin,
      message: "CORS_ORIGINS must contain only HTTP or HTTPS origins",
    });
    return z.NEVER;
  }

  if (
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.search ||
    parsedOrigin.hash ||
    (parsedOrigin.pathname !== "" && parsedOrigin.pathname !== "/")
  ) {
    context.issues.push({
      code: "custom",
      input: origin,
      message:
        "CORS_ORIGINS entries must not include credentials, paths, queries, or fragments",
    });
    return z.NEVER;
  }

  return parsedOrigin.origin;
});

const corsOriginsSchema = requiredString("CORS_ORIGINS")
  .transform((rawOrigins) =>
    rawOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .pipe(
    z.array(corsOriginSchema).min(1, {
      error: "CORS_ORIGINS must contain at least one origin",
    }),
  )
  .transform((origins) => [...new Set(origins)]);

const integerFromEnvironment = (
  name: string,
  minimum: number,
  maximum: number,
) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value)
        : value,
    z
      .number({ error: `${name} must be an integer` })
      .int({ error: `${name} must be an integer` })
      .min(minimum, {
        error: `${name} must be between ${minimum} and ${maximum}`,
      })
      .max(maximum, {
        error: `${name} must be between ${minimum} and ${maximum}`,
      }),
  );

const httpUrlSchema = (name: string) =>
  requiredString(name).transform((value, context) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      context.issues.push({
        code: "custom",
        input: value,
        message: `${name} must be a valid HTTP(S) URL`,
      });
      return z.NEVER;
    }

    if (
      (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      context.issues.push({
        code: "custom",
        input: value,
        message: `${name} must be a valid HTTP(S) URL without embedded credentials`,
      });
      return z.NEVER;
    }

    return parsedUrl.toString();
  });

const paddleIdSchema = (name: string, prefix: string) =>
  requiredString(name).regex(new RegExp(`^${prefix}_[a-z0-9]{26}$`), {
    error: `${name} must be a valid Paddle ${prefix} ID`,
  });

const currencySchema = requiredString("PADDLE_PROMOTION_CURRENCY")
  .transform((value) => value.toUpperCase())
  .pipe(
    z.string().regex(/^[A-Z]{3}$/, {
      error:
        "PADDLE_PROMOTION_CURRENCY must be a three-letter uppercase currency code",
    }),
  );

const storageBucketSchema = requiredString("SUPABASE_STORAGE_BUCKET").regex(
  /^[a-z0-9][a-z0-9._-]{2,62}$/,
  {
    error:
      "SUPABASE_STORAGE_BUCKET must be 3-63 lowercase letters, digits, dot, underscore, or hyphen",
  },
);

export const environmentVariablesSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS, {
    error: `NODE_ENV must be one of: ${NODE_ENVIRONMENTS.join(", ")}`,
  }),
  PORT: portSchema,
  DATABASE_URL: databaseUrlSchema,
  CORS_ORIGINS: corsOriginsSchema,
  JWT_SECRET: requiredString("JWT_SECRET").refine(
    (secret) => Buffer.byteLength(secret, "utf8") >= 32,
    { error: "JWT_SECRET must contain at least 32 UTF-8 bytes" },
  ),
  JWT_ACCESS_TTL_SECONDS: integerFromEnvironment(
    "JWT_ACCESS_TTL_SECONDS",
    60,
    86_400,
  ),
  JWT_ISSUER: requiredString("JWT_ISSUER"),
  JWT_AUDIENCE: requiredString("JWT_AUDIENCE"),
  EMAIL_VERIFICATION_TTL_SECONDS: integerFromEnvironment(
    "EMAIL_VERIFICATION_TTL_SECONDS",
    300,
    604_800,
  ),
  FRONTEND_VERIFY_EMAIL_URL: httpUrlSchema("FRONTEND_VERIFY_EMAIL_URL"),
  RESEND_API_KEY: requiredString("RESEND_API_KEY"),
  RESEND_FROM: requiredString("RESEND_FROM"),
  RESEND_TIMEOUT_MS: integerFromEnvironment("RESEND_TIMEOUT_MS", 100, 30_000),
  PADDLE_ENVIRONMENT: z.enum(PADDLE_ENVIRONMENTS, {
    error: `PADDLE_ENVIRONMENT must be one of: ${PADDLE_ENVIRONMENTS.join(", ")}`,
  }),
  PADDLE_API_KEY: requiredString("PADDLE_API_KEY"),
  PADDLE_WEBHOOK_SECRET: requiredString("PADDLE_WEBHOOK_SECRET"),
  PADDLE_PROMOTION_PRICE_ID: paddleIdSchema("PADDLE_PROMOTION_PRICE_ID", "pri"),
  PADDLE_PROMOTION_UNIT_PRICE_MINOR: integerFromEnvironment(
    "PADDLE_PROMOTION_UNIT_PRICE_MINOR",
    1,
    100_000_000,
  ),
  PADDLE_PROMOTION_CURRENCY: currencySchema,
  PADDLE_API_TIMEOUT_MS: integerFromEnvironment(
    "PADDLE_API_TIMEOUT_MS",
    100,
    30_000,
  ),
  PROMOTION_EXPIRY_BATCH_SIZE: integerFromEnvironment(
    "PROMOTION_EXPIRY_BATCH_SIZE",
    1,
    1_000,
  ),
  PROMOTION_EXPIRY_MAX_BATCHES: integerFromEnvironment(
    "PROMOTION_EXPIRY_MAX_BATCHES",
    1,
    100,
  ),
  SUPABASE_STORAGE_URL: httpUrlSchema("SUPABASE_STORAGE_URL"),
  SUPABASE_STORAGE_SECRET_KEY: requiredString("SUPABASE_STORAGE_SECRET_KEY"),
  SUPABASE_STORAGE_BUCKET: storageBucketSchema,
  SUPABASE_STORAGE_TIMEOUT_MS: integerFromEnvironment(
    "SUPABASE_STORAGE_TIMEOUT_MS",
    100,
    30_000,
  ),
});

export type EnvironmentVariables = z.infer<typeof environmentVariablesSchema>;
```

`SUPABASE_STORAGE_SECRET_KEY` 是服务器 secret/service-role 凭证，只能存在于 API 的 secret manager；绝不能使用 `SUPABASE_ANON_KEY` 命名混淆，也不能写进前端环境变量。

### 7.7 `api/.env.example`

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://mealrelay:change_me@localhost:5432/mealrelay_dev
CORS_ORIGINS=http://localhost:5173

JWT_SECRET=replace_with_at_least_32_random_bytes
JWT_ACCESS_TTL_SECONDS=900
JWT_ISSUER=mealrelay-api
JWT_AUDIENCE=mealrelay-web

EMAIL_VERIFICATION_TTL_SECONDS=86400
FRONTEND_VERIFY_EMAIL_URL=http://localhost:5173/confirm-email
RESEND_API_KEY=replace_with_resend_api_key
RESEND_FROM=MealRelay <noreply@example.com>
RESEND_TIMEOUT_MS=5000

PADDLE_ENVIRONMENT=sandbox
PADDLE_API_KEY=replace_with_paddle_sandbox_api_key
PADDLE_WEBHOOK_SECRET=replace_with_notification_destination_secret
PADDLE_PROMOTION_PRICE_ID=pri_replace_with_real_paddle_price_id
PADDLE_PROMOTION_UNIT_PRICE_MINOR=1000
PADDLE_PROMOTION_CURRENCY=USD
PADDLE_API_TIMEOUT_MS=5000

PROMOTION_EXPIRY_BATCH_SIZE=100
PROMOTION_EXPIRY_MAX_BATCHES=10

SUPABASE_STORAGE_URL=https://replace-with-project-ref.supabase.co
SUPABASE_STORAGE_SECRET_KEY=replace_with_server_only_secret_key
SUPABASE_STORAGE_BUCKET=mealrelay-public-images
SUPABASE_STORAGE_TIMEOUT_MS=5000
```

### 7.8 `api/test/setup-env.ts`

这只是让现有 Nest 测试进程未来能够完成配置加载，不新增任何 Jest 场景。

```ts
process.env.NODE_ENV ??= "test";
process.env.PORT ??= "3001";
process.env.DATABASE_URL ??=
  "postgresql://mealrelay_test:mealrelay_test@localhost:5432/mealrelay_test";
process.env.CORS_ORIGINS ??= "http://localhost:5173";
process.env.JWT_SECRET ??= "test-only-jwt-secret-with-at-least-32-bytes";
process.env.JWT_ACCESS_TTL_SECONDS ??= "900";
process.env.JWT_ISSUER ??= "mealrelay-api-test";
process.env.JWT_AUDIENCE ??= "mealrelay-web-test";
process.env.EMAIL_VERIFICATION_TTL_SECONDS ??= "3600";
process.env.FRONTEND_VERIFY_EMAIL_URL ??= "http://localhost:5173/confirm-email";
process.env.RESEND_API_KEY ??= "test-only-resend-key";
process.env.RESEND_FROM ??= "MealRelay Test <noreply@example.test>";
process.env.RESEND_TIMEOUT_MS ??= "500";
process.env.PADDLE_ENVIRONMENT ??= "sandbox";
process.env.PADDLE_API_KEY ??= "test-only-paddle-api-key";
process.env.PADDLE_WEBHOOK_SECRET ??= "test-only-paddle-webhook-secret";
process.env.PADDLE_PROMOTION_PRICE_ID ??= "pri_01gsz8z1q1n00f12qt82y31smh";
process.env.PADDLE_PROMOTION_UNIT_PRICE_MINOR ??= "1000";
process.env.PADDLE_PROMOTION_CURRENCY ??= "USD";
process.env.PADDLE_API_TIMEOUT_MS ??= "500";
process.env.PROMOTION_EXPIRY_BATCH_SIZE ??= "100";
process.env.PROMOTION_EXPIRY_MAX_BATCHES ??= "10";
process.env.SUPABASE_STORAGE_URL ??= "http://localhost:54321";
process.env.SUPABASE_STORAGE_SECRET_KEY ??=
  "test-only-supabase-storage-secret-key";
process.env.SUPABASE_STORAGE_BUCKET ??= "mealrelay-test-images";
process.env.SUPABASE_STORAGE_TIMEOUT_MS ??= "500";
```

现有 `src/config/validate-environment.spec.ts` 的 `validConfig` 已经落后于 Identity/Payments 的必填变量。不要在 7B 中扩写这个 Jest 文件；在统一 Jest 阶段重建一份集中、类型安全的环境 fixture，并覆盖所有新增变量的拒绝路径。

### 7.9 `api/src/uploads/upload.constants.ts`

```ts
export const UPLOAD_FILE_FIELD = "file";
export const UPLOAD_MAX_SOURCE_BYTES = 5 * 1024 * 1024;
export const UPLOAD_MAX_DIMENSION = 4_096;
export const UPLOAD_MAX_PIXELS = 16_000_000;
export const UPLOAD_MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
export const UPLOAD_OUTPUT_CONTENT_TYPE = "image/webp" as const;
export const UPLOAD_OUTPUT_EXTENSION = "webp" as const;
export const UPLOAD_PUBLIC_CACHE_SECONDS = 31_536_000;
export const UPLOAD_RATE_LIMIT_TTL_MS = 60_000;
export const UPLOAD_RATE_LIMIT_MAX = 10;
```

这些值是 API/安全契约，不是每个环境随意漂移的调优参数，所以先固化在代码中。反向代理必须设置不高于 5 MiB 加 multipart overhead 的请求体上限；应用层限制不能替代代理限制。

### 7.10 `api/src/uploads/domain/upload-purpose.ts`

```ts
export enum UploadPurpose {
  RESTAURANT_COVER = "RESTAURANT_COVER",
  DISH_PHOTO = "DISH_PHOTO",
}

export const UPLOAD_PURPOSE_FOLDERS: Record<UploadPurpose, string> = {
  [UploadPurpose.RESTAURANT_COVER]: "restaurant-covers",
  [UploadPurpose.DISH_PHOTO]: "dish-photos",
};
```

### 7.11 `api/src/uploads/domain/upload-errors.ts`

```ts
export class InvalidUploadedImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUploadedImageError";
  }
}

export class PublicImageStorageUnavailableError extends Error {
  constructor() {
    super("Public image storage is unavailable.");
    this.name = "PublicImageStorageUnavailableError";
  }
}
```

### 7.12 `api/src/uploads/dto/upload-image.body.ts`

```ts
import { UploadPurpose } from "@/uploads/domain/upload-purpose";
import { Transform } from "class-transformer";
import { IsEnum } from "class-validator";

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim() : value;

export class UploadImageBody {
  @Transform(trimString)
  @IsEnum(UploadPurpose)
  purpose!: UploadPurpose;
}
```

### 7.13 `api/src/uploads/dto/upload-image.response.ts`

```ts
import type { UPLOAD_OUTPUT_CONTENT_TYPE } from "@/uploads/upload.constants";

export interface UploadImageResponse {
  ok: true;
  url: string;
  contentType: typeof UPLOAD_OUTPUT_CONTENT_TYPE;
  sizeBytes: number;
  width: number;
  height: number;
}
```

### 7.14 `api/src/uploads/integrations/image-processor.port.ts`

```ts
import type {
  UPLOAD_OUTPUT_CONTENT_TYPE,
  UPLOAD_OUTPUT_EXTENSION,
} from "@/uploads/upload.constants";

export const IMAGE_PROCESSOR = Symbol("IMAGE_PROCESSOR");

export interface IncomingImage {
  bytes: Buffer;
  declaredContentType: string;
}

export interface ProcessedImage {
  bytes: Buffer;
  contentType: typeof UPLOAD_OUTPUT_CONTENT_TYPE;
  extension: typeof UPLOAD_OUTPUT_EXTENSION;
  sizeBytes: number;
  width: number;
  height: number;
}

export interface ImageProcessorPort {
  process(input: IncomingImage): Promise<ProcessedImage>;
}
```

### 7.15 `api/src/uploads/integrations/public-image-storage.port.ts`

```ts
export const PUBLIC_IMAGE_STORAGE = Symbol("PUBLIC_IMAGE_STORAGE");

export interface PutPublicImageCommand {
  objectKey: string;
  bytes: Buffer;
  contentType: "image/webp";
  cacheControlSeconds: number;
}

export interface StoredPublicImage {
  url: string;
}

export interface PublicImageStoragePort {
  put(command: PutPublicImageCommand): Promise<StoredPublicImage>;
}
```

### 7.16 `api/src/uploads/integrations/sharp-image.processor.ts`

```ts
import { InvalidUploadedImageError } from "@/uploads/domain/upload-errors";
import type {
  ImageProcessorPort,
  IncomingImage,
  ProcessedImage,
} from "@/uploads/integrations/image-processor.port";
import {
  UPLOAD_MAX_DIMENSION,
  UPLOAD_MAX_OUTPUT_BYTES,
  UPLOAD_MAX_PIXELS,
  UPLOAD_MAX_SOURCE_BYTES,
  UPLOAD_OUTPUT_CONTENT_TYPE,
  UPLOAD_OUTPUT_EXTENSION,
} from "@/uploads/upload.constants";
import { Injectable } from "@nestjs/common";
import sharp, { type Sharp } from "sharp";

const EXPECTED_FORMAT_BY_CONTENT_TYPE = new Map<string, string>([
  ["image/jpeg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

@Injectable()
export class SharpImageProcessor implements ImageProcessorPort {
  async process(input: IncomingImage): Promise<ProcessedImage> {
    validateSourceSize(input.bytes);

    const expectedFormat = EXPECTED_FORMAT_BY_CONTENT_TYPE.get(
      input.declaredContentType.toLowerCase(),
    );
    if (!expectedFormat) {
      throw new InvalidUploadedImageError(
        "Only JPEG, PNG, and WebP images are accepted.",
      );
    }

    try {
      const metadata = await createSafeSharp(input.bytes).metadata();
      if (metadata.format !== expectedFormat) {
        throw new InvalidUploadedImageError(
          "The declared content type does not match the image content.",
        );
      }

      if ((metadata.pages ?? 1) !== 1) {
        throw new InvalidUploadedImageError(
          "Animated or multi-page images are not accepted.",
        );
      }

      const width = metadata.width;
      const height = metadata.height;
      if (!width || !height) {
        throw new InvalidUploadedImageError(
          "The image dimensions could not be determined.",
        );
      }

      if (width > UPLOAD_MAX_DIMENSION || height > UPLOAD_MAX_DIMENSION) {
        throw new InvalidUploadedImageError(
          `Image width and height must not exceed ${UPLOAD_MAX_DIMENSION}px.`,
        );
      }

      if (width * height > UPLOAD_MAX_PIXELS) {
        throw new InvalidUploadedImageError(
          `Image pixel count must not exceed ${UPLOAD_MAX_PIXELS}.`,
        );
      }

      const { data, info } = await createSafeSharp(input.bytes)
        .rotate()
        .webp({
          quality: 82,
          alphaQuality: 90,
          effort: 4,
          smartSubsample: true,
        })
        .toBuffer({ resolveWithObject: true });

      if (data.byteLength > UPLOAD_MAX_OUTPUT_BYTES) {
        throw new InvalidUploadedImageError(
          "The processed image exceeds the storage size limit.",
        );
      }

      return {
        bytes: data,
        contentType: UPLOAD_OUTPUT_CONTENT_TYPE,
        extension: UPLOAD_OUTPUT_EXTENSION,
        sizeBytes: data.byteLength,
        width: info.width,
        height: info.height,
      };
    } catch (error: unknown) {
      if (error instanceof InvalidUploadedImageError) {
        throw error;
      }

      throw new InvalidUploadedImageError(
        "File content is not a valid supported image.",
      );
    }
  }
}

function validateSourceSize(bytes: Buffer): void {
  if (bytes.byteLength === 0) {
    throw new InvalidUploadedImageError("The uploaded file is empty.");
  }

  if (bytes.byteLength > UPLOAD_MAX_SOURCE_BYTES) {
    throw new InvalidUploadedImageError(
      `The uploaded file must not exceed ${UPLOAD_MAX_SOURCE_BYTES} bytes.`,
    );
  }
}

function createSafeSharp(bytes: Buffer): Sharp {
  return sharp(bytes, {
    animated: false,
    failOn: "warning",
    limitInputPixels: UPLOAD_MAX_PIXELS,
    pages: 1,
  });
}
```

安全含义：MIME 是第一层筛选，Sharp 解码结果才是实际格式证据；`limitInputPixels` 在解码边界限制 decompression bomb；不调用 `keepMetadata()`/`withMetadata()`，因此输出按 Sharp 默认行为移除 EXIF、XMP、IPTC 和 ICC metadata。

### 7.17 `api/src/uploads/integrations/supabase-image-storage.adapter.ts`

```ts
import type { EnvironmentVariables } from "@/config/environment.variables";
import { PublicImageStorageUnavailableError } from "@/uploads/domain/upload-errors";
import type {
  PublicImageStoragePort,
  PutPublicImageCommand,
  StoredPublicImage,
} from "@/uploads/integrations/public-image-storage.port";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseImageStorageAdapter implements PublicImageStoragePort {
  private readonly logger = new Logger(SupabaseImageStorageAdapter.name);
  private readonly client: SupabaseClient;
  private readonly bucketName: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    const timeoutMs = config.get("SUPABASE_STORAGE_TIMEOUT_MS", {
      infer: true,
    });

    this.bucketName = config.get("SUPABASE_STORAGE_BUCKET", { infer: true });
    this.client = createClient(
      config.get("SUPABASE_STORAGE_URL", { infer: true }),
      config.get("SUPABASE_STORAGE_SECRET_KEY", { infer: true }),
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
        global: {
          fetch: createTimeoutFetch(timeoutMs),
        },
      },
    );
  }

  async put(command: PutPublicImageCommand): Promise<StoredPublicImage> {
    try {
      const { error } = await this.client.storage
        .from(this.bucketName)
        .upload(command.objectKey, command.bytes, {
          cacheControl: String(command.cacheControlSeconds),
          contentType: command.contentType,
          upsert: false,
        });

      if (error) {
        this.logger.error(
          `Supabase image upload failed (${error.name ?? "StorageError"}).`,
        );
        throw new PublicImageStorageUnavailableError();
      }

      const { data } = this.client.storage
        .from(this.bucketName)
        .getPublicUrl(command.objectKey);
      const url = parsePublicHttpUrl(data.publicUrl);
      return { url };
    } catch (error: unknown) {
      if (error instanceof PublicImageStorageUnavailableError) {
        throw error;
      }

      this.logger.error(
        `Supabase image upload request failed (${errorName(error)}).`,
      );
      throw new PublicImageStorageUnavailableError();
    }
  }
}

function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const signals: AbortSignal[] = [AbortSignal.timeout(timeoutMs)];
    if (init?.signal) {
      signals.push(init.signal);
    }

    return fetch(input, {
      ...init,
      signal: AbortSignal.any(signals),
    });
  };
}

function parsePublicHttpUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new PublicImageStorageUnavailableError();
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new PublicImageStorageUnavailableError();
  }

  return url.toString();
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}
```

这里不是单纯用 `Promise.race` 放弃等待；timeout signal 会传给 Supabase SDK 使用的 `fetch`，能够终止底层 HTTP 请求。调用方已有 signal 时使用 `AbortSignal.any()` 合并，避免覆盖上游取消。

### 7.18 `api/src/uploads/application/upload-image.service.ts`

```ts
import type { AuthenticatedPrincipal } from "@/auth/auth-principal";
import { UserRole } from "@/users/user-role.enum";
import {
  UPLOAD_PURPOSE_FOLDERS,
  type UploadPurpose,
} from "@/uploads/domain/upload-purpose";
import {
  IMAGE_PROCESSOR,
  type ImageProcessorPort,
  type IncomingImage,
} from "@/uploads/integrations/image-processor.port";
import {
  PUBLIC_IMAGE_STORAGE,
  type PublicImageStoragePort,
} from "@/uploads/integrations/public-image-storage.port";
import type { UploadImageResponse } from "@/uploads/dto/upload-image.response";
import { UPLOAD_PUBLIC_CACHE_SECONDS } from "@/uploads/upload.constants";
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

@Injectable()
export class UploadImageService {
  constructor(
    @Inject(IMAGE_PROCESSOR)
    private readonly imageProcessor: ImageProcessorPort,
    @Inject(PUBLIC_IMAGE_STORAGE)
    private readonly storage: PublicImageStoragePort,
  ) {}

  async upload(
    principal: AuthenticatedPrincipal,
    purpose: UploadPurpose,
    input: IncomingImage,
  ): Promise<UploadImageResponse> {
    if (principal.role !== UserRole.OWNER) {
      throw new ForbiddenException("Only restaurant owners may upload images.");
    }

    const processed = await this.imageProcessor.process(input);
    const folder = UPLOAD_PURPOSE_FOLDERS[purpose];
    const objectKey = `${folder}/${principal.userId}/${randomUUID()}.${processed.extension}`;
    const stored = await this.storage.put({
      objectKey,
      bytes: processed.bytes,
      contentType: processed.contentType,
      cacheControlSeconds: UPLOAD_PUBLIC_CACHE_SECONDS,
    });

    return {
      ok: true,
      url: stored.url,
      contentType: processed.contentType,
      sizeBytes: processed.sizeBytes,
      width: processed.width,
      height: processed.height,
    };
  }
}
```

`randomUUID()` 只决定不可预测对象名，不承担领域 ID 语义，因此这里无需强制 UUIDv7。对象永不覆盖，URL 可安全使用一年 immutable cache；替换餐厅/菜品图片时生成新 URL。

### 7.19 `api/src/uploads/upload-throttler.guard.ts`

```ts
import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class UploadThrottlerGuard extends ThrottlerGuard {}
```

当前内置 storage 是单进程、按客户端 IP 追踪。这足以为单实例开发/首个生产切片提供应用层保护，但不是多实例全局配额。阶段 8 应在确认部署拓扑后选择共享 Redis storage，并明确 `trust proxy` 范围；不能未经边界配置就信任任意 `X-Forwarded-For`。

### 7.20 `api/src/uploads/uploads.controller.ts`

```ts
import type { AuthenticatedPrincipal } from "@/auth/auth-principal";
import { CurrentHttpPrincipal } from "@/auth/current-http-principal.decorator";
import { HttpAuthGuard } from "@/auth/http-auth.guard";
import { Roles } from "@/auth/roles.decorator";
import { RolesGuard } from "@/auth/roles.guard";
import { UserRole } from "@/users/user-role.enum";
import { UploadImageService } from "@/uploads/application/upload-image.service";
import {
  InvalidUploadedImageError,
  PublicImageStorageUnavailableError,
} from "@/uploads/domain/upload-errors";
import { UploadImageBody } from "@/uploads/dto/upload-image.body";
import type { UploadImageResponse } from "@/uploads/dto/upload-image.response";
import {
  UPLOAD_FILE_FIELD,
  UPLOAD_MAX_SOURCE_BYTES,
} from "@/uploads/upload.constants";
import { UploadThrottlerGuard } from "@/uploads/upload-throttler.guard";
import {
  BadRequestException,
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Express } from "express";

@Controller("uploads")
@UseGuards(HttpAuthGuard, RolesGuard, UploadThrottlerGuard)
@Roles(UserRole.OWNER)
export class UploadsController {
  constructor(private readonly uploads: UploadImageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Header("Cache-Control", "no-store")
  @UseInterceptors(
    FileInterceptor(UPLOAD_FILE_FIELD, {
      limits: {
        fieldNameSize: 50,
        fieldSize: 100,
        fields: 1,
        fileSize: UPLOAD_MAX_SOURCE_BYTES,
        files: 1,
        parts: 2,
      },
    }),
  )
  async uploadImage(
    @CurrentHttpPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: UploadImageBody,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UploadImageResponse> {
    if (!file) {
      throw new BadRequestException(
        `Multipart field "${UPLOAD_FILE_FIELD}" is required.`,
      );
    }

    try {
      return await this.uploads.upload(principal, body.purpose, {
        bytes: file.buffer,
        declaredContentType: file.mimetype,
      });
    } catch (error: unknown) {
      if (error instanceof InvalidUploadedImageError) {
        throw new UnprocessableEntityException(error.message);
      }

      if (error instanceof PublicImageStorageUnavailableError) {
        throw new ServiceUnavailableException(
          "Image storage is temporarily unavailable.",
        );
      }

      throw error;
    }
  }
}
```

不要在 controller 中 catch `ForbiddenException`、`UnauthorizedException` 或 throttler exception；让 Nest 保留正确状态码。不要返回旧实现的 `{ ok: false, url: fallback }`，因为 HTTP 失败不能伪装成可继续使用的资源。

### 7.21 `api/src/uploads/uploads.module.ts`

```ts
import { AuthModule } from "@/auth/auth.module";
import { UploadImageService } from "@/uploads/application/upload-image.service";
import { IMAGE_PROCESSOR } from "@/uploads/integrations/image-processor.port";
import { PUBLIC_IMAGE_STORAGE } from "@/uploads/integrations/public-image-storage.port";
import { SharpImageProcessor } from "@/uploads/integrations/sharp-image.processor";
import { SupabaseImageStorageAdapter } from "@/uploads/integrations/supabase-image-storage.adapter";
import {
  UPLOAD_RATE_LIMIT_MAX,
  UPLOAD_RATE_LIMIT_TTL_MS,
} from "@/uploads/upload.constants";
import { UploadThrottlerGuard } from "@/uploads/upload-throttler.guard";
import { UploadsController } from "@/uploads/uploads.controller";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    ThrottlerModule.forRoot([
      {
        name: "uploads",
        ttl: UPLOAD_RATE_LIMIT_TTL_MS,
        limit: UPLOAD_RATE_LIMIT_MAX,
      },
    ]),
  ],
  controllers: [UploadsController],
  providers: [
    UploadImageService,
    SharpImageProcessor,
    SupabaseImageStorageAdapter,
    UploadThrottlerGuard,
    {
      provide: IMAGE_PROCESSOR,
      useExisting: SharpImageProcessor,
    },
    {
      provide: PUBLIC_IMAGE_STORAGE,
      useExisting: SupabaseImageStorageAdapter,
    },
  ],
})
export class UploadsModule {}
```

两个 token 都使用 `useExisting`，避免 Nest 为同一个适配器再实例化一次。Supabase client 因而只在模块 provider 构造时创建，不会每次请求创建。

### 7.22 `api/src/app.module.ts`

```ts
import { AuthModule } from "@/auth/auth.module";
import { GraphqlContextFactory } from "@/auth/graphql-context.factory";
import { CatalogModule } from "@/catalog/catalog.module";
import type { EnvironmentVariables } from "@/config/environment.variables";
import { validateEnvironment } from "@/config/validate-environment";
import { HealthModule } from "@/health/health.module";
import { OrdersModule } from "@/orders/orders.module";
import { PaymentsModule } from "@/payments/payments.module";
import { UploadsModule } from "@/uploads/uploads.module";
import { UsersModule } from "@/users/users.module";
import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ScheduleModule } from "@nestjs/schedule";
import { join } from "node:path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
      ignoreEnvFile: process.env.NODE_ENV === "production",
    }),
    ScheduleModule.forRoot(),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule, AuthModule],
      inject: [ConfigService, GraphqlContextFactory],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
        contexts: GraphqlContextFactory,
      ): ApolloDriverConfig => ({
        driver: ApolloDriver,
        graphiql: config.get("NODE_ENV", { infer: true }) !== "production",
        autoSchemaFile: join(process.cwd(), "src/schema.gql"),
        sortSchema: true,
        stopOnApplicationShutdown: true,
        subscriptions: {
          "graphql-ws": {
            path: "/graphql",
            connectionInitWaitTimeout: 5_000,
            onConnect: (context: unknown) => contexts.onConnect(context),
            onSubscribe: (context: unknown) => contexts.onSubscribe(context),
            onClose: (context: unknown) => contexts.onClose(context),
          },
        },
        context: (context: unknown) => contexts.create(context),
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    OrdersModule,
    PaymentsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

`main.ts` 不需要为上传增加全局 body parser。Nest 的 Express/Multer interceptor 负责 multipart；现有 `app.useBodyParser('json', { limit: '1mb' })` 只约束 JSON。部署时还必须在 ingress/reverse proxy 设置 multipart body limit。

## 8. Supabase 部署资源

Bucket 是外部基础设施，不属于应用 PostgreSQL 的 Prisma migration。先在 Supabase 项目上创建公共 bucket；以下 SQL 可以在明确的目标项目中由运维执行并 review：

```sql
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'mealrelay-public-images',
  'mealrelay-public-images',
  true,
  5242880,
  array['image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

只允许 `image/webp` 是有意设计：API 可以接收三种源图片，但 provider 只能收到服务端已经重编码和清理过的 WebP。公共 bucket 只表示下载公开；上传/删除仍受 Storage 授权控制。本实现由持有 server secret 的 API 上传，secret 会绕过 RLS，所以权限边界完全落在 API 的 JWT、角色、校验和对象 key 生成上。

生产配置要求：

- secret 从 secret manager 注入，永不提交到 Git；
- bucket 只放公开餐厅/菜品图片，不放用户私密资料；
- 不向浏览器下发 storage secret；
- bucket 名与 `SUPABASE_STORAGE_BUCKET` 完全一致；
- 对象 key 永不 upsert，避免 CDN 传播期间返回旧内容；
- 后续删除旧图必须走新的 storage port 方法和所有权/引用检查，不能让客户端提交任意 object key。

## 9. 实施顺序

1. 完成 Commit A，确认 TypeScript/build 阻断消失、格式门禁归零。
2. 安装并锁定 7B 依赖，review `package.json` 与 `pnpm-lock.yaml`，不升级无关包。
3. 增加 HTTP auth request、guard、decorator，并把 `RolesGuard` 扩展为 GraphQL/HTTP 双 transport。
4. 增加配置 schema、`.env.example` 和测试进程环境夹具；用假 secret 验证错误消息不泄露值。
5. 先实现纯端口和 Sharp processor，再实现 Supabase adapter。
6. 实现 application service；确认角色检查不只存在于 controller guard。
7. 实现 Controller/Module 并接入 `AppModule`。
8. 配置 sandbox bucket，按第 10 节做 runtime 验证。
9. 重新执行非测试质量门禁；检查 `git diff --check` 和两个 Git status。
10. 只有拿到真实结果后才创建 `docs/learning/06-secure-image-uploads.md`，记录测量、失败证据和延期测试。

## 10. 验证方案

### 10.1 静态/构建门禁

```powershell
cd api
pnpm exec prisma format
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec tsc --noEmit
pnpm exec eslint "src/**/*.ts" "test/**/*.ts"
pnpm run build
git diff --check
git status --short
git -C .. status --short
```

本切片没有 Prisma schema 变化；执行 Prisma 三项命令是确认依赖安装没有意外影响生成客户端。不要运行 destructive reset。

### 10.2 成功 smoke

先用 GraphQL login 获得 OWNER access token，再执行：

```powershell
$env:MEALRELAY_OWNER_TOKEN = '<owner-access-token>'
curl.exe -i `
  -X POST http://localhost:3000/uploads `
  -H "Authorization: Bearer $env:MEALRELAY_OWNER_TOKEN" `
  -F "purpose=RESTAURANT_COVER" `
  -F "file=@C:\temp\restaurant.jpg;type=image/jpeg"
```

必须核对：

- HTTP 201；
- `ok: true`；
- URL path 只含受控 folder、OWNER UUID、随机 UUID 和 `.webp`；
- Storage 对象的实际 content type 是 `image/webp`；
- 返回宽高与旋转后的图片一致；
- 下载结果可由 Sharp/浏览器解码；
- EXIF/GPS/XMP 等 metadata 已移除；
- 相同源文件上传两次得到两个不同 URL，没有覆盖。

### 10.3 失败矩阵

| 场景               | 构造方式                  | 期望                                  |
| ------------------ | ------------------------- | ------------------------------------- |
| 无 Authorization   | 不传 header               | 401；Multer/Storage 未执行            |
| `x-jwt`            | 只传历史 header           | 401                                   |
| 重复 Authorization | 发送两个同名 header       | 401                                   |
| CUSTOMER/COURIER   | 使用对应 token            | 403；Multer/Storage 未执行            |
| 无 purpose         | 只传 file                 | 400                                   |
| 未知 purpose       | `purpose=AVATAR`          | 400                                   |
| 无 file            | 只传 purpose              | 400                                   |
| 两个 file          | 同一字段发送两次          | 400，不能只悄悄取第一个               |
| 超过 5 MiB         | 发送 5 MiB+ 文件          | 413；processor/Storage 未执行         |
| MIME 不允许        | `text/plain`              | 422                                   |
| 伪装 MIME          | PNG 内容声明 `image/jpeg` | 422                                   |
| 损坏图片           | 截断 JPEG/WebP            | 422                                   |
| 动画 WebP          | 多帧图片                  | 422                                   |
| 超尺寸             | 任一边大于 4096           | 422                                   |
| 像素炸弹           | 宽高乘积大于 1600 万      | 422，进程稳定                         |
| provider timeout   | 指向受控慢/断网 sandbox   | 503；请求在配置 deadline 附近结束     |
| provider 4xx/5xx   | 错 bucket/key             | 503；响应不含 provider secret/message |
| 第 11 次/分钟      | 同一客户端连续上传        | 429                                   |

### 10.4 运行时资源证据

记录但先不自动化：

- 5 MiB 输入时的进程 RSS/heap 峰值；
- Sharp 处理不同尺寸图片的 p50/p95 时间；
- Supabase 上传耗时与 timeout 行为；
- 10 个并发 5 MiB 请求时事件循环延迟和内存；
- 日志中只有 request/provider error category，没有 JWT、secret、原始文件和完整 provider payload。

这些数据决定阶段 8 是否需要 worker thread/独立媒体服务、更低并发、共享限流或直接上传方案。没有测量前不引入队列或微服务。

## 11. 延期 Jest 覆盖清单

等 functional refactor 明确完成、用户确认进入 Jest 阶段后实现：

### Unit

- `HttpAuthGuard`：标准 Bearer、缺失、重复、`x-jwt`、过期 token；
- `RolesGuard`：GraphQL 与 HTTP 的无 metadata/无 principal/允许/拒绝路径；
- `SharpImageProcessor`：三种允许格式、MIME mismatch、损坏、多帧、边长、像素、输出大小、orientation、metadata removal；
- `UploadImageService`：二次 OWNER 校验、受控 key、随机 key、storage 参数、错误传播；
- Supabase adapter：成功 URL、SDK error、fetch timeout、非法 URL、日志脱敏。

### HTTP e2e

- 使用真实 Nest Express/Multer 边界发送 multipart；
- 证明 guard 在文件 interceptor 之前拒绝未认证/错误角色请求；
- 201/400/401/403/413/422/429/503 contract；
- 额外字段、额外文件、错误 field name 和非 multipart 请求；
- 响应不泄露 secret、原始文件名和 provider 细节。

### Integration

- 对 disposable Supabase/local Storage 或受控 sandbox 上传并下载真实 WebP；
- bucket MIME/size policy 与应用策略一致；
- timeout/断网/错误 bucket；
- 并发上传不覆盖对象。

### Security/contract

- `x-jwt` 永远不成为 HTTP fallback；
- filename path traversal (`../`、绝对路径、Unicode 控制字符) 完全不影响 key；
- SVG/polyglot/伪 magic bytes 被拒绝；
- EXIF GPS 不出现在下载文件；
- GraphQL SDL 不因纯 HTTP 上传切片发生非预期 diff。

## 12. 失败、并发与一致性说明

- **无数据库事务**：上传只有一次外部对象写入，没有需要与 PostgreSQL 原子提交的记录；不要为了“看起来一致”把网络 I/O 放进 Prisma transaction。
- **对象唯一性**：server UUID + `upsert: false`，并发不会相互覆盖；极小概率 key 冲突安全失败为 503，不覆盖旧内容。
- **orphan**：客户端上传后可能不创建/更新 Restaurant/Dish，形成未引用对象。本切片用 OWNER-only、purpose、大小限制和限流控制成本；阶段 8 根据真实 orphan 指标实现清理，不预先增加 Asset 状态机。
- **替换图片**：Catalog 仍保存 URL；新图成功后再更新领域记录。旧图删除属于单独的补偿/生命周期命令，不能在 Catalog transaction 内调用 Storage。
- **provider 超时**：请求中断并不绝对证明服务端没有保存对象；随机 key 让迟到写入最多形成 orphan，不会覆盖业务正在使用的 URL。
- **多实例**：对象 key 天然无共享锁需求；内置限流不全局一致，生产横向扩展前在阶段 8 替换共享 storage。
- **公共可见性**：Restaurant/Dish 图片是公开产品内容；不得复用该 bucket 存储身份证、付款材料或任何私密用户资料。

## 13. 阶段 9 前端适配清单

保持 `frontend/` 只读，仅记录：

- `fetch('/uploads')` 增加 `Authorization: Bearer <JWT>`；
- multipart 增加 `purpose=RESTAURANT_COVER` 或 `DISH_PHOTO`；
- 处理非 2xx HTTP 状态，不再假设总有 fallback URL；
- 使用目标响应的 `url`，不要依赖 `originalname` 或 provider object key；
- 客户端 `accept="image/jpeg,image/png,image/webp"` 只改善 UX，服务端校验仍是权威；
- 显示 5 MiB、格式和尺寸限制；
- 创建/编辑 Restaurant/Dish 时仍使用目标 schema 的 `coverImageUrl`/`photoUrl`；
- 认证 transport 同时迁移为标准 Bearer，不增加 `x-jwt` bridge。

## 14. Learning note 要求（实施后创建）

实现和 runtime 验证完成后创建 `docs/learning/06-secure-image-uploads.md`，至少包括：

1. OWNER 上传到 Restaurant/Dish URL 的用户行为和 HTTP 契约；
2. guard → throttler → Multer → service → Sharp → storage adapter 的生命周期；
3. MIME、magic/decode、像素、metadata 和 object-key 威胁模型；
4. 为什么公开产品图用 public bucket，为什么 secret 只能在 API；
5. 为什么本切片不增加 Asset 表、数据库事务、队列或微服务；
6. provider timeout 的取消语义和可能 orphan；
7. runtime 内存/延迟/并发实测；
8. deferred Jest 矩阵；
9. 阶段 9 客户端适配；
10. 3–5 个能结合本代码回答的面试问题。

## 15. 验收清单

- [ ] 7A 的 Paddle SDK 已锁定在 `package.json`/`pnpm-lock.yaml`，TypeScript/build 通过。
- [ ] 机械格式化独立提交，后续非修复 lint 无 Prettier 错误。
- [ ] 上传依赖版本已锁定，没有机会性升级 Nest/Prisma/GraphQL。
- [ ] 配置启动即校验 storage URL、server secret、bucket、timeout。
- [ ] `POST /uploads` 只接受标准 Bearer 且仅 OWNER 可用。
- [ ] guard 拒绝发生在 Multer 读取文件之前，service 仍二次验证 OWNER。
- [ ] 单文件、5 MiB、MIME/实际格式、单帧、尺寸、像素限制全部有 runtime 证据。
- [ ] 所有成功对象都是剥离 metadata 的 WebP。
- [ ] object key 不包含 `originalname`，不覆盖已有对象。
- [ ] Supabase client 由 Nest 单例管理，网络 timeout 会 abort fetch。
- [ ] provider 失败返回 503，不返回 fallback URL，不泄露 provider 细节。
- [ ] 限流和反向代理 body limit 的当前能力/阶段 8 缺口有记录。
- [ ] `prisma validate`、typecheck、非修复 lint、build、`git diff --check` 全部通过。
- [ ] GraphQL SDL 没有非预期变化。
- [ ] runtime 结果写入 learning note；Jest 场景只进入延期清单。
- [ ] `frontend/`、`backend/` 未修改。

## 16. 官方依据

- [NestJS File upload](https://docs.nestjs.com/techniques/file-upload)：Express 平台的 `FileInterceptor`、Multer、单文件限制和 `@types/multer`。
- [NestJS Rate limiting](https://docs.nestjs.com/security/rate-limiting)：Throttler v6 的毫秒 TTL、命名配置和内置内存 storage 边界。
- [Supabase standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads)：小文件 standard upload、`contentType`、`upsert: false` 和避免覆盖 CDN 对象。
- [Supabase public URLs](https://supabase.com/docs/reference/javascript/file-buckets-getpublicurl)：public bucket 的 `getPublicUrl()` 行为。
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)：public download 与 write 权限的区别，以及 server secret/service role 绕过 RLS 的风险。
- [Supabase bucket fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals)：bucket 级文件大小/MIME 限制与 public/private 访问模型。
- [Sharp constructor](https://sharp.pixelplumbing.com/api-constructor/)：`failOn`、`limitInputPixels` 和安全解码选项。
- [Sharp output](https://sharp.pixelplumbing.com/api-output/)：WebP 输出与默认 metadata stripping 行为。

实施当天仍需重新打开这些页面，并以实际 lockfile 类型为准；官方示例不能替代本仓库的严格 TypeScript 编译。
