import { validateEnvironment } from './validate-environment';

const validConfig = {
  NODE_ENV: 'test',
  PORT: '3001',
  DATABASE_URL:
    'postgresql://mealrelay_test:mealrelay_test@localhost:5432/mealrelay_test',
  CORS_ORIGINS: 'http://localhost:5173',
};

describe('validateEnvironment', () => {
  it('returns normalized, typed configuration and strips unrelated variables', () => {
    expect(
      validateEnvironment({
        ...validConfig,
        CORS_ORIGINS:
          'http://localhost:5173/, https://example.com, http://localhost:5173',
        UNRELATED_VARIABLE: 'ignored',
      }),
    ).toEqual({
      NODE_ENV: 'test',
      PORT: 3001,
      DATABASE_URL: validConfig.DATABASE_URL,
      CORS_ORIGINS: ['http://localhost:5173', 'https://example.com'],
    });
  });

  it.each([{ PORT: undefined }, { PORT: '' }])(
    'uses the default port when PORT is $PORT',
    (override) => {
      expect(validateEnvironment({ ...validConfig, ...override }).PORT).toBe(
        3000,
      );
    },
  );

  it.each([
    ['not an integer', '3.14', 'PORT must be an integer'],
    ['below the valid range', '0', 'PORT must be between 1 and 65535'],
    ['above the valid range', '65536', 'PORT must be between 1 and 65535'],
  ])('rejects a port that is %s', (_case, port, message) => {
    expect(() => validateEnvironment({ ...validConfig, PORT: port })).toThrow(
      message,
    );
  });

  it.each([
    [
      'a non-PostgreSQL URL',
      { DATABASE_URL: 'https://localhost/mealrelay' },
      'DATABASE_URL must use the postgres or postgresql protocol',
    ],
    [
      'a PostgreSQL URL without a database name',
      { DATABASE_URL: 'postgresql://localhost' },
      'DATABASE_URL must include a host and database name',
    ],
    [
      'a CORS origin with a path',
      { CORS_ORIGINS: 'https://example.com/graphql' },
      'CORS_ORIGINS entries must not include credentials, paths, queries, or fragments',
    ],
    [
      'a CORS origin with credentials',
      { CORS_ORIGINS: 'https://user:password@example.com' },
      'CORS_ORIGINS entries must not include credentials, paths, queries, or fragments',
    ],
    [
      'a CORS origin with a query',
      { CORS_ORIGINS: 'https://example.com?debug=true' },
      'CORS_ORIGINS entries must not include credentials, paths, queries, or fragments',
    ],
    [
      'a CORS origin with a fragment',
      { CORS_ORIGINS: 'https://example.com#graphql' },
      'CORS_ORIGINS entries must not include credentials, paths, queries, or fragments',
    ],
    [
      'a non-HTTP CORS origin',
      { CORS_ORIGINS: 'ftp://example.com' },
      'CORS_ORIGINS must contain only HTTP or HTTPS origins',
    ],
  ])('rejects %s', (_case, override, message) => {
    expect(() => validateEnvironment({ ...validConfig, ...override })).toThrow(
      message,
    );
  });

  it('reports every invalid variable without exposing their values', () => {
    const invalidDatabaseUrl = 'do-not-log-this-database-secret';
    const validate = () =>
      validateEnvironment({
        NODE_ENV: 'staging',
        PORT: '70000',
        DATABASE_URL: invalidDatabaseUrl,
        CORS_ORIGINS: 'not-an-origin',
      });

    expect(validate).toThrow('NODE_ENV');
    expect(validate).toThrow('PORT');
    expect(validate).toThrow('DATABASE_URL');
    expect(validate).toThrow('CORS_ORIGINS');
    expect(validate).not.toThrow(invalidDatabaseUrl);
  });
});
