# 身份模块完整实施蓝图（Users + Auth）

> 状态：仅实施说明，不代表代码已经落地。本文不会修改 `api/` 源码；实施时应按文末顺序逐个提交。
>
> 基线日期：2026-08-07。目标版本以 `api/package.json` 为准：NestJS 11、`@nestjs/graphql` 13、Apollo 5、Prisma 7、PostgreSQL。

## 1. 目标和边界

本切片一次性交付以下后端能力：

| GraphQL operation | 认证 | 成功结果 | 已知失败 |
| --- | --- | --- | --- |
| `register(input)` | 否 | `{ ok, user }` | `{ ok: false, error }` |
| `login(input)` | 否 | `{ ok, accessToken, expiresIn, user }` | 统一的无效凭据错误 |
| `me` | Bearer | 安全的 `User` | GraphQL `UNAUTHENTICATED` |
| `changeEmail(input)` | Bearer | `{ ok, user }` | 当前密码错误、邮箱占用、并发冲突 |
| `changePassword(input)` | Bearer | `{ ok, user }` | 当前密码错误、新旧密码相同、并发冲突 |
| `verifyEmail(input)` | 否 | `{ ok, verified }` | token 无效、过期或已消费 |
| `resendVerificationEmail` | Bearer | `{ ok }` | 邮件服务暂时不可用 |

本阶段不修改 `frontend/`，也不提供 `x-jwt`、旧 operation 名称或双协议兼容。旧前端的 `createAccount`、`editProfile` 以及 `x-jwt` 迁移留到前端阶段。`backend/` 保持只读。

选择这些边界的原因：

- Resolver 只处理 GraphQL input、principal 和 payload 映射；Nest 官方的 code-first resolver 也是通过 decorator 元数据把 operation 连接到 provider，而不是在 resolver 中实现持久化流程。
- GraphQL guard 必须用 `GqlExecutionContext` 读取 GraphQL context。
- 密码使用 Argon2id 单向 hash；Nest 官方建议使用 `bcrypt` 或 `argon2`，本项目选择当前 Node 版本支持的 `argon2`。
- User 与 EmailVerification 的相关写入必须原子完成；邮件发送必须在数据库提交之后。

官方依据：

- [NestJS GraphQL resolvers](https://docs.nestjs.com/graphql/resolvers)
- [NestJS GraphQL guards and execution context](https://docs.nestjs.com/graphql/other-features)
- [NestJS authentication](https://docs.nestjs.com/security/authentication)
- [NestJS encryption and hashing](https://docs.nestjs.com/security/encryption-and-hashing)
- [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting)
- [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [Prisma error reference](https://www.prisma.io/docs/orm/reference/error-reference)
- [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)

## 2. 完整文件清单

### 2.1 新增

```text
api/src/common/dto/operation.payload.ts
api/src/auth/access-token.service.ts
api/src/auth/auth-principal.ts
api/src/auth/auth.resolver.ts
api/src/auth/bearer-token.ts
api/src/auth/credentials.repository.ts
api/src/auth/current-principal.decorator.ts
api/src/auth/gql-auth.guard.ts
api/src/auth/gql-throttler.guard.ts
api/src/auth/graphql-context.ts
api/src/auth/password-hasher.service.ts
api/src/auth/password-policy.ts
api/src/auth/roles.decorator.ts
api/src/auth/roles.guard.ts
api/src/users/dto/resend-verification-email.payload.ts
api/src/users/dto/update-user.payload.ts
api/src/users/resend-verification-mailer.service.ts
api/src/users/normalize-email.ts
api/src/users/user.persistence.ts
api/src/users/user.types.ts
api/src/users/users.repository.ts
api/src/users/users.service.types.ts
api/src/users/verification-mailer.port.ts
api/src/users/verification-token.service.ts
api/prisma/migrations/20260807000000_identity_foundation/migration.sql
api/src/auth/access-token.service.spec.ts
api/src/auth/auth.resolver.spec.ts
api/src/auth/bearer-token.spec.ts
api/src/auth/password-hasher.service.spec.ts
api/src/config/validate-environment.spec.ts
api/src/users/resend-verification-mailer.service.spec.ts
api/test/assert-test-database.ts
api/test/identity.e2e-spec.ts
```

### 2.2 完整替换

```text
api/src/app.module.ts
api/src/main.ts
api/src/config/environment.variables.ts
api/src/config/validate-environment.ts
api/src/auth/auth.module.ts
api/src/auth/auth.service.ts
api/src/auth/auth.service.spec.ts
api/src/auth/dto/auth.payload.ts
api/src/auth/dto/login.input.ts
api/src/users/user-role.enum.ts
api/src/users/user.mapper.ts
api/src/users/users.module.ts
api/src/users/users.resolver.ts
api/src/users/users.resolver.spec.ts
api/src/users/users.service.ts
api/src/users/users.service.spec.ts
api/src/users/models/user.model.ts
api/src/users/dto/change-email.input.ts
api/src/users/dto/change-password.input.ts
api/src/users/dto/register.input.ts
api/src/users/dto/register.payload.ts
api/src/users/dto/verify-email.input.ts
api/src/users/dto/verify-email.payload.ts
api/prisma/schema.prisma
api/.env.example
api/test/setup-env.ts
```

### 2.3 删除

```text
api/src/auth/auth.controller.ts
api/src/auth/auth.controller.spec.ts
```

登录是 GraphQL mutation；继续保留一个空的 REST controller 会制造第二个未经设计的认证入口。

### 2.4 生成但禁止手工编辑

```text
api/src/generated/prisma/**
api/src/schema.gql
api/pnpm-lock.yaml
```

`pnpm-lock.yaml` 由 `pnpm add` 更新；Prisma Client 和 SDL 分别由 Prisma/Nest 生成。

## 3. 依赖变更

在 `api/` 运行：

```powershell
pnpm add zod@4.4.3 argon2@0.45.1 @nestjs/throttler@6.5.0
```

这会修改 `api/package.json` 和 `api/pnpm-lock.yaml`。环境变量验证统一使用 Zod 4，不引入 Joi，也不使用 `class-transformer`/`class-validator` 模拟配置对象。`argon2` 已内置 TypeScript 类型，不添加 `@types/argon2`。实施时仍应重新核对 Node 版本和该包的安装平台支持；本文基线下 `argon2@0.45.1` 要求 Node 22+，仓库类型基线是 Node 24。`@nestjs/throttler@6.5.0` 使用毫秒 TTL，并支持 Nest 11 与 GraphQL 自定义 guard。

Resend 在这个切片中只使用官方 `POST https://api.resend.com/emails` 发送接口，因此直接使用 Node 24 内置的 `fetch`，不额外安装 `resend` SDK。这样可以通过 `AbortSignal.timeout()` 真正取消超时请求，并且只处理状态码、不读取或记录 provider 响应正文。若以后引入 Resend template、webhook 或更多 API，再评估官方 SDK，并在同一变更中补齐 adapter contract tests。

## 4. 环境和启动边界

### `api/src/config/environment.variables.ts`

继续扩展 Foundation 已落地的 `environmentVariablesSchema`，不要重新创建手写 interface。公共的 `requiredString`、PostgreSQL URL、CORS origin 与端口 schema 以当前源文件为准；Identity 切片新增一个严格整数转换 helper，并把以下字段加入现有 `z.object({...})`：

```ts
const integerFromEnvironment = (
  name: string,
  minimum: number,
  maximum: number,
) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && /^\d+$/.test(value.trim())
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
        code: 'custom',
        input: value,
        message: `${name} must be a valid HTTP(S) URL`,
      });
      return z.NEVER;
    }

    if (
      (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      context.issues.push({
        code: 'custom',
        input: value,
        message: `${name} must be a valid HTTP(S) URL without embedded credentials`,
      });
      return z.NEVER;
    }

    return parsedUrl.toString();
  });

export const environmentVariablesSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS, {
    error: `NODE_ENV must be one of: ${NODE_ENVIRONMENTS.join(', ')}`,
  }),
  PORT: portSchema,
  DATABASE_URL: databaseUrlSchema,
  CORS_ORIGINS: corsOriginsSchema,
  JWT_SECRET: requiredString('JWT_SECRET').refine(
    (secret) => Buffer.byteLength(secret, 'utf8') >= 32,
    { error: 'JWT_SECRET must contain at least 32 UTF-8 bytes' },
  ),
  JWT_ACCESS_TTL_SECONDS: integerFromEnvironment(
    'JWT_ACCESS_TTL_SECONDS',
    60,
    86_400,
  ),
  JWT_ISSUER: requiredString('JWT_ISSUER'),
  JWT_AUDIENCE: requiredString('JWT_AUDIENCE'),
  EMAIL_VERIFICATION_TTL_SECONDS: integerFromEnvironment(
    'EMAIL_VERIFICATION_TTL_SECONDS',
    300,
    604_800,
  ),
  FRONTEND_VERIFY_EMAIL_URL: httpUrlSchema('FRONTEND_VERIFY_EMAIL_URL'),
  RESEND_API_KEY: requiredString('RESEND_API_KEY'),
  RESEND_FROM: requiredString('RESEND_FROM'),
  RESEND_TIMEOUT_MS: integerFromEnvironment(
    'RESEND_TIMEOUT_MS',
    100,
    30_000,
  ),
});

export type EnvironmentVariables = z.infer<typeof environmentVariablesSchema>;
```

上面的对象片段必须与现有四个 Foundation 字段合并，而不是覆盖它们。Zod schema 同时承担运行时验证、字符串到 number/数组的转换和 TypeScript 输出类型推导；以后增加环境变量时只修改这一份契约。

### `api/src/config/validate-environment.ts`

```ts
import type { ZodError } from 'zod';
import {
  type EnvironmentVariables,
  environmentVariablesSchema,
} from './environment.variables';

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const result = environmentVariablesSchema.safeParse(config);

  if (!result.success) {
    throw new Error(formatEnvironmentErrors(result.error));
  }

  return result.data;
}

function formatEnvironmentErrors(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.') || 'environment';
    return `${path}: ${issue.message}`;
  });

  return `Environment validation failed: ${issues.join('; ')}`;
}

```

`safeParse()` 会一次收集所有配置问题；`formatEnvironmentErrors()` 只使用 Zod issue 的 path 和 message，绝不拼接 `issue.input`。因此启动失败信息可以定位变量名，同时不会泄露数据库 URL、JWT secret 或 provider key。

### `api/.env.example`

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
```

`RESEND_FROM` 必须使用 `Name <sender@example.com>` 或 `sender@example.com` 格式。生产环境的发件地址必须属于已经在 Resend Dashboard 验证的域名；不要把 Resend API key 提交到仓库。

### `api/test/setup-env.ts`

```ts
process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '3001';
process.env.DATABASE_URL ??=
  'postgresql://mealrelay_test:mealrelay_test@localhost:5432/mealrelay_test';
process.env.CORS_ORIGINS ??= 'http://localhost:5173';
process.env.JWT_SECRET ??=
  'test-only-jwt-secret-with-at-least-32-bytes';
process.env.JWT_ACCESS_TTL_SECONDS ??= '900';
process.env.JWT_ISSUER ??= 'mealrelay-api-test';
process.env.JWT_AUDIENCE ??= 'mealrelay-web-test';
process.env.EMAIL_VERIFICATION_TTL_SECONDS ??= '3600';
process.env.FRONTEND_VERIFY_EMAIL_URL ??=
  'http://localhost:5173/confirm-email';
process.env.RESEND_API_KEY ??= 'test-only-resend-key';
process.env.RESEND_FROM ??= 'MealRelay Test <noreply@example.test>';
process.env.RESEND_TIMEOUT_MS ??= '500';
```

### `api/src/app.module.ts`

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Request, Response } from 'express';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnvironment } from '@/config/validate-environment';
import { EnvironmentVariables } from '@/config/environment.variables';
import { GraphqlContext } from '@/auth/graphql-context';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ) => ({
        graphiql:
          config.get('NODE_ENV', { infer: true }) !== 'production',
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        context: ({
          req,
          res,
        }: {
          req: Request;
          res: Response;
        }): GraphqlContext => ({
          request: req,
          response: res,
        }),
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

这里暂时只建立 HTTP GraphQL context。`graphql-ws` 的 `Authorization` connection parameter 在实时阶段接入，不应把 WS 兼容逻辑偷偷塞进 HTTP parser。

### `api/src/main.ts`

```ts
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentVariables } from '@/config/environment.variables';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvironmentVariables, true>);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  });

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
```

## 5. Prisma 模型和 migration

### `api/prisma/schema.prisma`

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

enum UserRole {
  CLIENT   @map("Client")
  OWNER    @map("Owner")
  DELIVERY @map("Delivery")
}

model User {
  id           String    @id @default(uuid(7)) @db.Uuid
  email        String    @unique(map: "users_email_key") @db.VarChar(254)
  passwordHash String    @map("password_hash") @db.VarChar(255)
  role         UserRole  @default(CLIENT)
  verifiedAt   DateTime? @map("verified_at") @db.Timestamptz(3)
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  emailVerification EmailVerification?

  @@map("users")
}

model EmailVerification {
  id        String   @id @default(uuid(7)) @db.Uuid
  userId    String   @unique(map: "email_verifications_user_id_key") @map("user_id") @db.Uuid
  tokenHash String   @unique(map: "email_verifications_token_hash_key") @map("token_hash") @db.Char(64)
  expiresAt DateTime @map("expires_at") @db.Timestamptz(3)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([expiresAt], map: "email_verifications_expires_at_idx")
  @@map("email_verifications")
}
```

公开 GraphQL enum 和数据库 enum 标签都是 `Client/Owner/Delivery`；Prisma 代码内部使用合法且醒目的 `CLIENT/OWNER/DELIVERY`，由 mapper 显式转换。

### `api/prisma/migrations/20260807000000_identity_foundation/migration.sql`

不要直接复制 migration 到一个已有数据库执行。正确流程是先运行 `prisma migrate dev --create-only` 让已安装的 Prisma 7 根据 schema 生成 SQL，再把下面的规范化约束加入生成文件并 review。一个全新数据库的预期 SQL 如后：

```sql
CREATE TYPE "UserRole" AS ENUM ('Client', 'Owner', 'Delivery');

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'Client',
    "verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_normalized_check"
      CHECK ("email" = lower(btrim("email")))
);

CREATE TABLE "email_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "email_verifications_user_id_key"
  ON "email_verifications"("user_id");
CREATE UNIQUE INDEX "email_verifications_token_hash_key"
  ON "email_verifications"("token_hash");
CREATE INDEX "email_verifications_expires_at_idx"
  ON "email_verifications"("expires_at");

ALTER TABLE "email_verifications"
  ADD CONSTRAINT "email_verifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

如果 migration 目录已经出现了别的身份 migration，不要创建第二份初始表；生成 diff 后把 enum/约束变更合入新的增量 migration。

## 6. GraphQL 公共 payload

### `api/src/common/dto/operation.payload.ts`

```ts
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
export abstract class OperationPayload {
  @Field()
  ok!: boolean;

  @Field(() => String, { nullable: true })
  error?: string;
}
```

DTO validation error仍由 `ValidationPipe` 产生 GraphQL error；业务可预期失败使用 `{ ok, error }`。数据库断线、代码错误等不可预期异常不得伪装成业务失败，应继续抛给统一异常层并保留安全日志。

## 7. Auth：principal、Bearer、JWT、Guard

### `api/src/auth/auth-principal.ts`

```ts
import { UserRole } from '@/users/user-role.enum';

export interface AuthenticatedPrincipal {
  userId: string;
  role: UserRole;
}
```

### `api/src/auth/graphql-context.ts`

```ts
import { Request, Response } from 'express';
import { AuthenticatedPrincipal } from './auth-principal';

export interface GraphqlContext {
  request: Request;
  response: Response;
  principal?: AuthenticatedPrincipal;
}
```

### `api/src/auth/password-policy.ts`

```ts
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
```

登录 input 只要求密码非空，因为登录验证的是已有 credential；注册和修改密码统一要求 12–128 字符。

### `api/src/auth/password-hasher.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

@Injectable()
export class PasswordHasherService {
  private readonly dummyHash = argon2.hash(randomBytes(32), {
    type: argon2.argon2id,
  });

  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  verify(passwordHash: string, candidate: string): Promise<boolean> {
    return argon2.verify(passwordHash, candidate);
  }

  async verifyOrDummy(
    passwordHash: string | null,
    candidate: string,
  ): Promise<boolean> {
    const comparisonHash = passwordHash ?? (await this.dummyHash);
    const matches = await argon2.verify(comparisonHash, candidate);
    return passwordHash !== null && matches;
  }
}
```

不存在的 email 仍执行一次 Argon2 verify，降低明显的账户枚举时间差。这里不吞掉 hash 格式损坏等异常；数据库中的 hash 损坏属于服务器故障。

### `api/src/auth/access-token.service.ts`

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { EnvironmentVariables } from '@/config/environment.variables';
import { UserRole } from '@/users/user-role.enum';
import { AuthenticatedPrincipal } from './auth-principal';

interface AccessTokenPayload extends Record<string, unknown> {
  sub: string;
  role: UserRole;
  exp: number;
  iat: number;
}

export interface IssuedAccessToken {
  accessToken: string;
  expiresIn: number;
}

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async issue(
    principal: AuthenticatedPrincipal,
  ): Promise<IssuedAccessToken> {
    const expiresIn = this.config.get('JWT_ACCESS_TTL_SECONDS', {
      infer: true,
    });
    const accessToken = await this.jwt.signAsync(
      { role: principal.role },
      {
        algorithm: 'HS256',
        subject: principal.userId,
        expiresIn,
        issuer: this.config.get('JWT_ISSUER', { infer: true }),
        audience: this.config.get('JWT_AUDIENCE', { infer: true }),
      },
    );

    return { accessToken, expiresIn };
  }

  async verify(accessToken: string): Promise<AuthenticatedPrincipal> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(
        accessToken,
        {
          algorithms: ['HS256'],
          issuer: this.config.get('JWT_ISSUER', { infer: true }),
          audience: this.config.get('JWT_AUDIENCE', { infer: true }),
        },
      );

      if (!isUUID(payload.sub, '7') || !isUserRole(payload.role)) {
        throw new UnauthorizedException('Invalid access token');
      }

      return {
        userId: payload.sub,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}

function isUserRole(value: unknown): value is UserRole {
  return Object.values(UserRole).some((role) => role === value);
}
```

JWT 使用标准 `sub` 表示 user ID，并固定算法、issuer、audience 和过期时间。`decode()` 不能替代 `verifyAsync()`。

### `api/src/auth/bearer-token.ts`

```ts
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

const JWT_PATTERN =
  /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i;
const MAX_AUTHORIZATION_LENGTH = 8_192;

type RawHeaderRequest = Pick<Request, 'rawHeaders'>;

export function extractBearerToken(request: RawHeaderRequest): string {
  const legacyCredentials = collectRawHeaders(request, 'x-jwt');
  if (legacyCredentials.length > 0) {
    throw new UnauthorizedException('Unsupported authentication header');
  }

  const authorizationValues = collectRawHeaders(request, 'authorization');
  if (authorizationValues.length !== 1) {
    throw new UnauthorizedException('A single Authorization header is required');
  }

  const authorization = authorizationValues[0];
  if (authorization.length > MAX_AUTHORIZATION_LENGTH) {
    throw new UnauthorizedException('Invalid Authorization header');
  }

  const match = JWT_PATTERN.exec(authorization);
  if (!match) {
    throw new UnauthorizedException('Expected Authorization: Bearer <JWT>');
  }

  return match[1];
}

function collectRawHeaders(
  request: RawHeaderRequest,
  headerName: string,
): string[] {
  const values: string[] = [];
  const target = headerName.toLowerCase();

  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    if (request.rawHeaders[index]?.toLowerCase() === target) {
      values.push(request.rawHeaders[index + 1] ?? '');
    }
  }

  return values;
}
```

读取 `rawHeaders` 是为了检测重复 `Authorization`；只读 `request.headers.authorization` 可能已经丢失重复信息。认证 scheme 按 HTTP 语义大小写不敏感，但 header 必须严格只有一个 bearer credential。

### `api/src/auth/gql-auth.guard.ts`

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AccessTokenService } from './access-token.service';
import { extractBearerToken } from './bearer-token';
import { GraphqlContext } from './graphql-context';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokenService) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const graphql = GqlExecutionContext.create(executionContext);
    const context = graphql.getContext<GraphqlContext>();
    const accessToken = extractBearerToken(context.request);

    context.principal = await this.accessTokens.verify(accessToken);
    return true;
  }
}
```

### `api/src/auth/gql-throttler.guard.ts`

```ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GraphqlContext } from './graphql-context';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(executionContext: ExecutionContext): {
    req: GraphqlContext['request'];
    res: GraphqlContext['response'];
  } {
    const graphql = GqlExecutionContext.create(executionContext);
    const context = graphql.getContext<GraphqlContext>();
    return {
      req: context.request,
      res: context.response,
    };
  }
}
```

首版 throttler storage 是进程内存，只能提供单实例保护。上线多个实例前必须换成共享 storage，并基于可信 proxy 配置取得客户端 IP；不能无条件信任 `X-Forwarded-For`。

### `api/src/auth/current-principal.decorator.ts`

```ts
import { UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedPrincipal } from './auth-principal';
import { GraphqlContext } from './graphql-context';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, executionContext): AuthenticatedPrincipal => {
    const graphql = GqlExecutionContext.create(executionContext);
    const context = graphql.getContext<GraphqlContext>();

    if (!context.principal) {
      throw new UnauthorizedException('Authentication is required');
    }

    return context.principal;
  },
);
```

### `api/src/auth/roles.decorator.ts`

```ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@/users/user-role.enum';

export const ROLES_METADATA_KEY = 'auth:roles';

export const Roles = (...roles: readonly UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_METADATA_KEY, roles);
```

### `api/src/auth/roles.guard.ts`

```ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '@/users/user-role.enum';
import { GraphqlContext } from './graphql-context';
import { ROLES_METADATA_KEY } from './roles.decorator';

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

    const graphql = GqlExecutionContext.create(executionContext);
    const principal = graphql.getContext<GraphqlContext>().principal;

    if (!principal) {
      throw new UnauthorizedException('Authentication is required');
    }

    if (!requiredRoles.includes(principal.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
```

`RolesGuard` 只能回答“这个角色能否进入用例”。餐厅所有权、订单当前状态等检查仍必须留在对应 application service。

## 8. Auth：登录 persistence、service、resolver

### `api/src/auth/credentials.repository.ts`

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  USER_CREDENTIALS_SELECT,
  UserCredentialsRecord,
} from '@/users/user.persistence';

@Injectable()
export class CredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByNormalizedEmail(email: string): Promise<UserCredentialsRecord | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: USER_CREDENTIALS_SELECT,
    });
  }
}
```

### `api/src/auth/dto/login.input.ts`

```ts
import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_PASSWORD_LENGTH } from '../password-policy';
import { normalizeEmail } from '@/users/normalize-email';

@InputType()
export class LoginInput {
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail({ allow_utf8_local_part: false })
  @MaxLength(254)
  email!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PASSWORD_LENGTH)
  password!: string;
}
```

### `api/src/auth/dto/auth.payload.ts`

```ts
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { OperationPayload } from '@/common/dto/operation.payload';
import { UserModel } from '@/users/models/user.model';

@ObjectType()
export class AuthPayload extends OperationPayload {
  @Field(() => String, { nullable: true })
  accessToken?: string;

  @Field(() => Int, { nullable: true })
  expiresIn?: number;

  @Field(() => UserModel, { nullable: true })
  user?: UserModel;
}
```

### `api/src/auth/auth.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { UserModel } from '@/users/models/user.model';
import { normalizeEmail } from '@/users/normalize-email';
import { toSafeUser } from '@/users/user.mapper';
import { AccessTokenService } from './access-token.service';
import { CredentialsRepository } from './credentials.repository';
import { PasswordHasherService } from './password-hasher.service';

export interface LoginCommand {
  email: string;
  password: string;
}

export type LoginResult =
  | {
      ok: true;
      accessToken: string;
      expiresIn: number;
      user: UserModel;
    }
  | { ok: false };

@Injectable()
export class AuthService {
  constructor(
    private readonly credentials: CredentialsRepository,
    private readonly passwords: PasswordHasherService,
    private readonly accessTokens: AccessTokenService,
  ) {}

  async login(input: LoginCommand): Promise<LoginResult> {
    const user = await this.credentials.findByNormalizedEmail(
      normalizeEmail(input.email),
    );
    const passwordMatches = await this.passwords.verifyOrDummy(
      user?.passwordHash ?? null,
      input.password,
    );

    if (!user || !passwordMatches) {
      return { ok: false };
    }

    const safeUser = toSafeUser(user);
    const issued = await this.accessTokens.issue({
      userId: safeUser.id,
      role: safeUser.role,
    });

    return {
      ok: true,
      ...issued,
      user: safeUser,
    };
  }
}
```

### `api/src/auth/auth.resolver.ts`

```ts
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthPayload } from './dto/auth.payload';
import { LoginInput } from './dto/login.input';
import { GqlThrottlerGuard } from './gql-throttler.guard';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(GqlThrottlerGuard)
  @Throttle({ identity: { limit: 5, ttl: 60_000 } })
  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    const result = await this.authService.login({
      email: input.email,
      password: input.password,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: 'Invalid email or password.',
      };
    }

    return {
      ok: true,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }
}
```

### `api/src/auth/auth.module.ts`

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { EnvironmentVariables } from '@/config/environment.variables';
import { PrismaModule } from '@/prisma/prisma.module';
import { AccessTokenService } from './access-token.service';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { CredentialsRepository } from './credentials.repository';
import { GqlAuthGuard } from './gql-auth.guard';
import { GqlThrottlerGuard } from './gql-throttler.guard';
import { PasswordHasherService } from './password-hasher.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        name: 'identity',
        ttl: 60_000,
        limit: 10,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
      ) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
      }),
    }),
  ],
  providers: [
    AuthResolver,
    AuthService,
    CredentialsRepository,
    PasswordHasherService,
    AccessTokenService,
    GqlAuthGuard,
    GqlThrottlerGuard,
    RolesGuard,
  ],
  exports: [
    PasswordHasherService,
    GqlAuthGuard,
    GqlThrottlerGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
```

AuthModule 不依赖 UsersModule，避免环形模块依赖；它只通过自己的 credential repository 查询认证所需字段。UsersModule 单向导入 AuthModule，以复用 password hasher 和 guards。

## 9. Users：安全类型、枚举和 mapper

### `api/src/users/user-role.enum.ts`

```ts
import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Delivery = 'Delivery',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'MealRelay account role.',
});
```

### `api/src/users/user.types.ts`

```ts
import { UserRole } from './user-role.enum';

export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### `api/src/users/user.persistence.ts`

```ts
import { Prisma } from '@/generated/prisma/client';

export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  verifiedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

export const USER_CREDENTIALS_SELECT = {
  ...PUBLIC_USER_SELECT,
  passwordHash: true,
} as const satisfies Prisma.UserSelect;

export type PublicUserRecord = Prisma.UserGetPayload<{
  select: typeof PUBLIC_USER_SELECT;
}>;

export type UserCredentialsRecord = Prisma.UserGetPayload<{
  select: typeof USER_CREDENTIALS_SELECT;
}>;
```

所有普通查询都复用 `PUBLIC_USER_SELECT`。只有登录和验证当前密码的路径才能使用 `USER_CREDENTIALS_SELECT`。

### `api/src/users/user.mapper.ts`

```ts
import { UserRole as PrismaUserRole } from '@/generated/prisma/client';
import { UserRole } from './user-role.enum';
import { PublicUserRecord } from './user.persistence';
import { SafeUser } from './user.types';
import { UserRole } from './user-role.enum';

export interface RegisterCommand {
  email: string;
  password: string;
  role: UserRole;
}

export interface ChangeEmailCommand {
  newEmail: string;
  currentPassword: string;
}

export interface ChangePasswordCommand {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailCommand {
  token: string;
}

export function toSafeUser(user: PublicUserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: toPublicUserRole(user.role),
    emailVerified: user.verifiedAt !== null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toPublicUserRole(role: PrismaUserRole): UserRole {
  switch (role) {
    case PrismaUserRole.CLIENT:
      return UserRole.Client;
    case PrismaUserRole.OWNER:
      return UserRole.Owner;
    case PrismaUserRole.DELIVERY:
      return UserRole.Delivery;
  }
}

export function toPrismaUserRole(role: UserRole): PrismaUserRole {
  switch (role) {
    case UserRole.Client:
      return PrismaUserRole.CLIENT;
    case UserRole.Owner:
      return PrismaUserRole.OWNER;
    case UserRole.Delivery:
      return PrismaUserRole.DELIVERY;
  }
}
```

### `api/src/users/normalize-email.ts`

```ts
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
```

应用层和 DTO 都执行规范化，数据库 migration 再以 check constraint 兜底，避免绕过 GraphQL 的写入产生不同大小写账户。

### `api/src/users/models/user.model.ts`

```ts
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserRole } from '../user-role.enum';

@ObjectType('User')
export class UserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field(() => UserRole)
  role!: UserRole;

  @Field()
  emailVerified!: boolean;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
```

这个 GraphQL model 从类型定义上就没有 `password` 或 `passwordHash`，不能用 Prisma User 直接替代。

## 10. Users：GraphQL DTO

### `api/src/users/dto/register.input.ts`

```ts
import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@/auth/password-policy';
import { normalizeEmail } from '../normalize-email';
import { UserRole } from '../user-role.enum';

@InputType()
export class RegisterInput {
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail({ allow_utf8_local_part: false })
  @MaxLength(254)
  email!: string;

  @Field()
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(MAX_PASSWORD_LENGTH)
  password!: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  role!: UserRole;
}
```

### `api/src/users/dto/register.payload.ts`

```ts
import { Field, ObjectType } from '@nestjs/graphql';
import { OperationPayload } from '@/common/dto/operation.payload';
import { UserModel } from '../models/user.model';

@ObjectType()
export class RegisterPayload extends OperationPayload {
  @Field(() => UserModel, { nullable: true })
  user?: UserModel;
}
```

### `api/src/users/dto/change-email.input.ts`

```ts
import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_PASSWORD_LENGTH } from '@/auth/password-policy';
import { normalizeEmail } from '../normalize-email';

@InputType()
export class ChangeEmailInput {
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail({ allow_utf8_local_part: false })
  @MaxLength(254)
  newEmail!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PASSWORD_LENGTH)
  currentPassword!: string;
}
```

### `api/src/users/dto/change-password.input.ts`

```ts
import { Field, InputType } from '@nestjs/graphql';
import { IsString, MaxLength, MinLength } from 'class-validator';
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@/auth/password-policy';

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PASSWORD_LENGTH)
  currentPassword!: string;

  @Field()
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(MAX_PASSWORD_LENGTH)
  newPassword!: string;
}
```

### `api/src/users/dto/update-user.payload.ts`

```ts
import { Field, ObjectType } from '@nestjs/graphql';
import { OperationPayload } from '@/common/dto/operation.payload';
import { UserModel } from '../models/user.model';

@ObjectType()
export class UpdateUserPayload extends OperationPayload {
  @Field(() => UserModel, { nullable: true })
  user?: UserModel;
}
```

### `api/src/users/dto/verify-email.input.ts`

```ts
import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';

@InputType()
export class VerifyEmailInput {
  @Field()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  token!: string;
}
```

### `api/src/users/dto/verify-email.payload.ts`

```ts
import { Field, ObjectType } from '@nestjs/graphql';
import { OperationPayload } from '@/common/dto/operation.payload';

@ObjectType()
export class VerifyEmailPayload extends OperationPayload {
  @Field()
  verified!: boolean;
}
```

### `api/src/users/dto/resend-verification-email.payload.ts`

```ts
import { ObjectType } from '@nestjs/graphql';
import { OperationPayload } from '@/common/dto/operation.payload';

@ObjectType()
export class ResendVerificationEmailPayload extends OperationPayload {}
```

## 11. Users：verification token 与 mailer port

### `api/src/users/verification-token.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { EnvironmentVariables } from '@/config/environment.variables';

export interface IssuedVerificationToken {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class VerificationTokenService {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  issue(now = new Date()): IssuedVerificationToken {
    const rawToken = randomBytes(32).toString('base64url');
    const ttlSeconds = this.config.get('EMAIL_VERIFICATION_TTL_SECONDS', {
      infer: true,
    });

    return {
      rawToken,
      tokenHash: this.hash(rawToken),
      expiresAt: new Date(now.getTime() + ttlSeconds * 1_000),
    };
  }

  hash(rawToken: string): string {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }
}
```

数据库只存 SHA-256 后的 token。这里的 token 本身有 256 bit 随机性，不需要像人类密码那样使用慢 hash。

### `api/src/users/verification-mailer.port.ts`

```ts
export const VERIFICATION_MAILER = Symbol('VERIFICATION_MAILER');

export interface SendVerificationEmailCommand {
  recipientEmail: string;
  rawToken: string;
  deliveryKey: string;
}

export interface VerificationMailer {
  send(command: SendVerificationEmailCommand): Promise<void>;
}
```

`deliveryKey` 是 provider-neutral 的副作用幂等键，不是 GraphQL input。application service 使用 verification token hash 派生它，避免把 raw token 放进 provider header；Resend 在 24 小时内会对相同 key 和相同 payload 去重。

### `api/src/users/resend-verification-mailer.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '@/config/environment.variables';
import {
  SendVerificationEmailCommand,
  VerificationMailer,
} from './verification-mailer.port';

const RESEND_EMAILS_ENDPOINT = 'https://api.resend.com/emails';

@Injectable()
export class ResendVerificationMailer implements VerificationMailer {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async send(command: SendVerificationEmailCommand): Promise<void> {
    const verificationUrl = new URL(
      this.config.get('FRONTEND_VERIFY_EMAIL_URL', { infer: true }),
    );
    verificationUrl.searchParams.set('token', command.rawToken);

    const body = {
      from: this.config.get('RESEND_FROM', { infer: true }),
      to: [command.recipientEmail],
      subject: 'Verify your MealRelay email',
      text: `Verify your MealRelay email by opening this link: ${verificationUrl.toString()}`,
    };

    try {
      const response = await fetch(RESEND_EMAILS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.get('RESEND_API_KEY', {
            infer: true,
          })}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': command.deliveryKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(
          this.config.get('RESEND_TIMEOUT_MS', { infer: true }),
        ),
      });

      if (!response.ok) {
        throw new Error(`Resend returned status ${response.status}`);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new Error('Resend request timed out');
      }
      throw error;
    }
  }
}
```

adapter 只检查 Resend HTTP 状态码，不读取或记录响应 body，避免 provider 错误中意外出现收件人或消息内容。`Idempotency-Key` 使同一次发送可安全重试，但 Resend 只保留 24 小时的幂等窗口，它不能替代本地 durable job/outbox。application/e2e 测试必须 override mailer port；adapter 自身的聚焦单元测试 mock `fetch`，所有自动化测试都禁止真实网络请求。

## 12. Users：repository 与事务

### `api/src/users/users.repository.ts`

```ts
import { Injectable } from '@nestjs/common';
import { UserRole as PrismaUserRole } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  PUBLIC_USER_SELECT,
  PublicUserRecord,
  USER_CREDENTIALS_SELECT,
  UserCredentialsRecord,
} from './user.persistence';

export interface CreateUserRecord {
  email: string;
  passwordHash: string;
  role: PrismaUserRole;
  tokenHash: string;
  expiresAt: Date;
}

export interface ReplaceVerificationRecord {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithVerification(input: CreateUserRecord): Promise<PublicUserRecord> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        emailVerification: {
          create: {
            tokenHash: input.tokenHash,
            expiresAt: input.expiresAt,
          },
        },
      },
      select: PUBLIC_USER_SELECT,
    });
  }

  findSafeById(userId: string): Promise<PublicUserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });
  }

  findCredentialsById(userId: string): Promise<UserCredentialsRecord | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_CREDENTIALS_SELECT,
    });
  }

  updateEmailWithVerification(input: {
    userId: string;
    expectedUpdatedAt: Date;
    email: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PublicUserRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.update({
        where: {
          id: input.userId,
          updatedAt: input.expectedUpdatedAt,
        },
        data: {
          email: input.email,
          verifiedAt: null,
        },
        select: PUBLIC_USER_SELECT,
      });

      await transaction.emailVerification.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        },
        update: {
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          createdAt: new Date(),
        },
      });

      return user;
    });
  }

  updatePassword(input: {
    userId: string;
    expectedUpdatedAt: Date;
    passwordHash: string;
  }): Promise<PublicUserRecord> {
    return this.prisma.user.update({
      where: {
        id: input.userId,
        updatedAt: input.expectedUpdatedAt,
      },
      data: { passwordHash: input.passwordHash },
      select: PUBLIC_USER_SELECT,
    });
  }

  replaceVerification(
    input: ReplaceVerificationRecord,
  ): Promise<PublicUserRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUniqueOrThrow({
        where: { id: input.userId },
        select: PUBLIC_USER_SELECT,
      });

      await transaction.emailVerification.upsert({
        where: { userId: input.userId },
        create: input,
        update: {
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          createdAt: new Date(),
        },
      });

      return user;
    });
  }

  consumeVerification(
    tokenHash: string,
    now: Date,
  ): Promise<PublicUserRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      const verification = await transaction.emailVerification.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
        },
      });

      if (!verification || verification.expiresAt <= now) {
        if (verification) {
          await transaction.emailVerification.deleteMany({
            where: { id: verification.id },
          });
        }
        return null;
      }

      const consumed = await transaction.emailVerification.deleteMany({
        where: {
          id: verification.id,
          tokenHash,
          expiresAt: { gt: now },
        },
      });

      if (consumed.count !== 1) {
        return null;
      }

      return transaction.user.update({
        where: { id: verification.userId },
        data: { verifiedAt: now },
        select: PUBLIC_USER_SELECT,
      });
    });
  }
}
```

注册使用 nested write，User 和 Verification 要么一起成功，要么一起失败。修改 email 使用短 transaction。`updatedAt` 被当作乐观并发条件，防止“校验旧密码后，另一个请求先修改账户”造成 lost update。验证消费先条件删除，再更新 user；两个并发请求中只有 `count === 1` 的请求成功。

生产代码如需完全可控时间，应再注入 Clock port，替换 repository 中更新 verification `createdAt` 使用的 `new Date()`；首个切片可以先保留，测试通过 fake timers 固定时间。

## 13. Users：application service

### `api/src/users/users.service.types.ts`

```ts
import { SafeUser } from './user.types';

export enum UserOperationError {
  EmailAlreadyInUse = 'EMAIL_ALREADY_IN_USE',
  EmailUnchanged = 'EMAIL_UNCHANGED',
  PasswordUnchanged = 'PASSWORD_UNCHANGED',
  InvalidCurrentPassword = 'INVALID_CURRENT_PASSWORD',
  UserNotFound = 'USER_NOT_FOUND',
  ConcurrentModification = 'CONCURRENT_MODIFICATION',
  InvalidOrExpiredVerification = 'INVALID_OR_EXPIRED_VERIFICATION',
  VerificationDeliveryFailed = 'VERIFICATION_DELIVERY_FAILED',
}

export type UserOperationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: UserOperationError };

export type UserMutationResult = UserOperationResult<SafeUser>;
export type EmptyUserOperationResult = UserOperationResult<undefined>;
```

### `api/src/users/users.service.ts`

```ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PasswordHasherService } from '@/auth/password-hasher.service';
import { normalizeEmail } from './normalize-email';
import { toPrismaUserRole, toSafeUser } from './user.mapper';
import { SafeUser } from './user.types';
import { UsersRepository } from './users.repository';
import {
  EmptyUserOperationResult,
  ChangeEmailCommand,
  ChangePasswordCommand,
  RegisterCommand,
  UserMutationResult,
  UserOperationError,
  VerifyEmailCommand,
} from './users.service.types';
import {
  VERIFICATION_MAILER,
  VerificationMailer,
} from './verification-mailer.port';
import { VerificationTokenService } from './verification-token.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly users: UsersRepository,
    private readonly passwords: PasswordHasherService,
    private readonly verificationTokens: VerificationTokenService,
    @Inject(VERIFICATION_MAILER)
    private readonly verificationMailer: VerificationMailer,
  ) {}

  async register(input: RegisterCommand): Promise<UserMutationResult> {
    const email = normalizeEmail(input.email);
    const passwordHash = await this.passwords.hash(input.password);
    const verification = this.verificationTokens.issue();

    try {
      const created = await this.users.createWithVerification({
        email,
        passwordHash,
        role: toPrismaUserRole(input.role),
        tokenHash: verification.tokenHash,
        expiresAt: verification.expiresAt,
      });

      await this.sendVerificationAfterCommit(
        email,
        verification.rawToken,
        verification.tokenHash,
        'registration',
      );

      return { ok: true, value: toSafeUser(created) };
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        return {
          ok: false,
          error: UserOperationError.EmailAlreadyInUse,
        };
      }
      throw error;
    }
  }

  async getCurrentUser(userId: string): Promise<SafeUser | null> {
    const user = await this.users.findSafeById(userId);
    return user ? toSafeUser(user) : null;
  }

  async changeEmail(
    userId: string,
    input: ChangeEmailCommand,
  ): Promise<UserMutationResult> {
    const current = await this.users.findCredentialsById(userId);
    if (!current) {
      return { ok: false, error: UserOperationError.UserNotFound };
    }

    const passwordMatches = await this.passwords.verify(
      current.passwordHash,
      input.currentPassword,
    );
    if (!passwordMatches) {
      return {
        ok: false,
        error: UserOperationError.InvalidCurrentPassword,
      };
    }

    const email = normalizeEmail(input.newEmail);
    if (email === current.email) {
      return { ok: false, error: UserOperationError.EmailUnchanged };
    }

    const verification = this.verificationTokens.issue();

    try {
      const updated = await this.users.updateEmailWithVerification({
        userId,
        expectedUpdatedAt: current.updatedAt,
        email,
        tokenHash: verification.tokenHash,
        expiresAt: verification.expiresAt,
      });

      await this.sendVerificationAfterCommit(
        email,
        verification.rawToken,
        verification.tokenHash,
        'email change',
      );

      return { ok: true, value: toSafeUser(updated) };
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        return {
          ok: false,
          error: UserOperationError.EmailAlreadyInUse,
        };
      }
      if (hasPrismaCode(error, 'P2025')) {
        return {
          ok: false,
          error: UserOperationError.ConcurrentModification,
        };
      }
      throw error;
    }
  }

  async changePassword(
    userId: string,
    input: ChangePasswordCommand,
  ): Promise<UserMutationResult> {
    const current = await this.users.findCredentialsById(userId);
    if (!current) {
      return { ok: false, error: UserOperationError.UserNotFound };
    }

    const passwordMatches = await this.passwords.verify(
      current.passwordHash,
      input.currentPassword,
    );
    if (!passwordMatches) {
      return {
        ok: false,
        error: UserOperationError.InvalidCurrentPassword,
      };
    }

    if (await this.passwords.verify(current.passwordHash, input.newPassword)) {
      return { ok: false, error: UserOperationError.PasswordUnchanged };
    }

    const passwordHash = await this.passwords.hash(input.newPassword);

    try {
      const updated = await this.users.updatePassword({
        userId,
        expectedUpdatedAt: current.updatedAt,
        passwordHash,
      });
      return { ok: true, value: toSafeUser(updated) };
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) {
        return {
          ok: false,
          error: UserOperationError.ConcurrentModification,
        };
      }
      throw error;
    }
  }

  async verifyEmail(
    input: VerifyEmailCommand,
  ): Promise<EmptyUserOperationResult> {
    const tokenHash = this.verificationTokens.hash(input.token);
    const verified = await this.users.consumeVerification(tokenHash, new Date());

    if (!verified) {
      return {
        ok: false,
        error: UserOperationError.InvalidOrExpiredVerification,
      };
    }

    return { ok: true, value: undefined };
  }

  async resendVerificationEmail(
    userId: string,
  ): Promise<EmptyUserOperationResult> {
    const existing = await this.users.findSafeById(userId);
    if (!existing) {
      return { ok: false, error: UserOperationError.UserNotFound };
    }

    if (existing.verifiedAt !== null) {
      return { ok: true, value: undefined };
    }

    const verification = this.verificationTokens.issue();
    await this.users.replaceVerification({
      userId,
      tokenHash: verification.tokenHash,
      expiresAt: verification.expiresAt,
    });

    try {
      await this.verificationMailer.send({
        recipientEmail: existing.email,
        rawToken: verification.rawToken,
        deliveryKey: verificationDeliveryKey(verification.tokenHash),
      });
      return { ok: true, value: undefined };
    } catch (error) {
      this.logger.error(
        'Verification email resend failed after token rotation',
        error instanceof Error ? error.stack : undefined,
      );
      return {
        ok: false,
        error: UserOperationError.VerificationDeliveryFailed,
      };
    }
  }

  private async sendVerificationAfterCommit(
    recipientEmail: string,
    rawToken: string,
    tokenHash: string,
    operation: string,
  ): Promise<void> {
    try {
      await this.verificationMailer.send({
        recipientEmail,
        rawToken,
        deliveryKey: verificationDeliveryKey(tokenHash),
      });
    } catch (error) {
      this.logger.error(
        `Verification email delivery failed after ${operation}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

function verificationDeliveryKey(tokenHash: string): string {
  return `email-verification/${tokenHash}`;
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
```

注意注册和改邮箱的邮件失败不会回滚数据库提交，也不会伪装成账户创建失败。用户可以登录后调用 `resendVerificationEmail`。真正的 durable retry/outbox 留到异步阶段；当前 mailer port 已为替换做好边界。

修改密码后，已经签发的短期 access token 在到期前仍有效。这是首版只实现 access token 的明确取舍；若产品要求立即失效，需要在 User 中加入 token version 或 revocation 机制并写 ADR。

## 14. Users：resolver 与 module

### `api/src/users/users.resolver.ts`

```ts
import {
  Args,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentPrincipal } from '@/auth/current-principal.decorator';
import { GqlAuthGuard } from '@/auth/gql-auth.guard';
import { GqlThrottlerGuard } from '@/auth/gql-throttler.guard';
import { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { ChangeEmailInput } from './dto/change-email.input';
import { ChangePasswordInput } from './dto/change-password.input';
import { RegisterInput } from './dto/register.input';
import { RegisterPayload } from './dto/register.payload';
import { ResendVerificationEmailPayload } from './dto/resend-verification-email.payload';
import { UpdateUserPayload } from './dto/update-user.payload';
import { VerifyEmailInput } from './dto/verify-email.input';
import { VerifyEmailPayload } from './dto/verify-email.payload';
import { UserModel } from './models/user.model';
import { UserOperationError } from './users.service.types';
import { UsersService } from './users.service';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(GqlThrottlerGuard)
  @Throttle({ identity: { limit: 5, ttl: 60_000 } })
  @Mutation(() => RegisterPayload)
  async register(
    @Args('input') input: RegisterInput,
  ): Promise<RegisterPayload> {
    const result = await this.usersService.register({
      email: input.email,
      password: input.password,
      role: input.role,
    });
    return result.ok
      ? { ok: true, user: result.value }
      : { ok: false, error: 'Unable to register with these details.' };
  }

  @UseGuards(GqlThrottlerGuard, GqlAuthGuard)
  @Throttle({ identity: { limit: 30, ttl: 60_000 } })
  @Query(() => UserModel)
  async me(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ): Promise<UserModel> {
    const user = await this.usersService.getCurrentUser(principal.userId);
    if (!user) {
      throw new UnauthorizedException('Authenticated account no longer exists');
    }
    return user;
  }

  @UseGuards(GqlThrottlerGuard, GqlAuthGuard)
  @Throttle({ identity: { limit: 5, ttl: 60_000 } })
  @Mutation(() => UpdateUserPayload)
  async changeEmail(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: ChangeEmailInput,
  ): Promise<UpdateUserPayload> {
    const result = await this.usersService.changeEmail(principal.userId, {
      newEmail: input.newEmail,
      currentPassword: input.currentPassword,
    });
    return result.ok
      ? { ok: true, user: result.value }
      : { ok: false, error: userErrorMessage(result.error) };
  }

  @UseGuards(GqlThrottlerGuard, GqlAuthGuard)
  @Throttle({ identity: { limit: 5, ttl: 60_000 } })
  @Mutation(() => UpdateUserPayload)
  async changePassword(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Args('input') input: ChangePasswordInput,
  ): Promise<UpdateUserPayload> {
    const result = await this.usersService.changePassword(
      principal.userId,
      {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      },
    );
    return result.ok
      ? { ok: true, user: result.value }
      : { ok: false, error: userErrorMessage(result.error) };
  }

  @UseGuards(GqlThrottlerGuard)
  @Throttle({ identity: { limit: 10, ttl: 60_000 } })
  @Mutation(() => VerifyEmailPayload)
  async verifyEmail(
    @Args('input') input: VerifyEmailInput,
  ): Promise<VerifyEmailPayload> {
    const result = await this.usersService.verifyEmail({ token: input.token });
    return result.ok
      ? { ok: true, verified: true }
      : {
          ok: false,
          verified: false,
          error: userErrorMessage(result.error),
        };
  }

  @UseGuards(GqlThrottlerGuard, GqlAuthGuard)
  @Throttle({ identity: { limit: 3, ttl: 60_000 } })
  @Mutation(() => ResendVerificationEmailPayload)
  async resendVerificationEmail(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ): Promise<ResendVerificationEmailPayload> {
    const result = await this.usersService.resendVerificationEmail(
      principal.userId,
    );
    return result.ok
      ? { ok: true }
      : { ok: false, error: userErrorMessage(result.error) };
  }
}

function userErrorMessage(error: UserOperationError): string {
  switch (error) {
    case UserOperationError.EmailAlreadyInUse:
      return 'Unable to use that email address.';
    case UserOperationError.EmailUnchanged:
      return 'The new email must be different.';
    case UserOperationError.PasswordUnchanged:
      return 'The new password must be different.';
    case UserOperationError.InvalidCurrentPassword:
      return 'Current password is incorrect.';
    case UserOperationError.UserNotFound:
      return 'Account is unavailable.';
    case UserOperationError.ConcurrentModification:
      return 'The account changed during this request. Please retry.';
    case UserOperationError.InvalidOrExpiredVerification:
      return 'Verification token is invalid or expired.';
    case UserOperationError.VerificationDeliveryFailed:
      return 'Verification email could not be sent. Please retry later.';
  }
}
```

### `api/src/users/users.module.ts`

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { ResendVerificationMailer } from './resend-verification-mailer.service';
import { UsersRepository } from './users.repository';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import {
  VERIFICATION_MAILER,
} from './verification-mailer.port';
import { VerificationTokenService } from './verification-token.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    UsersResolver,
    UsersService,
    UsersRepository,
    VerificationTokenService,
    ResendVerificationMailer,
    {
      provide: VERIFICATION_MAILER,
      useExisting: ResendVerificationMailer,
    },
  ],
})
export class UsersModule {}
```

不导出 UsersService，因为当前没有其他模块需要跨边界调用它。以后订单需要用户信息时，应优先定义最小 query port，而不是把整个 service 变成公共万能入口。

## 15. 单元测试

下面是最低完整测试集。Repository 的事务与并发不应该用 Prisma mock 证明，而是在下一节的 PostgreSQL e2e 中验证。

### `api/src/users/resend-verification-mailer.service.spec.ts`

```ts
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SendVerificationEmailCommand } from './verification-mailer.port';
import { ResendVerificationMailer } from './resend-verification-mailer.service';

describe('ResendVerificationMailer', () => {
  let service: ResendVerificationMailer;
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  const command: SendVerificationEmailCommand = {
    recipientEmail: 'client@example.com',
    rawToken: 'raw-verification-token',
    deliveryKey: `email-verification/${'a'.repeat(64)}`,
  };

  beforeEach(async () => {
    fetchMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendVerificationMailer,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'FRONTEND_VERIFY_EMAIL_URL':
                  return 'https://app.example.com/confirm-email';
                case 'RESEND_API_KEY':
                  return 'test-only-resend-key';
                case 'RESEND_FROM':
                  return 'MealRelay <noreply@example.com>';
                case 'RESEND_TIMEOUT_MS':
                  return 500;
                default:
                  throw new Error(`Unexpected config key: ${key}`);
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get(ResendVerificationMailer);
  });

  afterAll(() => {
    fetchMock.mockRestore();
  });

  it('sends the expected Resend request without exposing the raw token in headers', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await expect(service.send(command)).resolves.toBeUndefined();

    const call = fetchMock.mock.calls[0];
    if (!call) {
      throw new Error('Expected fetch to be called');
    }
    const [endpoint, request] = call;
    if (typeof request?.body !== 'string') {
      throw new Error('Expected a JSON request body');
    }

    const headers = new Headers(request.headers);
    expect(endpoint).toBe('https://api.resend.com/emails');
    expect(headers.get('Authorization')).toBe(
      'Bearer test-only-resend-key',
    );
    expect(headers.get('Idempotency-Key')).toBe(command.deliveryKey);
    expect(headers.get('Idempotency-Key')).not.toContain(command.rawToken);
    expect(JSON.parse(request.body)).toEqual({
      from: 'MealRelay <noreply@example.com>',
      to: ['client@example.com'],
      subject: 'Verify your MealRelay email',
      text:
        'Verify your MealRelay email by opening this link: ' +
        'https://app.example.com/confirm-email?token=raw-verification-token',
    });
  });

  it('maps non-success status without reading a provider response body', async () => {
    fetchMock.mockResolvedValue(
      new Response('sensitive provider detail', { status: 422 }),
    );

    await expect(service.send(command)).rejects.toThrow(
      'Resend returned status 422',
    );
  });

  it('maps an aborted provider request to a stable timeout error', async () => {
    const timeoutError = new Error('request aborted');
    timeoutError.name = 'TimeoutError';
    fetchMock.mockRejectedValue(timeoutError);

    await expect(service.send(command)).rejects.toThrow(
      'Resend request timed out',
    );
  });
});
```

### `api/src/auth/bearer-token.spec.ts`

```ts
import { UnauthorizedException } from '@nestjs/common';
import { extractBearerToken } from './bearer-token';

const VALID_TOKEN = 'header.payload.signature';

describe('extractBearerToken', () => {
  it('extracts one standard bearer credential', () => {
    expect(
      extractBearerToken({
        rawHeaders: ['Authorization', `Bearer ${VALID_TOKEN}`],
      }),
    ).toBe(VALID_TOKEN);
  });

  it('accepts a case-insensitive bearer auth scheme', () => {
    expect(
      extractBearerToken({
        rawHeaders: ['authorization', `bearer ${VALID_TOKEN}`],
      }),
    ).toBe(VALID_TOKEN);
  });

  it.each([
    { rawHeaders: [] },
    { rawHeaders: ['Authorization', VALID_TOKEN] },
    {
      rawHeaders: [
        'Authorization',
        `Bearer ${VALID_TOKEN}`,
        'Authorization',
        `Bearer ${VALID_TOKEN}`,
      ],
    },
    {
      rawHeaders: [
        'Authorization',
        `Bearer ${VALID_TOKEN}`,
        'x-jwt',
        VALID_TOKEN,
      ],
    },
    { rawHeaders: ['x-jwt', VALID_TOKEN] },
  ])('rejects malformed, duplicate, or legacy credentials', (request) => {
    expect(() => extractBearerToken(request)).toThrow(UnauthorizedException);
  });
});
```

### `api/src/auth/password-hasher.service.spec.ts`

```ts
import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  const service = new PasswordHasherService();

  it('stores an Argon2id hash and verifies only the correct password', async () => {
    const password = 'correct-password-value';
    const passwordHash = await service.hash(password);

    expect(passwordHash).not.toBe(password);
    expect(passwordHash).toContain('$argon2id$');
    await expect(service.verify(passwordHash, password)).resolves.toBe(true);
    await expect(service.verify(passwordHash, 'wrong-password')).resolves.toBe(
      false,
    );
  });

  it('executes the dummy path without authenticating an unknown account', async () => {
    await expect(
      service.verifyOrDummy(null, 'candidate-password'),
    ).resolves.toBe(false);
  });
});
```

### `api/src/auth/access-token.service.spec.ts`

```ts
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentVariables } from '@/config/environment.variables';
import { UserRole } from '@/users/user-role.enum';
import { AccessTokenService } from './access-token.service';

describe('AccessTokenService', () => {
  let service: AccessTokenService;

  const values: Pick<
    EnvironmentVariables,
    | 'JWT_ACCESS_TTL_SECONDS'
    | 'JWT_ISSUER'
    | 'JWT_AUDIENCE'
  > = {
    JWT_ACCESS_TTL_SECONDS: 900,
    JWT_ISSUER: 'mealrelay-test',
    JWT_AUDIENCE: 'mealrelay-web-test',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'unit-test-secret-with-at-least-32-bytes',
        }),
      ],
      providers: [
        AccessTokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: keyof typeof values) => values[key]),
          },
        },
      ],
    }).compile();

    service = module.get(AccessTokenService);
  });

  it('issues and verifies the expected principal claims', async () => {
    const principal = {
      userId: '01989b55-1a2b-7def-8123-123456789abc',
      role: UserRole.Client,
    };

    const issued = await service.issue(principal);

    expect(issued.expiresIn).toBe(900);
    await expect(service.verify(issued.accessToken)).resolves.toEqual(principal);
  });

  it('rejects an invalid token', async () => {
    await expect(service.verify('invalid.token.value')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
```

### `api/src/auth/auth.service.spec.ts`

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole as PrismaUserRole } from '@/generated/prisma/client';
import { UserRole } from '@/users/user-role.enum';
import { AccessTokenService } from './access-token.service';
import { AuthService } from './auth.service';
import { CredentialsRepository } from './credentials.repository';
import { PasswordHasherService } from './password-hasher.service';

describe('AuthService', () => {
  let service: AuthService;

  const now = new Date('2026-08-07T00:00:00.000Z');
  const credentials = {
    id: '01989b55-1a2b-7def-8123-123456789abc',
    email: 'client@example.com',
    passwordHash: 'stored-hash',
    role: PrismaUserRole.CLIENT,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const credentialsRepository = {
    findByNormalizedEmail: jest.fn(),
  };
  const passwordHasher = {
    verifyOrDummy: jest.fn(),
  };
  const accessTokens = {
    issue: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: CredentialsRepository, useValue: credentialsRepository },
        { provide: PasswordHasherService, useValue: passwordHasher },
        { provide: AccessTokenService, useValue: accessTokens },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('normalizes email, verifies credentials, and issues a token', async () => {
    credentialsRepository.findByNormalizedEmail.mockResolvedValue(credentials);
    passwordHasher.verifyOrDummy.mockResolvedValue(true);
    accessTokens.issue.mockResolvedValue({
      accessToken: 'signed-token',
      expiresIn: 900,
    });

    await expect(
      service.login({
        email: ' Client@Example.COM ',
        password: 'correct-password',
      }),
    ).resolves.toEqual({
      ok: true,
      accessToken: 'signed-token',
      expiresIn: 900,
      user: {
        id: credentials.id,
        email: credentials.email,
        role: UserRole.Client,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      },
    });

    expect(credentialsRepository.findByNormalizedEmail).toHaveBeenCalledWith(
      'client@example.com',
    );
  });

  it('uses the dummy verification path for an unknown email', async () => {
    credentialsRepository.findByNormalizedEmail.mockResolvedValue(null);
    passwordHasher.verifyOrDummy.mockResolvedValue(false);

    await expect(
      service.login({ email: 'missing@example.com', password: 'secret' }),
    ).resolves.toEqual({ ok: false });
    expect(passwordHasher.verifyOrDummy).toHaveBeenCalledWith(null, 'secret');
    expect(accessTokens.issue).not.toHaveBeenCalled();
  });

  it('returns the same failure for a wrong password', async () => {
    credentialsRepository.findByNormalizedEmail.mockResolvedValue(credentials);
    passwordHasher.verifyOrDummy.mockResolvedValue(false);

    await expect(
      service.login({ email: credentials.email, password: 'wrong' }),
    ).resolves.toEqual({ ok: false });
    expect(accessTokens.issue).not.toHaveBeenCalled();
  });
});
```

### `api/src/auth/auth.resolver.spec.ts`

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@/users/user-role.enum';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  const authService = { login: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    resolver = module.get(AuthResolver);
  });

  it('maps successful login to the GraphQL payload', async () => {
    const user = {
      id: '01989b55-1a2b-7def-8123-123456789abc',
      email: 'client@example.com',
      role: UserRole.Client,
      emailVerified: false,
      createdAt: new Date('2026-08-07T00:00:00.000Z'),
      updatedAt: new Date('2026-08-07T00:00:00.000Z'),
    };
    authService.login.mockResolvedValue({
      ok: true,
      accessToken: 'token',
      expiresIn: 900,
      user,
    });

    await expect(
      resolver.login({ email: user.email, password: 'password-value' }),
    ).resolves.toEqual({
      ok: true,
      accessToken: 'token',
      expiresIn: 900,
      user,
    });
  });

  it('uses one client-safe message for all invalid credentials', async () => {
    authService.login.mockResolvedValue({ ok: false });

    await expect(
      resolver.login({
        email: 'missing@example.com',
        password: 'wrong-password',
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'Invalid email or password.',
    });
  });
});
```

### `api/src/users/users.service.spec.ts`

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole as PrismaUserRole } from '@/generated/prisma/client';
import { PasswordHasherService } from '@/auth/password-hasher.service';
import { UserRole } from './user-role.enum';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UserOperationError } from './users.service.types';
import {
  VERIFICATION_MAILER,
} from './verification-mailer.port';
import { VerificationTokenService } from './verification-token.service';

describe('UsersService', () => {
  let service: UsersService;

  const now = new Date('2026-08-07T00:00:00.000Z');
  const persistedUser = {
    id: '01989b55-1a2b-7def-8123-123456789abc',
    email: 'client@example.com',
    role: PrismaUserRole.CLIENT,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const credentialUser = {
    ...persistedUser,
    passwordHash: 'stored-hash',
  };
  const repository = {
    createWithVerification: jest.fn(),
    findSafeById: jest.fn(),
    findCredentialsById: jest.fn(),
    updateEmailWithVerification: jest.fn(),
    updatePassword: jest.fn(),
    replaceVerification: jest.fn(),
    consumeVerification: jest.fn(),
  };
  const passwords = {
    hash: jest.fn(),
    verify: jest.fn(),
  };
  const verificationTokens = {
    issue: jest.fn(),
    hash: jest.fn(),
  };
  const mailer = { send: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    verificationTokens.issue.mockReturnValue({
      rawToken: 'raw-token',
      tokenHash: 'a'.repeat(64),
      expiresAt: new Date('2026-08-08T00:00:00.000Z'),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
        { provide: PasswordHasherService, useValue: passwords },
        { provide: VerificationTokenService, useValue: verificationTokens },
        { provide: VERIFICATION_MAILER, useValue: mailer },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('creates the user and sends email only after persistence succeeds', async () => {
    passwords.hash.mockResolvedValue('new-hash');
    repository.createWithVerification.mockResolvedValue(persistedUser);
    mailer.send.mockResolvedValue(undefined);

    await expect(
      service.register({
        email: ' Client@Example.COM ',
        password: 'long-enough-password',
        role: UserRole.Client,
      }),
    ).resolves.toMatchObject({
      ok: true,
      value: {
        email: 'client@example.com',
        role: UserRole.Client,
        emailVerified: false,
      },
    });

    expect(
      repository.createWithVerification.mock.invocationCallOrder[0],
    ).toBeLessThan(
      mailer.send.mock.invocationCallOrder[0],
    );
    expect(mailer.send).toHaveBeenCalledWith({
      recipientEmail: 'client@example.com',
      rawToken: 'raw-token',
      deliveryKey: `email-verification/${'a'.repeat(64)}`,
    });
  });

  it('keeps registration successful if post-commit email delivery fails', async () => {
    passwords.hash.mockResolvedValue('new-hash');
    repository.createWithVerification.mockResolvedValue(persistedUser);
    mailer.send.mockRejectedValue(new Error('provider unavailable'));

    await expect(
      service.register({
        email: persistedUser.email,
        password: 'long-enough-password',
        role: UserRole.Client,
      }),
    ).resolves.toMatchObject({ ok: true });
  });

  it('maps the database unique constraint to an email conflict', async () => {
    passwords.hash.mockResolvedValue('new-hash');
    repository.createWithVerification.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.register({
        email: persistedUser.email,
        password: 'long-enough-password',
        role: UserRole.Client,
      }),
    ).resolves.toEqual({
      ok: false,
      error: UserOperationError.EmailAlreadyInUse,
    });
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('requires the current password before changing email', async () => {
    repository.findCredentialsById.mockResolvedValue(credentialUser);
    passwords.verify.mockResolvedValue(false);

    await expect(
      service.changeEmail(persistedUser.id, {
        newEmail: 'new@example.com',
        currentPassword: 'wrong-password',
      }),
    ).resolves.toEqual({
      ok: false,
      error: UserOperationError.InvalidCurrentPassword,
    });
    expect(repository.updateEmailWithVerification).not.toHaveBeenCalled();
  });

  it('changes password with an optimistic concurrency condition', async () => {
    repository.findCredentialsById.mockResolvedValue(credentialUser);
    passwords.verify
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    passwords.hash.mockResolvedValue('replacement-hash');
    repository.updatePassword.mockResolvedValue({
      ...persistedUser,
      updatedAt: new Date('2026-08-07T00:01:00.000Z'),
    });

    await expect(
      service.changePassword(persistedUser.id, {
        currentPassword: 'current-password',
        newPassword: 'replacement-password',
      }),
    ).resolves.toMatchObject({ ok: true });
    expect(repository.updatePassword).toHaveBeenCalledWith({
      userId: persistedUser.id,
      expectedUpdatedAt: persistedUser.updatedAt,
      passwordHash: 'replacement-hash',
    });
  });

  it('accepts a verification token only when repository consumption wins', async () => {
    verificationTokens.hash.mockReturnValue('b'.repeat(64));
    repository.consumeVerification.mockResolvedValue(persistedUser);

    await expect(
      service.verifyEmail({ token: 'x'.repeat(43) }),
    ).resolves.toEqual({ ok: true, value: undefined });

    repository.consumeVerification.mockResolvedValueOnce(null);
    await expect(
      service.verifyEmail({ token: 'x'.repeat(43) }),
    ).resolves.toEqual({
      ok: false,
      error: UserOperationError.InvalidOrExpiredVerification,
    });
  });
});
```

### `api/src/users/users.resolver.spec.ts`

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from './user-role.enum';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { UserOperationError } from './users.service.types';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  const usersService = {
    register: jest.fn(),
    getCurrentUser: jest.fn(),
    changeEmail: jest.fn(),
    changePassword: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
  };
  const principal = {
    userId: '01989b55-1a2b-7def-8123-123456789abc',
    role: UserRole.Client,
  };
  const user = {
    id: principal.userId,
    email: 'client@example.com',
    role: UserRole.Client,
    emailVerified: false,
    createdAt: new Date('2026-08-07T00:00:00.000Z'),
    updatedAt: new Date('2026-08-07T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();
    resolver = module.get(UsersResolver);
  });

  it('uses the authenticated principal for me', async () => {
    usersService.getCurrentUser.mockResolvedValue(user);
    await expect(resolver.me(principal)).resolves.toEqual(user);
    expect(usersService.getCurrentUser).toHaveBeenCalledWith(principal.userId);
  });

  it('does not accept a user id from changeEmail input', async () => {
    usersService.changeEmail.mockResolvedValue({ ok: true, value: user });
    const input = {
      newEmail: 'new@example.com',
      currentPassword: 'current-password',
    };

    await expect(resolver.changeEmail(principal, input)).resolves.toEqual({
      ok: true,
      user,
    });
    expect(usersService.changeEmail).toHaveBeenCalledWith(
      principal.userId,
      input,
    );
  });

  it('maps expected verification failure to a stable payload', async () => {
    usersService.verifyEmail.mockResolvedValue({
      ok: false,
      error: UserOperationError.InvalidOrExpiredVerification,
    });

    await expect(
      resolver.verifyEmail({ token: 'x'.repeat(43) }),
    ).resolves.toEqual({
      ok: false,
      verified: false,
      error: 'Verification token is invalid or expired.',
    });
  });
});
```

### Guard 测试策略

`GqlAuthGuard` 与 `RolesGuard` 的低价值框架 mock 很容易只测试自己构造的假 `ExecutionContext`。保留以下证明层次即可：

1. `bearer-token.spec.ts` 纯函数覆盖 header 边界；
2. `access-token.service.spec.ts` 覆盖 JWT 签名和 claims；
3. 下一节 e2e 通过真实 Nest GraphQL execution context 覆盖 guard 和 decorator；
4. 当 `@Roles()` 第一次用于餐厅/订单 operation 时，在该领域增加允许/拒绝 e2e。

因此不单独创建 `gql-auth.guard.spec.ts` 与 `roles.guard.spec.ts`；它们由更高价值的真实 GraphQL context 测试替代。

## 16. PostgreSQL + GraphQL e2e

### `api/test/assert-test-database.ts`

```ts
export function assertTestDatabase(databaseUrl: string): void {
  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));

  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing destructive test cleanup for non-test database: ${databaseName}`,
    );
  }
}
```

### `api/test/identity.e2e-spec.ts`

```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { printSchema } from 'graphql';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import {
  SendVerificationEmailCommand,
  VERIFICATION_MAILER,
  VerificationMailer,
} from '@/users/verification-mailer.port';
import { assertTestDatabase } from './assert-test-database';

class FakeVerificationMailer implements VerificationMailer {
  readonly messages: SendVerificationEmailCommand[] = [];

  async send(command: SendVerificationEmailCommand): Promise<void> {
    this.messages.push(command);
  }

  clear(): void {
    this.messages.length = 0;
  }
}

describe('Identity API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mailer = new FakeVerificationMailer();

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for identity e2e tests');
    }
    assertTestDatabase(databaseUrl);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(VERIFICATION_MAILER)
      .useValue(mailer)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        validationError: { target: false, value: false },
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    mailer.clear();
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
  });

  it('generates a safe and deterministic identity schema', () => {
    const schema = printSchema(app.get(GraphQLSchemaHost).schema);

    expect(schema).not.toMatch(/\bpassword(Hash)?\s*:/);
    expect(schema).not.toContain('x-jwt');
    expect(schema).toContain('register(input: RegisterInput!)');
    expect(schema).toContain('login(input: LoginInput!)');
    expect(schema).toContain('me: User!');
    expect(schema).toMatch(
      /enum UserRole \{\s+Client\s+Delivery\s+Owner\s+\}/,
    );
  });

  it('registers, logs in, authenticates me, and verifies email once', async () => {
    await register('Client@Example.com', 'correct-password-value');
    expect(mailer.messages).toHaveLength(1);

    const loginResponse = await graphql(
      `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            ok
            error
            accessToken
            expiresIn
            user { id email role emailVerified }
          }
        }
      `,
      {
        input: {
          email: 'client@example.com',
          password: 'correct-password-value',
        },
      },
    );

    expect(asUnknown(loginResponse.body)).toMatchObject({
      data: {
        login: {
          ok: true,
          error: null,
          expiresIn: 900,
          user: {
            email: 'client@example.com',
            role: 'Client',
            emailVerified: false,
          },
        },
      },
    });
    const accessToken = readPathString(loginResponse.body, [
      'data',
      'login',
      'accessToken',
    ]);

    const meResponse = await graphql(
      'query Me { me { id email role emailVerified } }',
      undefined,
      { Authorization: `Bearer ${accessToken}` },
    );
    expect(asUnknown(meResponse.body)).toMatchObject({
      data: {
        me: {
          email: 'client@example.com',
          role: 'Client',
          emailVerified: false,
        },
      },
    });

    const rawToken = mailer.messages[0]?.rawToken;
    if (!rawToken) {
      throw new Error('Expected a captured verification token');
    }

    const verificationRequests = [
      graphql(
        `
          mutation Verify($input: VerifyEmailInput!) {
            verifyEmail(input: $input) { ok error verified }
          }
        `,
        { input: { token: rawToken } },
      ),
      graphql(
        `
          mutation Verify($input: VerifyEmailInput!) {
            verifyEmail(input: $input) { ok error verified }
          }
        `,
        { input: { token: rawToken } },
      ),
    ];
    const verificationResponses = await Promise.all(verificationRequests);
    const outcomes = verificationResponses.map((response) =>
      readPathBoolean(response.body, ['data', 'verifyEmail', 'ok']),
    );
    expect(outcomes.sort()).toEqual([false, true]);
  });

  it('allows only one concurrent registration for a normalized email', async () => {
    const responses = await Promise.all([
      register('Owner@Example.com', 'correct-password-value', 'Owner'),
      register(' owner@example.COM ', 'correct-password-value', 'Owner'),
    ]);

    const outcomes = responses.map((response) =>
      readPathBoolean(response.body, ['data', 'register', 'ok']),
    );
    expect(outcomes.sort()).toEqual([false, true]);
    await expect(
      prisma.user.count({ where: { email: 'owner@example.com' } }),
    ).resolves.toBe(1);
  });

  it('rejects x-jwt and changes a password only for the bearer principal', async () => {
    await register('client@example.com', 'current-password-value');
    const firstLogin = await login(
      'client@example.com',
      'current-password-value',
    );
    const accessToken = readPathString(firstLogin.body, [
      'data',
      'login',
      'accessToken',
    ]);

    const legacyResponse = await graphql(
      'query Me { me { id } }',
      undefined,
      { 'x-jwt': accessToken },
    );
    expect(readPathArray(legacyResponse.body, ['errors'])).not.toHaveLength(0);

    const changeResponse = await graphql(
      `
        mutation ChangePassword($input: ChangePasswordInput!) {
          changePassword(input: $input) { ok error user { id } }
        }
      `,
      {
        input: {
          currentPassword: 'current-password-value',
          newPassword: 'replacement-password-value',
        },
      },
      { Authorization: `Bearer ${accessToken}` },
    );
    expect(asUnknown(changeResponse.body)).toMatchObject({
      data: { changePassword: { ok: true, error: null } },
    });

    const oldLogin = await login(
      'client@example.com',
      'current-password-value',
    );
    const newLogin = await login(
      'client@example.com',
      'replacement-password-value',
    );
    expect(readPathBoolean(oldLogin.body, ['data', 'login', 'ok'])).toBe(false);
    expect(readPathBoolean(newLogin.body, ['data', 'login', 'ok'])).toBe(true);
  });

  async function register(
    email: string,
    password: string,
    role = 'Client',
  ): Promise<Response> {
    return graphql(
      `
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            ok
            error
            user { id email role emailVerified }
          }
        }
      `,
      { input: { email, password, role } },
    );
  }

  async function login(
    email: string,
    password: string,
  ): Promise<Response> {
    return graphql(
      `
        mutation Login($input: LoginInput!) {
          login(input: $input) { ok error accessToken }
        }
      `,
      { input: { email, password } },
    );
  }

  async function graphql(
    query: string,
    variables?: Record<string, unknown>,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    let operation = request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables });

    for (const [name, value] of Object.entries(headers)) {
      operation = operation.set(name, value);
    }

    return operation.expect(200);
  }

  afterAll(async () => {
    await app?.close();
  });
});

function asUnknown(value: unknown): unknown {
  return value;
}

function readPathString(value: unknown, path: readonly string[]): string {
  const result = readPath(value, path);
  if (typeof result !== 'string') {
    throw new Error(`Expected string at ${path.join('.')}`);
  }
  return result;
}

function readPathBoolean(value: unknown, path: readonly string[]): boolean {
  const result = readPath(value, path);
  if (typeof result !== 'boolean') {
    throw new Error(`Expected boolean at ${path.join('.')}`);
  }
  return result;
}

function readPathArray(value: unknown, path: readonly string[]): unknown[] {
  const result = readPath(value, path);
  if (!Array.isArray(result)) {
    throw new Error(`Expected array at ${path.join('.')}`);
  }
  return result;
}

function readPath(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const segment of path) {
    if (!isRecord(current)) {
      throw new Error(`Expected object before ${segment}`);
    }
    current = current[segment];
  }
  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
```

还应在该文件逐步补充以下 case；若本 PR 以“完整身份切片”为验收，这些 case 必须在合并前完成：

- 缺失、伪造、过期 JWT；
- 重复 Authorization header（可用 Node 原生 HTTP request 构造，Supertest `.set()` 会覆盖）；
- GraphQL schema 中完全没有 `password`/`passwordHash`；
- 改邮箱后旧 token 失败、新 email 未验证、旧 email 可被再次注册；
- 邮件 adapter 失败时注册事务仍提交，resend 可以恢复；
- 输入 whitelist 拒绝额外 user ID/role 字段；
- `Client`、`Owner`、`Delivery` 三个 enum 值的 schema 快照。

## 17. 预期生成 SDL（只审查，不手改）

实施后 `api/src/schema.gql` 至少应包含下面的契约；字段排序以 Nest 的 `sortSchema: true` 结果为准：

```graphql
enum UserRole {
  Client
  Delivery
  Owner
}

type User {
  createdAt: DateTime!
  email: String!
  emailVerified: Boolean!
  id: ID!
  role: UserRole!
  updatedAt: DateTime!
}

type Mutation {
  changeEmail(input: ChangeEmailInput!): UpdateUserPayload!
  changePassword(input: ChangePasswordInput!): UpdateUserPayload!
  login(input: LoginInput!): AuthPayload!
  register(input: RegisterInput!): RegisterPayload!
  resendVerificationEmail: ResendVerificationEmailPayload!
  verifyEmail(input: VerifyEmailInput!): VerifyEmailPayload!
}

type Query {
  apiStatus: String!
  me: User!
}
```

必须加入 schema 断言，例如：

```ts
expect(schema).not.toMatch(/\bpassword(Hash)?\s*:/);
expect(schema).not.toContain('x-jwt');
```

## 18. 实施顺序

严格按下面顺序落地，避免在同一个无法编译的大改动中排查所有问题：

1. **准备依赖和配置**
   - 添加 `argon2`、`@nestjs/throttler`；Resend 发送使用 Node 内置 `fetch`，不新增邮件 SDK；
   - 更新 `EnvironmentVariables`、validator、`.env.example` 和 test env；
   - 单独运行配置单元测试。
2. **固定 persistence**
   - 更新 `schema.prisma`；
   - `prisma migrate dev --create-only`；
   - review enum、外键、unique、index、email check；
   - migrate test DB，生成 Prisma Client。
3. **建立安全模型边界**
   - 完成 public/credential selects、role mapper、SafeUser 和 GraphQL User；
   - 先加 schema 测试证明 password 不可见。
4. **完成 Auth 基础**
   - PasswordHasher、AccessToken、Bearer parser、GraphQL context/guard、roles 和 throttler；
   - 完成 login service/resolver；
   - 删除空 REST auth controller。
5. **完成 Users 用例**
   - repository 与 verification token；
   - Mailer port/Resend adapter；
   - register、me、change email/password、verify、resend；
   - 所有邮件调用放在 commit 后。
6. **完成证据**
   - unit、真实 PostgreSQL e2e、并发与 schema contract；
   - 生成并 review `src/schema.gql`；
   - 将旧前端 operation/header 差异记录到阶段 9，不修改 frontend。
7. **补 learning note**
   - 实现和测试完成后新增 `docs/learning/02-identity-access.md`；
   - 写入实际命令输出、失败案例、生成 schema diff 和并发测试证据；
   - 不要在实现前创建空 note。

## 19. 验证命令

先分别检查外层仓库和嵌套 `api/.git` 状态，确认没有覆盖用户改动：

```powershell
git status --short
git -C api status --short
```

然后在 `api/` 运行：

```powershell
pnpm install
pnpm exec prisma format
pnpm exec prisma validate
pnpm exec prisma migrate dev --create-only --name identity_foundation
# review migration.sql 后再执行：
pnpm exec prisma migrate dev
pnpm exec prisma generate

pnpm exec tsc --noEmit
pnpm exec eslint "src/**/*.ts" "test/**/*.ts"
pnpm exec jest --runInBand
pnpm exec jest --config ./test/jest-e2e.json --runInBand
pnpm run build
```

不要对未知、共享或非 `_test` 数据库运行 `prisma migrate reset`。CI/生产只运行 review 后的 `prisma migrate deploy`。

## 20. 完成定义

只有同时满足以下条件，Users/Auth 才算完成：

- [ ] `register/login/me/changeEmail/changePassword/verifyEmail/resendVerificationEmail` 均存在于生成 SDL 并通过 e2e。
- [ ] `UserRole` 对外只有 `Client/Owner/Delivery`。
- [ ] GraphQL schema 没有 `password` 或 `passwordHash`。
- [ ] 普通 user query 不选择 hash；只有 credential repository 路径选择。
- [ ] 同 email 并发注册只有一个成功，正确性来自 unique constraint。
- [ ] User + Verification、email + replacement Verification 具有原子边界。
- [ ] 同一 verification token 的并发消费只有一个成功。
- [ ] 邮件调用发生在 commit 后，Resend 被 injectable port 隔离，测试不访问网络。
- [ ] Resend 使用已验证的发件域名、Bearer API key、请求超时和基于 verification token hash 的幂等键。
- [ ] HTTP 只接受一个标准 Bearer credential；缺失、伪造、过期、重复和 `x-jwt` 均被拒绝。
- [ ] login、register、verify 和 resend 有 GraphQL-aware throttling；多实例共享 storage 是生产阶段的明确待办。
- [ ] Guard 负责认证/角色入口，application service 仍负责 user ID、当前密码、并发状态等检查。
- [ ] 配置启动即验证，不存在默认生产 JWT secret。
- [ ] unit、PostgreSQL e2e、schema contract、typecheck、lint、build 全部通过。
- [ ] `docs/learning/02-identity-access.md` 记录真实证据和面试问题。
- [ ] frontend 和 backend 未被修改；前端 Bearer/operation 迁移已进入阶段 9 清单。

## 21. 设计取舍与后续工作

- **错误契约**：保留 `{ ok, error }` 作为业务失败 payload；输入校验、未认证、未授权及未知服务器故障仍使用 GraphQL errors。以后若加入稳定 error code，应作为显式 schema 变更。
- **Access token only**：当前不虚构 refresh token/rotation/revocation。短 TTL 是旧 token 在密码修改后仍有效这一取舍的控制手段。
- **Resend integration**：当前 adapter 直接调用官方 Send Email API，以保留可取消的请求超时并严格控制日志；`deliveryKey` 映射到 Resend `Idempotency-Key`，24 小时 provider 去重仍不能替代可靠队列或 transactional outbox。
- **Mailer durability**：当前 port 和 `resendVerificationEmail` 能从单次发送失败中恢复；可靠队列或 transactional outbox 在异步里程碑实现。
- **Rate-limit storage**：当前进程内 storage 适合单实例开发和基线保护；多实例生产必须使用共享 storage。proxy trust 必须绑定实际代理拓扑。
- **Repository 抽象**：这里只创建两个有明确安全职责的 repository，而不是通用 CRUD repository。credential select 和 user transaction 边界因此可被集中 review。
- **邮箱唯一性**：应用规范化、数据库 check 和 unique constraint 三层同时存在；只做 `findUnique()` 预检查不能解决竞争。
- **公开 profile**：没有产品用例，所以不迁移遗留 `userProfile/findAll/removeUser`。需要时先定义隐私和授权契约。
- **WS authentication**：HTTP 实现不解析 connection params。实时阶段使用 `graphql-ws` 的 `Authorization: Bearer <JWT>` connection parameter，并复用 AccessTokenService。

## 22. 实施时容易踩的坑

1. 不要保留当前 resolver 里的空 `@UseGuards()`、未定义的 `mapRegisterResult`、`CurrentPrincipal` 或 `toUserModel`。
2. 不要让 `AuthService` 或 `UsersService`返回 Prisma User；始终经过 `toSafeUser()`。
3. 不要在注册前只查询 email 再认为不会重复；必须捕获 `P2002`。
4. 不要把 Argon2 hash、JWT、verification token、Authorization header 或 Resend API key 写入日志。
5. 不要在 transaction 中执行 Argon2、JWT、Resend 或其他网络调用。
6. 不要用 broad `catch` 把数据库故障变成“邮箱已存在”；只识别明确 Prisma code。
7. 不要在受保护 mutation input 中加入 `userId` 或 role；actor 来自 principal。
8. 不要直接信任 JWT 里的资源所有权；JWT 只提供最小 principal。
9. 不要手改 `schema.gql`、generated Prisma Client 或前端 generated types。
10. 不要为了解决 AuthModule/UsersModule 依赖而使用 `forwardRef()`；本文的单向模块依赖已经避免环。
