import { describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { buildPublicAssetUrl, getPublicAssetBaseUrl } from './public-asset-url';

describe('public asset URLs', () => {
  it('prefers the normalized S3 endpoint and bucket', () => {
    expect(
      getPublicAssetBaseUrl(
        new ConfigService({
          AWS_ENDPOINT_URL_S3: ' https://s3.example.test/// ',
          AWS_S3_BUCKET: ' bucket ',
          PUBLIC_ASSET_BASE_URL: 'https://fallback.test',
        }),
      ),
    ).toBe('https://s3.example.test/bucket');
  });
  it('normalizes the configured fallback when S3 configuration is incomplete', () => {
    expect(
      getPublicAssetBaseUrl(
        new ConfigService({
          AWS_ENDPOINT_URL_S3: 'https://s3.test',
          PUBLIC_ASSET_BASE_URL: ' https://assets.test/base/// ',
        }),
      ),
    ).toBe('https://assets.test/base');
  });
  it.each([{}, { PUBLIC_ASSET_BASE_URL: ' ' }, { AWS_S3_BUCKET: 'bucket' }])(
    'rejects missing configuration',
    (config) => {
      expect(() => getPublicAssetBaseUrl(new ConfigService(config))).toThrow(
        'S3 upload configuration is incomplete.',
      );
    },
  );
  it('encodes each key segment while preserving path separators', () => {
    expect(
      buildPublicAssetUrl(
        'https://assets.test/base///',
        'uploads/中 文+#?.png',
      ),
    ).toBe(
      'https://assets.test/base/uploads/%E4%B8%AD%20%E6%96%87%2B%23%3F.png',
    );
  });
});
