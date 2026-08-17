import { ConfigService } from '@nestjs/config';
import {
  buildPublicAssetUrl,
  getPublicAssetBaseUrl,
  validateUploadsEnvironment,
} from './public-asset-url';

describe('public asset URL configuration', () => {
  it('allows HTTP during development and builds encoded stable paths', () => {
    const config = new ConfigService({
      PUBLIC_ASSET_BASE_URL: 'http://localhost:9000/public',
      NODE_ENV: 'development',
    });
    const baseUrl = getPublicAssetBaseUrl(config);
    expect(buildPublicAssetUrl(baseUrl, 'uploads/a b.png')).toBe(
      'http://localhost:9000/public/uploads/a%20b.png',
    );
  });

  it.each([
    ['https://assets.example.com/', 'production'],
    ['http://assets.example.com', 'production'],
    ['file:///tmp/assets', 'development'],
  ])('rejects unsafe base URL %s in %s', (baseUrl, nodeEnv) => {
    expect(() =>
      validateUploadsEnvironment({
        PUBLIC_ASSET_BASE_URL: baseUrl,
        NODE_ENV: nodeEnv,
      }),
    ).toThrow();
  });

  it('requires configuration at application startup', () => {
    expect(() => validateUploadsEnvironment({ NODE_ENV: 'test' })).toThrow(
      'PUBLIC_ASSET_BASE_URL is required.',
    );
  });
});
