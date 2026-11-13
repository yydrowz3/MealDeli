import { z } from 'zod';

const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;
const PADDLE_ENVIRONMENTS = ['sandbox', 'production'] as const;
const DEFAULT_PORT = 3000;
const MIN_PORT = 1;
const MAX_PORT = 65_535;

const requiredString = (name: string) =>
  z
    .string({ error: `${name} is required` })
    .trim()
    .min(1, { error: `${name} is required` });

const portSchema = z.preprocess(
  (value) => (value === undefined || value === '' ? DEFAULT_PORT : value),
  z
    .union(
      [
        z.number(),
        z
          .string()
          .trim()
          .regex(/^\d+$/, { error: 'PORT must be an integer' })
          .transform(Number),
      ],
      { error: 'PORT must be an integer' },
    )
    .pipe(
      z
        .number({ error: 'PORT must be an integer' })
        .int({ error: 'PORT must be an integer' })
        .min(MIN_PORT, {
          error: `PORT must be between ${MIN_PORT} and ${MAX_PORT}`,
        })
        .max(MAX_PORT, {
          error: `PORT must be between ${MIN_PORT} and ${MAX_PORT}`,
        }),
    ),
);

const databaseUrlSchema = requiredString('DATABASE_URL').transform(
  (databaseUrl, context) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(databaseUrl);
    } catch {
      context.issues.push({
        code: 'custom',
        input: databaseUrl,
        message: 'DATABASE_URL must be a valid PostgreSQL URL',
      });
      return z.NEVER;
    }

    if (
      parsedUrl.protocol !== 'postgres:' &&
      parsedUrl.protocol !== 'postgresql:'
    ) {
      context.issues.push({
        code: 'custom',
        input: databaseUrl,
        message: 'DATABASE_URL must use the postgres or postgresql protocol',
      });
      return z.NEVER;
    }

    if (
      !parsedUrl.hostname ||
      !parsedUrl.pathname ||
      parsedUrl.pathname === '/'
    ) {
      context.issues.push({
        code: 'custom',
        input: databaseUrl,
        message: 'DATABASE_URL must include a host and database name',
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
      code: 'custom',
      input: origin,
      message: 'CORS_ORIGINS must contain valid HTTP origins',
    });
    return z.NEVER;
  }

  if (parsedOrigin.protocol !== 'http:' && parsedOrigin.protocol !== 'https:') {
    context.issues.push({
      code: 'custom',
      input: origin,
      message: 'CORS_ORIGINS must contain only HTTP or HTTPS origins',
    });
    return z.NEVER;
  }

  if (
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.search ||
    parsedOrigin.hash ||
    (parsedOrigin.pathname !== '' && parsedOrigin.pathname !== '/')
  ) {
    context.issues.push({
      code: 'custom',
      input: origin,
      message:
        'CORS_ORIGINS entries must not include credentials, paths, queries, or fragments',
    });
    return z.NEVER;
  }

  return parsedOrigin.origin;
});

const corsOriginsSchema = requiredString('CORS_ORIGINS')
  .transform((rawOrigins) =>
    rawOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .pipe(
    z.array(corsOriginSchema).min(1, {
      error: 'CORS_ORIGINS must contain at least one origin',
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

const paddleIdSchema = (name: string, prefix: string) =>
  requiredString(name).regex(new RegExp(`^${prefix}_[a-z0-9]{26}$`), {
    error: `${name} must be a valid Paddle ${prefix} ID`,
  });

const currencySchema = requiredString('PADDLE_PROMOTION_CURRENCY')
  .transform((value) => value.toUpperCase())
  .pipe(
    z.string().regex(/^[A-Z]{3}$/, {
      error:
        'PADDLE_PROMOTION_CURRENCY must be a three-letter uppercase currency code',
    }),
  );

const storageBucketSchema = requiredString('SUPABASE_STORAGE_BUCKET').regex(
  /^[a-z0-9][a-z0-9._-]{2,62}$/,
  {
    error:
      'SUPABASE_STORAGE_BUCKET must be 3-63 lowercase letters, digits, dot, underscore, or hyphen',
  },
);

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
  RESEND_TIMEOUT_MS: integerFromEnvironment('RESEND_TIMEOUT_MS', 100, 30_000),
  PADDLE_ENVIRONMENT: z.enum(PADDLE_ENVIRONMENTS, {
    error: `PADDLE_ENVIRONMENT must be one of: ${PADDLE_ENVIRONMENTS.join(', ')}`,
  }),
  PADDLE_API_KEY: requiredString('PADDLE_API_KEY'),
  PADDLE_WEBHOOK_SECRET: requiredString('PADDLE_WEBHOOK_SECRET'),
  PADDLE_PROMOTION_PRICE_ID: paddleIdSchema('PADDLE_PROMOTION_PRICE_ID', 'pri'),
  PADDLE_PROMOTION_UNIT_PRICE_MINOR: integerFromEnvironment(
    'PADDLE_PROMOTION_UNIT_PRICE_MINOR',
    1,
    100_000_000,
  ),
  PADDLE_PROMOTION_CURRENCY: currencySchema,
  PADDLE_API_TIMEOUT_MS: integerFromEnvironment(
    'PADDLE_API_TIMEOUT_MS',
    100,
    30_000,
  ),
  PROMOTION_EXPIRY_BATCH_SIZE: integerFromEnvironment(
    'PROMOTION_EXPIRY_BATCH_SIZE',
    1,
    1_000,
  ),
  PROMOTION_EXPIRY_MAX_BATCHES: integerFromEnvironment(
    'PROMOTION_EXPIRY_MAX_BATCHES',
    1,
    100,
  ),
  SUPABASE_STORAGE_URL: httpUrlSchema('SUPABASE_STORAGE_URL'),
  SUPABASE_STORAGE_SECRET_KEY: requiredString('SUPABASE_STORAGE_SECRET_KEY'),
  SUPABASE_STORAGE_BUCKET: storageBucketSchema,
  SUPABASE_STORAGE_TIMEOUT_MS: integerFromEnvironment(
    'SUPABASE_STORAGE_TIMEOUT_MS',
    100,
    30_000,
  ),
});

export type EnvironmentVariables = z.infer<typeof environmentVariablesSchema>;
