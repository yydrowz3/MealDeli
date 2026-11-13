import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule, JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import type { App } from 'supertest/types';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { CommonModule } from '../src/common/common.module';
import { UsersModule } from '../src/users/users.module';
import { RestaurantsModule } from '../src/restaurants/restaurants.module';
import { OrdersModule } from '../src/orders/orders.module';
import { PaymentsModule } from '../src/payments/payments.module';
import { UploadsModule } from '../src/uploads/uploads.module';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailsService } from '../src/mails/mails.service';
import {
  UPLOADS_STORAGE,
  type UploadsStorage,
} from '../src/uploads/uploads.storage';
import { MAX_UPLOAD_BYTES } from '../src/uploads/uploads.service';
import { UserRole } from '../src/users/enums/role.enum';
import { makeUser, NOW, testConfig } from './fixtures';

type GqlBody = {
  data?: Record<string, unknown>;
  errors?: { message: string; extensions?: { code: string } }[];
};
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('isolated Nest HTTP and GraphQL API', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let passwordHash: string;
  let accessToken: string;
  const prisma = {
    user: { findUnique: vi.fn() },
    authSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    restaurant: { create: vi.fn() },
  };
  const put = vi.fn<UploadsStorage['put']>().mockResolvedValue(undefined);
  const sendVerificationEmail = vi.fn();

  beforeAll(async () => {
    passwordHash = await argon2.hash('test-password');
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          ignoreEnvVars: true,
        }),
        JwtModule.register({
          global: true,
          secret: 'test-only-access-secret',
          signOptions: {
            algorithm: 'HS256',
            issuer: 'meal-deli-test',
            audience: 'meal-deli-test-client',
            expiresIn: '15m',
          },
          verifyOptions: {
            algorithms: ['HS256'],
            issuer: 'meal-deli-test',
            audience: 'meal-deli-test-client',
          },
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          context: ({ req, res }: { req: Request; res: Response }) => ({
            req,
            res,
            token: req.headers.authorization?.split(' ')[1],
          }),
        }),
        CommonModule,
        UsersModule,
        RestaurantsModule,
        OrdersModule,
        PaymentsModule,
        AuthModule,
        UploadsModule,
      ],
      controllers: [AppController],
      providers: [AppService],
    })
      .overrideProvider(ConfigService)
      .useValue(testConfig())
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(MailsService)
      .useValue({ sendVerificationEmail })
      .overrideProvider(UPLOADS_STORAGE)
      .useValue({ put })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    jwt = app.get(JwtService);
  });

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    prisma.user.findUnique
      .mockReset()
      .mockResolvedValue(makeUser({ passwordHash }));
    prisma.authSession.create
      .mockReset()
      .mockResolvedValue({ id: 'session-id' });
    prisma.authSession.findFirst
      .mockReset()
      .mockResolvedValue({ user: makeUser() });
    prisma.authSession.findUnique.mockReset();
    prisma.authSession.updateMany.mockReset().mockResolvedValue({ count: 1 });
    prisma.restaurant.create
      .mockReset()
      .mockResolvedValue({ id: 'restaurant-id' });
    put.mockReset().mockResolvedValue(undefined);
    accessToken = await jwt.signAsync({
      sub: 'user-id',
      sid: 'session-id',
      tokenType: 'access',
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  function graphql(
    query: string,
    variables?: Record<string, unknown>,
    token?: string,
  ) {
    const req = request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables });
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  }

  it('GET / returns the current welcome message', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Welcome to MealDeli API!');
  });

  const signInQuery =
    'mutation($input: SignInInput!) { signIn(input: $input) { ok error accessToken } }';
  it('logs in with real password verification and JWT signing and sets an HttpOnly cookie', async () => {
    const response = await graphql(signInQuery, {
      input: { email: 'user@example.test', password: 'test-password' },
    }).expect(200);
    const body = response.body as GqlBody;
    expect(body.errors).toBeUndefined();
    expect(body.data).toMatchObject({
      signIn: { ok: true, accessToken: expect.any(String) as string },
    });
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toContain('meal_deli_refresh=');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('Path=/graphql');
    expect(cookies[0]).toContain('SameSite=Lax');
    expect(prisma.authSession.create).toHaveBeenCalledOnce();
    expect(body.data?.signIn).not.toHaveProperty('refreshToken');
  });

  it('rejects invalid GraphQL input before calling the service', async () => {
    const response = await graphql(signInQuery, {
      input: { email: 'invalid', password: 'short' },
    }).expect(200);
    expect((response.body as GqlBody).errors?.[0].extensions?.code).toBe(
      'BAD_REQUEST',
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.authSession.create).not.toHaveBeenCalled();
  });

  it('returns a login failure without setting a cookie', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const response = await graphql(signInQuery, {
      input: { email: 'missing@example.test', password: 'test-password' },
    }).expect(200);
    expect((response.body as GqlBody).data).toMatchObject({
      signIn: { ok: false, accessToken: null },
    });
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it.each([undefined, 'invalid-token'])(
    'rejects a missing or invalid access token',
    async (token) => {
      const response = await graphql('{ me { id } }', undefined, token).expect(
        200,
      );
      expect((response.body as GqlBody).errors?.[0].extensions?.code).toBe(
        'UNAUTHENTICATED',
      );
      expect(prisma.authSession.findFirst).not.toHaveBeenCalled();
    },
  );

  it('loads the current user through the real guard and active session lookup', async () => {
    const response = await graphql(
      '{ me { id role } }',
      undefined,
      accessToken,
    ).expect(200);
    expect((response.body as GqlBody).errors).toBeUndefined();
    expect((response.body as GqlBody).data).toEqual({
      me: { id: 'user-id', role: 'CUSTOMER' },
    });
    expect(prisma.authSession.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'session-id',
        revokedAt: null,
        refreshExpiresAt: { gt: NOW },
      },
      select: { user: true },
    });
  });

  it('rejects revoked sessions even for a signed access token', async () => {
    prisma.authSession.findFirst.mockResolvedValue(null);
    const response = await graphql(
      '{ me { id } }',
      undefined,
      accessToken,
    ).expect(200);
    expect((response.body as GqlBody).errors?.[0].extensions?.code).toBe(
      'UNAUTHENTICATED',
    );
  });

  const createRestaurant =
    'mutation { createRestaurant(input: { name: "Cafe", address: "Street", categoryId: "00000000-0000-4000-8000-000000000001" }) { ok restaurantId } }';
  it('rejects a customer invoking an owner mutation without writing', async () => {
    const response = await graphql(
      createRestaurant,
      undefined,
      accessToken,
    ).expect(200);
    expect((response.body as GqlBody).errors?.[0].extensions?.code).toBe(
      'FORBIDDEN',
    );
    expect(prisma.restaurant.create).not.toHaveBeenCalled();
  });

  it('allows an owner mutation through the real resolver and service', async () => {
    prisma.authSession.findFirst.mockResolvedValue({
      user: makeUser({ role: UserRole.OWNER }),
    });
    const response = await graphql(
      createRestaurant,
      undefined,
      accessToken,
    ).expect(200);
    expect((response.body as GqlBody).errors).toBeUndefined();
    expect((response.body as GqlBody).data).toEqual({
      createRestaurant: { ok: true, restaurantId: 'restaurant-id' },
    });
    expect(prisma.restaurant.create).toHaveBeenCalledWith({
      data: {
        name: 'Cafe',
        address: 'Street',
        categoryId: '00000000-0000-4000-8000-000000000001',
        ownerId: 'user-id',
      },
    });
  });

  it('clears the refresh cookie on authenticated sign-out', async () => {
    const response = await graphql(
      'mutation { signOut { ok } }',
      undefined,
      accessToken,
    ).expect(200);
    expect((response.body as GqlBody).data).toEqual({ signOut: { ok: true } });
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies[0]).toContain('meal_deli_refresh=;');
    expect(cookies[0]).toContain('Expires=Thu, 01 Jan 1970');
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-id', revokedAt: null },
      data: { revokedAt: NOW },
    });
  });

  it('uploads multipart PNG through the real guard, interceptor and validation', async () => {
    const response = await request(app.getHttpServer())
      .post('/uploads')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', png, { filename: 'photo.png', contentType: 'image/png' })
      .expect(201);
    expect(response.body).toEqual({
      key: expect.stringMatching(/^uploads\/[0-9a-f-]+\.png$/) as string,
      url: expect.stringMatching(
        /^https:\/\/assets\.example\.test\/uploads\//,
      ) as string,
    });
    expect(put).toHaveBeenCalledWith({
      key: expect.any(String) as string,
      body: png,
      contentType: 'image/png',
    });
  });

  it('rejects uploads without a token', async () => {
    await request(app.getHttpServer())
      .post('/uploads')
      .attach('file', png, 'photo.png')
      .expect(401);
    expect(put).not.toHaveBeenCalled();
  });

  it('rejects requests without the multipart file field', async () => {
    await request(app.getHttpServer())
      .post('/uploads')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
    expect(put).not.toHaveBeenCalled();
  });

  it('rejects forged image contents', async () => {
    await request(app.getHttpServer())
      .post('/uploads')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('not a PNG'), {
        filename: 'photo.png',
        contentType: 'image/png',
      })
      .expect(415);
    expect(put).not.toHaveBeenCalled();
  });

  it('enforces the interceptor file size limit', async () => {
    await request(app.getHttpServer())
      .post('/uploads')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.alloc(MAX_UPLOAD_BYTES + 1), {
        filename: 'large.png',
        contentType: 'image/png',
      })
      .expect(413);
    expect(put).not.toHaveBeenCalled();
  });
});
