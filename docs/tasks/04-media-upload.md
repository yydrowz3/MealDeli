# Media Upload 最小任务

## 来源与依赖

- 需求：[`02-customer.md`](../proposals/02-customer.md)、[`03-owner.md`](../proposals/03-owner.md)、[`04-courier.md`](../proposals/04-courier.md) 的头像、餐厅图和菜品图场景。
- 设计：[`04-media-upload.md`](../detailed-designs/04-media-upload.md)。
- 依赖：Design System、Identity access-token reader、Zod；业务表单只通过 Media 公共 port 接收最终 URL。
- 现状：已有未认证的 S3 multipart endpoint，但它信任扩展名/MIME、没有 5 MiB 限制并返回签名临时 URL，因此相关任务均未完成。

## 实现任务

### 客户端

- [x] 定义 `UploadedImage`、`UploadProgress`、`MediaUploader` 及 Zod response schema，并仅从公共出口暴露稳定接口。
- [x] 实现 JPEG/PNG/WebP 与 5 MiB 的选择前校验，错误显示在字段下方。
- [x] 实现 object URL preview 的创建、替换和卸载 revoke，避免内存泄漏。
- [x] 实现携带 Bearer access token 的 multipart uploader；字段名固定为 `file`，成功响应必须为 absolute HTTP(S) URL。
- [x] 实现 Abort、401 refresh 一次、可控 retry 和稳定错误映射；Abort 不显示错误 Toast。
- [x] 实现表单无关 `ImageField` 的选择、上传、重试、移除和 uploading 状态；调用方可据此禁止提交。

### REST 与存储

- [x] 为 `POST /uploads` 增加与 GraphQL 一致的 access-token/session guard，三种登录角色允许上传，非法 token 返回 401。
- [x] 在写 S3 前同时校验 size、声明 MIME、扩展名和 JPEG/PNG/WebP magic bytes。
- [x] 由验证出的格式重写扩展名并使用 UUID key，绝不接受客户端 key/path 或原始文件名。
- [x] 增加 `PUBLIC_ASSET_BASE_URL` 校验并返回稳定公开 URL，移除 `GetObjectCommand/getSignedUrl` 临时读取 URL。
- [x] 为 missing、too large、unsupported/伪造文件和 storage failure 返回规定的 HTTP status，且不泄露 credential/stack。

## 测试与验收

- [x] 覆盖前端文件校验、preview revoke、成功/畸形响应、401 refresh、Abort 和 retry。
- [x] 用 MSW 验证 method、multipart 字段和 Authorization，并用最小 TanStack Form harness 验证 URL 写入。
- [x] 覆盖后端三角色认证、大小、三种签名、伪造格式、key/扩展名、稳定 URL 和 S3 failure。
- [x] 证明 Profile、Restaurant、Dish 可复用同一 ImageField，且 Media 测试不加载业务表单。

## 完成条件

以上所有任务均为 `[x]`，且所存 URL 长期公开可读、客户端和服务端均独立校验后，才可在 [`progress.md`](./progress.md) 勾选本模块。
