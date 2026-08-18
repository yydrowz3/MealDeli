<p align="center">
  <img src="./web/public/brand/mealdeli-logo-primary.svg" alt="MealDeli" width="280" />
</p>

<p align="center">
  一个面向顾客、餐厅商家和骑手的<strong>全栈</strong>实时餐食配送平台。
</p>

<p align="center">
  <a href="./README.md">English</a>
  ·
  中文
  ·
  <a href="./api/README.md">API 文档</a>
  ·
  <a href="./web/README.md">Web 文档</a>
</p>

<p align="center">
  <a href="https://mealdeli.onrender.com">
  <img alt="在线演示徽章" src="https://img.shields.io/badge/Live Demo-Render-000000?logo=render" />
  </a>
</p>

<p align="center">
<img alt="NestJS" src="https://img.shields.io/badge/-NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" />
<img alt="GraphQL" src="https://img.shields.io/badge/-GraphQL-E10098?style=flat-square&logo=graphql&logoColor=white" />
<img alt="Prisma" src="https://img.shields.io/badge/-Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" />
<img alt="PostgreSQL" src="https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
<img alt="React" src="https://img.shields.io/badge/-React-45b8d8?style=flat-square&logo=react&logoColor=white" />
<img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white" />
<img alt="TailwindCSS" src="https://img.shields.io/badge/-Tailwind CSS-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" />
<img alt="Node.js" src="https://img.shields.io/badge/-Node.js-5fa04e?style=flat-square&logo=node.js&logoColor=white" />
</p>

<p align="center">
<img alt="Apollo" src="https://img.shields.io/badge/-Apollo-311C87?style=flat-square&logo=apollographql&logoColor=white" />
<img alt="DaisyUI" src="https://img.shields.io/badge/-DaisyUI-FFC63A?style=flat-square&logo=daisyui&logoColor=white" />
<img alt="Vite" src="https://img.shields.io/badge/-Vite-646CFF?style=flat-square&logo=Vite&logoColor=white" />
<img alt="Vitest" src="https://img.shields.io/badge/-Vitest-6E9F18?style=flat-square&logo=Vitest&logoColor=white" />
<img alt="Testing Library" src="https://img.shields.io/badge/-Testing Library-E33332?style=flat-square&logo=testinglibrary&logoColor=white" />
<img alt="Neon" src="https://img.shields.io/badge/-Neon-34D59A?style=flat-square&logo=neon&logoColor=white" />
<img alt="Resend" src="https://img.shields.io/badge/-Resend-025E8C?style=flat-square&logo=resend&logoColor=white" />
<img alt="Oxc" src="https://img.shields.io/badge/-Oxc-00F7F1?style=flat-square&logo=oxc&logoColor=white" />
</p>

<p align="center">
<img alt="横幅" src="./public/banner.png" />
</p>

## 👋 项目概览

MealDeli 是一款基于角色的全栈餐食配送应用，由相互独立的后端与前端 Node.js 项目组成。

⚡ 后端系统基于 [**NestJS**](https://nestjs.com/) 构建。NestJS 后端提供 GraphQL API、**实时订阅**以及需要身份验证的图片上传功能。

🚀 前端系统基于 [**React**](https://react.dev/) 构建。React 前端以可安装 PWA 的形式，为顾客、商家和骑手提供**响应式**使用体验。

本项目覆盖完整的配送生命周期——从发现餐厅、结账下单，到后厨备餐、骑手接单以及最终送达。

![演示视频](./public/videos/demo.mp4)

## ✨ 项目亮点

- 为**顾客**、餐厅**商家**和**骑手**分别打造专属使用体验
- 使用 JWT 访问令牌及服务端轮换的**刷新**会话
- 通过 `graphql-ws` 实时更新订单状态
- 在服务端严格执行订单状态流转与**角色授权**
- 支持餐厅、菜单、菜品选项、图片及推广管理
- 使用 PostgreSQL 持久化数据，并对 Prisma 迁移进行审查
- 使用兼容 **S3** 的图片存储和 **Resend** 邮件验证
- 支持安装为 PWA，并提供安全的运行时缓存与更新提示
- 根据后端 Schema 生成强类型 **GraphQL** 操作
- 前后端均具备单元、集成与端到端测试覆盖

<details>
  <summary><kbd>截图</kbd></summary>

- **顾客端**

  <img alt="顾客端截图" src="./public/screenshots/shot-1-customer.png" />

- **餐厅商家控制台**

  <img alt="商家端截图" src="./public/screenshots/shot-2-owner.png" />

- **骑手面板**

  <img alt="骑手端截图" src="./public/screenshots/shot-3-courier.png" />

</details>

## 👥 产品体验

| 角色 | 功能 |
| ---- | ---- |
| 顾客 | 浏览餐厅，按分类或名称搜索，自定义菜品，管理购物车，下单并实时跟踪订单进度 |
| 商家 | 创建餐厅，管理菜单，接收新订单，推进后厨状态，查看经营动态并购买餐厅推广时段 |
| 骑手 | 浏览可配送订单，接单，查看配送路线，推进配送状态并查看配送历史 |

## 🛠️ 技术栈

| 领域 | 技术 |
| ---- | ---- |
| Web | React 19、TypeScript、Vite 8、TanStack Router、TanStack Form、Apollo Client、Jotai、Zod |
| UI | Tailwind CSS、daisyUI、Phosphor Icons、Leaflet、Recharts、Sonner |
| API | NestJS 11、Apollo Server、GraphQL、graphql-ws、class-validator |
| 数据与认证 | PostgreSQL、Prisma 7、JWT、Argon2 |
| 集成服务 | Resend、兼容 S3 的对象存储 |
| 测试 | Jest、Supertest、Vitest、Testing Library、MSW |

## 🏗️ 系统架构

```text
浏览器 / 已安装的 PWA
        │
        ├── GraphQL HTTP ────── 查询与变更
        ├── GraphQL WebSocket ─ 实时订单订阅
        └── REST multipart ──── 需要身份验证的图片上传
        │
NestJS API
        ├── JWT 与角色守卫
        ├── 应用服务与订单状态机
        ├── Prisma ──────────── PostgreSQL
        ├── Resend ──────────── 验证邮件
        └── AWS SDK ─────────── 兼容 S3 的存储
```

身份验证使用 Authorization 请求头中的短期访问令牌，以及 HttpOnly Cookie 中的刷新令牌。刷新令牌经过哈希处理后存储在服务端会话中，因此无需存储原始刷新凭据，即可实现退出登录与会话撤销。

## 📁 仓库结构

```text
MealDeli/
├── api/                     # NestJS GraphQL API
│   ├── prisma/              # Schema、迁移、种子脚本和示例数据
│   ├── src/                 # 功能模块与生成的 GraphQL Schema
│   └── test/                # 端到端测试
├── web/                     # React PWA
│   ├── public/              # 品牌资源与 PWA 图标
│   ├── src/app/             # 运行时组合、路由、Apollo 与 PWA
│   ├── src/modules/         # 按业务领域组织的产品功能
│   ├── src/routes/          # TanStack Router 文件路由
│   └── src/shared/ui/       # 设计令牌与可复用 UI
└── docs/                    # 提案、详细设计与交付计划
```

仓库根目录中没有 `package.json`。请分别在 `api/` 和 `web/` 目录中安装依赖并运行命令。

## 🚀 快速开始

### 📋 前置要求

- Node.js
- pnpm
- PostgreSQL
- 兼容 S3 的对象存储，例如 AWS S3 或 MinIO
- 如需发送验证邮件，还需要 Resend API 密钥

### ⚙️ 1. 配置 API

```bash
cd api
pnpm install
cp .env.example .env
```

PowerShell 用户可使用以下命令复制文件：

```powershell
Copy-Item .env.example .env
```

至少需要在 `api/.env` 中配置数据库、前端来源、JWT 密钥和对象存储：

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/meal_deli"
FRONTEND_URL="http://localhost:5173"
PORT=3000

JWT_ISSUER="meal-deli-api"
JWT_AUDIENCE="meal-deli-client"
JWT_ACCESS_SECRET="replace-with-a-long-random-access-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-secret"
JWT_REFRESH_EXPIRES_IN="1d"
JWT_REFRESH_TOKEN_COOKIE="meal_deli_refresh"
JWT_REFRESH_TOKEN_TTL_MS=86400000
```

应用数据库迁移，生成 Prisma Client，可选填充演示数据，然后启动 API：

```bash
pnpm exec prisma migrate dev
pnpm exec prisma generate
pnpm exec ts-node prisma/seed.ts
pnpm start:dev
```

现在可通过以下地址访问 API：

- GraphQL 与 GraphiQL：`http://localhost:3000/graphql`
- GraphQL 订阅：`ws://localhost:3000/graphql`
- 健康检查响应：`http://localhost:3000/`

完整的环境变量参考、数据模型和端点文档，请参阅 [API 指南](./api/README.md)。

### 🌐 2. 配置 Web 应用

打开另一个终端：

```bash
cd web
pnpm install
```

创建 `web/.env.local`：

```dotenv
VITE_API_HTTP_URL="http://localhost:3000/graphql"
VITE_API_WS_URL="ws://localhost:3000/graphql"
VITE_APP_ORIGIN="http://localhost:5173"
```

启动 Vite：

```bash
pnpm dev
```

打开 `http://localhost:5173`。有关路由权限、应用架构、PWA 行为和故障排除的信息，请参阅 [Web 指南](./web/README.md)。

## 🧪 演示账户

在 `api/` 目录中运行 `pnpm exec ts-node prisma/seed.ts`，将创建以下经过验证的开发账户：

| 角色 | 邮箱 | 密码 |
| ---- | ---- | ---- |
| 顾客 | `customer@mealdeli.com` | `passwordcustomer` |
| 商家 | `owner@mealdeli.com` | `passwordowner` |
| 骑手 | `courier@mealdeli.com` | `passwordcourier` |

这些凭据仅供本地开发使用。切勿在公开环境或生产环境中重复使用。

## 🔄 订单生命周期

订单遵循严格的相邻状态机。API 会拒绝跳过中间状态的流转，以及由错误角色尝试的状态流转。

```text
PENDING ──商家──▶ COOKING ──商家──▶ WAITING ──骑手──▶ PICKED ──骑手──▶ DELIVERED
```

订单项以快照形式保留菜品名称、价格、已选选项和总金额。因此，后续菜单编辑不会改变历史订单。

## 💻 开发命令

请在对应的项目目录中运行各项命令。

| 任务 | `api/` | `web/` |
| ---- | ------ | ------- |
| 开发服务器 | `pnpm start:dev` | `pnpm dev` |
| 生产构建 | `pnpm build` | `pnpm build` |
| 代码检查 | `pnpm lint` | `pnpm lint` |
| 单元测试 | `pnpm test` | `pnpm test` |
| 测试覆盖率 | `pnpm test:cov` | `pnpm test:coverage` |
| 端到端测试 | `pnpm test:e2e` | — |
| 生成类型 | `pnpm exec prisma generate` | `pnpm codegen` |

当 GraphQL Schema 或前端 `.graphql` 文档发生变化时，请重新生成 Web 客户端产物：

```bash
cd web
pnpm codegen
```

请勿手动编辑 `api/src/generated/prisma/`、`web/src/gql/` 或 `web/src/routeTree.gen.ts`。

## ✅ 评审前验证

```bash
cd api
pnpm lint
pnpm test
pnpm test:e2e
pnpm build

cd ../web
pnpm lint
pnpm test
pnpm build
```

如有数据库变更，请在提交前检查生成的迁移 SQL。如有 UI 变更，请在拉取请求中附上截图；如有 API 变更，请附上有代表性的 GraphQL 操作。

## 🔒 生产环境注意事项

- 全面使用 HTTPS 和 WSS，并分别设置高熵的访问令牌密钥与刷新令牌密钥。
- 设置 `NODE_ENV=production`，使刷新 Cookie 获得 Secure 属性。
- 将 `FRONTEND_URL` 与已部署 Web 应用的来源完全匹配，以支持携带凭据的 CORS 请求。
- 将 S3 存储桶的写入权限设为私有，并通过受控的公共基础 URL 或 CDN 暴露资源。
- 部署时运行 `prisma migrate deploy`，不要使用开发环境迁移命令。
- `POST /payments` 目前只是支付服务商 Webhook 的占位实现。投入生产使用前，请添加签名验证、幂等处理以及经过审计的事件处理机制。
- 切勿提交 `.env` 文件、凭据、生产数据、生成的构建产物或覆盖率报告。

## 📚 文档

- [API 参考与开发指南](./api/README.md)
- [Web 架构与开发指南](./web/README.md)
- [系统架构](./docs/detailed-designs/00-architecture.md)
- [功能实现状态](./docs/tasks/progress.md)

## 📄 许可证

本项目采用 `MIT License`，详情请参阅 `LICENSE.md`。

版权所有 © 2026 [MealDeli](https://github.com/yydrowz3/mealdeli)。
