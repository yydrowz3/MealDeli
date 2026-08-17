import { ConfigService } from '@nestjs/config';

function parsePublicAssetBaseUrl(value: unknown, nodeEnv: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('PUBLIC_ASSET_BASE_URL is required.');
  }
  const baseUrl = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error('PUBLIC_ASSET_BASE_URL must be an absolute URL.');
  }
  const allowedProtocols =
    nodeEnv === 'production' ? ['https:'] : ['http:', 'https:'];
  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new Error(
      nodeEnv === 'production'
        ? 'PUBLIC_ASSET_BASE_URL must use HTTPS in production.'
        : 'PUBLIC_ASSET_BASE_URL must use HTTP or HTTPS.',
    );
  }
  if (baseUrl.endsWith('/')) {
    throw new Error('PUBLIC_ASSET_BASE_URL must not have a trailing slash.');
  }
  return baseUrl;
}

export function validateUploadsEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  parsePublicAssetBaseUrl(
    environment.PUBLIC_ASSET_BASE_URL,
    environment.NODE_ENV,
  );
  return environment;
}

export function getPublicAssetBaseUrl(configService: ConfigService): string {
  return parsePublicAssetBaseUrl(
    configService.get<string>('PUBLIC_ASSET_BASE_URL'),
    configService.get<string>('NODE_ENV'),
  );
}

export function buildPublicAssetUrl(baseUrl: string, key: string): string {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl}/${encodedKey}`;
}
