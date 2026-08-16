# Media Upload 详细设计

## 1. 职责与非目标

Media 模块统一处理头像、餐厅图和菜品图的客户端选择、预览、校验、上传、取消和稳定 URL。后端负责认证、内容校验、对象存储和稳定 URL 构造。

不负责：把 URL 保存到 User/Restaurant/Dish、图片裁剪、私有文件、视频、批量上传或孤儿对象清理后台。

## 2. 依赖与公共出口

依赖 Design System、Identity 提供的 access-token reader，以及 Zod。`ImageField` 保持 TanStack Form 无关；Identity/Owner 在各自 `<form.Field>` render 中用 `field.handleChange(url)` 连接它，Media 不依赖具体表单实例。

```ts
export type UploadedImage = { key: string; url: string };
export type UploadProgress =
  | { status: "idle" }
  | { status: "uploading"; previewUrl: string }
  | { status: "success"; image: UploadedImage; previewUrl: string }
  | { status: "error"; previewUrl?: string; message: string };

export interface MediaUploader {
  upload(file: File, signal?: AbortSignal): Promise<UploadedImage>;
}

export function ImageField(props: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  uploader?: MediaUploader;
}): JSX.Element;
```

`ImageField` 只返回最终 URL，不知道其将保存到哪种实体。

## 3. 建议目录

```text
src/modules/media/
├── api/http-media-uploader.ts
├── model/image-schema.ts
├── model/file-validation.ts
├── components/image-field.tsx
├── components/image-preview.tsx
├── testing/fake-uploader.ts
├── testing/handlers.ts
└── index.ts
```

## 4. 客户端流程

1. `<input type=file accept="image/jpeg,image/png,image/webp">` 选择单文件。
2. 在请求前检查 size ≤ 5 MiB 和 MIME；错误显示在字段下方。
3. 用 `URL.createObjectURL` 生成本地 preview；替换/卸载时 revoke。
4. 自动或显式 `Upload image` 发起 multipart `POST /uploads`，字段名固定 `file`。
5. 请求携带 `Authorization: Bearer <accessToken>`；不依赖 cookie-only REST auth。
6. 成功后 Zod 校验 `{ key, url }` 且 url 为 http/https absolute URL，调用 `onChange(url)`。
7. Abort 不显示 error Toast；网络/校验错误保留本地 preview 和 `Try again`。

表单提交时若仍 uploading，提交按钮禁用；图片是可选字段时用户可 `Remove image` 或继续无图保存。

## 5. REST API 契约

### 5.1 Request/response

```http
POST /uploads
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

file=<binary>
```

```json
{
  "key": "uploads/<uuid>.webp",
  "url": "https://assets.example.com/uploads/<uuid>.webp"
}
```

错误使用标准 HTTP status：401 unauthenticated、400 missing/invalid file、413 too large、415 unsupported media、500 storage failure。前端不依赖错误正文做安全决策。

### 5.2 Stable URL

- 新环境变量 `PUBLIC_ASSET_BASE_URL`，必须为不带尾随 slash 的 absolute https URL（开发可 http）。
- `url = PUBLIC_ASSET_BASE_URL + "/" + encodeURI(key path segments)`。
- S3 bucket policy/CDN origin 必须允许公开 GET；Put 仍使用服务端 credential。
- 不再调用 `GetObjectCommand/getSignedUrl` 返回临时读取 URL。
- 数据库现有 `image` 字段继续保存 URL，无 schema migration。

## 6. 后端认证与验证

新增适用于 Express REST context 的 access-token guard：

1. 解析 Bearer token，使用与 GraphQL 相同 issuer/audience/algorithm。
2. 校验 `tokenType=access`、`sub`、`sid`。
3. 调用现有 session lookup 确认 session 未撤销/过期。
4. 将 User 附到 request；所有 CUSTOMER/OWNER/COURIER 均允许上传。

文件验证必须在写对象存储前完成：

- hard limit 5 MiB，Multer limit 与业务检查一致。
- allowlist：JPEG、PNG、WebP。
- 同时校验 MIME、扩展名和 magic bytes；不增加识别库，使用下列最小确定性 signature：JPEG 的前 3 bytes 为 `FF D8 FF`；PNG 的前 8 bytes 为 `89 50 4E 47 0D 0A 1A 0A`；WebP 的 bytes 0–3 为 ASCII `RIFF` 且 bytes 8–11 为 `WEBP`。
- 扩展名根据验证出的真实格式重写，不信任 original name；signature、声明 MIME 与允许扩展名三者必须一致。
- key 继续使用服务端 UUID，不接受客户端 key/path。
- S3 `ContentType` 使用验证后 MIME。

## 7. 错误与安全

- 401 交由 Platform refresh 一次；REST uploader 在 refresh 成功后可重试一次未开始写入的 upload。
- 413：`Image must be 5 MB or smaller.`
- 415/伪造文件：`Choose a JPEG, PNG, or WebP image.`
- storage failure：`Image upload failed. Try again or continue without an image.`
- 不把文件名、token、S3 credential 写入客户端日志。
- 当前公共图片不适合敏感内容；UI 在选择器旁说明只上传公开头像/餐饮图片。

## 8. 独立测试

### 8.1 前端

- size/MIME Zod 校验、错误文案、重新选择。
- preview object URL 创建/revoke。
- success response schema、malformed response、401 refresh、Abort、retry。
- ImageField 键盘选择、remove、uploading 禁止 form submit。
- 使用最小 TanStack Form harness 验证成功 URL 能写入 field value、上传中能由调用方阻止 submit，但 Media 测试不导入 Identity/Owner form。
- MSW REST handler 验证 method、multipart field 和 Authorization。

### 8.2 后端

- 无/非法/过期 token 为 401；三角色有效 token 均可上传。
- missing file、>5 MiB、伪造 MIME、错误 magic bytes、允许的三格式。
- key 不含原始文件名且扩展名正确。
- response URL 使用 public base，不含签名 query。
- S3 failure 不返回 credential/内部 stack。

## 9. 验收标准

- Profile、Owner Restaurant、Dish form 使用同一 `ImageField` 和 uploader。
- 所存 URL 在签名过期时间之后仍可公开读取。
- 客户端校验仅改善体验，后端始终独立执行认证和内容校验。
- Media 测试不加载 Identity UI 或任何业务 form。
