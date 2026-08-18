import { ConfigService } from '@nestjs/config';

// function parsePublicAssetBaseUrl(value: unknown, nodeEnv: unknown): string {
//   if (typeof value !== "string" || !value.trim()) {
//     throw new Error("PUBLIC_ASSET_BASE_URL is required.");
//   }
//   const baseUrl = value.trim();
//   let parsed: URL;
//   try {
//     parsed = new URL(baseUrl);
//   } catch {
//     throw new Error("PUBLIC_ASSET_BASE_URL must be an absolute URL.");
//   }
//   const allowedProtocols = nodeEnv === "production" ? ["https:"] : ["http:", "https:"];
//   if (!allowedProtocols.includes(parsed.protocol)) {
//     throw new Error(
//       nodeEnv === "production"
//         ? "PUBLIC_ASSET_BASE_URL must use HTTPS in production."
//         : "PUBLIC_ASSET_BASE_URL must use HTTP or HTTPS.",
//     );
//   }
//   if (baseUrl.endsWith("/")) {
//     throw new Error("PUBLIC_ASSET_BASE_URL must not have a trailing slash.");
//   }
//   return baseUrl;
// }

// export function validateUploadsEnvironment(
//   environment: Record<string, unknown>,
// ): Record<string, unknown> {
//   parsePublicAssetBaseUrl(environment.PUBLIC_ASSET_BASE_URL, environment.NODE_ENV);
//   return environment;
// }

export function getPublicAssetBaseUrl(configService: ConfigService): string {
  const endpoint = configService
    .get<string>('AWS_ENDPOINT_URL_S3')
    ?.trim()
    .replace(/\/+$/, '');
  const bucket = configService.get<string>('AWS_S3_BUCKET')?.trim();

  if (endpoint && bucket) return `${endpoint}/${bucket}`;

  // Keep the fallback for local/unit-test configurations that only provide
  // the already-composed asset base URL.
  const configuredBaseUrl = configService.get<string>('PUBLIC_ASSET_BASE_URL');
  if (configuredBaseUrl?.trim())
    return configuredBaseUrl.trim().replace(/\/+$/, '');

  throw new Error('S3 upload configuration is incomplete.');
}

export function buildPublicAssetUrl(baseUrl: string, key: string): string {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl.replace(/\/+$/, '')}/${encodedKey}`;
}
